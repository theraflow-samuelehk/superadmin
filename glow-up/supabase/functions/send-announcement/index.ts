import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createNotification } from "../_shared/notifications.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Authenticate salon owner
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

    const { title, body } = await req.json();
    if (!title || !body) {
      return new Response(JSON.stringify({ error: "Title and body required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save announcement
    const { data: announcement, error: annError } = await supabase
      .from("announcements")
      .insert({
        user_id: user.id,
        title,
        body,
        sent_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (annError) throw annError;

    // Get all registered clients for this salon
    const { data: clients } = await supabase
      .from("clients")
      .select("auth_user_id")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .not("auth_user_id", "is", null);

    let sentCount = 0;
    for (const client of clients || []) {
      if (!client.auth_user_id) continue;
      try {
        await createNotification(supabase, {
          user_id: client.auth_user_id,
          salon_user_id: user.id,
          type: "announcement",
          title,
          body,
          data: { announcement_id: announcement.id, url: '/portal' },
        });
        sentCount++;
      } catch (e) {
        console.error("Failed to notify client:", e);
      }
    }

    // Notify salon owner too
    await createNotification(supabase, {
      user_id: user.id,
      salon_user_id: user.id,
      type: "announcement",
      title: `Avviso inviato a ${sentCount} clienti`,
      body: title,
      data: { announcement_id: announcement.id },
    });

    return new Response(JSON.stringify({ success: true, sent: sentCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-announcement:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
