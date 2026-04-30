import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Fetch queued messages that are ready to be sent
    const now = new Date().toISOString();
    const { data: queuedMessages, error: fetchErr } = await supabase
      .from("wa_message_queue")
      .select("*")
      .eq("status", "queued")
      .lte("scheduled_for", now)
      .order("scheduled_for", { ascending: true })
      .limit(20); // Process in batches

    if (fetchErr) throw fetchErr;

    if (!queuedMessages?.length) {
      return new Response(JSON.stringify({ processed: 0, message: "Nessun messaggio in coda" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let failed = 0;
    let requeued = 0;

    for (const msg of queuedMessages) {
      try {
        // Call send-whatsapp with skip_rate_limit=false so it applies budget checks again
        // But we pass through the queue, so it re-evaluates
        const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            salon_user_id: msg.salon_user_id,
            to: msg.recipient_phone,
            body: msg.body,
            flow_node_id: msg.flow_node_id,
            skip_rate_limit: true, // Already passed rate limit check once
          }),
        });

        const result = await sendResponse.json();

        if (result.sent) {
          await supabase
            .from("wa_message_queue")
            .update({ status: "sent", processed_at: new Date().toISOString() })
            .eq("id", msg.id);
          sent++;
        } else if (result.reason === "queued_outside_window" || result.reason === "queued_budget_exceeded") {
          // Still not ready, increment attempts
          await supabase
            .from("wa_message_queue")
            .update({ attempts: msg.attempts + 1 })
            .eq("id", msg.id);
          requeued++;
        } else {
          await supabase
            .from("wa_message_queue")
            .update({
              status: msg.attempts >= 3 ? "failed" : "queued",
              attempts: msg.attempts + 1,
              error_message: result.error || result.reason || "Unknown error",
              processed_at: msg.attempts >= 3 ? new Date().toISOString() : null,
            })
            .eq("id", msg.id);
          failed++;
        }

        // Small delay between queue processing
        await new Promise((r) => setTimeout(r, 2000 + Math.random() * 3000));
      } catch (sendErr: any) {
        console.error(`[process-wa-queue] Error processing message ${msg.id}:`, sendErr);
        await supabase
          .from("wa_message_queue")
          .update({
            attempts: msg.attempts + 1,
            error_message: sendErr.message,
            status: msg.attempts >= 3 ? "failed" : "queued",
          })
          .eq("id", msg.id);
        failed++;
      }
    }

    console.log(`[process-wa-queue] Done: sent=${sent}, failed=${failed}, requeued=${requeued}`);

    return new Response(
      JSON.stringify({ processed: queuedMessages.length, sent, failed, requeued }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[process-wa-queue] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
