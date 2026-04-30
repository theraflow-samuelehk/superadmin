import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getAuthUser(req: Request, supabaseUrl: string) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return null;
  return user;
}

async function getManagerAffiliate(supabase: any, authUserId: string) {
  const { data } = await supabase
    .from("affiliates")
    .select("*")
    .eq("auth_user_id", authUserId)
    .eq("is_manager", true)
    .is("deleted_at", null)
    .single();
  return data;
}

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
    // ── Quick login ──
    if (action === "quick-login" && req.method === "POST") {
      return await handleQuickLogin(supabase, req);
    }

    // ── Invite quick login ──
    if (action === "invite-quick-login" && req.method === "POST") {
      return await handleInviteQuickLogin(supabase, supabaseUrl, req);
    }

    // ── Validate invite ──
    if (action === "validate-invite" && req.method === "GET") {
      return await handleValidateInvite(supabase, url);
    }

    // ── Accept invite ──
    if (action === "accept-invite" && req.method === "POST") {
      return await handleAcceptInvite(supabase, supabaseUrl, req);
    }

    // ── My data ──
    if (action === "my-data" && req.method === "GET") {
      return await handleMyData(supabase, supabaseUrl, req);
    }

    // ── Create team member (manager only) ──
    if (action === "create-team-member" && req.method === "POST") {
      return await handleCreateTeamMember(supabase, supabaseUrl, req);
    }

    // ── Create team invite (manager only) ──
    if (action === "create-team-invite" && req.method === "POST") {
      return await handleCreateTeamInvite(supabase, supabaseUrl, req);
    }

    // ── Assign client to member (manager only) ──
    if (action === "assign-client-to-member" && req.method === "POST") {
      return await handleAssignClientToMember(supabase, supabaseUrl, req);
    }

    return json({ error: "Invalid action" }, 400);
  } catch (error: any) {
    console.error("Error in affiliate-portal:", error);
    return json({ error: "Internal server error" }, 500);
  }
});

// ══════════════════════════════════════════════════════════════════
// Action handlers
// ══════════════════════════════════════════════════════════════════

async function handleQuickLogin(supabase: any, req: Request) {
  const body = await req.json();
  const email = body.email?.trim()?.toLowerCase();
  if (!email) return json({ error: "Email required" }, 400);

  const { data: authList } = await supabase.auth.admin.listUsers();
  const authUser = authList?.users?.find((u: any) => u.email?.toLowerCase() === email);

  let affiliateFound = false;
  if (authUser) {
    const { data: aff } = await supabase
      .from("affiliates").select("id").eq("auth_user_id", authUser.id).is("deleted_at", null).limit(1).maybeSingle();
    if (aff) affiliateFound = true;
  }

  if (!affiliateFound) return json({ error: "email_not_found" }, 404);

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({ type: "magiclink", email });
  if (linkError || !linkData) {
    const isRateLimit = linkError?.message?.includes("rate") || linkError?.message?.includes("security");
    return json({ error: isRateLimit ? "rate_limited" : "login_failed" }, isRateLimit ? 429 : 500);
  }

  const tokenHash = linkData.properties?.hashed_token;
  if (!tokenHash) return json({ error: "login_failed" }, 500);
  return json({ token_hash: tokenHash, type: "magiclink" });
}

async function handleInviteQuickLogin(supabase: any, supabaseUrl: string, req: Request) {
  const body = await req.json();
  const email = body.email?.trim()?.toLowerCase();
  const inviteToken = body.token;
  if (!email || !inviteToken) return json({ error: "email_and_token_required" }, 400);

  const { data: invite } = await supabase
    .from("affiliate_invites").select("id, affiliate_id, created_by, accepted_at").eq("token", inviteToken).single();
  if (!invite) return json({ error: "invite_not_found" }, 404);

  const { data: affiliate } = await supabase
    .from("affiliates").select("id, auth_user_id, email").eq("id", invite.affiliate_id).single();
  if (!affiliate) return json({ error: "affiliate_not_found" }, 404);

  // Verify email match
  if (affiliate.auth_user_id) {
    const { data: existingAuth } = await supabase.auth.admin.getUserById(affiliate.auth_user_id);
    if (existingAuth?.user?.email?.toLowerCase() !== email) return json({ error: "email_mismatch" }, 403);
  } else if (affiliate.email) {
    if (affiliate.email.toLowerCase() !== email) return json({ error: "email_mismatch" }, 403);
  } else {
    return json({ error: "email_not_configured" }, 400);
  }

  // Find or create auth user
  const { data: authList } = await supabase.auth.admin.listUsers();
  let authUser = authList?.users?.find((u: any) => u.email?.toLowerCase() === email);

  if (!authUser) {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({ email, email_confirm: true });
    if (createErr || !created?.user) return json({ error: "create_user_failed" }, 500);
    authUser = created.user;
  }

  if (!affiliate.auth_user_id) {
    await supabase.from("affiliates").update({ auth_user_id: authUser.id }).eq("id", affiliate.id);
  }

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({ type: "magiclink", email });
  if (linkError || !linkData) {
    const isRateLimit = linkError?.message?.includes("rate") || linkError?.message?.includes("security");
    return json({ error: isRateLimit ? "rate_limited" : "login_failed" }, isRateLimit ? 429 : 500);
  }

  const tokenHash = linkData.properties?.hashed_token;
  if (!tokenHash) return json({ error: "login_failed" }, 500);
  return json({ token_hash: tokenHash, type: "magiclink" });
}

