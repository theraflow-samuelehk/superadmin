import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createNotification } from "../_shared/notifications.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    const now = new Date();
    const italyTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Rome" }));
    const currentHour = italyTime.getHours();

    const defaultSlots = [
      { hour: 8, key: "morning", isNextDay: false, title: "☀️ Reminder Mattina" },
      { hour: 12, key: "midday", isNextDay: false, title: "🔔 Follow-up Mezzogiorno" },
      { hour: 16, key: "afternoon", isNextDay: false, title: "⏰ Ultimo Sollecito" },
      { hour: 19, key: "evening", isNextDay: true, title: "🌙 Reminder per Domani" },
    ];

    // Get all active salon owners
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, salon_name, display_name")
      .is("deleted_at", null);

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;

    for (const profile of profiles) {
      // Read user's config or use defaults
      const { data: configRow } = await supabase
        .from("manual_reminder_config")
        .select("slots")
        .eq("user_id", profile.user_id)
        .maybeSingle();

      const userSlots = configRow?.slots && Array.isArray(configRow.slots)
        ? (configRow.slots as any[])
        : defaultSlots;

      // Find slot matching current hour
      const activeSlot = userSlots.find((s: any) => s.enabled !== false && s.hour === currentHour);
      if (!activeSlot) continue;

      const isNextDay = activeSlot.isNextDay || false;
      const slotTitle = activeSlot.key === "morning" ? "☀️ Reminder Mattina"
        : activeSlot.key === "midday" ? "🔔 Follow-up Mezzogiorno"
        : activeSlot.key === "afternoon" ? "⏰ Ultimo Sollecito"
        : activeSlot.key === "evening" ? "🌙 Reminder per Domani"
        : `🔔 Reminder ${activeSlot.label || activeSlot.key}`;

      const targetDate = new Date(italyTime);
      if (isNextDay) targetDate.setDate(targetDate.getDate() + 1);
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Get appointments in slot range
      let query = supabase
        .from("appointments")
        .select("id")
        .eq("user_id", profile.user_id)
        .is("deleted_at", null)
        .in("status", ["confirmed", "in_progress"])
        .gte("start_time", dayStart.toISOString())
        .lte("start_time", dayEnd.toISOString());

      const { data: appointments } = await query;
      if (!appointments || appointments.length === 0) continue;

      // Exclude already-sent
      const aptIds = appointments.map(a => a.id);
      const { data: sentLogs } = await supabase
        .from("manual_reminder_logs")
        .select("appointment_id")
        .in("appointment_id", aptIds);

      const sentSet = new Set((sentLogs || []).map(l => l.appointment_id));
      const unsent = aptIds.filter(id => !sentSet.has(id));
      if (unsent.length === 0) continue;

      const count = unsent.length;
      const dayLabel = isNextDay ? "domani" : "oggi";

      await createNotification(supabase, {
        user_id: profile.user_id,
        salon_user_id: profile.user_id,
        type: "system",
        title: slotTitle,
        body: `Hai ${count} ${count === 1 ? "cliente" : "clienti"} da avvisare per ${dayLabel}. Apri la sezione Reminder WhatsApp per inviarli.`,
        data: {
          url: "/reminder-whatsapp",
          slot: activeSlot.key,
          count,
        },
      });

      sentCount++;
    }

    return new Response(JSON.stringify({ sent: sentCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in wa-reminder-notify:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
