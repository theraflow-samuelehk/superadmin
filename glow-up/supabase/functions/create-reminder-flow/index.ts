import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Timezone helpers ──────────────────────────────────────

function getAppointmentHourInRome(startTime: string): number {
  const d = new Date(startTime);
  const romeStr = d.toLocaleString("en-US", { timeZone: "Europe/Rome", hour: "numeric", hour12: false });
  return parseInt(romeStr, 10);
}

function setHourInRome(baseDate: Date, hour: number): Date {
  const romeDate = new Date(baseDate.toLocaleString("en-US", { timeZone: "Europe/Rome" }));
  romeDate.setHours(hour, 0, 0, 0);
  const offset = baseDate.getTime() - new Date(baseDate.toLocaleString("en-US", { timeZone: "Europe/Rome" })).getTime();
  return new Date(romeDate.getTime() + offset);
}

function getDayBefore(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d;
}

// ── Flow config types (v3) ─────────────────────────────────

interface NodeConfig {
  node_type: string;
  timing: string;
  offset_hours?: number;
  message_key?: string;
  message_variant?: string;
  is_admin?: boolean;
  only_if_confirmed?: boolean;
  only_if_no_response?: boolean;
}

interface CaseConfig {
  min_hours: number;
  max_hours: number | null;
  label: string;
  nodes: NodeConfig[];
  timing_tables?: Record<string, Record<string, number>>;
}

interface FlowConfig {
  version: number;
  channel_escalation: {
    sequence: string[];
    delays_min: Record<string, number>;
  };
  messages?: Record<string, string>;
  cases: Record<string, CaseConfig>;
}

interface FlowNode {
  node_type: string;
  scheduled_at: string;
  message_variant: string;
  message_key?: string;
  only_if_confirmed: boolean;
  only_if_no_response: boolean;
}

// ── Determine which case applies ──────────────────────────

function determineCase(flowConfig: FlowConfig, hoursUntil: number): { caseKey: string; caseConfig: CaseConfig } | null {
  const sortedCases = Object.entries(flowConfig.cases)
    .sort(([, a], [, b]) => b.min_hours - a.min_hours);

  for (const [key, cfg] of sortedCases) {
    const matchesMin = hoursUntil > cfg.min_hours;
    const matchesMax = cfg.max_hours === null || hoursUntil <= cfg.max_hours;
    if (matchesMin && matchesMax) {
      return { caseKey: key, caseConfig: cfg };
    }
  }

  for (const [key, cfg] of Object.entries(flowConfig.cases)) {
    if (cfg.min_hours === 0) return { caseKey: key, caseConfig: cfg };
  }
  return null;
}

// ── Calculate case-specific nodes from config ──────────────

