import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, MessageSquare, Smartphone, ChevronLeft, Calendar, X, Clock, User, ArrowLeft, Check, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SAMPLE_VALUES: Record<string, string> = {
  "{{salon_name}}": "BeautyPro Studio Milano",
  "{{short_data}}": "Gio, 19 Mar",
  "{{data}}": "giovedì 19 marzo",
  "{{ora}}": "12:00",
  "{{link}}": "https://glow-up.it/app/abc123",
  "{{service_name}}": "Epilazione Laser Zona Grande",
  "{{client_name}}": "Pinuccia",
};

function resolveTemplate(text: string): string {
  let resolved = text;
  for (const [key, val] of Object.entries(SAMPLE_VALUES)) {
    resolved = resolved.split(key).join(val);
  }
  resolved = resolved.replace(/\\n/g, "\n");
  return resolved;
}

/* ─── Back button strip (shared) ─── */
function SideBackStrip({ onBack, color }: { onBack: () => void; color: string }) {
  return (
    <motion.div
      className="absolute left-0 top-1/2 -translate-y-1/2 z-30"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.3 }}
    >
      <button onClick={onBack} className="flex items-center pl-0.5 pr-1.5 py-3 rounded-r-lg" style={{ background: color }}>
        <ChevronLeft className="h-4 w-4 text-white" />
      </button>
    </motion.div>
  );
}

