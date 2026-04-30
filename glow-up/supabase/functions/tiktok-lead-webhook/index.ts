import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createNotification } from "../_shared/notifications.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("[tiktok-webhook] Received:", JSON.stringify(body));

    const { full_name, email, phone, lead_data, user_id } = body;

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate a unique lead ID for TikTok leads
    const tiktokLeadId = `tiktok_${crypto.randomUUID()}`;

    const { error: insertError } = await supabase
      .from("facebook_leads")
      .insert({
        user_id,
        fb_lead_id: tiktokLeadId,
        full_name: full_name || null,
        email: email || null,
        phone: phone || null,
        lead_data: lead_data || {},
        source: "tiktok",
        status: "new",
      });

    if (insertError) {
      console.error("[tiktok-webhook] Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save lead" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[tiktok-webhook] Lead saved for user ${user_id}`);

    // Send push notification to super admin(s)
    try {
      const { data: superAdmins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "super_admin");

      const leadLabel = full_name || email || phone || "Nuovo lead";

      for (const admin of superAdmins || []) {
        await createNotification(supabase, {
          user_id: admin.user_id,
          salon_user_id: admin.user_id,
          type: "new_lead",
          title: "🎵 Nuovo Lead TikTok!",
          body: `${leadLabel}`,
          data: { lead_id: tiktokLeadId, source: "tiktok" },
        });
      }
    } catch (notifErr) {
      console.error("[tiktok-webhook] Notification error (non-fatal):", notifErr);
    }

    return new Response(
      JSON.stringify({ success: true, lead_id: tiktokLeadId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[tiktok-webhook] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