function calculateCaseNodes(
  startTime: string,
  endTime: string,
  hoursUntil: number,
  flowConfig: FlowConfig
): { flowCase: string; nodes: FlowNode[] } {
  const match = determineCase(flowConfig, hoursUntil);
  if (!match) return { flowCase: "E", nodes: [] };

  const { caseKey, caseConfig } = match;

  // Filter OUT immediate_confirmation — it's handled separately as Step 0
  const caseNodes = caseConfig.nodes.filter(n => n.node_type !== "immediate_confirmation");

  if (caseNodes.length === 0) {
    return { flowCase: caseKey, nodes: [] };
  }

  const aptDate = new Date(startTime);
  const aptEndDate = new Date(endTime);
  const aptHour = getAppointmentHourInRome(startTime);
  const clampedHour = Math.max(8, Math.min(20, aptHour));
  const now = new Date();
  const nodes: FlowNode[] = [];

  for (const node of caseNodes) {
    let scheduledAt: Date;

    if (node.timing === "immediate") {
      scheduledAt = now;
    } else if (node.timing === "day_before_same_hour") {
      const dayBefore = getDayBefore(aptDate);
      scheduledAt = setHourInRome(dayBefore, aptHour);
    } else if (node.timing === "mid_treatment") {
      const midpoint = aptDate.getTime() + (aptEndDate.getTime() - aptDate.getTime()) / 2;
      scheduledAt = new Date(midpoint);
    } else if (node.timing === "day_before_table") {
      const dayBefore = getDayBefore(aptDate);
      const hour = caseConfig.timing_tables?.day_before?.[String(clampedHour)] ?? clampedHour;
      scheduledAt = setHourInRome(dayBefore, hour);
    } else if (node.timing === "same_day_table") {
      const hour = caseConfig.timing_tables?.same_day?.[String(clampedHour)] ?? 12;
      if (clampedHour <= 14) {
        scheduledAt = setHourInRome(getDayBefore(aptDate), hour);
      } else {
        scheduledAt = setHourInRome(aptDate, hour);
      }
    } else if (node.timing === "escalation_table") {
      const hour = caseConfig.timing_tables?.escalation?.[String(clampedHour)] ?? 14;
      if (clampedHour <= 14) {
        scheduledAt = setHourInRome(getDayBefore(aptDate), hour);
      } else {
        scheduledAt = setHourInRome(aptDate, hour);
      }
    } else if (node.timing === "no_response_table") {
      const hour = caseConfig.timing_tables?.no_response?.[String(clampedHour)] ?? 14;
      if (clampedHour <= 14) {
        scheduledAt = setHourInRome(getDayBefore(aptDate), hour);
      } else {
        scheduledAt = setHourInRome(aptDate, hour);
      }
    } else if (node.timing === "admin_table") {
      const hour = caseConfig.timing_tables?.admin_push?.[String(clampedHour)] ?? 17;
      if (hoursUntil > 24 && clampedHour <= 14) {
        scheduledAt = setHourInRome(getDayBefore(aptDate), hour);
      } else {
        scheduledAt = setHourInRome(aptDate, hour);
      }
    } else if (node.timing === "confirmed_same_day") {
      const hour = caseConfig.timing_tables?.same_day?.[String(clampedHour)] ?? 9;
      scheduledAt = setHourInRome(aptDate, hour);
    } else if (node.timing === "offset_table") {
      const offset = caseConfig.timing_tables?.offset_hours?.[String(clampedHour)] ?? 3;
      scheduledAt = new Date(aptDate.getTime() - offset * 3600000);
    } else if (node.timing === "fixed_offset") {
      const offset = node.offset_hours ?? 2;
      scheduledAt = new Date(aptDate.getTime() - offset * 3600000);
    } else {
      scheduledAt = new Date(aptDate.getTime() - 2 * 3600000);
    }

    nodes.push({
      node_type: node.node_type,
      scheduled_at: scheduledAt.toISOString(),
      message_variant: node.message_key || node.message_variant || "first_contact",
      message_key: node.message_key,
      only_if_confirmed: node.only_if_confirmed ?? false,
      only_if_no_response: node.only_if_no_response ?? false,
    });
  }

  return { flowCase: caseKey, nodes };
}

// ── Hardcoded fallback (v2 compat) ─────────────────────────

