import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_USER_ID = "7d458727-a87b-491b-b137-ed809d4336d6";

const OPERATORS = [
  "d2cb7ce0-ab9e-4c82-ba1a-178debffc377",
  "a0000001-0000-0000-0000-000000000001",
  "a0000001-0000-0000-0000-000000000002",
  "91a61029-761c-4487-bc67-29c424c4da97",
  "23b50407-67ac-4060-b1ea-f27b9571746e",
  "a0000001-0000-0000-0000-000000000003",
  "a0000001-0000-0000-0000-000000000004",
  "a0000001-0000-0000-0000-000000000005",
  "a0000001-0000-0000-0000-000000000006",
  "a0000001-0000-0000-0000-000000000007",
];

const SERVICES = [
  { id: "606eef0e-78b5-4e2e-a599-fadf2cf66789", duration: 30 },
  { id: "1dc0b931-9dd9-4138-ae1d-e5eaafa0c20a", duration: 60 },
  { id: "1faa39a1-c084-4671-bba4-ae62cea054e2", duration: 120 },
  { id: "2a578258-73cf-4432-86e7-8572e1966e76", duration: 20 },
  { id: "35c20037-be90-45e6-b501-f1e46e228b8c", duration: 45 },
  { id: "39471bb2-b824-4f0f-9a4c-54916276bba7", duration: 15 },
  { id: "602cc377-eff2-4c6f-909a-6469ab7179da", duration: 50 },
  { id: "78bf1dfe-12c9-4909-956f-2589ba5355c2", duration: 40 },
  { id: "80891b77-2562-4710-b3f4-554322724e3c", duration: 50 },
  { id: "83c6022c-7b59-4c31-9196-255a7b7765b2", duration: 20 },
  { id: "996eee85-dce2-499a-a7cf-01b97bb896a5", duration: 50 },
  { id: "f8f90a91-235c-41b0-add8-3585ec614ef9", duration: 40 },
  { id: "fc90611d-45ab-4c84-a057-40cd185421d7", duration: 60 },
  { id: "e41756f0-ca05-4af8-a3da-4247d6260ac0", duration: 30 },
  { id: "7b2ebb43-73c9-4af6-a350-9d7840ac4e03", duration: 50 },
];

const CLIENTS = [
  { id: "c0000001-0000-0000-0000-000000000001", phone: "3391234567" },
  { id: "c0000001-0000-0000-0000-000000000002", phone: "3402345678" },
  { id: "c0000001-0000-0000-0000-000000000003", phone: "3473456789" },
  { id: "c0000001-0000-0000-0000-000000000004", phone: "3384567890" },
  { id: "c0000001-0000-0000-0000-000000000005", phone: "3495678901" },
  { id: "c0000001-0000-0000-0000-000000000006", phone: "3336789012" },
  { id: "c0000001-0000-0000-0000-000000000007", phone: "3447890123" },
  { id: "c0000001-0000-0000-0000-000000000008", phone: "3358901234" },
  { id: "c0000001-0000-0000-0000-000000000009", phone: "3469012345" },
  { id: "c0000001-0000-0000-0000-000000000010", phone: "3310123456" },
  { id: "c0000001-0000-0000-0000-000000000011", phone: "3421234567" },
  { id: "c0000001-0000-0000-0000-000000000012", phone: "3482345678" },
  { id: "c0000001-0000-0000-0000-000000000013", phone: "3393456789" },
  { id: "c0000001-0000-0000-0000-000000000014", phone: "3404567890" },
  { id: "c0000001-0000-0000-0000-000000000015", phone: "3475678901" },
  { id: "c0000001-0000-0000-0000-000000000016", phone: "3386789012" },
  { id: "c0000001-0000-0000-0000-000000000017", phone: "3497890123" },
  { id: "c0000001-0000-0000-0000-000000000018", phone: "3348901234" },
  { id: "c0000001-0000-0000-0000-000000000019", phone: "3459012345" },
  { id: "c0000001-0000-0000-0000-000000000020", phone: "3320123456" },
  { id: "c0000001-0000-0000-0000-000000000021", phone: "3431234567" },
  { id: "c0000001-0000-0000-0000-000000000022", phone: "3492345678" },
  { id: "c0000001-0000-0000-0000-000000000023", phone: "3353456789" },
  { id: "c0000001-0000-0000-0000-000000000024", phone: "3414567890" },
  { id: "c0000001-0000-0000-0000-000000000025", phone: "3485678901" },
  { id: "c0000001-0000-0000-0000-000000000026", phone: "3396789012" },
  { id: "c0000001-0000-0000-0000-000000000027", phone: "3407890123" },
  { id: "c0000001-0000-0000-0000-000000000028", phone: "3478901234" },
  { id: "c0000001-0000-0000-0000-000000000029", phone: "3349012345" },
  { id: "c0000001-0000-0000-0000-000000000030", phone: "3450123456" },
];

const NOTES = [
  null, null, null, null, null, null,
  "Cliente abituale",
  "Prima visita",
  "Pelle sensibile",
  "Allergia al nichel",
  "Trattamento anti-age",
  "Richiede prodotti bio",
  "Refill gel",
  "Zona gambe",
  "Zona bikini",
  "Zona braccia",
  "Ricostruzione completa",
  "Massaggio anticellulite",
  "Nail art richiesta",
  "Pacchetto prepagato",
];

