import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Rate Limiter Config ──
const WARMUP_PHASES = [
  { maxCumulativeNewContacts: 50,   dailyBudget: 10 },
  { maxCumulativeNewContacts: 200,  dailyBudget: 25 },
  { maxCumulativeNewContacts: 1000, dailyBudget: 50 },
  { maxCumulativeNewContacts: Infinity, dailyBudget: 80 },
];
const NEW_CONTACT_WEIGHT = 1.0;
const EXISTING_CONTACT_WEIGHT = 0.1;
const SEND_WINDOW_START = 9;  // 09:00
const SEND_WINDOW_END = 20;   // 20:00

function getItalyHour(): number {
  const now = new Date();
  const italyTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Rome" }));
  return italyTime.getHours();
}

function getRandomDelay(isNewContact: boolean, cumulativeNew: number): number {
  // Delay in ms based on warm-up phase
  if (cumulativeNew < 50) return (30 + Math.random() * 30) * 1000;    // 30-60s
  if (cumulativeNew < 200) return (20 + Math.random() * 20) * 1000;   // 20-40s
  if (cumulativeNew < 1000) return (15 + Math.random() * 15) * 1000;  // 15-30s
  return (10 + Math.random() * 10) * 1000;                             // 10-20s
}

function getDailyBudget(cumulativeNewContacts: number): number {
  for (const phase of WARMUP_PHASES) {
    if (cumulativeNewContacts < phase.maxCumulativeNewContacts) {
      return phase.dailyBudget;
    }
  }
  return WARMUP_PHASES[WARMUP_PHASES.length - 1].dailyBudget;
}