function calculateNodesFallback(startTime: string, endTime: string, hoursUntil: number): { flowCase: string; nodes: FlowNode[] } {
  const aptDate = new Date(startTime);
  const aptEndDate = new Date(endTime);
  const aptHour = getAppointmentHourInRome(startTime);
  const clampedHour = Math.max(8, Math.min(20, aptHour));

  const mkNode = (type: string, at: Date, key: string, opts?: { onlyConfirmed?: boolean; onlyNoResponse?: boolean }): FlowNode => ({
    node_type: type,
    scheduled_at: at.toISOString(),
    message_variant: key,
    message_key: key,
    only_if_confirmed: opts?.onlyConfirmed ?? false,
    only_if_no_response: opts?.onlyNoResponse ?? false,
  });

  const midTreatment = new Date(aptDate.getTime() + (aptEndDate.getTime() - aptDate.getTime()) / 2);

  // Note: immediate_confirmation is NOT included here — it's added universally in main handler
  if (hoursUntil > 24) {
    const dayBefore = getDayBefore(aptDate);
    return { flowCase: "A", nodes: [
      mkNode("reminder_24h", setHourInRome(dayBefore, clampedHour), "reminder_24h"),
      mkNode("reminder_confirmed", setHourInRome(aptDate, 9), "reminder_confirmed", { onlyConfirmed: true }),
      mkNode("no_response_followup", setHourInRome(dayBefore, clampedHour + 3), "no_response", { onlyNoResponse: true }),
      mkNode("admin_escalation", setHourInRome(dayBefore, clampedHour + 6), "admin_escalation"),
      mkNode("mid_treatment_link", midTreatment, "mid_treatment"),
    ]};
  }
  if (hoursUntil > 12) return { flowCase: "B", nodes: [
    mkNode("reminder", new Date(aptDate.getTime() - 3 * 3600000), "reminder_bcd"),
    mkNode("admin_escalation", new Date(aptDate.getTime() - 1 * 3600000), "admin_escalation"),
    mkNode("mid_treatment_link", midTreatment, "mid_treatment"),
  ]};
  if (hoursUntil > 4) return { flowCase: "C", nodes: [
    mkNode("reminder", new Date(aptDate.getTime() - 2 * 3600000), "reminder_bcd"),
    mkNode("admin_escalation", new Date(aptDate.getTime() - 0.5 * 3600000), "admin_escalation"),
    mkNode("mid_treatment_link", midTreatment, "mid_treatment"),
  ]};
  if (hoursUntil > 2) return { flowCase: "D", nodes: [
    mkNode("reminder", new Date(aptDate.getTime() - 1 * 3600000), "reminder_bcd"),
    mkNode("admin_escalation", new Date(aptDate.getTime() - 0.25 * 3600000), "admin_escalation"),
    mkNode("mid_treatment_link", midTreatment, "mid_treatment"),
  ]};
  // Case E: < 2h, only mid-treatment
  return { flowCase: "E", nodes: [
    mkNode("mid_treatment_link", midTreatment, "mid_treatment"),
  ]};
}

