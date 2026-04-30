import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiting (per IP, resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // max requests
const RATE_WINDOW_MS = 60_000; // per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

// Input sanitization
function sanitizeString(val: unknown, maxLen = 200): string {
  if (typeof val !== "string") return "";
  return val.trim().slice(0, maxLen).replace(/<[^>]*>/g, "");
}

function isValidUUID(val: unknown): boolean {
  if (typeof val !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

function isValidISO(val: unknown): boolean {
  if (typeof val !== "string") return false;
  const d = new Date(val);
  return !isNaN(d.getTime());
}

function isValidDate(val: unknown): boolean {
  if (typeof val !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(val);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const url = new URL(req.url);
  const slug = sanitizeString(url.searchParams.get("slug"), 100);

  if (!slug || slug.length < 2) {
    return new Response(JSON.stringify({ error: "Invalid slug" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // GET: fetch salon info, services, operators
    if (req.method === "GET") {
      const action = url.searchParams.get("action") || "info";

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, display_name, salon_name, booking_enabled, booking_blocked_from, booking_blocked_until, booking_blocked_message")
        .eq("booking_slug", slug)
        .eq("booking_enabled", true)
        .single();

      if (profileError || !profile) {
        return new Response(JSON.stringify({ error: "Salon not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = profile.user_id;

      if (action === "info") {
        const { data: services } = await supabase
          .from("services")
          .select("id, name, duration_minutes, price, category_id")
          .eq("user_id", userId)
          .is("deleted_at", null)
          .order("name");

        const { data: categories } = await supabase
          .from("service_categories")
          .select("id, name, emoji")
          .eq("user_id", userId)
          .is("deleted_at", null)
          .order("sort_order");

        const { data: operators } = await supabase
          .from("operators")
          .select("id, name, specializations, calendar_color, photo_url, service_ids")
          .eq("user_id", userId)
          .is("deleted_at", null)
          .order("name");

        return new Response(
          JSON.stringify({
            salon: { name: profile.salon_name || profile.display_name },
            services: services || [],
            categories: categories || [],
            operators: operators || [],
            booking_blocked_from: profile.booking_blocked_from || null,
            booking_blocked_until: profile.booking_blocked_until || null,
            booking_blocked_message: profile.booking_blocked_message || null,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "lookup_phone") {
        const phone = sanitizeString(url.searchParams.get("phone"), 20);
        const digits = phone.replace(/\D/g, "");
        const last10 = digits.slice(-10);

        if (last10.length < 6) {
          return new Response(JSON.stringify({ found: false }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: clients } = await supabase
          .from("clients")
          .select("id, first_name, last_name, email, phone")
          .eq("user_id", userId)
          .is("deleted_at", null);

        // Find ALL matches for the same phone number
        const matches = (clients || []).filter(
          (c) => c.phone && c.phone.replace(/\D/g, "").slice(-10) === last10
        );

        if (matches.length === 1) {
          // Single match: show name
          return new Response(JSON.stringify({
            found: true,
            show_name: true,
            first_name: matches[0].first_name,
            last_name: matches[0].last_name,
            email: matches[0].email || "",
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else if (matches.length > 1) {
          // Multiple matches (e.g. couple sharing number): don't show name
          return new Response(JSON.stringify({
            found: true,
            show_name: false,
            first_name: "",
            last_name: "",
            email: "",
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ found: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "slots") {
        const date = url.searchParams.get("date");
        const operatorId = url.searchParams.get("operator_id");
        const durationStr = url.searchParams.get("duration");
        const serviceIdParam = url.searchParams.get("service_id");

        const isAny = operatorId === "any";

        if (!isValidDate(date) || (!isAny && !isValidUUID(operatorId)) || !durationStr) {
          return new Response(JSON.stringify({ error: "Invalid parameters" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (isAny && !isValidUUID(serviceIdParam)) {
          return new Response(JSON.stringify({ error: "service_id required for any operator" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const duration = parseInt(durationStr);
        if (isNaN(duration) || duration < 5 || duration > 480) {
          return new Response(JSON.stringify({ error: "Invalid duration" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check booking block for this date
        const from = profile.booking_blocked_from;
        const until = profile.booking_blocked_until;
        if (from && date! >= from && (!until || date! <= until)) {
          return new Response(JSON.stringify({ slots: [], blocked: true, blocked_message: profile.booking_blocked_message || "" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
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

        // Resolve which operators to check
        let operatorIds: string[] = [];
        if (isAny) {
          const { data: ops } = await supabase
            .from("operators")
            .select("id, service_ids")
            .eq("user_id", userId)
            .is("deleted_at", null);
          operatorIds = (ops || [])
            .filter((o) => o.service_ids && o.service_ids.includes(serviceIdParam!))
            .map((o) => o.id);
        } else {
          operatorIds = [operatorId!];
        }

        if (operatorIds.length === 0) {
          return new Response(JSON.stringify({ slots: [], slot_operators: {} }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const slotsMap: Record<string, string> = {}; // slotISO -> operatorId

        for (const opId of operatorIds) {
          const { data: shiftRows } = await supabase
            .from("operator_shifts")
            .select("start_time, end_time, is_active")
            .eq("operator_id", opId)
            .eq("user_id", userId)
            .eq("day_of_week", dayOfWeek);

          const activeShifts = (shiftRows || []).filter((s) => s.is_active);
          if (activeShifts.length === 0) continue;

          const { data: appointments } = await supabase
            .from("appointments")
            .select("start_time, end_time")
            .eq("operator_id", opId)
            .eq("user_id", userId)
            .is("deleted_at", null)
            .not("status", "in", '("cancelled","no_show")')
            .gte("start_time", dayStartISO)
            .lte("start_time", dayEndISO);

          for (const shift of activeShifts) {
            const [shStartH, shStartM] = shift.start_time.split(":").map(Number);
            const [shEndH, shEndM] = shift.end_time.split(":").map(Number);

            for (let hour = shStartH; hour < shEndH || (hour === shEndH && 0 < shEndM); hour++) {
              for (const min of [0, 30]) {
                if (hour === shStartH && min < shStartM) continue;

                const hh = String(hour).padStart(2, "0");
                const mm = String(min).padStart(2, "0");
                const slotISO = `${date}T${hh}:${mm}:00${offset}`;

                // Skip if already assigned to another operator (first wins)
                if (slotsMap[slotISO]) continue;

                const slotStartMs = new Date(slotISO).getTime();
                const slotEndMs = slotStartMs + duration * 60000;

                const slotEndLocalMinutes = hour * 60 + min + duration;
                const shiftEndMinutes = shEndH * 60 + shEndM;
                if (slotEndLocalMinutes > shiftEndMinutes) continue;

                const hasConflict = (appointments || []).some((apt) => {
                  const aptStart = new Date(apt.start_time).getTime();
                  const aptEnd = new Date(apt.end_time).getTime();
                  return slotStartMs < aptEnd && slotEndMs > aptStart;
                });

                if (!hasConflict) {
                  slotsMap[slotISO] = opId;
                }
              }
            }
          }
        }

        const sortedSlots = Object.keys(slotsMap).sort();
        const slotOperators: Record<string, string> = {};
        for (const s of sortedSlots) {
          slotOperators[s] = slotsMap[s];
        }

        return new Response(JSON.stringify({ slots: sortedSlots, slot_operators: slotOperators }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // POST: create booking
    if (req.method === "POST") {
      const body = await req.json();

      // Validate & sanitize inputs
      const isExistingClient = body.is_existing_client === true;
      const clientName = sanitizeString(body.client_name, 100);
      const clientPhone = sanitizeString(body.client_phone, 20);
      const clientEmail = sanitizeString(body.client_email, 100);
      const notes = sanitizeString(body.notes, 500);
      const serviceId = body.service_id;
      const operatorId = body.operator_id;
      const startTime = body.start_time;

      if (isExistingClient) {
        // Existing client: email OR phone is required
        const hasEmail = clientEmail && clientEmail.length > 0;
        const hasPhone = clientPhone && clientPhone.length > 0;

        if (!hasEmail && !hasPhone) {
          return new Response(JSON.stringify({ error: "Email or phone required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
          return new Response(JSON.stringify({ error: "Invalid email format" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        // New client: name is required
        if (!clientName || clientName.length < 2) {
          return new Response(JSON.stringify({ error: "Invalid client name (min 2 characters)" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
          return new Response(JSON.stringify({ error: "Invalid email format" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      if (!isValidUUID(serviceId) || !isValidUUID(operatorId) || !isValidISO(startTime)) {
        return new Response(JSON.stringify({ error: "Invalid required fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Prevent bookings too far in the past or future
      const bookingDate = new Date(startTime);
      const now = new Date();
      const maxFuture = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
      if (bookingDate < now || bookingDate > maxFuture) {
        return new Response(JSON.stringify({ error: "Booking date out of range" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, booking_blocked_from, booking_blocked_until, booking_blocked_message")
        .eq("booking_slug", slug)
        .eq("booking_enabled", true)
        .single();

      // Check booking block
      if (profile) {
        const bookDate = startTime.slice(0, 10);
        const from = profile.booking_blocked_from;
        const until = profile.booking_blocked_until;
        if (from && bookDate >= from && (!until || bookDate <= until)) {
          return new Response(JSON.stringify({ error: "booking_blocked", message: profile.booking_blocked_message || "Prenotazioni bloccate per questo periodo" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      if (!profile) {
        return new Response(JSON.stringify({ error: "Salon not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = profile.user_id;

      const { data: service } = await supabase
        .from("services")
        .select("duration_minutes, price")
        .eq("id", serviceId)
        .single();

      if (!service) {
        return new Response(JSON.stringify({ error: "Service not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const endTime = new Date(new Date(startTime).getTime() + service.duration_minutes * 60000).toISOString();

      const { data: conflicts } = await supabase
        .from("appointments")
        .select("id")
        .eq("operator_id", operatorId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .not("status", "in", '("cancelled","no_show")')
        .lt("start_time", endTime)
        .gt("end_time", startTime);

      if (conflicts && conflicts.length > 0) {
        return new Response(JSON.stringify({ error: "Time slot not available" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Robust client resolution (aligned with client-portal logic) ──
      // Fetch ALL salon clients once for fuzzy matching
      const { data: allSalonClients } = await supabase
        .from("clients")
        .select("id, email, phone, auth_user_id")
        .eq("user_id", userId)
        .is("deleted_at", null);

      const allClients = allSalonClients || [];

      // Helper: normalise phone to last 10 digits
      function phoneLast10(raw: string): string {
        return raw.replace(/\D/g, "").slice(-10);
      }

      // Helper: find best match — prefer record with auth_user_id
      function pickBest(candidates: typeof allClients): (typeof allClients)[0] | null {
        if (candidates.length === 0) return null;
        const withAuth = candidates.filter((c) => !!c.auth_user_id);
        if (withAuth.length > 0) return withAuth[0];
        return candidates[0];
      }

      let clientId: string;

      if (isExistingClient) {
        // ── Existing client explicit lookup ──
        const hasEmail = clientEmail && clientEmail.length > 0;

        if (hasEmail) {
          const emailLower = clientEmail.toLowerCase().trim();
          const candidates = allClients.filter(
            (c) => c.email && c.email.toLowerCase().trim() === emailLower
          );
          const found = pickBest(candidates);
          if (!found) {
            return new Response(JSON.stringify({ error: "email_not_found" }), {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          clientId = found.id;
          console.log(`[public-booking] existing-client matched by email, id=${found.id}, auth_user_id=${found.auth_user_id || "NONE"}`);
        } else {
          // Phone lookup
          const digits = clientPhone.replace(/\D/g, "");
          const last10 = digits.slice(-10);

          if (last10.length < 6) {
            return new Response(JSON.stringify({ error: "Invalid phone number" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const candidates = allClients.filter(
            (c) => c.phone && phoneLast10(c.phone) === last10
          );
          const found = pickBest(candidates);
          if (!found) {
            return new Response(JSON.stringify({ error: "phone_not_found" }), {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          clientId = found.id;
          console.log(`[public-booking] existing-client matched by phone, id=${found.id}, auth_user_id=${found.auth_user_id || "NONE"}`);
        }
      } else {
        // ── New client flow with robust dedup ──
        const nameParts = clientName.split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || "-";

        let existingClient: (typeof allClients)[0] | null = null;

        // 1) Match by email (case-insensitive)
        if (clientEmail) {
          const emailLower = clientEmail.toLowerCase().trim();
          const candidates = allClients.filter(
            (c) => c.email && c.email.toLowerCase().trim() === emailLower
          );
          existingClient = pickBest(candidates);
        }

        // 2) Match by phone (normalized last 10 digits)
        if (!existingClient && clientPhone) {
          const last10 = phoneLast10(clientPhone);
          if (last10.length >= 6) {
            const candidates = allClients.filter(
              (c) => c.phone && phoneLast10(c.phone) === last10
            );
            existingClient = pickBest(candidates);
          }
        }

        if (existingClient) {
          clientId = existingClient.id;
          console.log(`[public-booking] new-client form reused existing id=${existingClient.id}, auth_user_id=${existingClient.auth_user_id || "NONE"}`);
        } else {
          // Normalize phone for storage: add +39 if it looks Italian without prefix
          let phoneToSave = clientPhone || null;
          if (phoneToSave) {
            const stripped = phoneToSave.replace(/\D/g, "");
            if (stripped.length === 10 && /^3\d{9}$/.test(stripped)) {
              phoneToSave = `+39${stripped}`;
            } else if (stripped.startsWith("39") && stripped.length === 12) {
              phoneToSave = `+${stripped}`;
            }
          }

          const { data: newClient, error: clientError } = await supabase
            .from("clients")
            .insert({
              user_id: userId,
              first_name: firstName,
              last_name: lastName,
              phone: phoneToSave,
              email: clientEmail || null,
              source: "online_booking",
              privacy_consent: true,
            })
            .select("id")
            .single();

          if (clientError) throw clientError;
          clientId = newClient.id;
          console.log(`[public-booking] created new client id=${newClient.id}`);
        }
      }

      const { data: appointment, error: aptError } = await supabase
        .from("appointments")
        .insert({
          user_id: userId,
          client_id: clientId,
          service_id: serviceId,
          operator_id: operatorId,
          start_time: startTime,
          end_time: endTime,
          status: "confirmed",
          notes: notes || null,
          final_price: service.price,
        })
        .select("id")
        .single();

      if (aptError) throw aptError;

      // Trigger reminder flow creation (non-blocking, same as client-portal)
      try {
        const reminderUrl = `${supabaseUrl}/functions/v1/create-reminder-flow`;
        await fetch(reminderUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            appointment_id: appointment.id,
            is_new: true,
          }),
        });
      } catch (e) {
        console.error("Failed to trigger reminder flow:", e);
      }

      return new Response(
        JSON.stringify({ success: true, appointment_id: appointment.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in public-booking:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
