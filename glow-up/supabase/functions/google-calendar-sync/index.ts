import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://gateway.lovable.dev/google_calendar/calendar/v3";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY non configurata");

    const GOOGLE_CALENDAR_API_KEY = Deno.env.get("GOOGLE_CALENDAR_API_KEY");
    if (!GOOGLE_CALENDAR_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Google Calendar non connesso. Configura il connettore nelle impostazioni." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non autenticato");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Non autenticato");

    const { action, appointmentId, calendarId = "primary" } = await req.json();

    const headers = {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_CALENDAR_API_KEY,
      "Content-Type": "application/json",
    };

    switch (action) {
      case "list-calendars": {
        const res = await fetch(`${GATEWAY_URL}/users/me/calendarList`, { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(`Google Calendar API failed [${res.status}]: ${JSON.stringify(data)}`);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "sync-appointment": {
        if (!appointmentId) throw new Error("appointmentId richiesto");

        // Get appointment with related data
        const { data: appt, error: apptError } = await supabase
          .from("appointments")
          .select("*, clients(first_name, last_name, phone), services(name, duration_minutes), operators(name)")
          .eq("id", appointmentId)
          .eq("user_id", user.id)
          .single();

        if (apptError || !appt) throw new Error("Appuntamento non trovato");

        const clientName = appt.clients ? `${appt.clients.first_name} ${appt.clients.last_name}` : "Cliente";
        const serviceName = appt.services?.name || "Servizio";
        const operatorName = appt.operators?.name || "";

        const eventBody = {
          summary: `${serviceName} - ${clientName}`,
          description: `Operatrice: ${operatorName}\n${appt.notes || ""}`.trim(),
          start: {
            dateTime: appt.start_time,
            timeZone: "Europe/Rome",
          },
          end: {
            dateTime: appt.end_time,
            timeZone: "Europe/Rome",
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: "popup", minutes: 30 },
            ],
          },
        };

        let result;
        if (appt.google_calendar_event_id) {
          // Update existing event
          const res = await fetch(
            `${GATEWAY_URL}/calendars/${calendarId}/events/${appt.google_calendar_event_id}`,
            { method: "PUT", headers, body: JSON.stringify(eventBody) }
          );
          result = await res.json();
          if (!res.ok) throw new Error(`Google Calendar update failed [${res.status}]: ${JSON.stringify(result)}`);
        } else {
          // Create new event
          const res = await fetch(
            `${GATEWAY_URL}/calendars/${calendarId}/events`,
            { method: "POST", headers, body: JSON.stringify(eventBody) }
          );
          result = await res.json();
          if (!res.ok) throw new Error(`Google Calendar create failed [${res.status}]: ${JSON.stringify(result)}`);

          // Save event ID
          await supabase
            .from("appointments")
            .update({ google_calendar_event_id: result.id })
            .eq("id", appointmentId);
        }

        return new Response(JSON.stringify({ success: true, eventId: result.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete-event": {
        if (!appointmentId) throw new Error("appointmentId richiesto");

        const { data: appt } = await supabase
          .from("appointments")
          .select("google_calendar_event_id")
          .eq("id", appointmentId)
          .eq("user_id", user.id)
          .single();

        if (appt?.google_calendar_event_id) {
          const res = await fetch(
            `${GATEWAY_URL}/calendars/${calendarId}/events/${appt.google_calendar_event_id}`,
            { method: "DELETE", headers }
          );
          if (!res.ok && res.status !== 404) {
            const data = await res.text();
            throw new Error(`Google Calendar delete failed [${res.status}]: ${data}`);
          }

          await supabase
            .from("appointments")
            .update({ google_calendar_event_id: null })
            .eq("id", appointmentId);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Azione non supportata: ${action}`);
    }
  } catch (error) {
    console.error("Google Calendar sync error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Errore sconosciuto" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
