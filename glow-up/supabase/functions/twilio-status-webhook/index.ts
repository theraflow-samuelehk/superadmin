import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Constant-time string comparison to prevent timing attacks
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Validate Twilio request signature per:
 * https://www.twilio.com/docs/usage/security#validating-requests
 */
async function validateTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string
): Promise<boolean> {
  // 1. Build the data string: URL + sorted param keys with values appended
  const sortedKeys = Object.keys(params).sort();
  let dataString = url;
  for (const key of sortedKeys) {
    dataString += key + params[key];
  }

  // 2. HMAC-SHA1 with the auth token
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(authToken),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(dataString));

  // 3. Base64 encode
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(sig)));

  // 4. Constant-time compare
  return secureCompare(expectedSignature, signature);
}

/**
 * Twilio StatusCallback webhook — ONLY for order confirmation SMS.
 * Updates sms_delivery_log with delivery/failure status.
 * Now validates X-Twilio-Signature for authenticity.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const twilioSignature = req.headers.get("X-Twilio-Signature");
    if (!twilioSignature) {
      console.warn("[twilio-status] Missing X-Twilio-Signature header");
      return new Response("Forbidden", { status: 403 });
    }

    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const messageSid = params["MessageSid"];
    const messageStatus = params["MessageStatus"];
    const accountSid = params["AccountSid"];

    console.log(`[twilio-status] SID=${messageSid} Status=${messageStatus}`);

    if (!messageSid || !messageStatus) {
      return new Response("Missing params", { status: 400 });
    }

    // Look up the auth token for this account from salon_integrations
    // We need the AccountSid to find the right salon
    let authToken: string | null = null;

    if (accountSid) {
      const { data: integration } = await supabase
        .from("salon_integrations")
        .select("twilio_auth_token")
        .eq("twilio_account_sid", accountSid)
        .limit(1)
        .single();

      authToken = integration?.twilio_auth_token || null;
    }

    if (!authToken) {
      console.warn("[twilio-status] No auth token found for AccountSid:", accountSid);
      return new Response("Forbidden", { status: 403 });
    }

    // Validate the signature using the full webhook URL
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/twilio-status-webhook`;
    const isValid = await validateTwilioSignature(authToken, webhookUrl, params, twilioSignature);

    if (!isValid) {
      console.warn("[twilio-status] Invalid Twilio signature — rejecting request");
      return new Response("Forbidden", { status: 403 });
    }

    const isDelivered = messageStatus === "delivered" || messageStatus === "read";
    const isFailed = messageStatus === "undelivered" || messageStatus === "failed";

    if (!isDelivered && !isFailed) {
      return new Response("<Response></Response>", {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Look up in sms_delivery_log only
    const { data: logs } = await supabase
      .from("sms_delivery_log")
      .select("id")
      .eq("message_sid", messageSid)
      .limit(1);

    if (!logs || logs.length === 0) {
      console.log(`[twilio-status] No delivery log found for SID ${messageSid}`);
      return new Response("<Response></Response>", {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    const logId = logs[0].id;

    if (isDelivered) {
      await supabase
        .from("sms_delivery_log")
        .update({ status: "delivered", delivered_at: new Date().toISOString() })
        .eq("id", logId);
      console.log(`[twilio-status] Log ${logId} marked as delivered`);
    } else if (isFailed) {
      await supabase
        .from("sms_delivery_log")
        .update({ status: "failed", failed_at: new Date().toISOString() })
        .eq("id", logId);
      console.log(`[twilio-status] Log ${logId} marked as failed`);
    }

    return new Response("<Response></Response>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error: any) {
    console.error("Error in twilio-status-webhook:", error);
    return new Response("<Response></Response>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
});
