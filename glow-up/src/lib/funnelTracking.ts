/**
 * Lightweight funnel analytics tracker.
 * Fires events via gtag (Google Analytics), Facebook Pixel,
 * and persists to Supabase for the admin dashboard.
 */

import { supabase } from "@/integrations/supabase/client";

const FUNNEL_STEPS = [
  "hero",
  "service_pick",
  "operator_pick",
  "time_pick",
  "confirm",
  "agenda",
  "problem",
  "reminder",
  "results",
  "cta",
] as const;

type FunnelStep = typeof FUNNEL_STEPS[number];

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

// --- Session helpers ---

function getSessionId(): string {
  const key = "funnel_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || null,
    utm_medium: params.get("utm_medium") || null,
    utm_campaign: params.get("utm_campaign") || null,
    utm_content: params.get("utm_content") || null,
    fb_lead_id: params.get("fb_lead_id") || null,
  };
}

function getDeviceType(): string {
  const w = window.screen.width;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getCommonPayload() {
  return {
    session_id: getSessionId(),
    referrer: document.referrer || null,
    user_agent: navigator.userAgent || null,
    screen_width: window.screen.width,
    device_type: getDeviceType(),
    ...getUtmParams(),
  };
}

// --- Persist to DB (fire-and-forget) ---

function persistEvent(payload: Record<string, unknown>) {
  supabase.from("funnel_events").insert(payload as any).then(({ error }) => {
    if (error && import.meta.env.DEV) {
      console.warn("[Funnel] DB insert error:", error.message);
    }
  });
}

// --- Auto-match lead from Facebook ---

let matchAttemptCount = 0;
const MAX_MATCH_ATTEMPTS = 3;
const RETRY_DELAYS = [0, 5000, 15000]; // immediate, 5s, 15s

function attemptLeadMatch() {
  const utmParams = getUtmParams();
  
  // Only attempt match if coming from a Facebook lead form AND no explicit fb_lead_id
  if (utmParams.utm_medium !== "lead_form" || utmParams.fb_lead_id) return;
  
  // Already matched successfully
  if (sessionStorage.getItem("funnel_matched_fb_lead_id")) return;
  
  if (matchAttemptCount >= MAX_MATCH_ATTEMPTS) return;
  
  const currentAttempt = matchAttemptCount;
  matchAttemptCount++;
  
  const sessionId = getSessionId();
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  if (!projectId) return;

  const doMatch = () => {
    fetch(`https://${projectId}.supabase.co/functions/v1/match-funnel-lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data?.fb_lead_id) {
          sessionStorage.setItem("funnel_matched_fb_lead_id", data.fb_lead_id);
          if (import.meta.env.DEV) {
            console.log(`[Funnel] Auto-matched lead: ${data.fb_lead_id} (attempt ${currentAttempt + 1})`);
          }
        } else if (matchAttemptCount < MAX_MATCH_ATTEMPTS) {
          // Schedule retry — lead might not have arrived in DB yet
          const delay = RETRY_DELAYS[matchAttemptCount] || 15000;
          setTimeout(() => attemptLeadMatch(), delay);
        }
      })
      .catch(() => {
        // Retry on network failure too
        if (matchAttemptCount < MAX_MATCH_ATTEMPTS) {
          const delay = RETRY_DELAYS[matchAttemptCount] || 15000;
          setTimeout(() => attemptLeadMatch(), delay);
        }
      });
  };

  const delay = RETRY_DELAYS[currentAttempt] || 0;
  if (delay > 0) {
    setTimeout(doMatch, delay);
  } else {
    doMatch();
  }
}

function getEffectiveFbLeadId(): string | null {
  const utmParams = getUtmParams();
  return utmParams.fb_lead_id || sessionStorage.getItem("funnel_matched_fb_lead_id") || null;
}

// --- Public API ---

export function trackFunnelStep(stepIndex: number) {
  const stepName = FUNNEL_STEPS[stepIndex] || `step_${stepIndex}`;
  const eventName = `funnel_step_view`;

  // Attempt auto-match on first step
  if (stepIndex === 0) {
    attemptLeadMatch();
  }

  // Google Analytics
  if (window.gtag) {
    window.gtag("event", eventName, {
      step_index: stepIndex,
      step_name: stepName,
      funnel: "demo_prenotazione",
    });
  }

  // Facebook Pixel
  if (window.fbq) {
    window.fbq("trackCustom", "FunnelStepView", {
      step_index: stepIndex,
      step_name: stepName,
    });
  }

  // Supabase persistence
  const common = getCommonPayload();
  persistEvent({
    ...common,
    fb_lead_id: getEffectiveFbLeadId() || common.fb_lead_id,
    step_index: stepIndex,
    step_name: stepName,
    event_type: "step_view",
  });

  // Dev logging
  if (import.meta.env.DEV) {
    console.log(`[Funnel] Step ${stepIndex}: ${stepName}`);
  }
}

export function trackFunnelCTA(action: string) {
  if (window.gtag) {
    window.gtag("event", "funnel_cta_click", {
      action,
      funnel: "demo_prenotazione",
    });
  }

  if (window.fbq) {
    window.fbq("trackCustom", "FunnelCTAClick", { action });
  }

  // Supabase persistence
  const common = getCommonPayload();
  persistEvent({
    ...common,
    fb_lead_id: getEffectiveFbLeadId() || common.fb_lead_id,
    step_index: 9,
    step_name: "cta",
    event_type: "cta_click",
    cta_action: action,
  });

  if (import.meta.env.DEV) {
    console.log(`[Funnel] CTA: ${action}`);
  }
}
