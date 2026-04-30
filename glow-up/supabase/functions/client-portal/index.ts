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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    // Quick login - instant access for registered clients (no email sent)
    if (action === "quick-login" && req.method === "POST") {
      const body = await req.json();
      const email = body.email?.trim()?.toLowerCase();
      const phone = body.phone?.trim();

      if (!email && !phone) {
        return new Response(JSON.stringify({ error: "Email or phone required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Step 1: Find client by email or phone
      let client: any = null;

      if (email) {
        const { data } = await supabase
          .from("clients")
          .select("id, auth_user_id, email, phone, user_id")
          .eq("email", email)
          .is("deleted_at", null)
          .limit(1)
          .maybeSingle();
        client = data;
      }

      if (!client && phone) {
        // Normalize: strip all non-digit chars for comparison
        const phoneDigits = phone.replace(/[^0-9]/g, "");
        // Try exact match first
        const { data } = await supabase
          .from("clients")
          .select("id, auth_user_id, email, phone, user_id")
          .eq("phone", phone)
          .is("deleted_at", null)
          .limit(1)
          .maybeSingle();
        client = data;

        // If not found, try fuzzy match: search clients whose phone ends with the entered digits
        if (!client && phoneDigits.length >= 8) {
          const { data: fuzzyData } = await supabase
            .from("clients")
            .select("id, auth_user_id, email, phone, user_id")
            .is("deleted_at", null)
            .ilike("phone", `%${phoneDigits.slice(-10)}`);
          // Filter by normalized digits to ensure a real match
          const match = (fuzzyData || []).find((c: any) => {
            const cDigits = (c.phone || "").replace(/[^0-9]/g, "");
            return cDigits.endsWith(phoneDigits) || phoneDigits.endsWith(cDigits.slice(-phoneDigits.length));
          });
          if (match) client = match;
        }
      }

      // Step 2: Fallback — find auth user by email, then find client by auth_user_id
      if (!client && email) {
        const { data: checkLink } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email,
        });
        if (checkLink?.user?.id) {
          const { data: fallbackClient } = await supabase
            .from("clients")
            .select("id, auth_user_id, email, phone, user_id")
            .eq("auth_user_id", checkLink.user.id)
            .is("deleted_at", null)
            .limit(1)
            .maybeSingle();
          if (fallbackClient) {
            client = fallbackClient;
          }
        }
      }

      if (!client) {
        return new Response(JSON.stringify({ error: phone ? "phone_not_found" : "email_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Step 3: If client has no auth account, create or find one and link it
      // For phone-only clients, generate a synthetic email for auth
      let authEmail = email || client.email;
      if (!authEmail) {
        const normalizedPhone = (client.phone || phone).replace(/[^0-9]/g, "");
        authEmail = `phone_${normalizedPhone}@clients.noreply.local`;
      }

      if (!client.auth_user_id) {
        // Check if auth user already exists with this email
        // NOTE: generateLink with magiclink will CREATE the user if not existing,
        // triggering handle_new_user which adds 'user' role + profile. We must clean up.
        const { data: existingLink } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: authEmail,
        });
        let authUserId: string | null = existingLink?.user?.id || null;

        if (!authUserId) {
          // Create new auth user
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: authEmail,
            email_confirm: true,
          });
          if (createError || !newUser?.user) {
            console.error("createUser error:", createError?.message);
            return new Response(JSON.stringify({ error: "login_failed" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          authUserId = newUser.user.id;
        }

        // Cleanup: handle_new_user trigger assigns 'user' role and creates salon profile
        // ALWAYS remove both because this is a CLIENT, not a salon owner
        // (generateLink also creates users and triggers the same trigger)
        await supabase.from("user_roles").delete()
          .eq("user_id", authUserId).eq("role", "user");
        await supabase.from("profiles").delete()
          .eq("user_id", authUserId);

        // Link auth user to client record
        await supabase
          .from("clients")
          .update({ auth_user_id: authUserId })
          .eq("id", client.id);

        // Ensure client role exists
        await supabase
          .from("user_roles")
          .upsert({ user_id: authUserId, role: "client" }, { onConflict: "user_id,role" });

        client.auth_user_id = authUserId;
      } else {
        // Client already has an auth account — resolve the REAL auth email
        // to avoid generateLink creating a second user with a different email
        const { data: existingUser } = await supabase.auth.admin.getUserById(client.auth_user_id);
        if (existingUser?.user?.email) {
          authEmail = existingUser.user.email;
        }
      }

      // Step 4: Generate magic link token (no email sent)
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: authEmail,
      });

      // Cleanup: generateLink may have created/triggered handle_new_user for existing users
      // Always ensure no stale 'user' role or profile lingers for this client
      if (linkData?.user?.id) {
        const uid = linkData.user.id;
        await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", "user");
        await supabase.from("profiles").delete().eq("user_id", uid);
        // Ensure client role
        await supabase.from("user_roles").upsert(
          { user_id: uid, role: "client" },
          { onConflict: "user_id,role" }
        );
      }

      if (linkError || !linkData) {
        console.error("generateLink error:", linkError?.message || "unknown");
        const isRateLimit = linkError?.message?.includes("rate") || linkError?.message?.includes("security");
        return new Response(JSON.stringify({ error: isRateLimit ? "rate_limited" : "login_failed" }), {
          status: isRateLimit ? 429 : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenHash = linkData.properties?.hashed_token;
      if (!tokenHash) {
        console.error("No hashed_token in generateLink response");
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

    // Invite quick login - instant access from invite page (no email sent)
    if (action === "invite-quick-login" && req.method === "POST") {
      const body = await req.json();
      const email = body.email?.trim()?.toLowerCase();
      const phone = body.phone?.trim();
      const inviteToken = body.token;

      if ((!email && !phone) || !inviteToken) {
        return new Response(JSON.stringify({ error: "credential_and_token_required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate the invite token
      const { data: invite, error: inviteError } = await supabase
        .from("client_invites")
        .select("id, user_id, client_id, accepted_at")
        .eq("token", inviteToken)
        .single();

      if (inviteError || !invite) {
        return new Response(JSON.stringify({ error: "invite_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get the client associated with this invite
      const { data: inviteClient } = await supabase
        .from("clients")
        .select("id, auth_user_id, email, phone")
        .eq("id", invite.client_id)
        .single();

      if (!inviteClient) {
        return new Response(JSON.stringify({ error: "client_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify credential matches
      if (email) {
        if (inviteClient.email?.toLowerCase() !== email) {
          return new Response(JSON.stringify({ error: "email_mismatch" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else if (phone) {
        if (inviteClient.phone !== phone) {
          return new Response(JSON.stringify({ error: "phone_mismatch" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Resolve the email to use for auth (phone login uses client's stored email, or synthetic)
      let authEmail = email || inviteClient.email;
      if (!authEmail) {
        const normalizedPhone = (inviteClient.phone || phone).replace(/[^0-9]/g, "");
        authEmail = `phone_${normalizedPhone}@clients.noreply.local`;
      }

      // If client has no auth account, create one
      let authUserId = inviteClient.auth_user_id;
      if (!authUserId) {
        // NOTE: generateLink with magiclink will CREATE the user if not existing,
        // triggering handle_new_user which adds 'user' role + profile. We must clean up.
        const { data: existingLink } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: authEmail,
        });
        const existingAuthId = existingLink?.user?.id || null;

        if (existingAuthId) {
          authUserId = existingAuthId;
        } else {
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: authEmail,
            email_confirm: true,
          });
          if (createError || !newUser?.user) {
            console.error("createUser error:", createError?.message);
            return new Response(JSON.stringify({ error: "account_creation_failed" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          authUserId = newUser.user.id;
        }

        // Cleanup: handle_new_user trigger assigns 'user' role and creates salon profile
        // ALWAYS remove both because this is a CLIENT, not a salon owner
        // (generateLink also creates users and triggers the same trigger)
        await supabase.from("user_roles").delete()
          .eq("user_id", authUserId).eq("role", "user");
        await supabase.from("profiles").delete()
          .eq("user_id", authUserId);

        // Link auth user to client
        await supabase
          .from("clients")
          .update({ auth_user_id: authUserId })
          .eq("id", inviteClient.id);

        // Ensure client role exists
        await supabase
          .from("user_roles")
          .upsert({ user_id: authUserId, role: "client" }, { onConflict: "user_id,role" });

        // Mark invite as accepted
        await supabase
          .from("client_invites")
          .update({ accepted_at: new Date().toISOString() })
          .eq("id", invite.id);
      }

      // Generate magic link token (no email sent)
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: authEmail,
      });

      if (linkError || !linkData) {
        console.error("generateLink error:", linkError?.message || "unknown");
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
        JSON.stringify({ token_hash: tokenHash }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate invite token (public, no auth needed)
    if (action === "validate-invite" && req.method === "GET") {
      const token = url.searchParams.get("token");
      if (!token || token.length < 10) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: invite, error } = await supabase
        .from("client_invites")
        .select("id, user_id, client_id, accepted_at, expires_at")
        .eq("token", token)
        .single();

      if (error || !invite) {
        return new Response(JSON.stringify({ error: "Invite not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const alreadyAccepted = !!invite.accepted_at;

      // Get salon name
      const { data: profile } = await supabase
        .from("profiles")
        .select("salon_name, display_name")
        .eq("user_id", invite.user_id)
        .single();

      // Get client name
      const { data: client } = await supabase
        .from("clients")
        .select("first_name, last_name, email, phone")
        .eq("id", invite.client_id)
        .single();

      return new Response(
        JSON.stringify({
          valid: true,
          already_accepted: alreadyAccepted,
          salon_name: profile?.salon_name || profile?.display_name || "Salone",
          client_name: client ? `${client.first_name} ${client.last_name}` : "",
          client_email: client?.email || "",
          client_phone: client?.phone || "",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Accept invite (requires auth)
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

      const userId = authUser.id;
      const body = await req.json();
      const token = body.token;

      if (!token) {
        return new Response(JSON.stringify({ error: "Token required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: result, error: rpcError } = await supabase.rpc("accept_client_invite", {
        p_token: token,
        p_auth_user_id: userId,
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

    // Get my portal data (requires auth)
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

      const authUserId = authUser.id;

      // Get client record
      const { data: client } = await supabase
        .from("clients")
        .select("*")
        .eq("auth_user_id", authUserId)
        .single();

      if (!client) {
        return new Response(JSON.stringify({ error: "no_client_linked" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get salon info from accepted invite
      const { data: invite } = await supabase
        .from("client_invites")
        .select("user_id")
        .eq("client_id", client.id)
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

      // Run ALL independent queries in parallel for speed
      const [
        { data: salonProfile },
        { data: services },
        { data: categories },
        { data: operators },
        { data: appointments },
        { data: loyaltyPoints },
        { data: packages },
        { data: treatmentCards },
        { data: photos },
        { data: shopSettings },
        { data: tutorialsFlag },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("salon_name, display_name, opening_hours, phone, address, loyalty_enabled, booking_blocked_from, booking_blocked_until, booking_blocked_message")
          .eq("user_id", salonUserId)
          .single(),
        supabase
          .from("services")
          .select("id, name, duration_minutes, price, category_id")
          .eq("user_id", salonUserId)
          .is("deleted_at", null)
          .order("name"),
        supabase
          .from("service_categories")
          .select("id, name, emoji")
          .eq("user_id", salonUserId)
          .is("deleted_at", null)
          .order("sort_order"),
        supabase
          .from("operators")
          .select("id, name, specializations, calendar_color, photo_url, service_ids")
          .eq("user_id", salonUserId)
          .is("deleted_at", null)
          .order("name"),
        supabase
          .from("appointments")
          .select("id, start_time, end_time, status, notes, service_id, operator_id, reminder_sent, package_id")
          .eq("client_id", client.id)
          .eq("user_id", salonUserId)
          .is("deleted_at", null)
          .order("start_time", { ascending: false })
          .limit(50),
        supabase
          .from("loyalty_points")
          .select("*")
          .eq("client_id", client.id)
          .eq("user_id", salonUserId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("client_packages")
          .select("*")
          .eq("client_id", client.id)
          .eq("user_id", salonUserId)
          .eq("status", "active")
          .is("deleted_at", null),
        supabase
          .from("treatment_cards")
          .select("id, threshold, stamps_count, completed_cycles, reward_type, reward_service_id, is_active, services:reward_service_id(name)")
          .eq("client_id", client.id)
          .eq("user_id", salonUserId)
          .eq("is_active", true),
        supabase
          .from("treatment_photos")
          .select("*")
          .eq("client_id", client.id)
          .eq("user_id", salonUserId)
          .is("deleted_at", null)
          .order("taken_at", { ascending: false }),
        supabase
          .from("shop_settings")
          .select("is_published")
          .eq("user_id", salonUserId)
          .maybeSingle(),
        supabase
          .from("feature_flags")
          .select("is_enabled")
          .eq("key", "tutorials_portal_enabled")
          .is("deleted_at", null)
          .maybeSingle(),
      ]);

      const shopPublished = shopSettings?.is_published === true;
      const shopSlug = shopPublished ? salonUserId.slice(0, 8) : null;
      const tutorialsEnabled = tutorialsFlag?.is_enabled === true;

      return new Response(
        JSON.stringify({
          client: {
            id: client.id,
            first_name: client.first_name,
            last_name: client.last_name,
            total_points: client.total_points,
            loyalty_level: client.loyalty_level,
          },
          salon: {
            name: salonProfile?.salon_name || salonProfile?.display_name || "Salone",
            opening_hours: salonProfile?.opening_hours,
            phone: salonProfile?.phone || null,
            address: salonProfile?.address || null,
            user_id: salonUserId,
            loyalty_enabled: salonProfile?.loyalty_enabled ?? true,
            shop_slug: shopSlug,
            tutorials_enabled: tutorialsEnabled,
            booking_blocked_from: salonProfile?.booking_blocked_from || null,
            booking_blocked_until: salonProfile?.booking_blocked_until || null,
            booking_blocked_message: salonProfile?.booking_blocked_message || null,
          },
          services: services || [],
          categories: categories || [],
          operators: operators || [],
          appointments: appointments || [],
          loyalty_points: loyaltyPoints || [],
          packages: packages || [],
          treatment_cards: treatmentCards || [],
          photos: photos || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Slots endpoint for portal booking
    if (action === "slots" && req.method === "GET") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const date = url.searchParams.get("date");
      const operatorId = url.searchParams.get("operator_id");
      const durationStr = url.searchParams.get("duration");
      const salonUserId = url.searchParams.get("salon_user_id");
      const serviceId = url.searchParams.get("service_id");
      const excludeAppointmentId = url.searchParams.get("exclude_appointment_id");

      if (!date || !operatorId || !durationStr || !salonUserId) {
        return new Response(JSON.stringify({ error: "Missing parameters" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const duration = parseInt(durationStr);

      // Check booking block
      {
        const { data: blockProfile } = await supabase
          .from("profiles")
          .select("booking_blocked_from, booking_blocked_until, booking_blocked_message")
          .eq("user_id", salonUserId)
          .single();
        if (blockProfile?.booking_blocked_from) {
          const from = blockProfile.booking_blocked_from;
          const until = blockProfile.booking_blocked_until;
          if (date! >= from && (!until || date! <= until)) {
            return new Response(JSON.stringify({ slots: [], blocked: true, blocked_message: blockProfile.booking_blocked_message || "" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }

      // Determine day_of_week (0=Sun, 1=Mon, ..., 6=Sat)
      const requestedDate = new Date(`${date}T12:00:00Z`);
      const dayOfWeek = requestedDate.getUTCDay();

      // Helper: determine Italy UTC offset for a given date string (YYYY-MM-DD)
      function getItalyOffset(dateStr: string): string {
        const d = new Date(dateStr + "T12:00:00Z");
        const year = d.getUTCFullYear();
        const marchLast = new Date(Date.UTC(year, 2, 31));
        marchLast.setUTCDate(31 - marchLast.getUTCDay());
        const octLast = new Date(Date.UTC(year, 9, 31));
        octLast.setUTCDate(31 - octLast.getUTCDay());
        const cestStart = Date.UTC(year, marchLast.getUTCMonth(), marchLast.getUTCDate(), 1);
        const cestEnd = Date.UTC(year, octLast.getUTCMonth(), octLast.getUTCDate(), 1);
        const ts = d.getTime();
        return (ts >= cestStart && ts < cestEnd) ? "+02:00" : "+01:00";
      }

      const offset = getItalyOffset(date!);
      const dayStartISO = `${date}T00:00:00${offset}`;
      const dayEndISO = `${date}T23:59:59${offset}`;

      // Resolve operator IDs to check
      let operatorIds: string[] = [];
      if (operatorId === "any") {
        // Get all operators assigned to this service
        const { data: ops } = await supabase
          .from("operators")
          .select("id, service_ids")
          .eq("user_id", salonUserId)
          .is("deleted_at", null);
        operatorIds = (ops || [])
          .filter((o: any) => o.service_ids && serviceId && o.service_ids.includes(serviceId))
          .map((o: any) => o.id);
      } else {
        operatorIds = [operatorId];
      }

      if (operatorIds.length === 0) {
        return new Response(JSON.stringify({ slots: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // For "any" mode, we aggregate: a slot is available if ANY operator can take it
      // We return slots with operator assignment info
      const slotsMap = new Map<string, string>(); // slotISO -> first available operator_id

      // Fetch shifts and appointments for ALL operators in parallel
      const opDataResults = await Promise.all(
        operatorIds.map(async (opId) => {
          const [{ data: shiftRows }, { data: appts }] = await Promise.all([
            supabase
              .from("operator_shifts")
              .select("start_time, end_time, is_active")
              .eq("operator_id", opId)
              .eq("user_id", salonUserId)
              .eq("day_of_week", dayOfWeek),
            (() => {
              let q = supabase
                .from("appointments")
                .select("id, start_time, end_time")
                .eq("operator_id", opId)
                .eq("user_id", salonUserId)
                .is("deleted_at", null)
                .not("status", "in", '("cancelled","no_show")')
                .gte("start_time", dayStartISO)
                .lte("start_time", dayEndISO);
              if (excludeAppointmentId) q = q.neq("id", excludeAppointmentId);
              return q;
            })(),
          ]);
          return { opId, shiftRows, appointments: appts };
        })
      );

      for (const { opId, shiftRows, appointments } of opDataResults) {
        const activeShifts = (shiftRows || []).filter((s: any) => s.is_active);
        if (activeShifts.length === 0) continue;

        for (const shift of activeShifts) {
          const [shStartH, shStartM] = shift.start_time.split(":").map(Number);
          const [shEndH, shEndM] = shift.end_time.split(":").map(Number);

          for (let hour = shStartH; hour < shEndH || (hour === shEndH && 0 < shEndM); hour++) {
            for (const min of [0, 30]) {
              if (hour === shStartH && min < shStartM) continue;

              const hh = String(hour).padStart(2, "0");
              const mm = String(min).padStart(2, "0");
              const slotISO = `${date}T${hh}:${mm}:00${offset}`;

              if (slotsMap.has(slotISO)) continue;

              const slotStartMs = new Date(slotISO).getTime();
              const slotEndMs = slotStartMs + duration * 60000;

              const slotEndLocalMinutes = hour * 60 + min + duration;
              const shiftEndMinutes = shEndH * 60 + shEndM;
              if (slotEndLocalMinutes > shiftEndMinutes) continue;

              const hasConflict = (appointments || []).some((apt: any) => {
                const aptStart = new Date(apt.start_time).getTime();
                const aptEnd = new Date(apt.end_time).getTime();
                return slotStartMs < aptEnd && slotEndMs > aptStart;
              });

              if (!hasConflict) {
                slotsMap.set(slotISO, opId);
              }
            }
          }
        }
      }

      // Sort slots chronologically
      const sortedSlots = [...slotsMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      const slots = sortedSlots.map(([s]) => s);
      const slotOperators = Object.fromEntries(sortedSlots);

      return new Response(JSON.stringify({ slots, slot_operators: operatorId === "any" ? slotOperators : undefined }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cancel appointment (requires auth)
    if (action === "cancel-appointment" && req.method === "POST") {
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
      const appointmentId = body.appointmentId;
      if (!appointmentId) {
        return new Response(JSON.stringify({ error: "appointmentId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get client record for this auth user
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("auth_user_id", authUser.id)
        .single();

      if (!client) {
        return new Response(JSON.stringify({ error: "no_client_linked" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch the appointment and verify ownership
      const { data: appointment } = await supabase
        .from("appointments")
        .select("id, client_id, operator_id, service_id, status, start_time, user_id, package_id")
        .eq("id", appointmentId)
        .is("deleted_at", null)
        .single();

      if (!appointment) {
        return new Response(JSON.stringify({ error: "appointment_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (appointment.client_id !== client.id) {
        return new Response(JSON.stringify({ error: "not_your_appointment" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (appointment.status === "cancelled") {
        return new Response(JSON.stringify({ error: "already_cancelled" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (new Date(appointment.start_time) <= new Date()) {
        return new Response(JSON.stringify({ error: "appointment_in_past" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const cancelledAt = new Date().toISOString();

      // Update status to cancelled using service role
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentId);

      if (updateError) {
        console.error("Cancel appointment error:", updateError);
        return new Response(JSON.stringify({ error: "cancel_failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Rollback package session if this was a package appointment
      if (appointment.package_id) {
        const { data: pkg } = await supabase
          .from("client_packages")
          .select("id, used_sessions, status")
          .eq("id", appointment.package_id)
          .single();
        if (pkg && pkg.used_sessions > 0) {
          const newUsed = pkg.used_sessions - 1;
          await supabase
            .from("client_packages")
            .update({ used_sessions: newUsed, status: "active" })
            .eq("id", pkg.id);
        }
      }

      // Respond immediately — all secondary work is non-blocking
      const cancelResponse = new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

      // Fire-and-forget: reminder flow cleanup, notifications, treatment stamps
      (async () => {
        try {
          // Cancel linked reminder flow
          const { data: activeFlow } = await supabase
            .from("reminder_flows")
            .select("id")
            .eq("appointment_id", appointmentId)
            .in("status", ["active", "completed"])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (activeFlow) {
            await supabase
              .from("reminder_flows")
              .update({ client_action: "cancelled", client_action_at: cancelledAt, status: "cancelled" })
              .eq("id", activeFlow.id);
            await supabase
              .from("reminder_flow_nodes")
              .update({ client_acted: true })
              .eq("flow_id", activeFlow.id);
            await supabase
              .from("reminder_flow_nodes")
              .update({ client_acted: true, status: "skipped" })
              .eq("flow_id", activeFlow.id)
              .in("status", ["pending", "in_progress"]);
          }

          // Notifications
          const [{ data: clientRecord }, { data: serviceRecord }, { data: operatorRecord }] = await Promise.all([
            supabase.from("clients").select("first_name, last_name").eq("id", client.id).single(),
            supabase.from("services").select("name").eq("id", appointment.service_id).single(),
            supabase.from("operators").select("auth_user_id").eq("id", appointment.operator_id).single(),
          ]);

          const cName = clientRecord ? `${clientRecord.first_name} ${clientRecord.last_name}` : "Cliente";
          const sName = serviceRecord?.name || "Servizio";
          const aDate = new Date(appointment.start_time);
          const dStr = aDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Rome" });
          const tStr = aDate.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });

          await createNotification(supabase, {
            user_id: appointment.user_id,
            salon_user_id: appointment.user_id,
            type: "cancellation",
            title: "Appuntamento annullato",
            body: `${cName} ha annullato: ${sName}, ${dStr} alle ${tStr}`,
            data: { appointment_id: appointmentId, url: '/agenda' },
          }).catch(e => console.error("Notify cancel salon error:", e));

          if (operatorRecord?.auth_user_id) {
            await createNotification(supabase, {
              user_id: operatorRecord.auth_user_id,
              salon_user_id: appointment.user_id,
              type: "cancellation",
              title: "Appuntamento annullato",
              body: `${cName} ha annullato: ${sName}, ${dStr} alle ${tStr}`,
              data: { appointment_id: appointmentId, url: '/staff-portal' },
            }).catch(e => console.error("Notify cancel operator error:", e));
          }

          // Treatment stamp removal
          const { data: activeCards } = await supabase
            .from("treatment_cards")
            .select("id, stamps_count")
            .eq("user_id", appointment.user_id)
            .eq("client_id", client.id)
            .eq("is_active", true);
          if (activeCards && activeCards.length > 0 && activeCards[0].stamps_count > 0) {
            await supabase.from("treatment_cards").update({ stamps_count: activeCards[0].stamps_count - 1 }).eq("id", activeCards[0].id);
          }
        } catch (e) {
          console.error("Cancel background tasks error:", e);
        }
      })();

      return cancelResponse;
    }

    // Confirm appointment (requires auth) - client confirms they will attend
    if (action === "confirm-appointment" && req.method === "POST") {
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

      const { data: { user: authUser } } = await userClient.auth.getUser();
      if (!authUser) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { appointmentId } = body;

      if (!appointmentId) {
        return new Response(JSON.stringify({ error: "appointmentId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find client record for auth user
      const { data: client } = await supabase
        .from("clients")
        .select("id, first_name, last_name")
        .eq("auth_user_id", authUser.id)
        .limit(1)
        .maybeSingle();

      if (!client) {
        return new Response(JSON.stringify({ error: "client_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify appointment belongs to client
      const { data: appointment } = await supabase
        .from("appointments")
        .select("id, user_id, service_id, operator_id, start_time, status, client_id")
        .eq("id", appointmentId)
        .eq("client_id", client.id)
        .is("deleted_at", null)
        .single();

      if (!appointment) {
        return new Response(JSON.stringify({ error: "appointment_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const confirmedAt = new Date().toISOString();

      // Core operation: mark appointment as confirmed
      await supabase
        .from("appointments")
        .update({ client_confirmed: true, client_confirmed_at: confirmedAt })
        .eq("id", appointmentId);

      // Respond immediately
      const confirmResponse = new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

      // Fire-and-forget: notifications + reminder flow updates
      (async () => {
        try {
          const [{ data: serviceRecord }, { data: operatorRecord }] = await Promise.all([
            supabase.from("services").select("name").eq("id", appointment.service_id).single(),
            supabase.from("operators").select("auth_user_id").eq("id", appointment.operator_id).single(),
          ]);

          const cName = `${client.first_name} ${client.last_name}`;
          const sName = serviceRecord?.name || "Servizio";
          const aDate = new Date(appointment.start_time);
          const dStr = aDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Rome" });
          const tStr = aDate.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });

          // Only notify the client about their confirmation (no salon/operator notification to reduce noise)
          await createNotification(supabase, {
            user_id: authUser.id,
            salon_user_id: appointment.user_id,
            type: "confirmation",
            title: "Appuntamento confermato",
            body: `Hai confermato: ${sName}, ${dStr} alle ${tStr}. Ti aspettiamo!`,
            data: { appointment_id: appointmentId, url: '/portal?tab=appointments' },
          }).catch(e => console.error("Notify confirm client error:", e));

          // Reminder flow updates
          const { data: activeFlow } = await supabase
            .from("reminder_flows")
            .select("id")
            .eq("appointment_id", appointmentId)
            .eq("status", "active")
            .maybeSingle();

          if (activeFlow?.id) {
            await supabase
              .from("reminder_flows")
              .update({ client_action: "confirmed", client_action_at: confirmedAt })
              .eq("id", activeFlow.id);

            await Promise.all([
              supabase.from("reminder_flow_nodes").update({ client_acted: true })
                .eq("flow_id", activeFlow.id).eq("only_if_confirmed", false)
                .eq("only_if_no_response", false)
                .not("node_type", "in", '("mid_treatment_link","admin_escalation","reminder_confirmed")')
                .in("status", ["completed", "sent", "done"]),
              supabase.from("reminder_flow_nodes").update({ client_acted: true })
                .eq("flow_id", activeFlow.id).eq("only_if_confirmed", false)
                .eq("only_if_no_response", false)
                .not("node_type", "in", '("mid_treatment_link","admin_escalation","reminder_confirmed")')
                .in("status", ["pending", "in_progress"]).not("push_sent_at", "is", null),
              supabase.from("reminder_flow_nodes").update({ status: "skipped" })
                .eq("flow_id", activeFlow.id).eq("only_if_no_response", true).eq("status", "pending"),
            ]);
          }
        } catch (e) {
          console.error("Confirm background tasks error:", e);
        }
      })();

      return confirmResponse;
    }

    // Book appointment (requires auth)
    if (action === "book-appointment" && req.method === "POST") {
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
      const { service_id, operator_id, start_time, package_id, exclude_appointment_id } = body;

      if (!service_id || !operator_id || !start_time) {
        return new Response(JSON.stringify({ error: "Missing required fields: service_id, operator_id, start_time" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get client record
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("auth_user_id", authUser.id)
        .single();

      if (!client) {
        return new Response(JSON.stringify({ error: "no_client_linked" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get salon user_id from accepted invite
      const { data: invite } = await supabase
        .from("client_invites")
        .select("user_id")
        .eq("client_id", client.id)
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

      // Load service (verify it belongs to this salon)
      const { data: service } = await supabase
        .from("services")
        .select("id, duration_minutes, price")
        .eq("id", service_id)
        .eq("user_id", salonUserId)
        .is("deleted_at", null)
        .single();

      if (!service) {
        return new Response(JSON.stringify({ error: "service_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify operator belongs to this salon
      const { data: operator } = await supabase
        .from("operators")
        .select("id")
        .eq("id", operator_id)
        .eq("user_id", salonUserId)
        .is("deleted_at", null)
        .single();

      if (!operator) {
        return new Response(JSON.stringify({ error: "operator_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check booking block
      {
        const { data: blockProfile } = await supabase
          .from("profiles")
          .select("booking_blocked_from, booking_blocked_until, booking_blocked_message")
          .eq("user_id", salonUserId)
          .single();
        if (blockProfile?.booking_blocked_from) {
          const bookDate = start_time.slice(0, 10);
          const from = blockProfile.booking_blocked_from;
          const until = blockProfile.booking_blocked_until;
          if (bookDate >= from && (!until || bookDate <= until)) {
            return new Response(JSON.stringify({ error: "booking_blocked", message: blockProfile.booking_blocked_message || "" }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }

      // Calculate end_time
      const startDate = new Date(start_time);
      const endDate = new Date(startDate.getTime() + service.duration_minutes * 60000);
      const endTime = endDate.toISOString();

      // Check for conflicts
      let conflictQuery = supabase
        .from("appointments")
        .select("id")
        .eq("operator_id", operator_id)
        .eq("user_id", salonUserId)
        .is("deleted_at", null)
        .not("status", "in", '("cancelled","no_show")')
        .lt("start_time", endTime)
        .gt("end_time", start_time)
        .limit(1);

      if (exclude_appointment_id) {
        conflictQuery = conflictQuery.neq("id", exclude_appointment_id);
      }

      const { data: conflicts } = await conflictQuery;

      if (conflicts && conflicts.length > 0) {
        return new Response(JSON.stringify({ error: "time_slot_conflict" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate package if provided
      let usePackage = false;
      if (package_id) {
        const { data: pkg } = await supabase
          .from("client_packages")
          .select("id, client_id, service_id, total_sessions, used_sessions, status")
          .eq("id", package_id)
          .eq("client_id", client.id)
          .eq("status", "active")
          .single();

        if (!pkg || pkg.used_sessions >= pkg.total_sessions) {
          return new Response(JSON.stringify({ error: "package_invalid_or_exhausted" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (pkg.service_id && pkg.service_id !== service_id) {
          return new Response(JSON.stringify({ error: "package_service_mismatch" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        usePackage = true;
      }

      // Insert appointment with service role
      const { data: newAppointment, error: insertError } = await supabase
        .from("appointments")
        .insert({
          user_id: salonUserId,
          client_id: client.id,
          service_id: service.id,
          operator_id: operator_id,
          start_time: start_time,
          end_time: endTime,
          status: "confirmed",
          final_price: usePackage ? 0 : service.price,
          package_id: usePackage ? package_id : null,
        })
        .select("*")
        .single();

      if (insertError) {
        console.error("Book appointment error:", insertError);
        return new Response(JSON.stringify({ error: "booking_failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update package sessions if used
      if (usePackage && package_id) {
        const { data: currentPkg } = await supabase
          .from("client_packages")
          .select("used_sessions, total_sessions")
          .eq("id", package_id)
          .single();

        if (currentPkg) {
          const newUsed = currentPkg.used_sessions + 1;
          const updates: Record<string, any> = { used_sessions: newUsed, updated_at: new Date().toISOString() };
          if (newUsed >= currentPkg.total_sessions) {
            updates.status = "completed";
          }
          await supabase.from("client_packages").update(updates).eq("id", package_id);
        }
      }

      // Respond immediately with the appointment data
      const bookResponse = new Response(JSON.stringify({ success: true, appointment: newAppointment }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

      // Fire-and-forget: notifications, treatment stamps, reminder flow
      (async () => {
        try {
          const [{ data: clientRecord }, { data: serviceRecord }, { data: operatorRecord }] = await Promise.all([
            supabase.from("clients").select("first_name, last_name").eq("id", client.id).single(),
            supabase.from("services").select("name").eq("id", service.id).single(),
            supabase.from("operators").select("auth_user_id").eq("id", operator_id).single(),
          ]);

          const clientName = clientRecord ? `${clientRecord.first_name} ${clientRecord.last_name}` : "Cliente";
          const serviceName = serviceRecord?.name || "Servizio";
          const aptDate = new Date(start_time);
          const dateStr = aptDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Rome" });
          const timeStr = aptDate.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });

          // Notifications
          const notifyPromises: Promise<any>[] = [
            createNotification(supabase, {
              user_id: salonUserId,
              salon_user_id: salonUserId,
              type: "booking",
              title: "Nuova prenotazione",
              body: `${clientName} - ${serviceName}, ${dateStr} alle ${timeStr}`,
              data: { appointment_id: newAppointment.id, url: '/agenda' },
            }).catch(e => console.error("Notify salon error:", e)),
          ];
          if (operatorRecord?.auth_user_id) {
            notifyPromises.push(
              createNotification(supabase, {
                user_id: operatorRecord.auth_user_id,
                salon_user_id: salonUserId,
                type: "booking",
                title: "Nuovo appuntamento",
                body: `${clientName} - ${serviceName}, ${dateStr} alle ${timeStr}`,
                data: { appointment_id: newAppointment.id, url: '/staff-portal' },
              }).catch(e => console.error("Notify operator error:", e))
            );
          }
          await Promise.all(notifyPromises);

          // Treatment stamp
          const { data: activeCards } = await supabase
            .from("treatment_cards")
            .select("id, stamps_count, threshold, completed_cycles")
            .eq("user_id", salonUserId)
            .eq("client_id", client.id)
            .eq("is_active", true);
          if (activeCards && activeCards.length > 0) {
            const card = activeCards[0];
            const newStamps = card.stamps_count + 1;
            if (newStamps >= card.threshold) {
              await supabase.from("treatment_cards").update({ stamps_count: 0, completed_cycles: card.completed_cycles + 1 }).eq("id", card.id);
            } else {
              await supabase.from("treatment_cards").update({ stamps_count: newStamps }).eq("id", card.id);
            }
          }

          // Reminder flow
          const flowUrl = `${supabaseUrl}/functions/v1/create-reminder-flow`;
          fetch(flowUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceRoleKey}` },
            body: JSON.stringify({ appointment_id: newAppointment.id, is_new: true }),
          }).catch((e) => console.error("Trigger reminder flow error:", e));
        } catch (e) {
          console.error("Book background tasks error:", e);
        }
      })();

      return bookResponse;
    }

    // Social register - create new client + auth account + instant login
    if (action === "social-register" && req.method === "POST") {
      const body = await req.json();
      const slug = body.slug?.trim()?.toLowerCase();
      const firstName = body.first_name?.trim();
      const lastName = body.last_name?.trim();
      const phone = body.phone?.trim();
      const email = body.email?.trim()?.toLowerCase();

      if (!slug || !firstName || !email) {
        return new Response(JSON.stringify({ error: "missing_fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find salon by slug
      const { data: salonProfile, error: salonErr } = await supabase
        .from("profiles")
        .select("user_id, salon_name, display_name")
        .eq("booking_slug", slug)
        .single();

      if (salonErr || !salonProfile) {
        return new Response(JSON.stringify({ error: "salon_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const salonUserId = salonProfile.user_id;

      // Check if client with this email already exists for this salon
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id, auth_user_id, email")
        .eq("user_id", salonUserId)
        .eq("email", email)
        .is("deleted_at", null)
        .maybeSingle();

      if (existingClient) {
        return new Response(JSON.stringify({ error: "client_already_exists" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create or find auth user
      let authUserId: string;
      const { data: authList } = await supabase.auth.admin.listUsers();
      const existingAuth = authList?.users?.find(
        (u) => u.email?.toLowerCase() === email
      );

      if (existingAuth) {
        authUserId = existingAuth.id;
      } else {
        const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
        });
        if (createErr || !newUser?.user) {
          console.error("createUser error:", createErr?.message);
          return new Response(JSON.stringify({ error: "account_creation_failed" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        authUserId = newUser.user.id;
      }

      // Create client record
      const { data: newClient, error: clientErr } = await supabase
        .from("clients")
        .insert({
          user_id: salonUserId,
          first_name: firstName,
          last_name: lastName || "",
          phone: phone || null,
          email,
          auth_user_id: authUserId,
          source: "social_link",
        })
        .select("id")
        .single();

      if (clientErr || !newClient) {
        console.error("Client insert error:", clientErr?.message);
        return new Response(JSON.stringify({ error: "client_creation_failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create accepted client invite
      await supabase.from("client_invites").insert({
        user_id: salonUserId,
        client_id: newClient.id,
        accepted_at: new Date().toISOString(),
      });

      // Assign client role (ignore if already exists)
      const { error: roleErr } = await supabase.from("user_roles").insert({
        user_id: authUserId,
        role: "client",
      });
      // Ignore unique constraint violation (role already assigned)
      if (roleErr && !roleErr.message?.includes("duplicate key")) {
        console.error("Role insert error:", roleErr.message);
      }

      // Generate magic link for instant login
      const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

      if (linkErr || !linkData?.properties?.hashed_token) {
        console.error("generateLink error:", linkErr?.message);
        return new Response(JSON.stringify({ error: "login_failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ token_hash: linkData.properties.hashed_token, type: "magiclink" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Social login - instant login for existing client by salon slug
    if (action === "social-login" && req.method === "POST") {
      const body = await req.json();
      const slug = body.slug?.trim()?.toLowerCase();
      const email = body.email?.trim()?.toLowerCase();
      const phone = body.phone?.trim();

      if (!slug || (!email && !phone)) {
        return new Response(JSON.stringify({ error: "missing_fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find salon by slug
      const { data: salonProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("booking_slug", slug)
        .single();

      if (!salonProfile) {
        return new Response(JSON.stringify({ error: "salon_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find client by email or phone
      let client: any = null;

      if (email) {
        const { data } = await supabase
          .from("clients")
          .select("id, auth_user_id, email, phone")
          .eq("user_id", salonProfile.user_id)
          .eq("email", email)
          .is("deleted_at", null)
          .limit(1)
          .maybeSingle();
        client = data;

        // Fallback: search by auth user email
        if (!client) {
          const { data: authList } = await supabase.auth.admin.listUsers();
          const authUser = authList?.users?.find(
            (u: any) => u.email?.toLowerCase() === email
          );
          if (authUser) {
            const { data: fb } = await supabase
              .from("clients")
              .select("id, auth_user_id, email, phone")
              .eq("user_id", salonProfile.user_id)
              .eq("auth_user_id", authUser.id)
              .is("deleted_at", null)
              .maybeSingle();
            if (fb) client = fb;
          }
        }
      }

      if (!client && phone) {
        const phoneDigits = phone.replace(/[^0-9]/g, "");
        // Try exact match first
        const { data } = await supabase
          .from("clients")
          .select("id, auth_user_id, email, phone")
          .eq("user_id", salonProfile.user_id)
          .eq("phone", phone)
          .is("deleted_at", null)
          .limit(1)
          .maybeSingle();
        client = data;

        // Fuzzy match on last 10 digits
        if (!client && phoneDigits.length >= 8) {
          const { data: fuzzyData } = await supabase
            .from("clients")
            .select("id, auth_user_id, email, phone")
            .eq("user_id", salonProfile.user_id)
            .is("deleted_at", null)
            .ilike("phone", `%${phoneDigits.slice(-10)}`);
          const match = (fuzzyData || []).find((c: any) => {
            const cDigits = (c.phone || "").replace(/[^0-9]/g, "");
            return cDigits.endsWith(phoneDigits) || phoneDigits.endsWith(cDigits.slice(-phoneDigits.length));
          });
          if (match) client = match;
        }
      }

      if (!client) {
        return new Response(JSON.stringify({ error: phone ? "phone_not_found" : "email_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Resolve auth email for magic link generation
      let authEmail = email || client.email;
      if (!authEmail && client.auth_user_id) {
        const { data: existingUser } = await supabase.auth.admin.getUserById(client.auth_user_id);
        if (existingUser?.user?.email) authEmail = existingUser.user.email;
      }
      if (!authEmail) {
        const normalizedPhone = (client.phone || phone).replace(/[^0-9]/g, "");
        authEmail = `phone_${normalizedPhone}@clients.noreply.local`;
      }

      // If client has no auth account, create one and link it
      if (!client.auth_user_id) {
        const { data: existingLink } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: authEmail,
        });
        let authUserId: string | null = existingLink?.user?.id || null;

        if (!authUserId) {
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: authEmail,
            email_confirm: true,
          });
          if (createError || !newUser?.user) {
            return new Response(JSON.stringify({ error: "login_failed" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          authUserId = newUser.user.id;
        }

        // Cleanup default trigger artifacts
        await supabase.from("user_roles").delete().eq("user_id", authUserId).eq("role", "user");
        await supabase.from("profiles").delete().eq("user_id", authUserId);
        await supabase.from("clients").update({ auth_user_id: authUserId }).eq("id", client.id);
        await supabase.from("user_roles").upsert({ user_id: authUserId, role: "client" }, { onConflict: "user_id,role" });
        client.auth_user_id = authUserId;
      } else {
        // Resolve real auth email
        const { data: existingUser } = await supabase.auth.admin.getUserById(client.auth_user_id);
        if (existingUser?.user?.email) authEmail = existingUser.user.email;
      }

      // Generate magic link
      const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: authEmail,
      });

      // Cleanup
      if (linkData?.user?.id) {
        const uid = linkData.user.id;
        await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", "user");
        await supabase.from("profiles").delete().eq("user_id", uid);
        await supabase.from("user_roles").upsert({ user_id: uid, role: "client" }, { onConflict: "user_id,role" });
      }

      if (linkErr || !linkData?.properties?.hashed_token) {
        const isRateLimit = linkErr?.message?.includes("rate") || linkErr?.message?.includes("security");
        return new Response(JSON.stringify({ error: isRateLimit ? "rate_limited" : "login_failed" }), {
          status: isRateLimit ? 429 : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ token_hash: linkData.properties.hashed_token, type: "magiclink" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve salon by slug (public, no auth)
    if (action === "resolve-salon" && req.method === "GET") {
      const slug = url.searchParams.get("slug")?.trim()?.toLowerCase();
      if (!slug) {
        return new Response(JSON.stringify({ error: "slug_required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("salon_name, display_name, booking_slug")
        .eq("booking_slug", slug)
        .single();

      if (!profile) {
        return new Response(JSON.stringify({ error: "salon_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ salon_name: profile.salon_name || profile.display_name || "Salone" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get appointment details by reminder flow token (public, no auth)
    if (action === "get-appointment-by-token" && req.method === "POST") {
      const body = await req.json();
      const flowToken = body.token;
      if (!flowToken) {
        return new Response(JSON.stringify({ error: "token_required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: flow } = await supabase
        .from("reminder_flows")
        .select("id, appointment_id, user_id, client_action, action_token")
        .eq("action_token", flowToken)
        .maybeSingle();

      if (!flow) {
        return new Response(JSON.stringify({ error: "invalid_token" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: apt } = await supabase
        .from("appointments")
        .select("start_time, end_time, status, service_id, operator_id")
        .eq("id", flow.appointment_id)
        .single();

      let serviceName = null;
      let operatorName = null;
      if (apt?.service_id) {
        const { data: svc } = await supabase.from("services").select("name").eq("id", apt.service_id).single();
        serviceName = svc?.name;
      }
      if (apt?.operator_id) {
        const { data: op } = await supabase.from("operators").select("name").eq("id", apt.operator_id).single();
        operatorName = op?.name;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("salon_name")
        .eq("user_id", flow.user_id)
        .single();

      return new Response(JSON.stringify({
        id: flow.id,
        appointment_id: flow.appointment_id,
        user_id: flow.user_id,
        client_action: flow.client_action,
        appointment: apt ? {
          start_time: apt.start_time,
          end_time: apt.end_time,
          status: apt.status,
          service_id: apt.service_id,
          operator_id: apt.operator_id,
          service: serviceName ? { name: serviceName } : null,
          operator: operatorName ? { name: operatorName } : null,
        } : null,
        salon_name: profile?.salon_name,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process client action on appointment via token (public, no auth)
    if (action === "appointment-action" && req.method === "POST") {
      const body = await req.json();
      const flowToken = body.token;
      const clientAction = body.client_action; // 'confirmed' or 'cancelled'

      if (!flowToken || !clientAction || !["confirmed", "cancelled"].includes(clientAction)) {
        return new Response(JSON.stringify({ error: "invalid_params" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: flow } = await supabase
        .from("reminder_flows")
        .select("id, appointment_id, user_id, client_id, client_action")
        .eq("action_token", flowToken)
        .eq("status", "active")
        .maybeSingle();

      if (!flow) {
        return new Response(JSON.stringify({ error: "invalid_token" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // For "confirmed": don't close flow, just mark action (flow stays active for subsequent nodes)
      // For "cancelled": close flow completely
      if (flow.client_action && flow.client_action !== "confirmed") {
        // Already cancelled or rescheduled - truly done
        return new Response(JSON.stringify({ error: "already_acted", action: flow.client_action }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (clientAction === "confirmed") {
        const confirmedAt = new Date().toISOString();

        // Mark confirmed but keep flow ACTIVE for follow-up nodes
        await supabase
          .from("reminder_flows")
          .update({
            client_action: "confirmed",
            client_action_at: confirmedAt,
            // status stays "active" - don't close!
          })
          .eq("id", flow.id);

        // Mark sent/completed reminder nodes as acted too, otherwise the UI keeps P uncolored
        await supabase
          .from("reminder_flow_nodes")
          .update({ client_acted: true })
          .eq("flow_id", flow.id)
          .eq("only_if_confirmed", false)
          .eq("only_if_no_response", false)
          .not("node_type", "in", '("mid_treatment_link","admin_escalation","reminder_confirmed")')
          .in("status", ["completed", "sent", "done"]);

        // Mark current pending non-conditional nodes as completed and acted
        // Conditional nodes (only_if_confirmed) will now match and execute
        await supabase
          .from("reminder_flow_nodes")
          .update({ client_acted: true })
          .eq("flow_id", flow.id)
          .in("status", ["pending", "in_progress"])
          .eq("only_if_confirmed", false)
          .eq("only_if_no_response", false)
          .not("node_type", "in", '("mid_treatment_link","admin_escalation","reminder_confirmed")')
          .not("push_sent_at", "is", null);

        // Skip no_response nodes since client responded
        await supabase
          .from("reminder_flow_nodes")
          .update({ status: "skipped" })
          .eq("flow_id", flow.id)
          .eq("only_if_no_response", true)
          .eq("status", "pending");

        // Update appointment
        await supabase
          .from("appointments")
          .update({ client_confirmed: true, client_confirmed_at: confirmedAt })
          .eq("id", flow.appointment_id);
      } else if (clientAction === "cancelled") {
        const cancelledAt = new Date().toISOString();

        await supabase
          .from("reminder_flows")
          .update({
            client_action: "cancelled",
            client_action_at: cancelledAt,
            status: "cancelled",
          })
          .eq("id", flow.id);

        await supabase
          .from("reminder_flow_nodes")
          .update({ client_acted: true })
          .eq("flow_id", flow.id);

        await supabase
          .from("reminder_flow_nodes")
          .update({ client_acted: true, status: "skipped" })
          .eq("flow_id", flow.id)
          .in("status", ["pending", "in_progress"]);

        await supabase
          .from("appointments")
          .update({ status: "cancelled", deleted_at: cancelledAt })
          .eq("id", flow.appointment_id);
      }

      // Resolve any unconfirmed_appointments entry
      await supabase
        .from("unconfirmed_appointments")
        .update({ resolved: true, resolved_at: new Date().toISOString(), resolution: clientAction })
        .eq("appointment_id", flow.appointment_id);

      // Notify salon owner
      const { data: client } = await supabase
        .from("clients")
        .select("first_name")
        .eq("id", flow.client_id)
        .single();

      const { data: apt } = await supabase
        .from("appointments")
        .select("start_time, service_id")
        .eq("id", flow.appointment_id)
        .single();

      let serviceName = "";
      if (apt?.service_id) {
        const { data: svc } = await supabase.from("services").select("name").eq("id", apt.service_id).single();
        serviceName = svc?.name || "";
      }

      const aptDate = apt ? new Date(apt.start_time) : new Date();
      const dateStr = aptDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Rome" });
      const timeStr = aptDate.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });

      await createNotification(supabase, {
        user_id: flow.user_id,
        salon_user_id: flow.user_id,
        type: clientAction === "confirmed" ? "appointment_confirmed" : "appointment_cancelled",
        title: clientAction === "confirmed" ? "Appuntamento confermato" : "Appuntamento annullato",
        body: `${client?.first_name || "Cliente"} ha ${clientAction === "confirmed" ? "confermato" : "annullato"} l'appuntamento di ${serviceName} del ${dateStr} alle ${timeStr}.`,
        data: { appointment_id: flow.appointment_id },
      });

      return new Response(JSON.stringify({ success: true, action: clientAction }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Manual reminder: get appointment by ID or short_code (public, no auth) ───
    if (action === "get-appointment-by-id" && req.method === "POST") {
      const body = await req.json();
      const appointmentId = body.appointment_id;
      if (!appointmentId) {
        return new Response(JSON.stringify({ error: "appointment_id_required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Detect if it's a UUID or a short_code
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appointmentId);
      const query = supabase
        .from("appointments")
        .select("id, start_time, end_time, status, service_id, operator_id, user_id, client_id, client_confirmed, deleted_at")
        .is("deleted_at", null);
      
      const { data: apt } = isUuid
        ? await query.eq("id", appointmentId).maybeSingle()
        : await query.eq("short_code", appointmentId).maybeSingle();

      if (!apt) {
        return new Response(JSON.stringify({ error: "not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let serviceName = null;
      let operatorName = null;
      if (apt.service_id) {
        const { data: svc } = await supabase.from("services").select("name").eq("id", apt.service_id).single();
        serviceName = svc?.name;
      }
      if (apt.operator_id) {
        const { data: op } = await supabase.from("operators").select("name").eq("id", apt.operator_id).single();
        operatorName = op?.name;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("salon_name")
        .eq("user_id", apt.user_id)
        .single();

      return new Response(JSON.stringify({
        appointment_id: apt.id,
        user_id: apt.user_id,
        client_id: apt.client_id,
        status: apt.status,
        client_confirmed: apt.client_confirmed,
        appointment: {
          start_time: apt.start_time,
          end_time: apt.end_time,
          status: apt.status,
          service_id: apt.service_id,
          operator_id: apt.operator_id,
          service: serviceName ? { name: serviceName } : null,
          operator: operatorName ? { name: operatorName } : null,
        },
        salon_name: profile?.salon_name,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Manual reminder: confirm/cancel by appointment ID or short_code (public) ───
    if (action === "appointment-action-by-id" && req.method === "POST") {
      const body = await req.json();
      const appointmentId = body.appointment_id;
      const clientAction = body.client_action;

      if (!appointmentId || !clientAction || !["confirmed", "cancelled"].includes(clientAction)) {
        return new Response(JSON.stringify({ error: "invalid_params" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Detect if it's a UUID or a short_code
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appointmentId);
      const actionQuery = supabase
        .from("appointments")
        .select("id, user_id, client_id, status, client_confirmed, start_time, service_id")
        .is("deleted_at", null);
      
      const { data: apt } = isUuid
        ? await actionQuery.eq("id", appointmentId).maybeSingle()
        : await actionQuery.eq("short_code", appointmentId).maybeSingle();

      if (!apt) {
        return new Response(JSON.stringify({ error: "not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (apt.status === "cancelled") {
        return new Response(JSON.stringify({ error: "already_acted", action: "cancelled" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const now = new Date().toISOString();

      if (clientAction === "confirmed") {
        await supabase
          .from("appointments")
          .update({ client_confirmed: true, client_confirmed_at: now })
          .eq("id", apt.id);
      } else {
        await supabase
          .from("appointments")
          .update({ status: "cancelled", deleted_at: now })
          .eq("id", apt.id);
      }

      // Notify salon owner
      const { data: client } = apt.client_id
        ? await supabase.from("clients").select("first_name").eq("id", apt.client_id).single()
        : { data: null };

      let serviceName = "";
      if (apt.service_id) {
        const { data: svc } = await supabase.from("services").select("name").eq("id", apt.service_id).single();
        serviceName = svc?.name || "";
      }

      const aptDate = new Date(apt.start_time);
      const dateStr = aptDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Rome" });
      const timeStr = aptDate.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });

      await createNotification(supabase, {
        user_id: apt.user_id,
        salon_user_id: apt.user_id,
        type: clientAction === "confirmed" ? "appointment_confirmed" : "appointment_cancelled",
        title: clientAction === "confirmed" ? "Appuntamento confermato" : "Appuntamento annullato",
        body: `${client?.first_name || "Cliente"} ha ${clientAction === "confirmed" ? "confermato" : "annullato"} l'appuntamento di ${serviceName} del ${dateStr} alle ${timeStr}.`,
        data: { appointment_id: apt.id },
      });

      return new Response(JSON.stringify({ success: true, action: clientAction }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in client-portal:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
