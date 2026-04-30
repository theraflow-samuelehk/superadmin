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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    // Quick login for registered operators
    if (action === "quick-login" && req.method === "POST") {
      const body = await req.json();
      const email = body.email?.trim()?.toLowerCase();

      if (!email) {
        return new Response(JSON.stringify({ error: "Email required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find operator with auth_user_id linked
      let operatorFound = false;
      const { data: authList } = await supabase.auth.admin.listUsers();
      const authUser = authList?.users?.find(
        (u) => u.email?.toLowerCase() === email
      );

      if (authUser) {
        const { data: op } = await supabase
          .from("operators")
          .select("id, auth_user_id")
          .eq("auth_user_id", authUser.id)
          .limit(1)
          .maybeSingle();
        if (op) operatorFound = true;
      }

      if (!operatorFound) {
        return new Response(JSON.stringify({ error: "email_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

      if (linkError || !linkData) {
        const isRateLimit = linkError?.message?.includes("rate") || linkError?.message?.includes("security");
        return new Response(JSON.stringify({ error: isRateLimit ? "rate_limited" : "login_failed" }), {
          status: isRateLimit ? 429 : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenHash = linkData.properties?.hashed_token;
      if (!tokenHash) {
        return new Response(JSON.stringify({ error: "login_failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ token_hash: tokenHash, type: "magiclink" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Instant login for invite flow – validates token & email match
    if (action === "invite-quick-login" && req.method === "POST") {
      const body = await req.json();
      const email = body.email?.trim()?.toLowerCase();
      const inviteToken = body.token;

      if (!email || !inviteToken) {
        return new Response(JSON.stringify({ error: "email_and_token_required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 1. Validate the invite token
      const { data: invite, error: invErr } = await supabase
        .from("operator_invites")
        .select("id, operator_id, user_id, accepted_at")
        .eq("token", inviteToken)
        .single();

      if (invErr || !invite) {
        return new Response(JSON.stringify({ error: "invite_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2. Get operator record (include email field)
      const { data: operator } = await supabase
        .from("operators")
        .select("id, auth_user_id, email")
        .eq("id", invite.operator_id)
        .single();

      if (!operator) {
        return new Response(JSON.stringify({ error: "operator_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 3. Verify email match
      if (operator.auth_user_id) {
        // Already linked: verify against auth account email
        const { data: existingAuth } = await supabase.auth.admin.getUserById(operator.auth_user_id);
        if (existingAuth?.user?.email?.toLowerCase() !== email) {
          return new Response(JSON.stringify({ error: "email_mismatch" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else if (operator.email) {
        // Not yet linked: verify against operator's configured email
        if (operator.email.toLowerCase() !== email) {
          return new Response(JSON.stringify({ error: "email_mismatch" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        // No auth_user_id and no email configured: admin must set email first
        return new Response(JSON.stringify({ error: "email_not_configured" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 4. Find or create auth user for this email
      const { data: authList } = await supabase.auth.admin.listUsers();
      let authUser = authList?.users?.find(
        (u) => u.email?.toLowerCase() === email
      );

      if (!authUser) {
        const { data: created, error: createErr } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
        });
        if (createErr || !created?.user) {
          return new Response(JSON.stringify({ error: "create_user_failed" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        authUser = created.user;
      }

      // 5. Link operator to auth user if not yet linked
      if (!operator.auth_user_id) {
        await supabase
          .from("operators")
          .update({ auth_user_id: authUser.id })
          .eq("id", operator.id);
      }

      // 5b. Ensure operator role is assigned
      await supabase
        .from("user_roles")
        .upsert({ user_id: authUser.id, role: "operator" }, { onConflict: "user_id,role" });

      // 5c. Remove 'user' role and auto-created profile to prevent owner dashboard access
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", authUser.id)
        .eq("role", "user");

      await supabase
        .from("profiles")
        .delete()
        .eq("user_id", authUser.id);

      // 6. Generate token_hash for instant login
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

      if (linkError || !linkData) {
        const isRateLimit = linkError?.message?.includes("rate") || linkError?.message?.includes("security");
        return new Response(JSON.stringify({ error: isRateLimit ? "rate_limited" : "login_failed" }), {
          status: isRateLimit ? 429 : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenHash = linkData.properties?.hashed_token;
      if (!tokenHash) {
        return new Response(JSON.stringify({ error: "login_failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ token_hash: tokenHash, type: "magiclink" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate operator invite token
    if (action === "validate-invite" && req.method === "GET") {
      const token = url.searchParams.get("token");
      if (!token || token.length < 10) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: invite, error } = await supabase
        .from("operator_invites")
        .select("id, user_id, operator_id, accepted_at")
        .eq("token", token)
        .single();

      if (error || !invite) {
        return new Response(JSON.stringify({ error: "Invite not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("salon_name, display_name")
        .eq("user_id", invite.user_id)
        .single();

      const { data: operator } = await supabase
        .from("operators")
        .select("name")
        .eq("id", invite.operator_id)
        .single();

      return new Response(
        JSON.stringify({
          valid: true,
          already_accepted: !!invite.accepted_at,
          salon_name: profile?.salon_name || profile?.display_name || "Salone",
          operator_name: operator?.name || "",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Accept operator invite
    if (action === "accept-invite" && req.method === "POST") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user: authUser }, error: userError } = await userClient.auth.getUser();
      if (userError || !authUser) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const token = body.token;

      if (!token) {
        return new Response(JSON.stringify({ error: "Token required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: result, error: rpcError } = await supabase.rpc("accept_operator_invite", {
        p_token: token,
        p_auth_user_id: authUser.id,
      });

      if (rpcError) {
        return new Response(JSON.stringify({ error: rpcError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get operator portal data
    if (action === "my-data" && req.method === "GET") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user: authUser }, error: userError } = await userClient.auth.getUser();
      if (userError || !authUser) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get operator record
      const { data: operator } = await supabase
        .from("operators")
        .select("*")
        .eq("auth_user_id", authUser.id)
        .is("deleted_at", null)
        .single();

      if (!operator) {
        return new Response(JSON.stringify({ error: "no_operator_linked" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get salon from accepted invite
      const { data: invite } = await supabase
        .from("operator_invites")
        .select("user_id")
        .eq("operator_id", operator.id)
        .not("accepted_at", "is", null)
        .limit(1)
        .single();

      if (!invite) {
        return new Response(JSON.stringify({ error: "no_salon_linked" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const salonUserId = invite.user_id;

      const { data: salonProfile } = await supabase
        .from("profiles")
        .select("salon_name, display_name, opening_hours")
        .eq("user_id", salonUserId)
        .single();

      // Get operator's future appointments (all)
      const now = new Date().toISOString();
      const { data: futureAppointments } = await supabase
        .from("appointments")
        .select("id, start_time, end_time, status, notes, service_id, operator_id, client_id")
        .eq("operator_id", operator.id)
        .eq("user_id", salonUserId)
        .is("deleted_at", null)
        .gte("start_time", now)
        .order("start_time", { ascending: true });

      // Get operator's past appointments (last 50)
      const { data: pastAppointments } = await supabase
        .from("appointments")
        .select("id, start_time, end_time, status, notes, service_id, operator_id, client_id")
        .eq("operator_id", operator.id)
        .eq("user_id", salonUserId)
        .is("deleted_at", null)
        .lt("start_time", now)
        .order("start_time", { ascending: false })
        .limit(50);

      const appointments = [...(futureAppointments || []), ...(pastAppointments || [])];

      // Get ALL salon appointments if operator has "agenda" permission
      let allAppointments: any[] = [];
      const permissions = operator.portal_permissions || {};
      if (permissions.agenda) {
        const { data: allAppts } = await supabase
          .from("appointments")
          .select("id, start_time, end_time, status, notes, service_id, operator_id, client_id")
          .eq("user_id", salonUserId)
          .is("deleted_at", null)
          .order("start_time", { ascending: false })
          .limit(500);
        allAppointments = allAppts || [];
      }

      // Get services for reference
      const { data: services } = await supabase
        .from("services")
        .select("id, name, duration_minutes, price")
        .eq("user_id", salonUserId)
        .is("deleted_at", null);

      // Get clients for reference
      const { data: clients } = await supabase
        .from("clients")
        .select("id, first_name, last_name")
        .eq("user_id", salonUserId)
        .is("deleted_at", null);

      // Get colleagues if operator has "operators" or "agenda" permission
      let colleagues: any[] = [];
      if (permissions.operators || permissions.agenda) {
        const { data: ops } = await supabase
          .from("operators")
          .select("id, name, role, specializations, calendar_color")
          .eq("user_id", salonUserId)
          .is("deleted_at", null);
        colleagues = (ops || []).filter((o: any) => permissions.operators || o.id !== operator.id);
      }

      return new Response(
        JSON.stringify({
          operator: {
            id: operator.id,
            name: operator.name,
            role: operator.role,
            portal_permissions: operator.portal_permissions || {},
          },
          salon: {
            name: salonProfile?.salon_name || salonProfile?.display_name || "Salone",
            opening_hours: salonProfile?.opening_hours,
            user_id: salonUserId,
          },
          appointments: appointments || [],
          allAppointments: permissions.agenda ? allAppointments : [],
          services: services || [],
          clients: clients || [],
          colleagues,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in operator-portal:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
