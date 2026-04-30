import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  const url = new URL(req.url);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // GET = Meta webhook verification challenge
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    console.log("[whatsapp-webhook] Verification request:", { mode, token });

    if (mode !== "subscribe" || !token || !challenge) {
      return new Response("Bad request", { status: 400 });
    }

    // Look up the verify token from salon_integrations
    const { data: integration } = await supabase
      .from("salon_integrations")
      .select("whatsapp_verify_token")
      .not("whatsapp_verify_token", "is", null)
      .eq("whatsapp_enabled", true)
      .limit(1)
      .maybeSingle();

    if (!integration || integration.whatsapp_verify_token !== token) {
      console.error("[whatsapp-webhook] Token mismatch");
      return new Response("Forbidden", { status: 403 });
    }

    console.log("[whatsapp-webhook] Verification OK, returning challenge");
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  // POST = incoming message / status update from Meta
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("[whatsapp-webhook] Incoming event:", JSON.stringify(body).substring(0, 500));

      // Process status updates (delivery receipts)
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (value?.statuses) {
        for (const status of value.statuses) {
          const messageId = status.id;
          const statusName = status.status; // sent, delivered, read, failed

          console.log(`[whatsapp-webhook] Status update: ${messageId} -> ${statusName}`);

          if (statusName === "delivered") {
            await supabase
              .from("reminder_flow_nodes")
              .update({ whatsapp_delivered_at: new Date().toISOString() })
              .eq("whatsapp_message_sid", messageId);
          }
        }
      }

      // For now, log incoming messages but don't process them
      if (value?.messages) {
        for (const msg of value.messages) {
          console.log(`[whatsapp-webhook] Incoming message from ${msg.from}: ${msg.text?.body || "(media)"}`);
        }
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err: any) {
      console.error("[whatsapp-webhook] Error processing:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response("Method not allowed", { status: 405 });
});
