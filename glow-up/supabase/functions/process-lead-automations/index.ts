import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Condition types for lead automations:
 * - no_funnel: lead has NO funnel_events at all
 * - funnel_started_no_steps: lead entered funnel (hero only, step 0) but didn't proceed
 * - funnel_partial: lead completed some steps but dropped before cta (step 9)
 * - funnel_complete_no_wa: lead completed all steps but didn't write on WhatsApp
 * - funnel_complete_wa: lead completed funnel AND wrote on WhatsApp (usually skip)
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get active automations
    const { data: automations, error: autoErr } = await supabase
      .from("lead_wa_automations")
      .select("*, lead_wa_templates(*)")
      .eq("is_active", true);

    if (autoErr) throw autoErr;
    if (!automations?.length) {
      return new Response(JSON.stringify({ processed: 0, message: "Nessuna automazione attiva" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all leads from today minus delay window
    const { data: leads, error: leadsErr } = await supabase
      .from("facebook_leads")
      .select("*")
      .neq("status", "annullato")
      .not("phone", "is", null);

    if (leadsErr) throw leadsErr;
    if (!leads?.length) {
      return new Response(JSON.stringify({ processed: 0, message: "Nessun lead da processare" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all funnel events for matching
    const leadIds = leads.map((l) => l.fb_lead_id).filter(Boolean);
    const { data: funnelEvents } = await supabase
      .from("funnel_events")
      .select("fb_lead_id, step_index, step_name, event_type")
      .in("fb_lead_id", leadIds);

    // Build funnel map: fb_lead_id -> max step + has cta click
    const funnelMap = new Map<string, { maxStep: number; hasCtaClick: boolean }>();
    for (const ev of funnelEvents || []) {
      if (!ev.fb_lead_id) continue;
      const current = funnelMap.get(ev.fb_lead_id) || { maxStep: -1, hasCtaClick: false };
      if (ev.step_index > current.maxStep) current.maxStep = ev.step_index;
      if (ev.step_name === "cta" && ev.event_type === "cta_click") current.hasCtaClick = true;
      funnelMap.set(ev.fb_lead_id, current);
    }

    // Get existing send logs to respect max_sends
    const leadDbIds = leads.map((l) => l.id);
    const { data: existingLogs } = await supabase
      .from("lead_wa_send_log")
      .select("lead_id, automation_id")
      .in("lead_id", leadDbIds);

    const sendCountMap = new Map<string, number>();
    for (const log of existingLogs || []) {
      const key = `${log.lead_id}:${log.automation_id}`;
      sendCountMap.set(key, (sendCountMap.get(key) || 0) + 1);
    }

    // Get Baileys config
    const { data: integration } = await supabase
      .from("salon_integrations")
      .select("baileys_service_url, baileys_api_key")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (!integration?.baileys_service_url || !integration?.baileys_api_key) {
      return new Response(JSON.stringify({ processed: 0, error: "Baileys non configurato" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    const now = Date.now();

    for (const automation of automations) {
      const template = automation.lead_wa_templates;
      if (!template?.body) continue;

      for (const lead of leads) {
        // Check delay: lead must be older than delay_minutes
        const leadAge = (now - new Date(lead.created_at).getTime()) / 60000;
        if (leadAge < automation.delay_minutes) continue;

        // Check max sends
        const sendKey = `${lead.id}:${automation.id}`;
        const sendCount = sendCountMap.get(sendKey) || 0;
        if (sendCount >= automation.max_sends_per_lead) continue;

        // Check condition
        const funnel = funnelMap.get(lead.fb_lead_id);
        const conditionMet = checkCondition(automation.condition_type, funnel);
        if (!conditionMet) continue;

        // Send message
        const nameParts = (lead.full_name || "").trim().split(/\s+/);
        const nome = nameParts[0] || "";
        const cognome = nameParts.slice(1).join(" ") || "";

        let messageBody = template.body
          .replace(/\{\{nome\}\}/gi, nome)
          .replace(/\{\{cognome\}\}/gi, cognome)
          .replace(/\{\{telefono\}\}/gi, lead.phone || "")
          .replace(/\{\{email\}\}/gi, lead.email || "")
          .replace(/\{\{fonte\}\}/gi, lead.source || "");

        // Normalize phone
        let normalizedPhone = (lead.phone || "").replace(/\s+/g, "").replace(/^\+/, "");
        const phoneDigits = normalizedPhone.replace(/\D/g, "");
        if (phoneDigits.length === 10 && /^3\d{9}$/.test(phoneDigits)) {
          normalizedPhone = `39${phoneDigits}`;
        } else {
          normalizedPhone = phoneDigits;
        }

        try {
          const baileysUrl = `${integration.baileys_service_url.replace(/\/$/, "")}/send`;
          const response = await fetch(baileysUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": integration.baileys_api_key,
            },
            body: JSON.stringify({ phone: normalizedPhone, message: messageBody }),
          });

          const result = await response.json();
          const sent = response.ok && result.sent;

          await supabase.from("lead_wa_send_log").insert({
            lead_id: lead.id,
            template_id: template.id,
            automation_id: automation.id,
            sent_body: messageBody,
            phone: normalizedPhone,
            status: sent ? "sent" : "failed",
            via: "baileys",
            message_id: result.message_id || null,
            error_message: sent ? null : (result.error || "Invio fallito"),
          });

          if (sent) {
            processed++;
            sendCountMap.set(sendKey, sendCount + 1);
          }

          console.log(`[process-lead-automations] Lead ${lead.fb_lead_id} → ${sent ? "OK" : "FAIL"}`);
        } catch (sendErr) {
          console.error(`[process-lead-automations] Error sending to ${lead.fb_lead_id}:`, sendErr);
        }
      }
    }

    return new Response(
      JSON.stringify({ processed, total_leads: leads.length, total_automations: automations.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[process-lead-automations] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function checkCondition(
  conditionType: string,
  funnel: { maxStep: number; hasCtaClick: boolean } | undefined
): boolean {
  switch (conditionType) {
    case "no_funnel":
      return !funnel;
    case "funnel_started_no_steps":
      return !!funnel && funnel.maxStep <= 0;
    case "funnel_partial":
      return !!funnel && funnel.maxStep > 0 && funnel.maxStep < 9;
    case "funnel_complete_no_wa":
      return !!funnel && funnel.maxStep >= 9 && !funnel.hasCtaClick;
    case "funnel_complete_wa":
      return !!funnel && funnel.maxStep >= 9 && funnel.hasCtaClick;
    default:
      return false;
  }
}
