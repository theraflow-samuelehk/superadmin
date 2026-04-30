import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const userId = user.id;

    // Gather business data for AI analysis
    const [clientsRes, appointmentsRes, transactionsRes, operatorsRes] = await Promise.all([
      supabase.from("clients").select("id, first_name, last_name, created_at, updated_at").eq("user_id", userId).is("deleted_at", null),
      supabase.from("appointments").select("id, client_id, operator_id, service_id, start_time, status, created_at").eq("user_id", userId).is("deleted_at", null).order("start_time", { ascending: false }).limit(200),
      supabase.from("transactions").select("id, total, created_at, payment_method").eq("user_id", userId).is("deleted_at", null).order("created_at", { ascending: false }).limit(100),
      supabase.from("operators").select("id, name").eq("user_id", userId).is("deleted_at", null),
    ]);

    const clients = clientsRes.data || [];
    const appointments = appointmentsRes.data || [];
    const transactions = transactionsRes.data || [];
    const operators = operatorsRes.data || [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Compute metrics
    const recentAppointments = appointments.filter(a => new Date(a.start_time) >= thirtyDaysAgo);
    const olderAppointments = appointments.filter(a => {
      const d = new Date(a.start_time);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    });

    const recentRevenue = transactions.filter(t => new Date(t.created_at) >= thirtyDaysAgo).reduce((s, t) => s + Number(t.total), 0);
    const olderRevenue = transactions.filter(t => {
      const d = new Date(t.created_at);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    }).reduce((s, t) => s + Number(t.total), 0);

    // Find clients with no recent appointments (inactive > 45 days)
    const clientLastVisit: Record<string, string> = {};
    for (const a of appointments) {
      if (!clientLastVisit[a.client_id] || a.start_time > clientLastVisit[a.client_id]) {
        clientLastVisit[a.client_id] = a.start_time;
      }
    }
    const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
    const inactiveClients = clients.filter(c => {
      const lastVisit = clientLastVisit[c.id];
      return !lastVisit || new Date(lastVisit) < fortyFiveDaysAgo;
    });

    // No-show rate
    const noShows = appointments.filter(a => a.status === "no_show").length;
    const noShowRate = appointments.length > 0 ? (noShows / appointments.length * 100).toFixed(1) : "0";

    // Build prompt
    const businessContext = `
Sei un assistente AI per un centro estetico. Analizza questi dati e fornisci suggerimenti concreti e azionabili.

DATI DEL CENTRO:
- Clienti totali: ${clients.length}
- Operatrici: ${operators.length} (${operators.map(o => o.name).join(", ")})
- Appuntamenti ultimi 30 giorni: ${recentAppointments.length}
- Appuntamenti 30-60 giorni fa: ${olderAppointments.length}
- Incasso ultimi 30 giorni: €${recentRevenue.toFixed(2)}
- Incasso 30-60 giorni fa: €${olderRevenue.toFixed(2)}
- Tasso no-show: ${noShowRate}%
- Clienti inattivi (>45 giorni): ${inactiveClients.length} su ${clients.length}
${inactiveClients.slice(0, 10).map(c => `  - ${c.first_name} ${c.last_name}`).join("\n")}

Fornisci esattamente 4 suggerimenti in formato JSON array, ognuno con:
- type: "inactive_clients" | "no_show_risk" | "agenda_optimization" | "trend_analysis"
- title: titolo breve (max 60 char)
- description: descrizione dettagliata con azione concreta (max 200 char)
- priority: "high" | "medium" | "low"

Rispondi SOLO con il JSON array, nessun altro testo.
`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Sei un business analyst esperto di centri estetici italiani. Rispondi sempre in italiano. Rispondi SOLO in JSON valido." },
          { role: "user", content: businessContext },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, riprova tra poco." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Crediti AI esauriti." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    // Parse JSON from response (handle markdown code blocks)
    let suggestions;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      suggestions = JSON.parse(cleaned);
    } catch {
      suggestions = [];
    }

    return new Response(JSON.stringify({
      suggestions,
      metrics: {
        totalClients: clients.length,
        recentAppointments: recentAppointments.length,
        recentRevenue,
        revenueTrend: olderRevenue > 0 ? ((recentRevenue - olderRevenue) / olderRevenue * 100).toFixed(1) : null,
        noShowRate,
        inactiveClients: inactiveClients.length,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