/* ─── GlowUp App Screen (Push) ─── */
function GlowUpAppScreen({ onBack }: { onBack: () => void }) {
  const serviceName = SAMPLE_VALUES["{{service_name}}"];
  const date = SAMPLE_VALUES["{{data}}"];
  const time = SAMPLE_VALUES["{{ora}}"];

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="absolute inset-0 z-20 flex flex-col"
      style={{ background: "hsl(350 30% 97%)" }}
    >
      <div className="flex items-center gap-1.5 px-2 py-1.5 shrink-0"
        style={{ background: "linear-gradient(135deg, hsl(346 60% 58%), hsl(346 50% 52%))" }}
      >
        <button onClick={onBack}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/25 hover:bg-white/35 active:bg-white/45 transition-colors shrink-0"
        >
          <ArrowLeft className="h-3 w-3 text-white" />
          <span className="text-[9px] font-semibold text-white">Indietro</span>
        </button>
        <div className="flex items-center gap-1 ml-0.5 min-w-0">
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-[8px]">✨</span>
          </div>
          <p className="text-[9px] font-bold text-white leading-tight truncate">BeautyPro Studio...</p>
        </div>
      </div>

      <SideBackStrip onBack={onBack} color="hsl(346 60% 55% / 0.8)" />

      <div className="flex-1 overflow-y-auto px-2.5 py-2">
        <p className="text-[11px] font-bold text-gray-800 mb-2">Prossimi appuntamenti</p>
        <div className="bg-white rounded-xl border border-gray-200 p-2.5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-gray-900 leading-tight">{serviceName}</p>
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="h-2.5 w-2.5 text-gray-400" />
                <span className="text-[9px] text-gray-600">{date} 2026</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="h-2.5 w-2.5 text-gray-400" />
                <span className="text-[9px] text-gray-600">{time} - 12:40</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <User className="h-2.5 w-2.5 text-gray-400" />
                <span className="text-[9px] text-gray-600">Giulia Bianchi</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: "hsl(346 60% 92%)", color: "hsl(346 60% 45%)" }}>Confermato</span>
              <button className="flex items-center gap-0.5 text-[9px] font-semibold cursor-default"
                style={{ color: "hsl(346 60% 50%)" }} onClick={e => e.stopPropagation()}>
                <Calendar className="h-2.5 w-2.5" /> Sposta
              </button>
              <button className="flex items-center gap-0.5 text-[9px] font-semibold cursor-default"
                style={{ color: "hsl(346 60% 50%)" }} onClick={e => e.stopPropagation()}>
                <X className="h-2.5 w-2.5" /> Annulla
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-around py-1.5 border-t border-gray-200 bg-white">
        {[
          { icon: "📋", label: "Prenota" },
          { icon: "📅", label: "Appuntamenti", active: true },
          { icon: "💬", label: "Contatta" },
          { icon: "⭐", label: "Fedeltà" },
          { icon: "•••", label: "Altro" },
        ].map(item => (
          <div key={item.label} className="flex flex-col items-center gap-0.5">
            <span className="text-[9px]">{item.icon}</span>
            <span className="text-[7px] font-medium" style={{ color: item.active ? "hsl(346 60% 50%)" : "hsl(0 0% 60%)" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── SMS App Screen (iOS Messages style) ─── */
function SmsAppScreen({ onBack, resolved }: { onBack: () => void; resolved: string }) {
  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="absolute inset-0 z-20 flex flex-col"
      style={{ background: "hsl(0 0% 96%)" }}
    >
      {/* SMS app header */}
      <div className="flex items-center gap-1.5 px-2 py-2 shrink-0 border-b border-gray-200 bg-white">
        <button onClick={onBack}
          className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors shrink-0"
          style={{ color: "hsl(210 100% 50%)" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="text-[9px] font-semibold">Indietro</span>
        </button>
        <div className="flex-1 flex flex-col items-center min-w-0">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "hsl(210 15% 88%)" }}>
            <span className="text-[10px] font-bold" style={{ color: "hsl(210 15% 50%)" }}>B</span>
          </div>
          <p className="text-[9px] font-semibold text-gray-800 truncate">BeautyPro Studio</p>
        </div>
        <div className="w-10" />
      </div>

      <SideBackStrip onBack={onBack} color="hsl(210 100% 50% / 0.7)" />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col justify-end">
        {/* Received SMS bubble */}
        <div className="max-w-[85%] self-start">
          <div className="rounded-2xl rounded-bl-sm px-3 py-2" style={{ background: "hsl(0 0% 90%)" }}>
            <RenderTextWithLinks text={resolved} className="text-[10px] text-gray-900 whitespace-pre-wrap leading-relaxed" />
          </div>
          <p className="text-[8px] text-gray-400 mt-0.5 ml-1">19:16</p>
        </div>
      </div>

      {/* Input bar */}
      <div className="shrink-0 flex items-center gap-2 px-2 py-1.5 border-t border-gray-200 bg-white">
        <div className="flex-1 rounded-full border border-gray-300 px-3 py-1.5">
          <span className="text-[9px] text-gray-400">Messaggio</span>
        </div>
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "hsl(210 100% 50%)" }}>
          <ArrowLeft className="h-3 w-3 text-white rotate-[135deg]" />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── WhatsApp App Screen ─── */
function WhatsAppAppScreen({ onBack, resolved }: { onBack: () => void; resolved: string }) {
  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="absolute inset-0 z-20 flex flex-col"
      style={{ background: "hsl(30 25% 90%)" }}
    >
      {/* WA header */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 shrink-0" style={{ background: "hsl(142 50% 30%)" }}>
        <button onClick={onBack}
          className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-white" />
          <span className="text-[9px] font-semibold text-white">Indietro</span>
        </button>
        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "hsl(142 30% 50%)" }}>
          <span className="text-[9px] font-bold text-white">B</span>
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-bold text-white truncate">BeautyPro Studio...</p>
          <p className="text-[7px] text-white/60">online</p>
        </div>
      </div>

      <SideBackStrip onBack={onBack} color="hsl(142 50% 30% / 0.8)" />

      {/* Chat area with WA doodle bg */}
      <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col justify-end"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M30 30c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10zM10 10c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10S10 15.5 10 10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
      >
        {/* Received WA bubble */}
        <div className="max-w-[85%] self-start">
          <div className="rounded-xl rounded-bl-sm px-3 py-2 shadow-sm" style={{ background: "white" }}>
            <p className="text-[9px] font-bold mb-0.5" style={{ color: "hsl(142 60% 35%)" }}>BeautyPro Studio Milano</p>
            <RenderTextWithLinks text={resolved} className="text-[10px] text-gray-900 whitespace-pre-wrap leading-relaxed" />
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-[8px] text-gray-400">19:16</span>
            </div>
          </div>
        </div>
      </div>

      {/* WA input bar */}
      <div className="shrink-0 flex items-center gap-1.5 px-2 py-1.5 bg-white/80 border-t border-gray-200">
        <div className="flex-1 rounded-full bg-white border border-gray-200 px-3 py-1.5 flex items-center">
          <span className="text-[9px] text-gray-400">Messaggio</span>
        </div>
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "hsl(142 50% 40%)" }}>
          <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Shared Phone Frame ─── */
function PhoneFrame({ children, hint }: { children: React.ReactNode; hint: string }) {
  return (
    <div className="space-y-1.5">
      <div
        className="relative rounded-[20px] overflow-hidden mx-auto border-2 border-white/10 w-full max-w-[320px]"
        style={{ aspectRatio: "320 / 340", background: "linear-gradient(160deg, hsl(220 15% 18%), hsl(220 12% 10%))" }}
      >
        {/* Status bar */}
        <div className="relative z-30 flex items-center justify-end px-4 pt-1.5 pb-0.5">
          <div className="flex items-center gap-1.5">
            <svg className="h-2.5 w-3" viewBox="0 0 16 12" fill="none">
              <rect x="0" y="8" width="3" height="4" rx="0.5" fill="white" fillOpacity="0.5" />
              <rect x="4.5" y="5" width="3" height="7" rx="0.5" fill="white" fillOpacity="0.5" />
              <rect x="9" y="2" width="3" height="10" rx="0.5" fill="white" fillOpacity="0.5" />
              <rect x="13" y="0" width="3" height="12" rx="0.5" fill="white" fillOpacity="0.3" />
            </svg>
            <div className="w-4 h-2.5 border border-white/40 rounded-[2px] relative">
              <div className="absolute inset-[1px] rounded-[1px]" style={{ width: "45%", background: "hsl(120 60% 50%)" }} />
            </div>
          </div>
        </div>
        {children}
      </div>
      <p className="text-[9px] text-muted-foreground text-center italic">{hint}</p>
    </div>
  );
}

/* ─── Render text with hyperlinks styled ─── */
function RenderTextWithLinks({ text, className }: { text: string; className?: string }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <p className={className}>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <span key={i} className="underline decoration-1 underline-offset-2 cursor-default" style={{ color: "hsl(210 100% 70%)" }}>{part}</span>
        ) : part
      )}
    </p>
  );
}

