import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createNotification } from "../_shared/notifications.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify the user using getClaims
    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { conversation_id, content, sender_type } = await req.json();

    // Get the conversation to determine recipient
    const { data: convo, error: convoErr } = await supabase
      .from("chat_conversations")
      .select("user_id, client_id, clients(first_name, last_name, auth_user_id)")
      .eq("id", conversation_id)
      .single();

    if (convoErr || !convo) {
      console.error("Conversation not found:", convoErr);
      return new Response(JSON.stringify({ error: "conversation_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const salonUserId = convo.user_id;
    const client = convo.clients as any;
    const truncatedContent =
      content && content.length > 80
        ? content.substring(0, 80) + "…"
        : content || "";

    if (sender_type === "client") {
      // Client sent message → notify salon owner
      const senderName = client
        ? `${client.first_name} ${client.last_name || ""}`.trim()
        : "Cliente";

      await createNotification(supabase, {
        user_id: salonUserId,
        salon_user_id: salonUserId,
        type: "chat",
        title: `💬 ${senderName}`,
        body: truncatedContent,
        data: { conversation_id, url: "/chat" },
      });
    } else {
      // Salon sent message → notify client (if they have auth_user_id)
      const clientAuthUserId = client?.auth_user_id;
      if (clientAuthUserId) {
        // Get salon name
        const { data: profile } = await supabase
          .from("profiles")
          .select("salon_name, display_name")
          .eq("user_id", salonUserId)
          .single();

        const salonName =
          profile?.salon_name || profile?.display_name || "Salone";

        await createNotification(supabase, {
          user_id: clientAuthUserId,
          salon_user_id: salonUserId,
          type: "chat",
          title: `💬 ${salonName}`,
          body: truncatedContent,
          data: { conversation_id, url: "/portal?tab=chat" },
        });
      } else {
        console.log("Client has no auth_user_id, skipping notification");
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("chat-notification error:", err);
    return new Response(JSON.stringify({ error: "internal" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