// ── Main handler ───────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { appointment_id, is_new, skip_confirmation } = await req.json();
    if (!appointment_id) throw new Error("appointment_id required");

    // Check fast_flow_mode
    let fastFlowMode = false;

    const { data: apt, error: aptErr } = await supabase
      .from("appointments")
      .select("id, user_id, client_id, start_time, end_time, status")
      .eq("id", appointment_id)
      .is("deleted_at", null)
      .single();

    if (aptErr || !apt) throw new Error("Appointment not found");

    // Check fast_flow_mode for this salon
    try {
      const { data: integration } = await supabase
        .from("salon_integrations")
        .select("fast_flow_mode")
        .eq("user_id", apt.user_id)
        .maybeSingle();
      if (integration?.fast_flow_mode) {
        fastFlowMode = true;
        console.log(`[fast_flow_mode] Enabled for salon ${apt.user_id}`);
      }
    } catch (e) {
      console.log("Could not check fast_flow_mode:", e);
    }

    if (apt.status !== "confirmed") {
      return new Response(JSON.stringify({ skipped: true, reason: "not_confirmed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if there is already an active flow (reschedule scenario)
    const { data: existingFlow } = await supabase
      .from("reminder_flows")
      .select("id")
      .eq("appointment_id", appointment_id)
      .maybeSingle();

    // Delete existing flow (for reschedules)
    await supabase.from("reminder_flows").delete().eq("appointment_id", appointment_id);

    const now = new Date();
    const startTime = new Date(apt.start_time);
    const hoursUntil = (startTime.getTime() - now.getTime()) / 3600000;

    if (hoursUntil < 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "past_appointment" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load active flow model
    const { data: activeModel } = await supabase
      .from("reminder_flow_models")
      .select("id, flow_config")
      .eq("is_active", true)
      .limit(1)
      .single();

    let flowCase: string;
    let caseNodes: FlowNode[];

    if (activeModel?.flow_config && (activeModel.flow_config as any).version >= 3) {
      const config = activeModel.flow_config as unknown as FlowConfig;
      const result = calculateCaseNodes(apt.start_time, apt.end_time, hoursUntil, config);
      flowCase = result.flowCase;
      caseNodes = result.nodes;
    } else {
      const result = calculateNodesFallback(apt.start_time, apt.end_time, hoursUntil);
      flowCase = result.flowCase;
      caseNodes = result.nodes;
    }

    // ── STEP 0: Immediate confirmation ──
    // Skipped if: flow_config.send_confirmation === false, or skip_confirmation === true (admin reschedule without resend)
    const flowConfig = activeModel?.flow_config as any;
    const sendConfirmation = flowConfig?.send_confirmation !== false; // default true
    const shouldSendImmediate = sendConfirmation && !skip_confirmation && (Boolean(is_new) || Boolean(existingFlow?.id));
    const allNodes: FlowNode[] = [];

    if (shouldSendImmediate) {
      allNodes.push({
        node_type: "immediate_confirmation",
        scheduled_at: now.toISOString(),
        message_variant: "immediate_confirmation",
        message_key: "immediate_confirmation",
        only_if_confirmed: false,
        only_if_no_response: false,
      });
    }

    // Add case-specific nodes
    allNodes.push(...caseNodes);

    // ── Fast Flow Mode: compress all non-immediate nodes to 1 min apart ──
    if (fastFlowMode && allNodes.length > 0) {
      console.log(`[fast_flow_mode] Compressing ${allNodes.length} nodes to 1-min intervals`);
      const baseTime = now.getTime();
      let minuteOffset = 0;
      for (const node of allNodes) {
        if (node.node_type === "immediate_confirmation") {
          node.scheduled_at = now.toISOString();
        } else {
          minuteOffset += 1;
          node.scheduled_at = new Date(baseTime + minuteOffset * 60000).toISOString();
        }
      }
    }

    if (allNodes.length === 0) {
      return new Response(JSON.stringify({ flow_case: flowCase, nodes_created: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: flow, error: flowErr } = await supabase
      .from("reminder_flows")
      .insert({ appointment_id: apt.id, user_id: apt.user_id, client_id: apt.client_id, flow_case: flowCase })
      .select("id, action_token")
      .single();

    if (flowErr) throw flowErr;

    const nodeRows = allNodes.map((n) => ({
      flow_id: flow.id,
      node_type: n.node_type,
      scheduled_at: n.scheduled_at,
      message_variant: n.message_variant,
      message_key: n.message_key || null,
      only_if_confirmed: n.only_if_confirmed,
      only_if_no_response: n.only_if_no_response,
    }));

    const { error: nodesErr } = await supabase.from("reminder_flow_nodes").insert(nodeRows);
    if (nodesErr) throw nodesErr;

    // ── Trigger immediate processing if there are immediate nodes ──
    const hasImmediate = allNodes.some(n => n.node_type === "immediate_confirmation");
    if (hasImmediate) {
      try {
        const processUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-reminder-flows`;
        // Fire-and-forget: don't await the full response to avoid slowing down the creation
        fetch(processUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({}),
        }).catch(e => console.error("[immediate-trigger] Failed to trigger process-reminder-flows:", e));
        console.log("[immediate-trigger] Triggered process-reminder-flows for instant delivery");
      } catch (e) {
        console.error("[immediate-trigger] Error:", e);
      }
    }

    return new Response(
      JSON.stringify({ flow_id: flow.id, flow_case: flowCase, nodes_created: allNodes.length, action_token: flow.action_token }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in create-reminder-flow:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
