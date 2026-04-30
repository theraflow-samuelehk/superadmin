import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Auth check — only super_admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Non autenticato" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  try {
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !userData?.user) throw new Error("Non autenticato");

    const userId = userData.user.id;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) throw new Error("Accesso negato: solo super admin");

    const body = await req.json();
    const { lead_id, template_id, custom_body, automation_id } = body;

    if (!lead_id) throw new Error("lead_id richiesto");

    // Get lead data
    const { data: lead, error: leadErr } = await supabase
      .from("facebook_leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadErr || !lead) throw new Error("Lead non trovato");
    if (!lead.phone) throw new Error("Lead senza numero di telefono");

    // Get template if provided
    let messageBody = custom_body || "";
    let usedTemplateId = template_id || null;

    if (template_id && !custom_body) {
      const { data: template } = await supabase
        .from("lead_wa_templates")
        .select("*")
        .eq("id", template_id)
        .single();

      if (!template) throw new Error("Template non trovato");
      messageBody = template.body;
      usedTemplateId = template.id;
    }

    if (!messageBody) throw new Error("Corpo messaggio mancante");

    // Replace variables
    const nameParts = (lead.full_name || "").trim().split(/\s+/);
    const nome = nameParts[0] || "";
    const cognome = nameParts.slice(1).join(" ") || "";

    messageBody = messageBody
      .replace(/\{\{nome\}\}/gi, nome)
      .replace(/\{\{cognome\}\}/gi, cognome)
      .replace(/\{\{telefono\}\}/gi, lead.phone || "")
      .replace(/\{\{email\}\}/gi, lead.email || "")
      .replace(/\{\{fonte\}\}/gi, lead.source || "");

    // Get Baileys config from salon_integrations (global config)
    const { data: integration } = await supabase
      .from("salon_integrations")
      .select("baileys_service_url, baileys_api_key, whatsapp_enabled")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (!integration?.baileys_service_url || !integration?.baileys_api_key) {
      throw new Error("Baileys non configurato. Configura URL e API Key nelle Impostazioni.");
    }

    // Normalize phone
    let normalizedPhone = lead.phone.replace(/\s+/g, "").replace(/^\+/, "");
    const phoneDigits = normalizedPhone.replace(/\D/g, "");
    if (phoneDigits.length === 10 && /^3\d{9}$/.test(phoneDigits)) {
      normalizedPhone = `39${phoneDigits}`;
    } else {
      normalizedPhone = phoneDigits;
    }

    // Send via Baileys
    const baileysUrl = `${integration.baileys_service_url.replace(/\/$/, "")}/send`;
    console.log(`[send-lead-whatsapp] Sending to ${normalizedPhone} via Baileys`);

    const baileysResponse = await fetch(baileysUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": integration.baileys_api_key,
      },
      body: JSON.stringify({
        phone: normalizedPhone,
        message: messageBody,
      }),
    });

    const baileysResult = await baileysResponse.json();
    const sent = baileysResponse.ok && baileysResult.sent;

    // Log the send
    await supabase.from("lead_wa_send_log").insert({
      lead_id,
      template_id: usedTemplateId,
      automation_id: automation_id || null,
      sent_body: messageBody,
      phone: normalizedPhone,
      status: sent ? "sent" : "failed",
      via: "baileys",
      message_id: baileysResult.message_id || null,
      error_message: sent ? null : (baileysResult.error || "Invio fallito"),
    });

    if (!sent) {
      console.error("[send-lead-whatsapp] Baileys failed:", baileysResult);
      return new Response(
        JSON.stringify({ sent: false, error: baileysResult.error || "Invio fallito" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ sent: true, message_id: baileysResult.message_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-lead-whatsapp] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
