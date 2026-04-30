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
    const { salon_user_id, to: rawTo, body, flow_node_id, track_delivery, delivery_log_id } = await req.json();
    if (!salon_user_id || !rawTo || !body) {
      throw new Error("salon_user_id, to, and body are required");
    }

    // Normalize phone to E.164 — auto-add +39 for Italian numbers
    let to = rawTo.replace(/\s+/g, "").replace(/^(\+)/, "");
    const digits = to.replace(/\D/g, "");
    if (digits.length === 10 && /^3\d{9}$/.test(digits)) {
      to = `+39${digits}`;
    } else if (!to.startsWith("+")) {
      to = `+${digits}`;
    }
    console.log(`[send-sms] normalized phone: ${rawTo} -> ${to}`);

    // Get salon's Twilio credentials
    const { data: integration } = await supabase
      .from("salon_integrations")
      .select("twilio_account_sid, twilio_auth_token, twilio_phone_number, twilio_sender_id, twilio_messaging_service_sid, sender_id_enabled, sms_enabled")
      .eq("user_id", salon_user_id)
      .single();

    if (!integration || !integration.sms_enabled) {
      return new Response(JSON.stringify({ sent: false, reason: "sms_not_enabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { twilio_account_sid, twilio_auth_token, twilio_phone_number, twilio_sender_id, twilio_messaging_service_sid, sender_id_enabled } = integration;
    
    const useSenderId = sender_id_enabled && twilio_sender_id;
    const useMessagingService = !!twilio_messaging_service_sid;

    if (!twilio_account_sid || !twilio_auth_token || (!twilio_phone_number && !useSenderId && !useMessagingService)) {
      return new Response(JSON.stringify({ sent: false, reason: "twilio_not_configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send SMS via Twilio REST API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilio_account_sid}/Messages.json`;
    const authHeader = btoa(`${twilio_account_sid}:${twilio_auth_token}`);

    // StatusCallback only if explicitly requested (e.g. order confirmations)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const statusCallbackUrl = `${supabaseUrl}/functions/v1/twilio-status-webhook`;

    const sendSms = async (params: URLSearchParams, trackDelivery = false) => {
      if (trackDelivery) {
        params.set("StatusCallback", statusCallbackUrl);
      }
      return fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });
    };

    let response: Response;
    let result: any;

    const shouldTrack = !!track_delivery;

    if (useMessagingService) {
      const params = new URLSearchParams({ To: to, Body: body, MessagingServiceSid: twilio_messaging_service_sid });
      response = await sendSms(params, shouldTrack);
      result = await response.json();
    } else if (useSenderId) {
      const params = new URLSearchParams({ To: to, Body: body, From: twilio_sender_id });
      response = await sendSms(params, shouldTrack);
      result = await response.json();
      if (!response.ok && result.code === 21267 && twilio_phone_number) {
        console.log("Sender ID not supported (trial account), retrying with phone number");
        const fallbackParams = new URLSearchParams({ To: to, Body: body, From: twilio_phone_number });
        response = await sendSms(fallbackParams, shouldTrack);
        result = await response.json();
      }
    } else {
      const params = new URLSearchParams({ To: to, Body: body, From: twilio_phone_number });
      response = await sendSms(params, shouldTrack);
      result = await response.json();
    }

    if (!response.ok) {
      console.error("Twilio error:", result);
      return new Response(JSON.stringify({ sent: false, error: result.message || "Twilio error" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save message SID to delivery log (for order confirmations)
    if (delivery_log_id && result.sid) {
      await supabase
        .from("sms_delivery_log")
        .update({ message_sid: result.sid })
        .eq("id", delivery_log_id);
    }

    // Log usage for billing
    try {
      const { data: priceSetting } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "sms_unit_price")
        .maybeSingle();

      await supabase.from("messaging_usage_log").insert({
        salon_user_id,
        channel: "sms",
        recipient_phone: to,
        flow_node_id: flow_node_id || null,
        message_sid: result.sid || null,
        unit_price: parseFloat(priceSetting?.value || "0.10"),
      });
    } catch (logErr) {
      console.error("Failed to log SMS usage:", logErr);
    }

    return new Response(JSON.stringify({ sent: true, sid: result.sid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-sms:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