/* ─── Notification Banner ─── */
function NotifBanner({
  resolved, expanded, onToggle, onTap, channelBg, channelIcon, channelIconBig, appName,
}: {
  resolved: string; expanded: boolean; onToggle: () => void; onTap: () => void;
  channelBg: { collapsed: string; expanded: string }; channelIcon: React.ReactNode; channelIconBig: React.ReactNode; appName: string;
}) {
  const lines = resolved.split("\n").filter(Boolean);
  const title = lines[0] || "Notifica";
  const bodyLines = lines.slice(1);
  const bodyShort = bodyLines.slice(0, 2).join("\n");

  return (
    <motion.div layout className="w-full select-none">
      <div className="rounded-2xl overflow-hidden transition-colors"
        style={{ background: expanded ? channelBg.expanded : channelBg.collapsed, backdropFilter: "blur(20px)" }}
      >
        <div className="flex items-center gap-1.5 px-3 pt-2 pb-0.5 cursor-pointer" onClick={onToggle}>
          {channelIcon}
          <span className="text-[10px] text-white/60 font-medium">{appName}</span>
          <span className="text-[10px] text-white/50 ml-auto">Adesso</span>
          <motion.svg animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}
            className="h-3 w-3 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </motion.svg>
        </div>

        <div className="px-3 pb-2.5 flex gap-2 cursor-pointer group" onClick={onTap}>
          {channelIconBig}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-white leading-tight">{title}</p>
            <AnimatePresence mode="wait">
              {!expanded ? (
                <motion.p key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[10px] text-white/70 leading-snug mt-0.5 line-clamp-2">{bodyShort}</motion.p>
              ) : (
                <motion.div key="f" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                  <RenderTextWithLinks text={bodyLines.join("\n")} className="text-[10px] text-white/70 whitespace-pre-wrap leading-snug mt-0.5" />
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="text-[10px] mt-1.5 font-semibold flex items-center gap-1" style={{ color: "hsl(346 70% 75%)" }}>
                    <span className="inline-block animate-pulse">👆</span>Tocca per aprire
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Interactive Preview ─── */
type Phase = "arriving" | "notification" | "app";

function InteractivePreview({
  text, label, icon: Icon, channelBg, channelIcon, channelIconBig, appName,
  AppScreen,
}: {
  text: string; label: string; icon: React.ElementType;
  channelBg: { collapsed: string; expanded: string }; channelIcon: React.ReactNode; channelIconBig: React.ReactNode; appName: string;
  AppScreen: React.ComponentType<{ onBack: () => void; resolved: string }>;
}) {
  const resolved = resolveTemplate(text);
  const [phase, setPhase] = useState<Phase>("arriving");
  const [expanded, setExpanded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const resetAnimation = useCallback(() => {
    setPhase("arriving");
    setExpanded(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPhase("notification");
      setTimeout(() => setExpanded(true), 1200);
    }, 400);
  }, []);

  useEffect(() => {
    resetAnimation();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [text, resetAnimation]);

  const hint = phase === "app"
    ? "Premi ← Indietro per tornare"
    : expanded ? "Tocca la notifica per aprire" : "La notifica si espande...";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        <Icon className="h-3 w-3" />
        {label} — Anteprima interattiva
      </div>
      <PhoneFrame hint={hint}>
        <AnimatePresence>
          {phase !== "app" && (
            <motion.div key="n" className="absolute inset-0 z-10 pt-6" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
              <p className="text-[10px] font-medium text-white/50 px-4 mb-1.5 mt-0.5">Notifiche</p>
              <div className="px-2">
                <AnimatePresence>
                  {phase === "notification" && (
                    <motion.div initial={{ y: -80, opacity: 0, scale: 0.92 }} animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: -80, opacity: 0, scale: 0.92 }} transition={{ type: "spring", damping: 22, stiffness: 260, mass: 0.8 }}>
                      <NotifBanner resolved={resolved} expanded={expanded}
                        onToggle={() => setExpanded(e => !e)} onTap={() => setPhase("app")}
                        channelBg={channelBg} channelIcon={channelIcon} channelIconBig={channelIconBig} appName={appName} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {phase === "app" && (
            <AppScreen onBack={() => { setPhase("notification"); setExpanded(true); }} resolved={resolved} />
          )}
        </AnimatePresence>
      </PhoneFrame>
    </div>
  );
}

/* ─── Channel configs ─── */
const PUSH_BG = { collapsed: "hsl(0 0% 20% / 0.85)", expanded: "hsl(346 25% 28% / 0.92)" };
const SMS_BG = { collapsed: "hsl(0 0% 20% / 0.85)", expanded: "hsl(210 20% 25% / 0.92)" };
const WA_BG = { collapsed: "hsl(0 0% 20% / 0.85)", expanded: "hsl(142 30% 22% / 0.92)" };

/* Push notification icon */
function PushNotifIcon() {
  return <div className="w-4 h-4 rounded-md bg-primary flex items-center justify-center"><Bell className="h-2.5 w-2.5 text-primary-foreground" /></div>;
}
function PushNotifIconBig() {
  return <div className="w-9 h-9 rounded-xl bg-primary/90 flex items-center justify-center shrink-0 mt-0.5 group-active:scale-95 transition-transform"><Bell className="h-4 w-4 text-primary-foreground" /></div>;
}

function SmsNotifIcon() {
  return <div className="w-4 h-4 rounded-md flex items-center justify-center" style={{ background: "hsl(210 100% 50%)" }}><MessageSquare className="h-2.5 w-2.5 text-white" /></div>;
}
function SmsNotifIconBig() {
  return <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-active:scale-95 transition-transform" style={{ background: "hsl(210 100% 50%)" }}><MessageSquare className="h-4 w-4 text-white" /></div>;
}

const WA_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fillRule="evenodd" />
  </svg>
);
function WaNotifIcon() {
  return <div className="w-4 h-4 rounded-md flex items-center justify-center" style={{ background: "hsl(142 60% 40%)" }}><span className="h-2.5 w-2.5 text-white">{WA_SVG}</span></div>;
}
function WaNotifIconBig() {
  return <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-active:scale-95 transition-transform" style={{ background: "hsl(142 60% 40%)" }}><span className="h-4 w-4 text-white">{WA_SVG}</span></div>;
}

/* ─── Export ─── */
interface NotificationPreviewProps {
  smsText?: string;
  pushText?: string;
  whatsappText?: string;
}

export default function NotificationPreview({ smsText, pushText, whatsappText }: NotificationPreviewProps) {
  if (!smsText && !pushText && !whatsappText) return null;

  return (
    <div className="flex flex-col justify-center p-4 rounded-xl border bg-muted/20">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">Anteprima</p>

      {pushText && (
        <InteractivePreview text={pushText} label="Push" icon={Bell}
          channelBg={PUSH_BG} channelIcon={<PushNotifIcon />} channelIconBig={<PushNotifIconBig />} appName="Glow Up • glow-up.it"
          AppScreen={({ onBack }) => <GlowUpAppScreen onBack={onBack} />} />
      )}

      {smsText && (
        <InteractivePreview text={smsText} label="SMS" icon={Smartphone}
          channelBg={SMS_BG} channelIcon={<SmsNotifIcon />} channelIconBig={<SmsNotifIconBig />} appName="Messaggi"
          AppScreen={({ onBack, resolved }) => <SmsAppScreen onBack={onBack} resolved={resolved} />} />
      )}

      {whatsappText && (
        <InteractivePreview text={whatsappText} label="WhatsApp" icon={MessageSquare}
          channelBg={WA_BG} channelIcon={<WaNotifIcon />} channelIconBig={<WaNotifIconBig />} appName="WhatsApp"
          AppScreen={({ onBack, resolved }) => <WhatsAppAppScreen onBack={onBack} resolved={resolved} />} />
      )}
    </div>
  );
}
