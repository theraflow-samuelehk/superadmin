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

  try {
    // Authenticate user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify the user's JWT
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { primary_id, secondary_id } = body;

    if (!primary_id || !secondary_id || primary_id === secondary_id) {
      return new Response(JSON.stringify({ error: "Invalid client IDs" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify both clients belong to the authenticated user
    const { data: clients } = await supabaseAdmin
      .from("clients")
      .select("id, user_id")
      .in("id", [primary_id, secondary_id]);

    if (!clients || clients.length !== 2) {
      return new Response(JSON.stringify({ error: "Clients not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allBelongToUser = clients.every((c) => c.user_id === user.id);
    if (!allBelongToUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Move all FK references from secondary to primary
    const tables = [
      "appointments",
      "transactions",
      "treatment_cards",
      "client_packages",
      "treatment_photos",
      "loyalty_points",
      "chat_conversations",
      "client_invites",
    ];

    for (const table of tables) {
      const { error } = await supabaseAdmin
        .from(table)
        .update({ client_id: primary_id })
        .eq("client_id", secondary_id);
      
      if (error) {
        console.log(`[merge-clients] Warning: could not update ${table}: ${error.message}`);
        // Some tables might not exist or have no rows — continue
      }
    }

    // Soft-delete the secondary client
    const { error: deleteError } = await supabaseAdmin
      .from("clients")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", secondary_id);

    if (deleteError) {
      return new Response(JSON.stringify({ error: "Failed to archive secondary client" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[merge-clients] Merged ${secondary_id} into ${primary_id} by user ${user.id}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[merge-clients] Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
