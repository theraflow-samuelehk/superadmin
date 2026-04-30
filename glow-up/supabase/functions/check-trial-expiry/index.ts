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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find profiles with expired trial and no active subscription
    // Exclude super_admins, clients, operators, affiliates
    const { data: specialRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["client", "operator", "affiliate", "affiliate_manager", "super_admin"]);

    const excludeIds = new Set((specialRoles || []).map((r: any) => r.user_id));

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, salon_name, display_name, trial_ends_at")
      .is("deleted_at", null)
      .lt("trial_ends_at", new Date().toISOString());

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No expired trials" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter out non-retailers
    const retailerProfiles = profiles.filter(
      (p: any) => !excludeIds.has(p.user_id)
    );

    // Check which have active subscriptions
    const { data: activeSubs } = await supabase
      .from("subscriptions")
      .select("user_id")
      .is("deleted_at", null)
      .eq("status", "active");

    const activeSubIds = new Set((activeSubs || []).map((s: any) => s.user_id));

    const expiredWithoutPlan = retailerProfiles.filter(
      (p: any) => !activeSubIds.has(p.user_id)
    );

    if (expiredWithoutPlan.length === 0) {
      return new Response(JSON.stringify({ message: "All expired trials have plans" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get super admins
    const { data: superAdminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "super_admin");

    const superAdminIds = (superAdminRoles || []).map((r: any) => r.user_id);

    if (superAdminIds.length === 0) {
      return new Response(JSON.stringify({ message: "No super admins found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for duplicate notifications in last 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    let notificationsSent = 0;

    for (const profile of expiredWithoutPlan) {
      const centerName = profile.salon_name || profile.display_name || "Centro senza nome";

      for (const adminId of superAdminIds) {
        // Check if notification already sent
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", adminId)
          .eq("type", "trial_expired")
          .gte("created_at", yesterday)
          .like("body", `%${profile.user_id}%`)
          .maybeSingle();

        if (existing) continue;

        await createNotification(supabase, {
          user_id: adminId,
          salon_user_id: adminId,
          type: "trial_expired",
          title: "Prova scaduta senza piano",
          body: `Il centro "${centerName}" non ha rinnovato il piano dopo la prova gratuita. [${profile.user_id}]`,
          data: { retailer_user_id: profile.user_id },
        });

        notificationsSent++;
      }
    }

    return new Response(
      JSON.stringify({
        message: `Sent ${notificationsSent} notifications for ${expiredWithoutPlan.length} expired trials`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("check-trial-expiry error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
