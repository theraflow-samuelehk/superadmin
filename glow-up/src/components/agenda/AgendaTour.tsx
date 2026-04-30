import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface TourStep {
  title: string;
  desc: string;
  selector?: string;
  centered?: boolean;
}

const STEPS: TourStep[] = [
  {
    title: "Ho creato 3 operatrici di esempio",
    desc: "Puoi cambiare i nomi, eliminarle o aggiungerne altre dalla sezione Operatrici nel menu.",
    selector: "[data-tour='operators-header']",
  },
  {
    title: "Personalizza i tuoi servizi",
    desc: "Nella sezione Servizi trovi dei trattamenti di esempio già pronti. Modificali, eliminali o creane di nuovi con durata e prezzo.",
    centered: true,
  },
  {
    title: "Crea il tuo primo appuntamento",
    desc: "Tocca una cella vuota dell'agenda nel giorno e nell'orario che preferisci: si aprirà subito la creazione dell'appuntamento.",
    centered: true,
  },
];

export interface AgendaTourHandle {
  start: () => void;
}

interface AgendaTourProps {
  autoStart?: boolean;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function getCombinedRect(selector: string): DOMRect | null {
  const els = Array.from(document.querySelectorAll(selector));
  const rects = els.map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
  if (!rects.length) return null;
  const l = Math.min(...rects.map((r) => r.left));
  const t = Math.min(...rects.map((r) => r.top));
  const ri = Math.max(...rects.map((r) => r.right));
  const b = Math.max(...rects.map((r) => r.bottom));
  return new DOMRect(l, t, ri - l, b - t);
}

const AgendaTour = forwardRef<AgendaTourHandle, AgendaTourProps>(function AgendaTour({ autoStart = true }, ref) {
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const seenKey = user?.id ? `agenda_tour_seen_${user.id}` : null;
  const pendingKey = user?.id ? `agenda_tour_pending_${user.id}` : null;

  const startTour = useCallback(() => {
    setStep(0);
    setActive(true);
  }, []);

  const scheduleTourStart = useCallback(() => {
    if (!seenKey || localStorage.getItem(seenKey) === "1") return;

    return window.setTimeout(() => {
      localStorage.setItem(seenKey, "1");
      if (pendingKey) localStorage.removeItem(pendingKey);
      startTour();
    }, 600);
  }, [pendingKey, seenKey, startTour]);

  useImperativeHandle(ref, () => ({ start: startTour }), [startTour]);

  const cur = STEPS[step];

  const measure = useCallback(() => {
    if (!active || !cur?.selector) {
      setRect(null);
      return;
    }
    setRect(getCombinedRect(cur.selector));
  }, [active, cur]);

  useEffect(() => {
    if (!autoStart || !seenKey || !user) return;
    if (localStorage.getItem(seenKey) === "1") return;

    const checkAndStart = async () => {
      if (pendingKey && localStorage.getItem(pendingKey) === "1") {
        return scheduleTourStart();
      }

      const { data } = await supabase
        .from("profiles")
        .select("onboarding_phase")
        .eq("user_id", user.id)
        .single();
      const phase = (data as any)?.onboarding_phase ?? 0;
      if (phase < 7) return;

      return scheduleTourStart();
    };

    let timeout: number | undefined;
    checkAndStart().then((t) => {
      timeout = t;
    });
    return () => {
      if (timeout) window.clearTimeout(timeout);
    };
  }, [autoStart, pendingKey, scheduleTourStart, seenKey, user]);

  useEffect(() => {
    if (!seenKey || !user) return;

    let timeout: number | undefined;

    const handleDebugReset = () => {
      localStorage.removeItem(seenKey);
      if (pendingKey) localStorage.removeItem(pendingKey);
    };

    const handleOnboardingCompleted = (event: Event) => {
      const detailUserId = (event as CustomEvent<{ userId?: string }>).detail?.userId;
      if (detailUserId && detailUserId !== user.id) return;
      timeout = scheduleTourStart();
    };

    window.addEventListener("glowup:onboarding-debug-reset", handleDebugReset);
    window.addEventListener("glowup:onboarding-completed", handleOnboardingCompleted as EventListener);
    return () => {
      window.removeEventListener("glowup:onboarding-debug-reset", handleDebugReset);
      window.removeEventListener("glowup:onboarding-completed", handleOnboardingCompleted as EventListener);
      if (timeout) window.clearTimeout(timeout);
    };
  }, [pendingKey, scheduleTourStart, seenKey, user]);

  useEffect(() => {
    measure();
    if (!active || !cur?.selector) return;
    const h = () => measure();
    window.addEventListener("resize", h);
    window.addEventListener("scroll", h, true);
    return () => {
      window.removeEventListener("resize", h);
      window.removeEventListener("scroll", h, true);
    };
  }, [active, cur, measure]);

  const close = useCallback(() => {
    setActive(false);
    setStep(0);
  }, []);

  const next = () => {
    step < STEPS.length - 1 ? setStep((s) => s + 1) : close();
  };

  const getStyle = (): CSSProperties => {
    const base: CSSProperties = { position: "fixed", zIndex: 10002 };
    if (typeof window === "undefined") return base;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 12;

    if (cur.centered || !rect) {
      const w = Math.min(vw - pad * 2, 340);
      return { ...base, left: (vw - w) / 2, top: vh * 0.3, width: w };
    }

    const gap = 8;
    const w = Math.min(vw - pad * 2, 340);
    const left = clamp(rect.left + rect.width / 2 - w / 2, pad, vw - w - pad);
    return { ...base, left, top: clamp(rect.bottom + gap, pad, vh - 180), width: w };
  };

  if (!active) return null;
  const isLast = step === STEPS.length - 1;

  return createPortal(
    <AnimatePresence>
      <motion.div key="agenda-tour" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="fixed inset-0 z-[10000]">
        <div className="absolute inset-0 bg-foreground/60" onClick={close} />

        {!cur.centered && rect && (
          <motion.div
            key={`spot-${step}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[10001] pointer-events-none rounded-2xl"
            style={{
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
              boxShadow: "0 0 0 9999px hsl(var(--foreground) / 0.60), 0 0 0 3px hsl(var(--background)), 0 0 24px 8px hsl(var(--primary) / 0.35)",
            }}
          />
        )}

        <motion.div
          key={`card-${step}`}
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.97 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={getStyle()}
          className="rounded-2xl border border-border/50 bg-card p-4 shadow-2xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                {step + 1}/{STEPS.length}
              </span>
            </div>
            <button onClick={close} className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>

          <h4 className="mb-1 text-[15px] font-semibold leading-snug text-foreground">{cur.title}</h4>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{cur.desc}</p>

          <div className="flex justify-end">
            <Button size="sm" className="h-8 rounded-full px-4 text-xs font-semibold" onClick={next}>
              {isLast ? "Inizia" : `Avanti ${step + 1}/${STEPS.length}`}
              {!isLast && <ChevronRight className="ml-1 h-3.5 w-3.5" />}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
});

export default AgendaTour;
