import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createNotification } from "../_shared/notifications.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ── Facebook Webhook Verification (GET) ──
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: setting } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "facebook_webhook_verify_token")
      .single();

    const verifyToken = setting?.value || "glowup_fb_leads_verify";

    if (mode === "subscribe" && token === verifyToken) {
      console.log("[fb-webhook] Verification successful");
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }

    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // ── Receive Lead Data (POST) ──
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("[fb-webhook] Received:", JSON.stringify(body));

      if (body.object !== "page") {
        return new Response("Not a page event", { status: 200, headers: corsHeaders });
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      for (const entry of body.entry || []) {
        const fbPageId = entry.id;

        for (const change of entry.changes || []) {
          if (change.field !== "leadgen") continue;

          const leadgenId = change.value?.leadgen_id;
          const formId = change.value?.form_id;

          if (!leadgenId) continue;

          // Find which salon owns this FB page
          const { data: fbPage } = await supabase
            .from("facebook_pages")
            .select("id, user_id, page_access_token, page_name")
            .eq("page_id", fbPageId)
            .eq("is_active", true)
            .limit(1)
            .single();

          if (!fbPage) {
            console.log(`[fb-webhook] No active page found for FB page ${fbPageId}`);
            continue;
          }

          // Fetch lead data from Facebook Graph API
          // Prefer system user token (permanent) over page-level token
          const accessToken = Deno.env.get("FB_SYSTEM_USER_TOKEN") || fbPage.page_access_token;
          let leadData: Record<string, any> = {};
          let fullName = "";
          let email = "";
          let phone = "";

          try {
            const graphRes = await fetch(
              `https://graph.facebook.com/v21.0/${leadgenId}?access_token=${accessToken}`
            );
            const graphData = await graphRes.json();

            if (graphData.field_data) {
              leadData = graphData;
              for (const field of graphData.field_data) {
                const val = field.values?.[0] || "";
                const name = (field.name || "").toLowerCase();
                if (name === "full_name" || name === "nome_completo" || name === "nome") {
                  fullName = val;
                } else if (name === "email") {
                  email = val;
                } else if (name === "phone_number" || name === "telefono" || name === "numero_di_telefono") {
                  phone = val;
                }
              }
            }
          } catch (graphErr) {
            console.error("[fb-webhook] Graph API error:", graphErr);
            leadData = { error: "Failed to fetch from Graph API", leadgen_id: leadgenId };
          }

          // Upsert lead (idempotent based on fb_lead_id)
          const { error: insertError } = await supabase
            .from("facebook_leads")
            .upsert(
              {
                user_id: fbPage.user_id,
                facebook_page_id: fbPage.id,
                fb_lead_id: leadgenId,
                fb_form_id: formId,
                fb_page_id: fbPageId,
                lead_data: leadData,
                full_name: fullName || null,
                email: email || null,
                phone: phone || null,
                status: "new",
              },
              { onConflict: "user_id,fb_lead_id" }
            );

          if (insertError) {
            console.error("[fb-webhook] Insert error:", insertError);
          } else {
            console.log(`[fb-webhook] Lead ${leadgenId} saved for user ${fbPage.user_id}`);

            // Send push notification to super admin(s)
            try {
              const { data: superAdmins } = await supabase
                .from("user_roles")
                .select("user_id")
                .eq("role", "super_admin");

              const leadLabel = fullName || email || phone || leadgenId;
              const pageName = (fbPage as any).page_name || fbPageId;

              for (const admin of superAdmins || []) {
                await createNotification(supabase, {
                  user_id: admin.user_id,
                  salon_user_id: admin.user_id,
                  type: "new_lead",
                  title: "🟢 Nuovo Lead Facebook!",
                  body: `${leadLabel} — dalla pagina ${pageName}`,
                  data: { lead_id: leadgenId, page_name: pageName },
                });
              }
              console.log(`[fb-webhook] Push notification sent for lead ${leadgenId}`);
            } catch (notifErr) {
              console.error("[fb-webhook] Notification error (non-fatal):", notifErr);
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("[fb-webhook] Error:", err);
      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
