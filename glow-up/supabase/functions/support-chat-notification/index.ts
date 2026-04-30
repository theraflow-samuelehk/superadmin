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

    const { conversation_id, content, sender_type } = await req.json();

    // Get the conversation
    const { data: convo, error: convoErr } = await supabase
      .from("support_conversations")
      .select("retailer_user_id")
      .eq("id", conversation_id)
      .single();

    if (convoErr || !convo) {
      return new Response(JSON.stringify({ error: "conversation_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const truncatedContent =
      content && content.length > 80
        ? content.substring(0, 80) + "…"
        : content || "";

    if (sender_type === "retailer") {
      // Retailer sent → notify all super_admins
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "super_admin");

      // Get retailer name
      const { data: profile } = await supabase
        .from("profiles")
        .select("salon_name, display_name")
        .eq("user_id", convo.retailer_user_id)
        .single();

      const salonName = profile?.salon_name || profile?.display_name || "Centro";

      for (const admin of adminRoles || []) {
        await createNotification(supabase, {
          user_id: admin.user_id,
          salon_user_id: convo.retailer_user_id,
          type: "support_chat",
          title: `🛟 ${salonName}`,
          body: truncatedContent,
          data: { conversation_id, url: "/admin?tab=support" },
        });
      }
    } else {
      // Admin sent → notify retailer
      await createNotification(supabase, {
        user_id: convo.retailer_user_id,
        salon_user_id: convo.retailer_user_id,
        type: "support_chat",
        title: `🛟 Supporto GlowUp`,
        body: truncatedContent,
        data: { conversation_id, url: "/supporto" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("support-chat-notification error:", err);
    return new Response(JSON.stringify({ error: "internal" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