// Simple seeded random for deterministic results per day
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function generateDayAppointments(dateStr: string, dayIndex: number) {
  const rand = seededRandom(dayIndex * 7919 + dateStr.charCodeAt(5) * 31 + dateStr.charCodeAt(8) * 97);
  const appointments: any[] = [];

  // Track each operator's schedule to avoid overlaps
  const operatorSchedules: Map<string, number[]> = new Map();
  for (const opId of OPERATORS) {
    operatorSchedules.set(opId, []);
  }

  // Work hours: 09:00 to 20:00 (in minutes from midnight)
  const WORK_START = 9 * 60;  // 540
  const WORK_END = 20 * 60;   // 1200
  // Lunch break: 13:00-14:00
  const LUNCH_START = 13 * 60;
  const LUNCH_END = 14 * 60;

  // Generate 5-6 appointments per operator
  for (const opId of OPERATORS) {
    const numAppts = Math.floor(rand() * 2) + 5; // 5 or 6
    const slots: { start: number; end: number }[] = [];

    for (let a = 0; a < numAppts; a++) {
      // Pick a random service
      const svcIdx = Math.floor(rand() * SERVICES.length);
      const svc = SERVICES[svcIdx];
      const duration = svc.duration;

      // Try up to 20 times to find a non-overlapping slot
      let placed = false;
      for (let attempt = 0; attempt < 30; attempt++) {
        const startMin = WORK_START + Math.floor(rand() * (WORK_END - duration - WORK_START));
        // Round to 15-minute intervals
        const roundedStart = Math.round(startMin / 15) * 15;
        const endMin = roundedStart + duration;

        if (endMin > WORK_END) continue;

        // Skip lunch overlap
        if (roundedStart < LUNCH_END && endMin > LUNCH_START) continue;

        // Check overlap with existing slots
        const overlaps = slots.some(
          (s) => roundedStart < s.end && endMin > s.start
        );
        if (overlaps) continue;

        slots.push({ start: roundedStart, end: endMin });

        // Pick a random client (avoid same client in same slot if possible)
        const clientIdx = Math.floor(rand() * CLIENTS.length);
        const client = CLIENTS[clientIdx];

        const startHour = Math.floor(roundedStart / 60);
        const startMinute = roundedStart % 60;
        const endHour = Math.floor(endMin / 60);
        const endMinute = endMin % 60;

        const startTime = `${dateStr}T${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}:00+02:00`;
        const endTime = `${dateStr}T${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}:00+02:00`;

        // ~30% already confirmed by client, rest not
        const clientConfirmed = rand() < 0.3;

        // Past appointments: some completed
        const today = new Date().toISOString().split("T")[0];
        let status = "confirmed";
        if (dateStr < today) {
          status = rand() < 0.85 ? "completed" : (rand() < 0.5 ? "no_show" : "cancelled");
        }

        const noteIdx = Math.floor(rand() * NOTES.length);

        appointments.push({
          user_id: DEMO_USER_ID,
          client_id: client.id,
          service_id: svc.id,
          operator_id: opId,
          start_time: startTime,
          end_time: endTime,
          status,
          notes: NOTES[noteIdx],
          client_confirmed: clientConfirmed,
          contact_phone: client.phone,
        });

        placed = true;
        break;
      }
    }
  }

  return appointments;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse body - optional: { days_ahead?: number, force_regenerate?: boolean }
    let daysAhead = 14;
    let forceRegenerate = false;
    try {
      const body = await req.json();
      if (body.days_ahead) daysAhead = Math.min(body.days_ahead, 30);
      if (body.force_regenerate) forceRegenerate = true;
    } catch { /* no body, use defaults */ }

    const today = new Date();
    const allAppointments: any[] = [];
    const datesProcessed: string[] = [];

    for (let d = 0; d < daysAhead; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() + d);
      const dateStr = date.toISOString().split("T")[0];

      // Check if this day already has appointments (skip Sundays optionally)
      const dayOfWeek = date.getDay();
      // Sunday = lighter schedule (3 operators only)
      
      if (!forceRegenerate) {
        const { count } = await supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", DEMO_USER_ID)
          .gte("start_time", `${dateStr}T00:00:00`)
          .lt("start_time", `${dateStr}T23:59:59`)
          .is("deleted_at", null);

        if ((count ?? 0) >= 30) {
          // Already populated enough
          continue;
        }

        // Delete sparse existing to regenerate cleanly
        if ((count ?? 0) > 0) {
          await supabase
            .from("appointments")
            .delete()
            .eq("user_id", DEMO_USER_ID)
            .gte("start_time", `${dateStr}T00:00:00`)
            .lt("start_time", `${dateStr}T23:59:59`);
        }
      } else {
        // Force: delete existing
        await supabase
          .from("appointments")
          .delete()
          .eq("user_id", DEMO_USER_ID)
          .gte("start_time", `${dateStr}T00:00:00`)
          .lt("start_time", `${dateStr}T23:59:59`);
      }

      const dayAppts = generateDayAppointments(dateStr, d + dayOfWeek * 100);
      allAppointments.push(...dayAppts);
      datesProcessed.push(dateStr);
    }

    // Batch insert in chunks of 50
    let inserted = 0;
    for (let i = 0; i < allAppointments.length; i += 50) {
      const chunk = allAppointments.slice(i, i + 50);
      const { error } = await supabase.from("appointments").insert(chunk);
      if (error) {
        console.error("Insert error:", error);
      } else {
        inserted += chunk.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_inserted: inserted,
        dates_processed: datesProcessed,
        days_ahead: daysAhead,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
