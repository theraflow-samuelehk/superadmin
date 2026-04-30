import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the most recent facebook lead created in the last 10 minutes
    // that hasn't been matched to a funnel session yet
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    // Get fb_lead_ids already matched to funnel sessions
    const { data: matchedEvents } = await supabase
      .from("funnel_events")
      .select("fb_lead_id")
      .not("fb_lead_id", "is", null)
      .gte("created_at", tenMinAgo);

    const matchedIds = new Set(
      (matchedEvents || []).map((e: any) => e.fb_lead_id).filter(Boolean)
    );

    // Find unmatched leads
    const { data: recentLeads, error: leadErr } = await supabase
      .from("facebook_leads")
      .select("fb_lead_id, full_name, email, phone")
      .gte("created_at", tenMinAgo)
      .order("created_at", { ascending: false })
      .limit(10);

    if (leadErr) {
      console.error("Error fetching leads:", leadErr.message);
      return new Response(JSON.stringify({ fb_lead_id: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pick the first unmatched lead
    const unmatchedLead = (recentLeads || []).find(
      (l: any) => !matchedIds.has(l.fb_lead_id)
    );

    if (!unmatchedLead) {
      return new Response(JSON.stringify({ fb_lead_id: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update all funnel events for this session with the matched fb_lead_id
    await supabase
      .from("funnel_events")
      .update({ fb_lead_id: unmatchedLead.fb_lead_id })
      .eq("session_id", session_id)
      .is("fb_lead_id", null);

    return new Response(
      JSON.stringify({ fb_lead_id: unmatchedLead.fb_lead_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("match-funnel-lead error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
