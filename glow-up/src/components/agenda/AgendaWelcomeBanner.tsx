import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Scissors, CalendarPlus, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffectiveUserId } from "@/hooks/useEffectiveUserId";

const STORAGE_KEY = "agenda_welcome_seen_v2";

const STEPS = [
  {
    icon: Users,
    emoji: "👩‍💼",
    titleKey: "agenda.welcome.step1Title",
    titleDefault: "Personalizza le tue operatrici",
    descKey: "agenda.welcome.step1Desc",
    descDefault: "Ho creato 3 operatrici di esempio. Rinominale con i nomi del tuo staff, eliminale o aggiungine altre.",
    ctaKey: "agenda.welcome.step1Cta",
    ctaDefault: "Vai a Operatori",
    route: "/operatori",
  },
  {
    icon: Scissors,
    emoji: "✂️",
    titleKey: "agenda.welcome.step2Title",
    titleDefault: "Crea il tuo menu servizi",
    descKey: "agenda.welcome.step2Desc",
    descDefault: "Trovi dei trattamenti di esempio. Personalizzali con i tuoi servizi, durate e prezzi.",
    ctaKey: "agenda.welcome.step2Cta",
    ctaDefault: "Vai a Servizi",
    route: "/servizi",
  },
  {
    icon: CalendarPlus,
    emoji: "📅",
    titleKey: "agenda.welcome.step3Title",
    titleDefault: "Crea il tuo primo appuntamento",
    descKey: "agenda.welcome.step3Desc",
    descDefault: "Tocca una cella vuota nell'agenda per inserire un appuntamento. Sei pronto!",
  },
];

export default function AgendaWelcomeBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userId = useEffectiveUserId();
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    // Show the welcome guide for any logged-in user who hasn't dismissed it yet
    if (userId) {
      setVisible(true);
    }
  }, [userId]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      dismiss();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleCta = () => {
    if (step.route) {
      dismiss();
      navigate(step.route);
    } else {
      dismiss();
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="rounded-2xl border border-primary/20 bg-card p-4 shadow-md mb-1.5 relative">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold text-muted-foreground tracking-wide uppercase">
                {t("agenda.welcome.stepLabel", "Guida rapida")} — {currentStep + 1}/{STEPS.length}
              </p>
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: i === currentStep ? 20 : 8,
                      background: i <= currentStep ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.2)",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center text-center py-2"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-[15px] font-bold text-foreground mb-1.5">
                  {step.emoji} {t(step.titleKey, step.titleDefault)}
                </h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[280px]">
                  {t(step.descKey, step.descDefault)}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-3">
              {step.route && (
                <Button
                  onClick={handleCta}
                  className="w-full"
                  size="sm"
                >
                  {t(step.ctaKey, step.ctaDefault)}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              <Button
                onClick={handleNext}
                variant={step.route ? "ghost" : "default"}
                size="sm"
                className={step.route ? "w-full text-muted-foreground" : "w-full"}
              >
                {isLast
                  ? t("agenda.welcome.finish", "Inizia ad usare l'agenda ✨")
                  : t("agenda.welcome.skip", "Avanti, lo farò dopo →")}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