async function handleValidateInvite(supabase: any, url: URL) {
  const token = url.searchParams.get("token");
  if (!token || token.length < 10) return json({ error: "Invalid token" }, 400);

  const { data: invite, error } = await supabase
    .from("affiliate_invites").select("id, affiliate_id, created_by, accepted_at").eq("token", token).single();
  if (error || !invite) return json({ error: "invite_not_found" }, 404);

  const { data: affiliate } = await supabase
    .from("affiliates").select("first_name, last_name, email").eq("id", invite.affiliate_id).single();

  return json({
    valid: true,
    already_accepted: !!invite.accepted_at,
    affiliate_name: affiliate ? `${affiliate.first_name} ${affiliate.last_name}` : "",
    affiliate_email: affiliate?.email || "",
  });
}

async function handleAcceptInvite(supabase: any, supabaseUrl: string, req: Request) {
  const authUser = await getAuthUser(req, supabaseUrl);
  if (!authUser) return json({ error: "Unauthorized" }, 401);

  const body = await req.json();
  const token = body.token;
  if (!token) return json({ error: "Token required" }, 400);

  const { data: result, error: rpcError } = await supabase.rpc("accept_affiliate_invite", {
    p_token: token,
    p_auth_user_id: authUser.id,
  });

  if (rpcError) return json({ error: rpcError.message }, 500);
  return json(result);
}

async function handleMyData(supabase: any, supabaseUrl: string, req: Request) {
  const authUser = await getAuthUser(req, supabaseUrl);
  if (!authUser) return json({ error: "Unauthorized" }, 401);

  const { data: affiliate } = await supabase
    .from("affiliates").select("*").eq("auth_user_id", authUser.id).is("deleted_at", null).single();
  if (!affiliate) return json({ error: "no_affiliate_linked" }, 404);

  // Get assigned clients
  const { data: clientAssignments } = await supabase
    .from("affiliate_clients").select("id, retailer_user_id, assigned_at, assigned_by").eq("affiliate_id", affiliate.id);

  const retailerIds = (clientAssignments || []).map((a: any) => a.retailer_user_id);
  let retailers: any[] = [];
  if (retailerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles").select("user_id, salon_name, display_name").in("user_id", retailerIds);
    retailers = profiles || [];
  }

  let subscriptionData: any[] = [];
  if (retailerIds.length > 0) {
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("id, user_id, status, plan_id, billing_period, current_period_start, current_period_end, created_at")
      .in("user_id", retailerIds);
    subscriptionData = subs || [];
  }

  const { data: plans } = await supabase.from("plans").select("id, name, price_monthly, price_yearly");

  // Commissions with retailer info
  const { data: rawCommissions } = await supabase
    .from("affiliate_commissions").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false });

  const commissionRetailerIds = [...new Set((rawCommissions || []).map((c: any) => c.retailer_user_id))];
  let commissionRetailers: any[] = [];
  if (commissionRetailerIds.length > 0) {
    const { data: cProfiles } = await supabase
      .from("profiles").select("user_id, salon_name, display_name").in("user_id", commissionRetailerIds);
    commissionRetailers = cProfiles || [];
  }
  const commissions = (rawCommissions || []).map((c: any) => {
    const prof = commissionRetailers.find((r: any) => r.user_id === c.retailer_user_id);
    return { ...c, retailer_name: prof?.salon_name || prof?.display_name || "Centro" };
  });

  // Team data (if manager)
  let teamMembers: any[] = [];
  let teamCommissions: any[] = [];
  if (affiliate.is_manager) {
    const { data: members } = await supabase
      .from("affiliates")
      .select("id, first_name, last_name, email, commission_pct, team_commission_pct, auth_user_id, created_at")
      .eq("manager_id", affiliate.id).is("deleted_at", null);
    teamMembers = members || [];

    const memberIds = teamMembers.map((m: any) => m.id);
    if (memberIds.length > 0) {
      const { data: teamClients } = await supabase
        .from("affiliate_clients").select("id, affiliate_id, retailer_user_id, assigned_at").in("affiliate_id", memberIds);
      teamMembers = teamMembers.map((m: any) => ({
        ...m,
        clients: (teamClients || []).filter((c: any) => c.affiliate_id === m.id),
      }));

      const { data: tComm } = await supabase
        .from("affiliate_commissions").select("*").in("affiliate_id", memberIds).order("created_at", { ascending: false });
      teamCommissions = tComm || [];
    }
  }

  // Build enriched clients
  const clientsEnriched = (clientAssignments || []).map((a: any) => {
    const profile = retailers.find((r: any) => r.user_id === a.retailer_user_id);
    const subs = subscriptionData.filter((s: any) => s.user_id === a.retailer_user_id);
    return {
      ...a,
      salon_name: profile?.salon_name || profile?.display_name || "Centro",
      subscriptions: subs.map((s: any) => ({
        ...s,
        plan: plans?.find((p: any) => p.id === s.plan_id),
      })),
    };
  });

  return json({
    affiliate: {
      id: affiliate.id,
      first_name: affiliate.first_name,
      last_name: affiliate.last_name,
      email: affiliate.email,
      commission_pct: affiliate.commission_pct,
      is_manager: affiliate.is_manager,
      team_commission_pct: affiliate.team_commission_pct,
      manager_id: affiliate.manager_id,
    },
    clients: clientsEnriched,
    commissions: commissions || [],
    team_members: teamMembers,
    team_commissions: teamCommissions,
  });
}

