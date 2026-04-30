import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createNotification } from "../_shared/notifications.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_PUSH_TO_WHATSAPP_DELAY = 10 * 60 * 1000;
const DEFAULT_WHATSAPP_TO_SMS_DELAY = 20 * 60 * 1000;

interface ChannelDelays {
  pushToWhatsapp: number;
  pushToSms: number;
}

interface FlowMessages {
  [key: string]: string;
}

async function loadChannelDelays(supabase: any, salonUserId?: string): Promise<ChannelDelays> {
  // Check if test_mode is enabled for this salon
  if (salonUserId) {
    try {
      const { data: integration } = await supabase
        .from("salon_integrations")
        .select("test_mode")
        .eq("user_id", salonUserId)
        .maybeSingle();
      if (integration?.test_mode) {
        console.log(`[test_mode] Delays zeroed for salon ${salonUserId}`);
        return { pushToWhatsapp: 0, pushToSms: 0 };
      }
    } catch (e) {
      console.log("Could not check test_mode:", e);
    }
  }

  try {
    const { data: model } = await supabase
      .from("reminder_flow_models")
      .select("flow_config")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (model?.flow_config?.channel_escalation?.delays_min) {
      const delays = model.flow_config.channel_escalation.delays_min;
      const waMin = delays.whatsapp ?? 10;
      const smsMin = delays.sms ?? 20;
      return {
        pushToWhatsapp: waMin * 60 * 1000,
        pushToSms: smsMin * 60 * 1000,
      };
    }
  } catch (e) {
    console.log("Could not load flow config, using defaults:", e);
  }
  return {
    pushToWhatsapp: DEFAULT_PUSH_TO_WHATSAPP_DELAY,
    pushToSms: DEFAULT_WHATSAPP_TO_SMS_DELAY,
  };
}

async function loadMessages(supabase: any): Promise<FlowMessages> {
  try {
    const { data: model } = await supabase
      .from("reminder_flow_models")
      .select("flow_config")
      .eq("is_active", true)
      .limit(1)
      .single();
    return model?.flow_config?.messages || {};
  } catch {
    return {};
  }
}