function getItalyStartOfDay(): string {
  const now = new Date();
  const italyNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Rome" }));
  italyNow.setHours(0, 0, 0, 0);
  // Convert back to UTC ISO string
  const offset = now.getTime() - italyNow.getTime();
  const utcStart = new Date(now.getTime() - (now.getTime() - italyNow.getTime()) % (24 * 60 * 60 * 1000));
  // Simpler: just use the Italy date as YYYY-MM-DD
  const y = italyNow.getFullYear();
  const m = String(italyNow.getMonth() + 1).padStart(2, "0");
  const d = String(italyNow.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}T00:00:00+02:00`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Security: Only allow calls from other Edge Functions using service_role key
  const authHeader = req.headers.get("authorization") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { salon_user_id, to: rawTo, body, flow_node_id, skip_rate_limit } = await req.json();
    if (!salon_user_id || !rawTo || !body) {
      throw new Error("salon_user_id, to, and body are required");
    }

    // ── Normalize phone ──
    let normalizedPhone = rawTo.replace(/\s+/g, "").replace(/^\+/, "");
    const phoneDigits = normalizedPhone.replace(/\D/g, "");
    if (phoneDigits.length === 10 && /^3\d{9}$/.test(phoneDigits)) {
      normalizedPhone = `39${phoneDigits}`;
    } else {
      normalizedPhone = phoneDigits;
    }
    console.log(`[send-whatsapp] normalized phone: ${rawTo} -> ${normalizedPhone}`);

    // ── Get salon's WhatsApp credentials ──
    const { data: integration } = await supabase
      .from("salon_integrations")
      .select("whatsapp_token, whatsapp_phone_id, whatsapp_phone_number, whatsapp_enabled, baileys_service_url, baileys_api_key")
      .eq("user_id", salon_user_id)
      .single();

    if (!integration || !integration.whatsapp_enabled) {
      return new Response(JSON.stringify({ sent: false, reason: "whatsapp_not_enabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Rate Limiter (skip if explicitly told, e.g. from queue processor) ──
    if (!skip_rate_limit) {
      // 1. Check time window
      const italyHour = getItalyHour();
      if (italyHour < SEND_WINDOW_START || italyHour >= SEND_WINDOW_END) {
        console.log(`[send-whatsapp] Outside send window (${italyHour}h Italy). Queueing.`);
        await queueMessage(supabase, salon_user_id, normalizedPhone, body, flow_node_id);
        return new Response(JSON.stringify({ sent: false, reason: "queued_outside_window" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2. Determine if this is a new contact
      const { count: existingCount } = await supabase
        .from("messaging_usage_log")
        .select("id", { count: "exact", head: true })
        .eq("salon_user_id", salon_user_id)
        .eq("recipient_phone", normalizedPhone)
        .eq("channel", "whatsapp");

      const isNewContact = (existingCount || 0) === 0;

      // 3. Get cumulative unique new contacts for this salon (for warm-up phase)
      const { count: cumulativeNew } = await supabase
        .from("messaging_usage_log")
        .select("id", { count: "exact", head: true })
        .eq("salon_user_id", salon_user_id)
        .eq("channel", "whatsapp")
        .eq("is_new_contact", true);

      const cumulativeNewContacts = cumulativeNew || 0;
      const dailyBudget = getDailyBudget(cumulativeNewContacts);

      // 4. Calculate today's spent points
      const todayStart = getItalyStartOfDay();
      const { data: todayLogs } = await supabase
        .from("messaging_usage_log")
        .select("is_new_contact")
        .eq("salon_user_id", salon_user_id)
        .eq("channel", "whatsapp")
        .gte("created_at", todayStart);

      let todayPoints = 0;
      for (const log of todayLogs || []) {
        todayPoints += log.is_new_contact ? NEW_CONTACT_WEIGHT : EXISTING_CONTACT_WEIGHT;
      }

      const messageWeight = isNewContact ? NEW_CONTACT_WEIGHT : EXISTING_CONTACT_WEIGHT;

      if (todayPoints + messageWeight > dailyBudget) {
        console.log(`[send-whatsapp] Daily budget exceeded (${todayPoints.toFixed(1)}/${dailyBudget}). Queueing.`);
        await queueMessage(supabase, salon_user_id, normalizedPhone, body, flow_node_id);
        return new Response(JSON.stringify({ 
          sent: false, 
          reason: "queued_budget_exceeded",
          today_points: todayPoints,
          daily_budget: dailyBudget,
          phase_cumulative_new: cumulativeNewContacts,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 5. Apply random delay (only for new contacts or if in early phases)
      if (isNewContact || cumulativeNewContacts < 200) {
        const delayMs = getRandomDelay(isNewContact, cumulativeNewContacts);
        console.log(`[send-whatsapp] Applying delay: ${Math.round(delayMs / 1000)}s (new=${isNewContact}, phase=${cumulativeNewContacts})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      // Store is_new_contact for logging later
      (req as any).__isNewContact = isNewContact;
    }

    // ── Send message ──
    const isNewContact = (req as any).__isNewContact ?? false;
    const sendResult = await sendMessage(supabase, integration, normalizedPhone, body, flow_node_id, salon_user_id, isNewContact);

    return new Response(JSON.stringify(sendResult), {
      status: sendResult.sent ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-whatsapp:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Queue a message for later delivery ──
async function queueMessage(
  supabase: any,
  salonUserId: string,
  phone: string,
  body: string,
  flowNodeId?: string
) {
  // Schedule for tomorrow 09:00 Italy time if outside window, or next available slot
  const now = new Date();
  const italyHour = getItalyHour();
  let scheduledFor: Date;

  if (italyHour >= SEND_WINDOW_END) {
    // Schedule for tomorrow 09:00
    const tomorrow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Rome" }));
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, Math.floor(Math.random() * 30), 0, 0); // 09:00-09:30 random
    scheduledFor = tomorrow;
  } else if (italyHour < SEND_WINDOW_START) {
    // Schedule for today 09:00
    const today = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Rome" }));
    today.setHours(9, Math.floor(Math.random() * 30), 0, 0);
    scheduledFor = today;
  } else {
    // Budget exceeded — schedule for tomorrow 09:00
    const tomorrow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Rome" }));
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, Math.floor(Math.random() * 30), 0, 0);
    scheduledFor = tomorrow;
  }

  await supabase.from("wa_message_queue").insert({
    salon_user_id: salonUserId,
    recipient_phone: phone,
    body,
    flow_node_id: flowNodeId || null,
    status: "queued",
    scheduled_for: scheduledFor.toISOString(),
  });

  console.log(`[send-whatsapp] Message queued for ${scheduledFor.toISOString()}`);
}

