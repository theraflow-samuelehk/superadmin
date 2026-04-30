import { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Bell, MessageSquare, Smartphone, Check, X, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FlowStep {
  key: string;
  label: string;
  subLabel?: string;
  hoursBeforeAppt: number;
}

export interface FlowNodeInfo {
  node_type: string;
  status: string;
  scheduled_at: string;
  push_sent_at?: string | null;
  whatsapp_sent_at?: string | null;
  sms_sent_at?: string | null;
  sms_delivered_at?: string | null;
  whatsapp_delivered_at?: string | null;
  client_acted?: boolean;
  only_if_confirmed?: boolean;
  only_if_no_response?: boolean;
}

interface ManualMessageLinks {
  whatsapp?: string | null;
  sms?: string | null;
}

interface Props {
  flowModel: {
    id: string;
    name: string;
    flow_config: any;
  } | null;
  hoursUntil: number;
  operatorColor?: string;
  /** Whether the confirmation message (step C) has been sent already */
  confirmationSent?: boolean;
  /** Whether the flow is armed already (e.g. phone number entered) */
  confirmationReady?: boolean;
  /** Real flow node data for tooltip details */
  flowNodes?: FlowNodeInfo[];
  /** Hours between appointment creation and appointment time (for C positioning) */
  createdHoursBeforeAppt?: number;
  /** Manual mode fallback callback when user clicks WA or SMS from a dot */
  onSendMessage?: (channel: "whatsapp" | "sms", stepKey: string) => void;
  /** Optional native links for WA/SMS inside the tooltip */
  getMessageLinks?: (stepKey: string) => ManualMessageLinks | null;
  /** Whether manual sending is available (show WA/SMS buttons in tooltip) */
  manualSendEnabled?: boolean;
}

function formatTime(isoStr: string | null | undefined): string {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

const CONFIRMATION_NODE_TYPES = new Set(["confirmation", "confirm", "immediate_confirmation"]);

function isConfirmationNodeType(nodeType: string | null | undefined): boolean {
  return Boolean(nodeType && CONFIRMATION_NODE_TYPES.has(nodeType));
}

function ChannelIcon({ type, className, style }: { type: "push" | "whatsapp" | "sms"; className?: string; style?: React.CSSProperties }) {
  switch (type) {
    case "push": return <Bell className={className} style={style} />;
    case "whatsapp": return <MessageSquare className={className} style={style} />;
    case "sms": return <Smartphone className={className} style={style} />;
  }
}

function StepTooltip({ node, stepKey, accentColor, onClose, anchorRef, onSendMessage, getMessageLinks, manualSendEnabled }: {
  node: FlowNodeInfo | null;
  stepKey: string;
  accentColor: string;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  onSendMessage?: (channel: "whatsapp" | "sms", stepKey: string) => void;
  getMessageLinks?: (stepKey: string) => ManualMessageLinks | null;
  manualSendEnabled?: boolean;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    const tip = ref.current;
    if (!anchor || !tip) return;
    const update = () => {
      const aRect = anchor.getBoundingClientRect();
      const tRect = tip.getBoundingClientRect();
      const gap = 8;
      let top = aRect.top - tRect.height - gap;
      let left = aRect.left + aRect.width / 2 - tRect.width / 2;
      if (top < 4) top = aRect.bottom + gap;
      if (left < 4) left = 4;
      if (left + tRect.width > window.innerWidth - 4) left = window.innerWidth - 4 - tRect.width;
      setPos({ top, left });
    };
    update();
    const raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [anchorRef]);

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target)) {
        onClose();
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [onClose]);

  const renderContent = () => {
    if (stepKey === "appointment") {
      return <p className="text-[11px] font-semibold text-foreground text-center">{t("reminder.appointment", "Appuntamento")}</p>;
    }
    if (stepKey === "confirmation") {
      const channels: { type: "push" | "whatsapp" | "sms"; at: string }[] = [];
      if (node?.push_sent_at) channels.push({ type: "push", at: node.push_sent_at });
      if (node?.whatsapp_sent_at) channels.push({ type: "whatsapp", at: node.whatsapp_sent_at });
      if (node?.sms_sent_at) channels.push({ type: "sms", at: node.sms_sent_at });
      return (
        <>
          <p className="text-[11px] font-semibold text-foreground mb-1">{t("reminder.confirmation", "Conferma")}</p>
          {channels.length > 0 ? (
            <div className="space-y-0.5">
              {channels.map(ch => (
                <div key={ch.type} className="flex items-center gap-1.5">
                  <ChannelIcon type={ch.type} className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{formatTime(ch.at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t("reminder.pending", "In attesa")}
            </p>
          )}
        </>
      );
    }
    const channels: { type: "push" | "whatsapp" | "sms"; at: string }[] = [];
    if (node?.push_sent_at) channels.push({ type: "push", at: node.push_sent_at });
    if (node?.whatsapp_sent_at) channels.push({ type: "whatsapp", at: node.whatsapp_sent_at });
    if (node?.sms_sent_at) channels.push({ type: "sms", at: node.sms_sent_at });
    const isSent = channels.length > 0;
    const acted = node?.client_acted;
    return (
      <>
        <p className="text-[11px] font-semibold text-foreground mb-1">{t("reminder.reminder", "Promemoria")}</p>
        {isSent ? (
          <div className="space-y-0.5">
            {channels.map(ch => (
              <div key={ch.type} className="flex items-center gap-1.5">
                <ChannelIcon type={ch.type} className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{formatTime(ch.at)}</span>
              </div>
            ))}
            {acted !== undefined && (
              <div className="flex items-center gap-1 mt-1 pt-1 border-t border-border">
                {acted ? (
                  <><Check className="w-3 h-3" style={{ color: accentColor }} /><span className="text-[10px]" style={{ color: accentColor }}>{t("reminder.responded", "Risposto")}</span></>
                ) : (
                  <><X className="w-3 h-3 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">{t("reminder.noResponse", "Nessuna risposta")}</span></>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {node?.scheduled_at ? formatTime(node.scheduled_at) : t("reminder.scheduled", "Programmato")}
          </p>
        )}
      </>
    );
  };

  const renderSendButtons = () => {
    const links = getMessageLinks?.(stepKey) ?? null;
    const canSendWhatsApp = Boolean(links?.whatsapp || onSendMessage);
    const canSendSms = Boolean(links?.sms || onSendMessage);

    if (!manualSendEnabled || stepKey === "appointment" || (!canSendWhatsApp && !canSendSms)) return null;

    const handleActionClick = (channel: "whatsapp" | "sms", e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      onSendMessage?.(channel, stepKey);
    };

    return (
      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
        {links?.whatsapp ? (
          <a
            href={links.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
            onPointerDown={(e) => { e.stopPropagation(); }}
            onClick={(e) => handleActionClick("whatsapp", e)}
          >
            <MessageSquare className="w-3 h-3" />
            WhatsApp
          </a>
        ) : canSendWhatsApp ? (
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
            onPointerDown={(e) => { e.stopPropagation(); }}
            onClick={(e) => handleActionClick("whatsapp", e)}
          >
            <MessageSquare className="w-3 h-3" />
            WhatsApp
          </button>
        ) : null}

        {links?.sms ? (
          <a
            href={links.sms}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
            onPointerDown={(e) => { e.stopPropagation(); }}
            onClick={(e) => handleActionClick("sms", e)}
          >
            <Smartphone className="w-3 h-3" />
            SMS
          </a>
        ) : canSendSms ? (
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
            onPointerDown={(e) => { e.stopPropagation(); }}
            onClick={(e) => handleActionClick("sms", e)}
          >
            <Smartphone className="w-3 h-3" />
            SMS
          </button>
        ) : null}
      </div>
    );
  };

  return createPortal(
    <div
      ref={ref}
      data-reminder-tooltip="true"
      className="fixed z-[99999] bg-popover border border-border rounded-lg shadow-lg px-3 py-2 min-w-[120px] animate-in fade-in-0 zoom-in-95"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{
        top: pos ? pos.top : -9999,
        left: pos ? pos.left : -9999,
        visibility: pos ? "visible" : "hidden",
      }}
    >
      {renderContent()}
      {renderSendButtons()}
    </div>,
    document.body
  );
}

export function ReminderTimeline({ flowModel, hoursUntil, operatorColor, confirmationSent = false, confirmationReady = false, flowNodes = [], createdHoursBeforeAppt, onSendMessage, manualSendEnabled = false }: Props) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const dotRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const steps = useMemo<FlowStep[]>(() => {
    if (!flowModel?.flow_config) return [];
    const config = flowModel.flow_config;
    const result: FlowStep[] = [];

    if (config.send_confirmation !== false) {
      result.push({
        key: "confirmation",
        label: "C",
        subLabel: "",
        hoursBeforeAppt: Infinity,
      });
    }

    const cases = config.cases || {};
    let caseConfig: any = null;
    for (const [key, cfg] of Object.entries(cases) as [string, any][]) {
      if (key === "all") { caseConfig = cfg; break; }
      const minH = cfg.min_hours ?? 0;
      const maxH = cfg.max_hours ?? Infinity;
      if (hoursUntil >= minH && hoursUntil < maxH) { caseConfig = cfg; break; }
    }

    if (caseConfig?.nodes) {
      for (const node of caseConfig.nodes) {
        if (node.is_admin || node.node_type === "admin_escalation" || node.node_type === "mid_treatment_link") continue;
        if (node.only_if_confirmed || node.only_if_no_response) continue;

        let offsetH = 0;
        if (node.timing === "day_before_table" || node.timing === "day_before_same_hour") {
          offsetH = 24;
        } else if (node.timing === "fixed_offset" && node.offset_hours) {
          offsetH = node.offset_hours;
        } else if (node.timing === "offset_table") {
          offsetH = 2;
        }

        if (offsetH > hoursUntil) continue;

        result.push({
          key: `notif_${offsetH}_${result.length}`,
          label: "P",
          subLabel: `${offsetH}h`,
          hoursBeforeAppt: offsetH,
        });
      }
    }

    const confirmStep = result.find(s => s.key === "confirmation");
    const reminderSteps = result.filter(s => s.key !== "confirmation").sort((a, b) => b.hoursBeforeAppt - a.hoursBeforeAppt);

    const finalSteps: FlowStep[] = [];
    if (confirmStep) {
      const farthestReminder = reminderSteps.length > 0 ? reminderSteps[0].hoursBeforeAppt : 0;
      // Position C exactly at the real creation offset; only keep it before the first reminder.
      const createdOffset = createdHoursBeforeAppt != null ? createdHoursBeforeAppt : hoursUntil;
      const minOffsetBeforeReminder = reminderSteps.length > 0
        ? farthestReminder + 0.01
        : 0;
      finalSteps.push({
        ...confirmStep,
        hoursBeforeAppt: Math.max(minOffsetBeforeReminder, createdOffset),
      });
    }
    finalSteps.push(...reminderSteps);
    finalSteps.push({
      key: "appointment",
      label: "A",
      hoursBeforeAppt: 0,
    });

    return finalSteps;
  }, [flowModel, hoursUntil, createdHoursBeforeAppt]);

  // Match flow nodes to steps (best-effort by index)
  const nodeForStep = useMemo(() => {
    const map: Record<string, FlowNodeInfo | null> = {};
    const confirmNode = flowNodes.find((n) => isConfirmationNodeType(n.node_type));
    const reminderNodes = flowNodes.filter(
      (n) => !isConfirmationNodeType(n.node_type) && !n.only_if_confirmed && !n.only_if_no_response
    );

    let ri = 0;
    for (const step of steps) {
      if (step.key === "confirmation") {
        map[step.key] = confirmNode || null;
      } else if (step.key === "appointment") {
        map[step.key] = null;
      } else {
        map[step.key] = reminderNodes[ri] || null;
        ri++;
      }
    }
    return map;
  }, [steps, flowNodes]);

  if (steps.length <= 1) return null;

  const accentColor = operatorColor || "hsl(var(--primary))";

  const hasNodeSent = (node: FlowNodeInfo | null | undefined) => {
    return Boolean(
      node?.push_sent_at ||
      node?.whatsapp_sent_at ||
      node?.sms_sent_at ||
      node?.status === "completed" ||
      node?.status === "sent" ||
      node?.status === "done" ||
      node?.status === "skipped" ||
      node?.status === "cancelled"
    );
  };

  const segmentProgress = steps.slice(0, -1).map((step, i) => {
    const nextStep = steps[i + 1];

    // Il tempo passa sempre indipendentemente dallo stato del nodo
    const segStart = step.hoursBeforeAppt;
    const segEnd = nextStep.hoursBeforeAppt;
    const segSpan = segStart - segEnd;
    if (segSpan <= 0) return hoursUntil <= segEnd ? 1 : 0;
    const clampedHoursUntil = Math.max(segEnd, Math.min(segStart, hoursUntil));
    const elapsed = segStart - clampedHoursUntil;
    return Math.max(0, Math.min(1, elapsed / segSpan));
  });

  // True when at least one channel confirmed actual delivery to the recipient
  const hasNodeDelivered = (node: FlowNodeInfo | null | undefined) => {
    return Boolean(
      node?.sms_delivered_at ||
      node?.whatsapp_delivered_at ||
      // Push delivery is confirmed at send time (pushDelivered flag sets push_sent_at only on success)
      node?.push_sent_at
    );
  };

  // Colored border:
  // C → border when phone is entered (confirmationReady) or message sent
  // P → border when client has confirmed (client_acted)
  // A → border when appointment time reached
  const isStepSent = (idx: number) => {
    const step = steps[idx];
    const node = nodeForStep[step.key];
    if (step.key === "appointment") return hoursUntil <= 0;
    if (step.key === "confirmation") return confirmationReady || confirmationSent || hasNodeSent(node);
    // P: colored border only if client acted (confirmed)
    return Boolean(node?.client_acted);
  };

  // Filled solid:
  // C → filled only when message was actually DELIVERED (not just sent/queued)
  // A → filled when appointment time reached
  // P → filled only if client acted (confirmed)
  const isStepFilled = (idx: number) => {
    const step = steps[idx];
    const node = nodeForStep[step.key];
    if (step.key === "appointment") return hoursUntil <= 0;
    if (step.key === "confirmation") return hasNodeDelivered(node);
    return Boolean(node?.client_acted);
  };


  const handleDotClick = (stepKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveTooltip(prev => prev === stepKey ? null : stepKey);
  };

  return (
    <div className="pt-1 pb-5 px-2">
      <div className="flex items-center relative">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const sent = isStepSent(idx);
          const filled = isStepFilled(idx);

          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0 last:flex-none">
              <div className="relative flex flex-col items-center z-10">
                <div
                  ref={(el) => { dotRefs.current[step.key] = el; }}
                  className={cn(
                    "rounded-full border-2 transition-all duration-300 shrink-0 cursor-pointer",
                    isLast ? "w-3 h-3" : "w-2.5 h-2.5"
                  )}
                  style={{
                    borderColor: sent ? accentColor : "hsl(var(--border))",
                    backgroundColor: filled ? accentColor : "transparent",
                  }}
                   onClick={(e) => handleDotClick(step.key, e)}
                />
                <div className="absolute top-full mt-1 flex flex-col items-center w-max">
                  <div className="flex items-baseline gap-[2px]">
                    <span
                      className="text-[10px] font-bold leading-tight transition-colors duration-200"
                      style={{ color: sent ? accentColor : "hsl(var(--muted-foreground) / 0.45)" }}
                    >
                      {step.label}
                    </span>
                    {step.subLabel && (
                      <span
                        className="text-[9px] font-medium leading-tight transition-colors duration-200"
                        style={{ color: sent ? `${accentColor}88` : "hsl(var(--muted-foreground) / 0.3)" }}
                      >
                        {step.subLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tooltip via portal */}
                {activeTooltip === step.key && (
                  <StepTooltip
                    node={nodeForStep[step.key]}
                    stepKey={step.key}
                    accentColor={accentColor}
                    onClose={() => setActiveTooltip(null)}
                    anchorRef={{ current: dotRefs.current[step.key] }}
                    onSendMessage={onSendMessage}
                    manualSendEnabled={manualSendEnabled}
                  />
                )}
              </div>
              {!isLast && (
                <div className="flex-1 h-[2px] relative mx-1 rounded-full overflow-hidden" style={{ backgroundColor: "hsl(var(--border) / 0.4)" }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min(100, segmentProgress[idx] * 100)}%`,
                      backgroundColor: accentColor,
                      opacity: segmentProgress[idx] > 0 ? 0.8 : 0,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
