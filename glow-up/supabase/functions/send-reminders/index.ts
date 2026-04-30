import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createNotification } from "../_shared/notifications.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Get all active reminder rules
    const { data: rules } = await supabase
      .from("reminder_rules")
      .select("*")
      .eq("is_active", true);

    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No active rules" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    let sentCount = 0;

    // Group rules by user_id
    const rulesByUser: Record<string, typeof rules> = {};
    for (const rule of rules) {
      if (!rulesByUser[rule.user_id]) rulesByUser[rule.user_id] = [];
      rulesByUser[rule.user_id].push(rule);
    }

    for (const [userId, userRules] of Object.entries(rulesByUser)) {
      for (const rule of userRules) {
        // Find appointments that start at now + offset_minutes (±15 min window)
        const targetTime = new Date(now.getTime() + rule.offset_minutes * 60000);
        const windowStart = new Date(targetTime.getTime() - 15 * 60000);
        const windowEnd = new Date(targetTime.getTime() + 15 * 60000);

        const { data: appointments } = await supabase
          .from("appointments")
          .select("id, client_id, service_id, start_time")
          .eq("user_id", userId)
          .is("deleted_at", null)
          .eq("status", "confirmed")
          .gte("start_time", windowStart.toISOString())
          .lte("start_time", windowEnd.toISOString());

        if (!appointments || appointments.length === 0) continue;

        for (const apt of appointments) {
          // Get client's auth_user_id
          const { data: client } = await supabase
            .from("clients")
            .select("auth_user_id, first_name")
            .eq("id", apt.client_id)
            .single();

          if (!client?.auth_user_id) continue;

          // Check for duplicate (already sent this reminder for this appointment)
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", client.auth_user_id)
            .eq("type", "reminder")
            .contains("data", { appointment_id: apt.id, rule_id: rule.id })
            .maybeSingle();

          if (existing) continue;

          // Get service name
          const { data: service } = await supabase
            .from("services")
            .select("name")
            .eq("id", apt.service_id)
            .single();

          const aptDate = new Date(apt.start_time);
        const dateStr = aptDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Rome" });
        const timeStr = aptDate.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });

          await createNotification(supabase, {
            user_id: client.auth_user_id,
            salon_user_id: userId,
            type: "reminder",
            title: "Conferma il tuo appuntamento",
            body: `${service?.name || "Appuntamento"} - ${dateStr} alle ${timeStr}. Conferma o annulla la tua presenza.`,
            data: {
              appointment_id: apt.id,
              rule_id: rule.id,
              requires_action: true,
              actions: ["confirm", "cancel"],
              url: `/portal?tab=appointments&confirm_appointment=${apt.id}`,
            },
          });

          // Mark appointment as reminder sent
          await supabase
            .from("appointments")
            .update({ reminder_sent: true })
            .eq("id", apt.id);

          sentCount++;
        }
      }
    }

    // === FOLLOW-UP REMINDERS (every 20 min until client acts) ===
    const twentyMinAgo = new Date(now.getTime() - 20 * 60000);

    const { data: pendingApts } = await supabase
      .from("appointments")
      .select("id, client_id, service_id, start_time, user_id")
      .eq("reminder_sent", true)
      .eq("client_confirmed", false)
      .eq("status", "confirmed")
      .is("deleted_at", null)
      .gt("start_time", now.toISOString())
      .or(`last_reminder_at.is.null,last_reminder_at.lt.${twentyMinAgo.toISOString()}`);

    if (pendingApts && pendingApts.length > 0) {
      for (const apt of pendingApts) {
        // Get client's auth_user_id
        const { data: client } = await supabase
          .from("clients")
          .select("auth_user_id, first_name")
          .eq("id", apt.client_id)
          .single();

        if (!client?.auth_user_id) continue;

        // Get service name
        const { data: service } = await supabase
          .from("services")
          .select("name")
          .eq("id", apt.service_id)
          .single();

        const aptDate = new Date(apt.start_time);
        const dateStr = aptDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Rome" });
        const timeStr = aptDate.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });

        await createNotification(supabase, {
          user_id: client.auth_user_id,
          salon_user_id: apt.user_id,
          type: "reminder",
          title: "Ricordati di confermare!",
          body: `${service?.name || "Appuntamento"} - ${dateStr} alle ${timeStr}. Conferma o annulla la tua presenza.`,
          data: {
            appointment_id: apt.id,
            is_followup: true,
            requires_action: true,
            actions: ["confirm", "cancel"],
            url: `/portal?tab=appointments&confirm_appointment=${apt.id}`,
          },
        });

        await supabase
          .from("appointments")
          .update({ last_reminder_at: now.toISOString() })
          .eq("id", apt.id);

        sentCount++;
      }
    }

    return new Response(JSON.stringify({ sent: sentCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-reminders:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
