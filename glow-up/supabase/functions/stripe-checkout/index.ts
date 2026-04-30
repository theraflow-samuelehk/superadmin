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
        JSON.stringify({ error: "Non autenticato - header mancante" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Token non valido" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return await handleCheckout(req, adminClient, STRIPE_SECRET_KEY, user, corsHeaders);
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;
    const user = { id: userId, email: userEmail };

    return await handleCheckout(req, adminClient, STRIPE_SECRET_KEY, user, corsHeaders);
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Errore sconosciuto" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleCheckout(
  req: Request,
  supabase: any,
  STRIPE_SECRET_KEY: string,
  user: { id: string; email?: string | null },
  corsHeaders: Record<string, string>
) {
  const { planId, billingPeriod, successUrl, cancelUrl, discountCode, withTrial } = await req.json();
  if (!planId) throw new Error("Piano non specificato");

  // Block if user already has an active subscription
  const { data: activeSub } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();

  if (activeSub) {
    return new Response(
      JSON.stringify({ error: "Hai già un abbonamento attivo. Cancellalo prima di attivarne uno nuovo." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Block trial abuse: check if user already used a trial
  if (withTrial) {
    const { data: pastTrialSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_trial", true)
      .limit(1)
      .maybeSingle();

    if (pastTrialSub) {
      return new Response(
        JSON.stringify({ error: "Hai già utilizzato il periodo di prova gratuito. Scegli un piano a pagamento." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Get plan details
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("*")
    .eq("id", planId)
    .single();
  if (planError || !plan) throw new Error("Piano non trovato");

  const priceId = billingPeriod === "yearly"
    ? plan.stripe_price_id_yearly
    : plan.stripe_price_id_monthly;

  if (!priceId) throw new Error("Prezzo Stripe non configurato per questo piano");

  // Check for existing Stripe customer
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .limit(1)
    .maybeSingle();

  let customerId = existingSub?.stripe_customer_id;

  // Create Stripe customer if needed
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

  // Validate discount code if provided
  let stripeCouponId: string | null = null;
  if (discountCode && discountCode.trim()) {
    const code = discountCode.trim().toUpperCase();
    const { data: dc, error: dcErr } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();

    if (!dc || dcErr) {
      return new Response(
        JSON.stringify({ error: "Codice sconto non valido o scaduto" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (dc.expires_at && new Date(dc.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Codice sconto scaduto" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (dc.max_uses !== null && dc.used_count >= dc.max_uses) {
      return new Response(
        JSON.stringify({ error: "Codice sconto esaurito" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (dc.target_user_id && dc.target_user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Codice sconto non valido per questo account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const couponParams: Record<string, string> = {
      percent_off: String(dc.discount_percent),
      "metadata[discount_code_id]": dc.id,
    };
    if (dc.duration_months) {
      couponParams.duration = "repeating";
      couponParams.duration_in_months = String(dc.duration_months);
    } else {
      couponParams.duration = "forever";
    }

    const couponRes = await fetch("https://api.stripe.com/v1/coupons", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(couponParams),
    });
    const coupon = await couponRes.json();
    if (!couponRes.ok) throw new Error(`Errore creazione coupon: ${coupon.error?.message}`);
    stripeCouponId = coupon.id;

    await supabase
      .from("discount_codes")
      .update({ used_count: dc.used_count + 1 })
      .eq("id", dc.id);
  }

  // Create checkout session — PLAN ONLY, no metered SMS/WA
  const params = new URLSearchParams({
    "customer": customerId!,
    "mode": "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "success_url": successUrl || `${req.headers.get("origin")}/pricing?success=true`,
    "cancel_url": cancelUrl || `${req.headers.get("origin")}/pricing?canceled=true`,
    "metadata[user_id]": user.id,
    "metadata[plan_id]": planId,
    "metadata[billing_period]": billingPeriod || "monthly",
    "subscription_data[metadata][user_id]": user.id,
    "subscription_data[metadata][plan_id]": planId,
    "subscription_data[metadata][type]": "plan",
  });

  if (stripeCouponId) {
    params.set("discounts[0][coupon]", stripeCouponId);
  }

  // Trial mode: simple 14-day trial via Stripe native trial_period_days
  // Since there are no metered items in this subscription, trial works perfectly
  if (withTrial) {
    params.set("subscription_data[trial_period_days]", "14");
    params.set("subscription_data[metadata][is_trial]", "true");
    params.set("payment_method_collection", "always");
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
}
