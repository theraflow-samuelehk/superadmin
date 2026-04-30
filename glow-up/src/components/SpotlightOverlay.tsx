import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useSpotlight } from "@/hooks/useSpotlight";
import { findElement } from "@/lib/elementFinder";
import { FeatherMascot } from "@/components/FeatherMascot";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const PAD = 10;
const MAX_LOCATE_RETRIES = 30;
const RETRY_DELAY_MS = 200;
const TOOLTIP_WIDTH = 240;
const TOOLTIP_GAP = 8;
const TOOLTIP_ESTIMATED_HEIGHT = 176;

type TooltipSide = "right" | "left" | "bottom" | "top";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function SpotlightOverlay() {
  const { t } = useTranslation();
  const {
    steps,
    currentStep,
    nextStep,
    dismiss,
    requestDismiss,
    confirmDismiss,
    cancelDismiss,
    showDismissConfirm,
    targetId,
  } = useSpotlight();

  const [rect, setRect] = useState<DOMRect | null>(null);
  const [tooltipSide, setTooltipSide] = useState<TooltipSide>("right");
  const [guideComplete, setGuideComplete] = useState(false);
  const clickListenerRef = useRef<(() => void) | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const retryCountRef = useRef(0);

  const isGuide = steps.length > 0;
  const active = isGuide || !!targetId || guideComplete;
  const step = isGuide ? steps[currentStep] : null;
  const stepMode = step?.mode || "click";
  const query = step?.query || (targetId ? `id:${targetId}` : null);

  const clearClickListener = useCallback(() => {
    if (clickListenerRef.current) {
      clickListenerRef.current();
      clickListenerRef.current = null;
    }
  }, []);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = undefined;
    }
  }, []);

  const handleGuideComplete = useCallback(() => {
    clearClickListener();
    setGuideComplete(true);
    setTimeout(() => {
      setGuideComplete(false);
      dismiss();
    }, 1400);
  }, [clearClickListener, dismiss]);

  const handleNextStep = useCallback(() => {
    clearClickListener();
    const isLast = currentStep >= steps.length - 1;
    if (isLast) {
      handleGuideComplete();
      return;
    }
    nextStep();
  }, [clearClickListener, currentStep, handleGuideComplete, nextStep, steps.length]);

  const locate = useCallback(() => {
    if (!query) {
      setRect(null);
      return;
    }

    const el = findElement(query);
    if (!el) {
      setRect(null);
      return;
    }

    clearRetryTimer();
    retryCountRef.current = 0;

    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    window.setTimeout(() => {
      const r = el.getBoundingClientRect();
      setRect(r);

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mascotSize = vw < 640 ? 36 : 48;
      const tooltipW = Math.min(TOOLTIP_WIDTH, vw - 16);
      const tooltipH = Math.min(TOOLTIP_ESTIMATED_HEIGHT, vh - 16);

      const spaceRight = vw - (r.right + PAD + 4 + mascotSize + TOOLTIP_GAP + tooltipW);
      const spaceLeft = r.left - (PAD + 4 + mascotSize + TOOLTIP_GAP + tooltipW);
      const spaceBottom = vh - (r.bottom + PAD + 4 + mascotSize + TOOLTIP_GAP + tooltipH);
      const spaceTop = r.top - (PAD + 4 + mascotSize + TOOLTIP_GAP + tooltipH);

      if (vw < 640) {
        setTooltipSide(spaceBottom >= spaceTop ? "bottom" : "top");
      } else if (spaceRight >= 0) {
        setTooltipSide("right");
      } else if (spaceLeft >= 0) {
        setTooltipSide("left");
      } else if (spaceBottom >= spaceTop) {
        setTooltipSide("bottom");
      } else {
        setTooltipSide("top");
      }

      clearClickListener();
      if (isGuide && stepMode === "click") {
        const handler = () => handleNextStep();
        el.addEventListener("click", handler, { once: true });
        clickListenerRef.current = () => el.removeEventListener("click", handler);
      }
    }, 260);
  }, [clearClickListener, clearRetryTimer, handleNextStep, isGuide, query, stepMode]);

  useEffect(() => {
    locate();
  }, [locate]);

  useEffect(() => {
    if (!isGuide || !query || rect || guideComplete) return;

    clearRetryTimer();
    retryCountRef.current = 0;

    const retryLocate = () => {
      if (findElement(query)) {
        locate();
        return;
      }

      retryCountRef.current += 1;
      if (retryCountRef.current >= MAX_LOCATE_RETRIES) return;

      retryTimerRef.current = setTimeout(retryLocate, RETRY_DELAY_MS);
    };

    retryTimerRef.current = setTimeout(retryLocate, RETRY_DELAY_MS);
    return clearRetryTimer;
  }, [clearRetryTimer, guideComplete, isGuide, locate, query, rect]);

  useEffect(() => {
    if (!active) return;

    const handler = () => {
      if (!guideComplete) locate();
    };

    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);

    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [active, guideComplete, locate]);

  useEffect(() => {
    if (!targetId || isGuide) return;
    const timeoutId = setTimeout(dismiss, 5000);
    return () => clearTimeout(timeoutId);
  }, [dismiss, isGuide, targetId]);

  useEffect(() => {
    return () => {
      clearClickListener();
      clearRetryTimer();
    };
  }, [clearClickListener, clearRetryTimer]);

  useEffect(() => {
    if (!isGuide || stepMode !== "interact" || !step || !rect) return;

    const verifyTarget = () => {
      const targetStillExists = findElement(step.query);
      if (!targetStillExists) {
        handleNextStep();
        return true;
      }
      return false;
    };

    const timeoutId = setTimeout(verifyTarget, 120);
    const intervalId = setInterval(() => {
      verifyTarget();
    }, 250);
    const observer = new MutationObserver(() => {
      verifyTarget();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      observer.disconnect();
    };
  }, [handleNextStep, isGuide, rect, step, stepMode]);

  if (!active) return null;

  if (guideComplete) {
    return (
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex flex-col items-center gap-3"
        >
          <FeatherMascot size={72} />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl shadow-2xl px-6 py-3"
          >
            <p className="text-base font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {t("spotlight.guideComplete", "Perfetto, hai finito! 🎉")}
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  if (showDismissConfirm) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center">
        <div className="absolute inset-0 bg-[hsl(var(--foreground)/0.5)]" />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative bg-card border border-border rounded-2xl shadow-2xl p-5 w-[280px] z-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <FeatherMascot size={36} blinking={false} />
            <p className="text-sm font-medium text-foreground leading-snug">
              {t("spotlight.dismissConfirm", "Sei sicuro di voler uscire dalla guida?")}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={cancelDismiss}>
              {t("spotlight.dismissNo", "No, continua")}
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDismiss}>
              {t("spotlight.dismissYes", "Sì, esci")}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const featherSize = vw < 640 ? 36 : 48;
  const viewportPadding = 8;
  const tooltipW = Math.min(TOOLTIP_WIDTH, vw - viewportPadding * 2);
  const tooltipH = Math.min(TOOLTIP_ESTIMATED_HEIGHT, vh - viewportPadding * 2);

  const rawFeatherTarget = rect
    ? (() => {
        switch (tooltipSide) {
          case "right":
            return { x: rect.right + PAD + 4, y: rect.top + rect.height / 2 - featherSize / 2 };
          case "left":
            return { x: rect.left - PAD - featherSize - 4, y: rect.top + rect.height / 2 - featherSize / 2 };
          case "top":
            return { x: rect.left + rect.width / 2 - featherSize / 2, y: rect.top - PAD - featherSize - 4 };
          case "bottom":
          default:
            return { x: rect.left + rect.width / 2 - featherSize / 2, y: rect.bottom + PAD + 4 };
        }
      })()
    : { x: vw / 2 - featherSize / 2, y: vh / 2 - featherSize / 2 };

  const featherTarget = {
    x: clamp(rawFeatherTarget.x, viewportPadding, vw - featherSize - viewportPadding),
    y: clamp(rawFeatherTarget.y, viewportPadding, vh - featherSize - viewportPadding),
  };

  const tooltipPosition = (() => {
    let left: number;
    let top: number;

    switch (tooltipSide) {
      case "right":
        left = featherSize + TOOLTIP_GAP;
        top = -(tooltipH / 2 - featherSize / 2);
        break;
      case "left":
        left = -(tooltipW + TOOLTIP_GAP);
        top = -(tooltipH / 2 - featherSize / 2);
        break;
      case "top":
        left = -(tooltipW / 2 - featherSize / 2);
        top = -(tooltipH + TOOLTIP_GAP);
        break;
      case "bottom":
      default:
        left = -(tooltipW / 2 - featherSize / 2);
        top = featherSize + TOOLTIP_GAP;
        break;
    }

    const absLeft = clamp(featherTarget.x + left, viewportPadding, vw - tooltipW - viewportPadding);
    const absTop = clamp(featherTarget.y + top, viewportPadding, vh - tooltipH - viewportPadding);

    return {
      left: absLeft - featherTarget.x,
      top: absTop - featherTarget.y,
    };
  })();

  return (
    <AnimatePresence>
      <motion.div
        key="spotlight-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] pointer-events-none"
      >
        {rect && (
          <>
            <div
              className="absolute pointer-events-auto bg-[hsl(var(--foreground)/0.55)] transition-all duration-200"
              style={{ top: 0, left: 0, width: "100%", height: Math.max(0, rect.top - PAD) }}
            />
            <div
              className="absolute pointer-events-auto bg-[hsl(var(--foreground)/0.55)] transition-all duration-200"
              style={{
                top: Math.max(0, rect.top - PAD),
                left: 0,
                width: Math.max(0, rect.left - PAD),
                height: rect.height + PAD * 2,
              }}
            />
            <div
              className="absolute pointer-events-auto bg-[hsl(var(--foreground)/0.55)] transition-all duration-200"
              style={{
                top: Math.max(0, rect.top - PAD),
                left: rect.right + PAD,
                width: Math.max(0, window.innerWidth - rect.right - PAD),
                height: rect.height + PAD * 2,
              }}
            />
            <div
              className="absolute pointer-events-auto bg-[hsl(var(--foreground)/0.55)] transition-all duration-200"
              style={{
                top: rect.bottom + PAD,
                left: 0,
                width: "100%",
                height: Math.max(0, window.innerHeight - rect.bottom - PAD),
              }}
            />

            <motion.div
              key={`ring-${currentStep}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute rounded-xl border-[2.5px] border-primary/80 pointer-events-none"
              style={{
                top: rect.top - PAD,
                left: rect.left - PAD,
                width: rect.width + PAD * 2,
                height: rect.height + PAD * 2,
                boxShadow: "0 0 0 2px hsl(var(--primary) / 0.15)",
              }}
            />
          </>
        )}

        {!rect && (
          <div className="absolute inset-0 pointer-events-auto bg-[hsl(var(--foreground)/0.45)] flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="pointer-events-none"
            >
              <FeatherMascot size={48} />
            </motion.div>
          </div>
        )}

        {rect && (
            <motion.div
              className="absolute z-10"
              style={{ pointerEvents: "none" }}
            initial={{ x: window.innerWidth - 80, y: window.innerHeight - 100 }}
            animate={{ x: featherTarget.x, y: featherTarget.y }}
            transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.8 }}
          >
            <FeatherMascot size={featherSize} />

            <motion.div
                className="absolute"
                style={{ pointerEvents: "none", left: tooltipPosition.left, top: tooltipPosition.top }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
                <div
                  className="bg-card border border-border rounded-xl shadow-xl max-w-[calc(100vw-16px)] overflow-hidden pointer-events-none"
                style={{ width: tooltipW, maxHeight: `calc(100vh - ${viewportPadding * 2}px)` }}
              >
                  <div className="px-3 py-2.5 overflow-y-auto max-h-[calc(100vh-16px)]">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {isGuide && (
                        <div className="flex items-center gap-1.5 mb-1">
                          {steps.map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 rounded-full transition-all duration-300 ${
                                i < currentStep
                                  ? "bg-primary w-3"
                                  : i === currentStep
                                    ? "bg-primary w-5"
                                    : "bg-muted-foreground/25 w-3"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      <p className="text-sm font-medium text-foreground leading-snug break-words">
                        {step?.description || t("spotlight.defaultDescription")}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={t("common.close")}
                      onClick={requestDismiss}
                      className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted pointer-events-auto"
                    >
                      ✕
                    </button>
                  </div>

                  {isGuide && stepMode === "click" && (
                    <p className="text-[11px] text-muted-foreground break-words">
                      {t("spotlight.tapHint", "Tocca l'elemento evidenziato per continuare")}
                    </p>
                  )}

                  {isGuide && stepMode === "interact" && (
                    <p className="text-[11px] text-muted-foreground break-words">
                      {t("spotlight.interactHint", "Compila o conferma direttamente nel riquadro evidenziato")}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
