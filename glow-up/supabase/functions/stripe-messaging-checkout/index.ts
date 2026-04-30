import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    let STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      const { data: setting } = await adminClient
        .from("platform_settings")
        .select("value")
        .eq("key", "stripe_secret_key")
        .maybeSingle();
      STRIPE_SECRET_KEY = setting?.value || null;
    }
    if (!STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Stripe non configurato. Contatta l'amministratore." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Non autenticato" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);

    let user: { id: string; email?: string | null };
    if (claimsError || !claimsData?.claims) {
      const { data: { user: u }, error: authError } = await adminClient.auth.getUser(token);
      if (authError || !u) {
        return new Response(
          JSON.stringify({ error: "Token non valido" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      user = u;
    } else {
      user = { id: claimsData.claims.sub as string, email: claimsData.claims.email as string };
    }

    const { successUrl, cancelUrl } = await req.json();

    // Check for existing Stripe customer from any subscription (plan or past)
    const { data: planSub } = await adminClient
      .from("subscriptions")
      .select("id, stripe_customer_id")
      .eq("user_id", user.id)
      .not("stripe_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Check if messaging subscription already exists
    const { data: existingMsgSub } = await adminClient
      .from("messaging_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (existingMsgSub) {
      return new Response(
        JSON.stringify({ error: "Hai già un abbonamento messaggistica attivo." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let customerId = planSub?.stripe_customer_id || null;

    // Create Stripe customer if none exists yet
    if (!customerId) {
      const customerRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: user.email || "",
          "metadata[user_id]": user.id,
        }),
      });
      const customer = await customerRes.json();
      if (!customerRes.ok) throw new Error(`Errore creazione customer: ${customer.error?.message}`);
      customerId = customer.id;
    }

    // Get metered price IDs for SMS and WhatsApp
    const { data: meteredSettings } = await adminClient
      .from("platform_settings")
      .select("key, value")
      .in("key", ["stripe_sms_price_id", "stripe_whatsapp_price_id"]);

    const meteredPrices: Record<string, string> = {};
    (meteredSettings || []).forEach((s: any) => { meteredPrices[s.key] = s.value; });

    if (!meteredPrices["stripe_sms_price_id"] && !meteredPrices["stripe_whatsapp_price_id"]) {
      return new Response(
        JSON.stringify({ error: "Prezzi messaggistica non configurati. Contatta l'amministratore." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create checkout session for messaging-only subscription
    const params = new URLSearchParams({
      "customer": customerId,
      "mode": "subscription",
      "success_url": successUrl || `${req.headers.get("origin")}/impostazioni?tab=integrations&messaging=success`,
      "cancel_url": cancelUrl || `${req.headers.get("origin")}/impostazioni?tab=integrations&messaging=canceled`,
      "metadata[user_id]": user.id,
      "metadata[type]": "messaging",
      "subscription_data[metadata][user_id]": user.id,
      "subscription_data[metadata][type]": "messaging",
    });

    let lineItemIndex = 0;
    if (meteredPrices["stripe_sms_price_id"]) {
      params.set(`line_items[${lineItemIndex}][price]`, meteredPrices["stripe_sms_price_id"]);
      lineItemIndex++;
    }
    if (meteredPrices["stripe_whatsapp_price_id"]) {
      params.set(`line_items[${lineItemIndex}][price]`, meteredPrices["stripe_whatsapp_price_id"]);
    }

    const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const session = await sessionRes.json();
    if (!sessionRes.ok) throw new Error(`Errore checkout: ${session.error?.message}`);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Messaging checkout error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Errore sconosciuto" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