function buildMessage(
  template: string | undefined,
  vars: Record<string, string>
): string {
  if (!template) return vars.fallback || "";
  let msg = template;
  for (const [key, value] of Object.entries(vars)) {
    msg = msg.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return msg;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const now = new Date();
    let processedCount = 0;

    const messages = await loadMessages(supabase);
    // Cache delays per salon user_id
    const delaysCache: Record<string, ChannelDelays> = {};
    const whatsappEnabledCache: Record<string, boolean> = {};

    // Get pending nodes that are due (batch of 50 to avoid edge function timeout)
    const { data: pendingNodes } = await supabase
      .from("reminder_flow_nodes")
      .select("*, flow:reminder_flows!inner(id, appointment_id, user_id, client_id, status, client_action, action_token)")
      .in("status", ["pending", "in_progress"])
      .lte("scheduled_at", now.toISOString())
      .eq("flow.status", "active")
      .order("scheduled_at", { ascending: true })
      .limit(50);

    if (!pendingNodes || pendingNodes.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const node of pendingNodes) {
      const flow = (node as any).flow;
      if (!flow) continue;

      // ── Conditional node checks ──
      // only_if_confirmed: skip if client has NOT confirmed
      if (node.only_if_confirmed && flow.client_action !== "confirmed") {
        await supabase
          .from("reminder_flow_nodes")
          .update({ status: "skipped" })
          .eq("id", node.id);
        continue;
      }

      // only_if_no_response: skip if client HAS responded
      if (node.only_if_no_response && flow.client_action) {
        await supabase
          .from("reminder_flow_nodes")
          .update({ status: "skipped" })
          .eq("id", node.id);
        continue;
      }

      // If client cancelled or rescheduled, skip remaining
      if (flow.client_action === "cancelled" || flow.client_action === "rescheduled") {
        await supabase
          .from("reminder_flow_nodes")
          .update({ status: "skipped", client_acted: true })
          .eq("id", node.id);
        continue;
      }

      // Get client info
      const { data: client } = await supabase
        .from("clients")
        .select("auth_user_id, phone, first_name")
        .eq("id", flow.client_id)
        .single();

      if (!client) {
        await supabase
          .from("reminder_flow_nodes")
          .update({ status: "skipped" })
          .eq("id", node.id);
        continue;
      }

      // Get appointment + service info
      const { data: apt } = await supabase
        .from("appointments")
        .select("start_time, end_time, service_id, status, deleted_at")
        .eq("id", flow.appointment_id)
        .single();

      if (!apt || apt.deleted_at || apt.status === "cancelled") {
        await supabase
          .from("reminder_flows")
          .update({ status: "cancelled" })
          .eq("id", flow.id);
        await supabase
          .from("reminder_flow_nodes")
          .update({ status: "skipped" })
          .eq("flow_id", flow.id)
          .eq("status", "pending");
        continue;
      }

      const { data: service } = await supabase
        .from("services")
        .select("name")
        .eq("id", apt.service_id)
        .single();

      const { data: profile } = await supabase
        .from("profiles")
        .select("salon_name")
        .eq("user_id", flow.user_id)
        .single();

      const salonName = profile?.salon_name || "GlowUp";
      const aptDate = new Date(apt.start_time);
      // Short date for SMS: "Lun, 16 Mar"
      const dayNames = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
      const monthNames = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
      const romeDate = new Date(aptDate.toLocaleString("en-US", { timeZone: "Europe/Rome" }));
      const shortDateStr = `${dayNames[romeDate.getDay()]}, ${romeDate.getDate()} ${monthNames[romeDate.getMonth()]}`;
      const dateStr = aptDate.toLocaleDateString("it-IT", {
        weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Rome",
      });
      const timeStr = aptDate.toLocaleTimeString("it-IT", {
        hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome",
      });

      const shortDomain = `https://glow-up.it`;
      const actionLink = `${shortDomain}/app/${flow.action_token}`;

      const templateVars: Record<string, string> = {
        salon_name: salonName,
        data: dateStr,
        short_data: shortDateStr,
        ora: timeStr,
        time: timeStr,
        link: actionLink,
        service_name: service?.name || "",
        client_name: client.first_name || "Cliente",
      };

      // ── ADMIN ESCALATION NODE ──
      if (node.node_type === "admin_escalation") {
        await handleAdminEscalation(supabase, flow, apt, salonName, dateStr, timeStr, client);
        await supabase
          .from("reminder_flow_nodes")
          .update({ status: "completed", admin_notified_at: now.toISOString() })
          .eq("id", node.id);
        processedCount++;
        continue;
      }

      // ── MID-TREATMENT LINK NODE ──
      // Uses the same Push → WhatsApp → SMS escalation as other client nodes
      // (no special handling — falls through to the standard escalation below)

      // ── CLIENT NODE: Build message based on message_key ──
      const messageKey = node.message_key || node.message_variant || "first_contact";
      let messageBody: string;
      let pushBody: string;

      if (messages[messageKey]) {
        messageBody = buildMessage(messages[messageKey], templateVars);
      } else {
        // Fallback messages
        switch (messageKey) {
          case "immediate_confirmation":
            messageBody = `${salonName}:\nAppuntamento confermato\n${shortDateStr} ${timeStr}\n\nSe vuoi annullarlo o spostarlo clicca qui:\n${actionLink}`;
            break;
          case "reminder_24h":
            messageBody = `${salonName}:\nPromemoria domani alle ${timeStr}\n\nConferma, sposta o annulla clicca qui:\n${actionLink}`;
            break;
          case "reminder_bcd":
            messageBody = `Azione Richiesta! ${salonName}:\nOggi, ore ${timeStr}\n\nConferma o annulla appuntamento qui:\n${actionLink}`;
            break;
          case "reminder_confirmed":
            messageBody = `${salonName}:\nOggi alle ${timeStr}\n\nSe vuoi modificare clicca qui:\n${actionLink}`;
            break;
          case "no_response":
            messageBody = `Azione Richiesta! ${salonName}:\nOggi, ore ${timeStr}\n\nConferma o annulla appuntamento qui:\n${actionLink}`;
            break;
          case "mid_treatment":
            messageBody = `${salonName}: Scarica la nostra app! ${shortDomain}`;
            break;
          default:
            messageBody = `${salonName}:\n${shortDateStr} ${timeStr}\n\nGestisci clicca qui:\n${actionLink}`;
        }
      }

      // ── Build separate push body (no link, app-native actions) ──
      const pushKey = `push_${messageKey}`;
      if (messages[pushKey]) {
        pushBody = buildMessage(messages[pushKey], templateVars);
      } else {
        // Fallback: strip link from messageBody
        pushBody = messageBody.replace(/\n*(?:Se vuoi annullarlo o spostarlo |Conferma, sposta o annulla |Conferma o annulla appuntamento |Se vuoi modificare |Gestisci )?clicca qui:\n?https?:\/\/\S+/gi, "").trim();
        if (pushBody === messageBody) {
          // No link found, use as-is
        }
      }

      // ── Push notification title
      const pushTitle = messageKey === "immediate_confirmation"
        ? "Appuntamento confermato!"
        : messageKey === "reminder_confirmed"
          ? "Promemoria appuntamento"
          : messageKey === "no_response"
            ? "Ricordati di confermare!"
            : messageKey === "mid_treatment"
              ? "Scarica la nostra app!"
              : "Conferma il tuo appuntamento";

      // ── Determine if this is an immediate confirmation node (instant escalation) ──
      const isImmediate = node.node_type === "immediate_confirmation";

      // Step 1: Send Push
      if (!node.push_sent_at) {
        const claimTime = now.toISOString();
        const { data: claimedNode, error: claimError } = await supabase
          .from("reminder_flow_nodes")
          .update({ push_sent_at: claimTime, status: "in_progress" })
          .eq("id", node.id)
          .is("push_sent_at", null)
          .in("status", ["pending", "in_progress"])
          .select("id")
          .maybeSingle();

        if (claimError) {
          console.error(`[push-debug] Failed to claim node ${node.id}:`, claimError);
          continue;
        }

        if (!claimedNode) {
          console.log(`[push-debug] Node ${node.id} already claimed by another run, skipping duplicate push`);
          continue;
        }

        let pushDelivered = false;
        console.log(`[push-debug] Node ${node.id} | messageKey=${messageKey} | client_id=${flow.client_id} | auth_user_id=${client.auth_user_id || "NONE"}`);

        if (client.auth_user_id) {
          // Check if client has push subscriptions BEFORE attempting
          const { data: subs, error: subsErr } = await supabase
            .from("push_subscriptions")
            .select("id, endpoint, created_at")
            .eq("user_id", client.auth_user_id);

          console.log(`[push-debug] Subscriptions for auth_user ${client.auth_user_id}: count=${subs?.length ?? 0}, error=${subsErr?.message ?? "none"}`);
          if (subs && subs.length > 0) {
            console.log(`[push-debug] Subscription endpoints: ${subs.map((s: any) => s.endpoint?.slice(0, 60) + "...").join(" | ")}`);
          }

          // Check VAPID keys exist
          const { data: vapidPub } = await supabase
            .from("platform_settings")
            .select("value")
            .eq("key", "vapid_public_key")
            .maybeSingle();
          const { data: vapidPriv } = await supabase
            .from("platform_settings")
            .select("value")
            .eq("key", "vapid_private_key")
            .maybeSingle();
          console.log(`[push-debug] VAPID keys: public=${vapidPub?.value ? "SET" : "MISSING"}, private=${vapidPriv?.value ? "SET" : "MISSING"}`);

          const result = await createNotification(supabase, {
            user_id: client.auth_user_id,
            salon_user_id: flow.user_id,
            type: "reminder",
            title: pushTitle,
            body: pushBody,
            data: {
              appointment_id: flow.appointment_id,
              flow_node_id: node.id,
              requires_action: messageKey !== "immediate_confirmation",
              actions: ["confirm", "cancel", "reschedule"],
              url: `/app/${flow.action_token}`,
            },
          });
          pushDelivered = result.pushDelivered;
          console.log(`[push-debug] createNotification result: pushDelivered=${pushDelivered}`);
        } else {
          console.log(`[push-debug] Client ${flow.client_id} has NO auth_user_id → skipping push entirely`);
        }

        if (pushDelivered) {
          // Push delivered → node complete, skip WA/SMS
          console.log(`[push-delivered] ✅ Node ${node.id} completed via push, skipping WA/SMS`);
          await supabase
            .from("reminder_flow_nodes")
            .update({ status: "completed", push_delivered_at: now.toISOString() })
            .eq("id", node.id);
          processedCount++;
          continue;
        }

        // For immediate confirmation: don't wait, try WhatsApp right now
        if (isImmediate) {
          console.log(`[immediate] Push failed for node ${node.id}, trying WhatsApp immediately`);
          node.push_sent_at = claimTime;
        } else {
          processedCount++;
          continue;
        }
      }

      // Re-check if client acted after push
      const { data: freshFlow } = await supabase
        .from("reminder_flows")
        .select("client_action")
        .eq("id", flow.id)
        .single();

      if (freshFlow?.client_action) {
        await supabase
          .from("reminder_flow_nodes")
          .update({ status: "completed", client_acted: true })
          .eq("id", node.id);
        continue;
      }

      const pushSentAt = new Date(node.push_sent_at).getTime();

      // Load per-salon delays and whatsapp status (cached)
      if (!delaysCache[flow.user_id]) {
        delaysCache[flow.user_id] = await loadChannelDelays(supabase, flow.user_id);
      }
      if (whatsappEnabledCache[flow.user_id] === undefined) {
        const { data: integ } = await supabase
          .from("salon_integrations")
          .select("whatsapp_enabled")
          .eq("user_id", flow.user_id)
          .maybeSingle();
        whatsappEnabledCache[flow.user_id] = integ?.whatsapp_enabled ?? false;
      }
      const delays = delaysCache[flow.user_id];
      const waEnabled = whatsappEnabledCache[flow.user_id];

      // For immediate confirmation nodes: zero delays (instant fallback)
      const effectivePushToWa = isImmediate ? 0 : delays.pushToWhatsapp;
      const effectivePushToSms = isImmediate ? 0 : (waEnabled ? delays.pushToSms : delays.pushToWhatsapp);

      // Step 2: WhatsApp (skip entirely if not enabled)
      if (!node.whatsapp_sent_at && waEnabled && now.getTime() >= pushSentAt + effectivePushToWa) {
        let waSent = false;
        if (client.phone) {
          try {
            const waUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-whatsapp`;
            const waResp = await fetch(waUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                salon_user_id: flow.user_id,
                to: client.phone,
                body: messageBody,
                flow_node_id: node.id,
              }),
            });
            const waResult = await waResp.json().catch(() => ({}));
            waSent = waResp.ok && waResult.sent !== false;
          } catch (e) {
            console.error("WhatsApp send error:", e);
          }
        }
        if (waSent) {
          // For immediate: WhatsApp delivered → complete, skip SMS
          console.log(`[wa-delivered] Node ${node.id} WhatsApp sent`);
          await supabase
            .from("reminder_flow_nodes")
            .update({ whatsapp_sent_at: now.toISOString(), status: isImmediate ? "completed" : undefined })
            .eq("id", node.id);

          if (isImmediate) {
            processedCount++;
            continue;
          }
        }

        // For immediate: WA failed, fall through to SMS immediately
        if (isImmediate && !waSent) {
          console.log(`[immediate] WhatsApp failed for node ${node.id}, trying SMS immediately`);
          node.whatsapp_sent_at = now.toISOString();
          // Fall through to SMS
        } else {
          processedCount++;
          continue;
        }
      }

      // Step 3: SMS
      if (!node.sms_sent_at && now.getTime() >= pushSentAt + effectivePushToSms) {
        let smsSent = false;
        if (client.phone) {
          try {
            const smsUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-sms`;
            const smsResp = await fetch(smsUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                salon_user_id: flow.user_id,
                to: client.phone,
                body: messageBody,
                flow_node_id: node.id,
              }),
            });
            const smsResult = await smsResp.json().catch(() => ({}));
            smsSent = smsResp.ok && smsResult.sent !== false;
          } catch (e) {
            console.error("SMS send error:", e);
          }
        }
        await supabase
          .from("reminder_flow_nodes")
          .update({
            sms_sent_at: smsSent ? now.toISOString() : null,
            status: "completed",
          })
          .eq("id", node.id);
        processedCount++;
        continue;
      }
    }

    return new Response(JSON.stringify({ processed: processedCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in process-reminder-flows:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleAdminEscalation(
  supabase: any,
  flow: any,
  apt: any,
  salonName: string,
  dateStr: string,
  timeStr: string,
  client: any
) {
  await supabase
    .from("unconfirmed_appointments")
    .upsert({
      appointment_id: flow.appointment_id,
      user_id: flow.user_id,
    }, { onConflict: "appointment_id" });

  await createNotification(supabase, {
    user_id: flow.user_id,
    salon_user_id: flow.user_id,
    type: "admin_escalation",
    title: "Cliente non ha confermato",
    body: `${client.first_name || "Cliente"} non ha confermato l'appuntamento del ${dateStr} alle ${timeStr}. L'appuntamento è stato mantenuto. Contattalo manualmente se vuoi annullare.`,
    data: {
      appointment_id: flow.appointment_id,
      client_id: flow.client_id,
      client_phone: client.phone,
      requires_action: true,
      default_action: "keep",
    },
  });
}
