import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CommissionRequest {
  retailer_user_id: string; // the salon owner who paid
  subscription_id: string;
  payment_amount: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { retailer_user_id, subscription_id, payment_amount } =
      (await req.json()) as CommissionRequest;

    if (!retailer_user_id || !subscription_id || !payment_amount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(
      `Calculating commissions for retailer ${retailer_user_id}, subscription ${subscription_id}, amount ${payment_amount}`
    );

    // 1. Check if this retailer is assigned to any affiliate
    const { data: assignments, error: assignErr } = await supabase
      .from("affiliate_clients")
      .select("affiliate_id")
      .eq("retailer_user_id", retailer_user_id);

    if (assignErr) {
      console.error("Error fetching assignments:", assignErr);
      throw assignErr;
    }

    if (!assignments || assignments.length === 0) {
      console.log("No affiliate assigned to this retailer, skipping");
      return new Response(
        JSON.stringify({ message: "No affiliate assigned", commissions_created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let commissionsCreated = 0;

    for (const assignment of assignments) {
      // 2. Fetch the affiliate details
      const { data: affiliate, error: affErr } = await supabase
        .from("affiliates")
        .select("id, commission_pct, is_manager, manager_id, team_commission_pct")
        .eq("id", assignment.affiliate_id)
        .is("deleted_at", null)
        .single();

      if (affErr || !affiliate) {
        console.error("Error fetching affiliate:", affErr);
        continue;
      }

      // Check for duplicate: same affiliate + subscription + not cancelled
      const { data: existing } = await supabase
        .from("affiliate_commissions")
        .select("id")
        .eq("affiliate_id", affiliate.id)
        .eq("subscription_id", subscription_id)
        .eq("retailer_user_id", retailer_user_id)
        .neq("status", "cancelled")
        .eq("is_manager_share", false)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`Commission already exists for affiliate ${affiliate.id}, skipping`);
        continue;
      }

      const totalCommission = (payment_amount * affiliate.commission_pct) / 100;

      if (affiliate.manager_id) {
        // This affiliate is a team member under a manager
        // Fetch the manager
        const { data: manager } = await supabase
          .from("affiliates")
          .select("id, team_commission_pct")
          .eq("id", affiliate.manager_id)
          .is("deleted_at", null)
          .single();

        if (manager) {
          // The team_commission_pct on the TEAM MEMBER defines what % of the manager's
          // commission goes to the team member.
          const teamPct = affiliate.team_commission_pct ?? 0;
          const teamMemberAmount = (totalCommission * teamPct) / 100;
          const managerAmount = totalCommission - teamMemberAmount;

          // Insert team member commission
          const { data: memberComm } = await supabase
            .from("affiliate_commissions")
            .insert({
              affiliate_id: affiliate.id,
              retailer_user_id,
              subscription_id,
              payment_amount,
              commission_pct: affiliate.commission_pct,
              commission_amount: teamMemberAmount,
              is_manager_share: false,
              status: "pending",
            })
            .select("id")
            .single();

          commissionsCreated++;

          // Insert manager share
          await supabase.from("affiliate_commissions").insert({
            affiliate_id: manager.id,
            retailer_user_id,
            subscription_id,
            payment_amount,
            commission_pct: affiliate.commission_pct,
            commission_amount: managerAmount,
            is_manager_share: true,
            parent_commission_id: memberComm?.id || null,
            status: "pending",
          });

          commissionsCreated++;
          console.log(
            `Split commission: team member ${affiliate.id} gets ${teamMemberAmount}, manager ${manager.id} gets ${managerAmount}`
          );
        }
      } else {
        // Direct affiliate (no manager) or is a manager themselves
        await supabase.from("affiliate_commissions").insert({
          affiliate_id: affiliate.id,
          retailer_user_id,
          subscription_id,
          payment_amount,
          commission_pct: affiliate.commission_pct,
          commission_amount: totalCommission,
          is_manager_share: false,
          status: "pending",
        });

        commissionsCreated++;
        console.log(
          `Direct commission for affiliate ${affiliate.id}: ${totalCommission}`
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        commissions_created: commissionsCreated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Commission calculation error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