// ── Send via Baileys or Meta API ──
async function sendMessage(
  supabase: any,
  integration: any,
  normalizedPhone: string,
  body: string,
  flowNodeId: string | undefined,
  salonUserId: string,
  isNewContact: boolean
): Promise<any> {
  // Try Baileys first
  if (integration.baileys_service_url && integration.baileys_api_key) {
    try {
      console.log(`[send-whatsapp] Trying Baileys microservice...`);
      const baileysUrl = `${integration.baileys_service_url.replace(/\/$/, "")}/send`;
      const baileysResponse = await fetch(baileysUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": integration.baileys_api_key,
        },
        body: JSON.stringify({ phone: normalizedPhone, message: body }),
      });

      const baileysResult = await baileysResponse.json();

      if (baileysResponse.ok && baileysResult.sent) {
        console.log(`[send-whatsapp] Sent via Baileys successfully`);
        await logUsage(supabase, salonUserId, normalizedPhone, flowNodeId, baileysResult.message_id, isNewContact, "0.00");
        return { sent: true, via: "baileys", message_id: baileysResult.message_id };
      }

      console.warn(`[send-whatsapp] Baileys failed, falling back to Meta API:`, baileysResult);
    } catch (baileysErr) {
      console.warn(`[send-whatsapp] Baileys error, falling back to Meta API:`, baileysErr);
    }
  }

  // Fallback: Meta Cloud API
  const { whatsapp_token, whatsapp_phone_id } = integration;
  if (!whatsapp_token || !whatsapp_phone_id) {
    return { sent: false, reason: "whatsapp_not_configured" };
  }

  const metaUrl = `https://graph.facebook.com/v21.0/${whatsapp_phone_id}/messages`;
  const response = await fetch(metaUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${whatsapp_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedPhone,
      type: "text",
      text: { preview_url: true, body },
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("WhatsApp Meta API error:", result);
    const errorCode = result?.error?.code;
    if (errorCode === 131026) {
      return { sent: false, reason: "not_on_whatsapp" };
    }
    return { sent: false, error: result?.error?.message || "Meta API error" };
  }

  const messageId = result?.messages?.[0]?.id;

  if (flowNodeId && messageId) {
    await supabase
      .from("reminder_flow_nodes")
      .update({ whatsapp_message_sid: messageId })
      .eq("id", flowNodeId);
  }

  await logUsage(supabase, salonUserId, normalizedPhone, flowNodeId, messageId, isNewContact, "0.07");

  return { sent: true, via: "meta", message_id: messageId };
}

// ── Log usage for billing ──
async function logUsage(
  supabase: any,
  salonUserId: string,
  phone: string,
  flowNodeId: string | undefined,
  messageId: string | null,
  isNewContact: boolean,
  defaultPrice: string
) {
  try {
    const { data: priceSetting } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "whatsapp_unit_price")
      .maybeSingle();

    await supabase.from("messaging_usage_log").insert({
      salon_user_id: salonUserId,
      channel: "whatsapp",
      recipient_phone: phone,
      flow_node_id: flowNodeId || null,
      message_sid: messageId || null,
      unit_price: parseFloat(priceSetting?.value || defaultPrice),
      is_new_contact: isNewContact,
    });
  } catch (logErr) {
    console.error("Failed to log WhatsApp usage:", logErr);
  }
}
