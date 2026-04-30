import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function base64UrlEncode(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // GET: return VAPID public key (generate if needed)
    if (req.method === "GET") {
      const { data: existing } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "vapid_public_key")
        .maybeSingle();

      if (existing?.value) {
        return new Response(JSON.stringify({ publicKey: existing.value }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate VAPID keys using Web Crypto API
      const keyPair = await crypto.subtle.generateKey(
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["sign", "verify"]
      );

      const publicKeyRaw = await crypto.subtle.exportKey("raw", keyPair.publicKey);
      const publicKeyB64 = base64UrlEncode(new Uint8Array(publicKeyRaw));

      const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
      const privateKeyB64 = privateKeyJwk.d!;

      // Store keys
      await supabase.from("platform_settings").delete().in("key", ["vapid_public_key", "vapid_private_key"]);
      await supabase.from("platform_settings").insert([
        { key: "vapid_public_key", value: publicKeyB64, description: "Web Push VAPID public key" },
        { key: "vapid_private_key", value: privateKeyB64, description: "Web Push VAPID private key" },
      ]);

      return new Response(JSON.stringify({ publicKey: publicKeyB64 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST/DELETE need authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const { endpoint, p256dh, auth } = await req.json();

      if (!endpoint || !p256dh || !auth) {
        return new Response(JSON.stringify({ error: "Missing fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Remove existing for this endpoint then insert
      await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
      const { error } = await supabase.from("push_subscriptions").insert({
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
      });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE") {
      const { endpoint } = await req.json();
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id)
        .eq("endpoint", endpoint);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in push-subscribe:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