// ── Create team member (manager only) ──
async function handleCreateTeamMember(supabase: any, supabaseUrl: string, req: Request) {
  const authUser = await getAuthUser(req, supabaseUrl);
  if (!authUser) return json({ error: "Unauthorized" }, 401);

  const manager = await getManagerAffiliate(supabase, authUser.id);
  if (!manager) return json({ error: "not_a_manager" }, 403);

  const body = await req.json();
  const { first_name, last_name, email, commission_pct, team_commission_pct } = body;
  if (!first_name || !last_name || !email) return json({ error: "missing_fields" }, 400);

  // Create affiliate with manager_id
  const { data: newAffiliate, error: insertErr } = await supabase
    .from("affiliates")
    .insert({
      first_name,
      last_name,
      email: email.trim().toLowerCase(),
      commission_pct: commission_pct ?? 10,
      team_commission_pct: team_commission_pct ?? null,
      is_manager: false,
      manager_id: manager.id,
      created_by: manager.created_by,
    })
    .select()
    .single();

  if (insertErr) return json({ error: insertErr.message }, 500);

  // Create invite
  const { data: invite, error: inviteErr } = await supabase
    .from("affiliate_invites")
    .insert({
      affiliate_id: newAffiliate.id,
      created_by: authUser.id,
    })
    .select("token")
    .single();

  if (inviteErr) return json({ error: inviteErr.message }, 500);

  return json({ affiliate: newAffiliate, invite_token: invite.token });
}

// ── Create team invite (regenerate) ──
async function handleCreateTeamInvite(supabase: any, supabaseUrl: string, req: Request) {
  const authUser = await getAuthUser(req, supabaseUrl);
  if (!authUser) return json({ error: "Unauthorized" }, 401);

  const manager = await getManagerAffiliate(supabase, authUser.id);
  if (!manager) return json({ error: "not_a_manager" }, 403);

  const body = await req.json();
  const { affiliate_id } = body;
  if (!affiliate_id) return json({ error: "affiliate_id_required" }, 400);

  // Verify member belongs to this manager
  const { data: member } = await supabase
    .from("affiliates").select("id").eq("id", affiliate_id).eq("manager_id", manager.id).is("deleted_at", null).single();
  if (!member) return json({ error: "member_not_found" }, 404);

  const { data: invite, error: inviteErr } = await supabase
    .from("affiliate_invites")
    .insert({ affiliate_id, created_by: authUser.id })
    .select("token")
    .single();

  if (inviteErr) return json({ error: inviteErr.message }, 500);
  return json({ token: invite.token });
}

// ── Assign client to member ──
async function handleAssignClientToMember(supabase: any, supabaseUrl: string, req: Request) {
  const authUser = await getAuthUser(req, supabaseUrl);
  if (!authUser) return json({ error: "Unauthorized" }, 401);

  const manager = await getManagerAffiliate(supabase, authUser.id);
  if (!manager) return json({ error: "not_a_manager" }, 403);

  const body = await req.json();
  const { affiliate_id, retailer_user_id } = body;
  if (!affiliate_id || !retailer_user_id) return json({ error: "missing_fields" }, 400);

  // Verify member belongs to manager
  const { data: member } = await supabase
    .from("affiliates").select("id").eq("id", affiliate_id).eq("manager_id", manager.id).is("deleted_at", null).single();
  if (!member) return json({ error: "member_not_found" }, 404);

  // Verify client is assigned to manager
  const { data: ownership } = await supabase
    .from("affiliate_clients").select("id").eq("affiliate_id", manager.id).eq("retailer_user_id", retailer_user_id).single();
  if (!ownership) return json({ error: "client_not_yours" }, 403);

  // Check if already assigned to member
  const { data: existing } = await supabase
    .from("affiliate_clients").select("id").eq("affiliate_id", affiliate_id).eq("retailer_user_id", retailer_user_id).maybeSingle();
  if (existing) return json({ error: "already_assigned" }, 409);

  const { error: assignErr } = await supabase
    .from("affiliate_clients")
    .insert({ affiliate_id, retailer_user_id, assigned_by: authUser.id });

  if (assignErr) return json({ error: assignErr.message }, 500);
  return json({ success: true });
}
