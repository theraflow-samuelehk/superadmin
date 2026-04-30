import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Store, Clock, ChevronRight, PartyPopper } from "lucide-react";

const ONBOARDING_KEY = "onboarding_completed";

interface OpeningHour {
  open: string;
  close: string;
  enabled: boolean;
}

const defaultHours: Record<string, OpeningHour> = {
  "0": { open: "09:00", close: "19:00", enabled: true },
  "1": { open: "09:00", close: "19:00", enabled: true },
  "2": { open: "09:00", close: "19:00", enabled: true },
  "3": { open: "09:00", close: "19:00", enabled: true },
  "4": { open: "09:00", close: "19:00", enabled: true },
  "5": { open: "09:00", close: "14:00", enabled: true },
  "6": { open: "09:00", close: "19:00", enabled: false },
};

interface OnboardingWizardProps {
  onComplete: (justFinished?: boolean) => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [salonName, setSalonName] = useState("");
  const [phone, setPhone] = useState("");
  const [hours, setHours] = useState<Record<string, OpeningHour>>(defaultHours);
  const [saving, setSaving] = useState(false);

  const daysRaw = t("settings.days", { returnObjects: true });
  const days = Array.isArray(daysRaw) ? daysRaw as string[] : ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

  useEffect(() => {
    if (!user) return;
    // Pre-fill salon name from signup metadata
    const metaName = user.user_metadata?.display_name;
    if (metaName && !salonName) {
      setSalonName(metaName);
    }
    // Check if onboarding already done
    if (localStorage.getItem(`${ONBOARDING_KEY}_${user.id}`)) {
      onComplete(false);
      return;
    }
    // Check if profile already has salon_name (existing user)
    supabase
      .from("profiles")
      .select("salon_name")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.salon_name) {
          localStorage.setItem(`${ONBOARDING_KEY}_${user.id}`, "1");
          onComplete(false);
        } else {
          setOpen(true);
        }
      });
  }, [user]);

  const skip = () => {
    if (user) localStorage.setItem(`${ONBOARDING_KEY}_${user.id}`, "1");
    setOpen(false);
    onComplete(true);
  };

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        salon_name: salonName || null,
        phone: phone || null,
        opening_hours: hours,
      } as any)
      .eq("user_id", user.id);
    localStorage.setItem(`${ONBOARDING_KEY}_${user.id}`, "1");
    setSaving(false);
    setOpen(false);
    onComplete(true);
  };

  const totalSteps = 3;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) skip(); }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0 [&>button]:hidden">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="p-6 sm:p-8"
            >
              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  {t("onboarding.welcomeTitle")}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("onboarding.welcomeDesc")}
                </p>
              </div>
              <div className="flex gap-3 mt-8">
                <Button variant="ghost" className="flex-1" onClick={skip}>
                  {t("onboarding.skip")}
                </Button>
                <Button variant="hero" className="flex-1" onClick={() => setStep(1)}>
                  {t("onboarding.start")}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="salon"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{t("onboarding.salonTitle")}</h3>
                  <p className="text-xs text-muted-foreground">{t("onboarding.step", { current: 1, total: 2 })}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("settings.salonName")}</Label>
                  <Input
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                    placeholder={t("onboarding.salonPlaceholder")}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.phone")}</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("onboarding.phonePlaceholder")}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(0)}>
                  {t("common.back")}
                </Button>
                <Button variant="hero" className="flex-1" onClick={() => setStep(2)}>
                  {t("common.next")}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="hours"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{t("onboarding.hoursTitle")}</h3>
                  <p className="text-xs text-muted-foreground">{t("onboarding.step", { current: 2, total: 2 })}</p>
                </div>
              </div>
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {days.map((day, i) => {
                  const key = String(i);
                  const h = hours[key];
                  return (
                    <div key={day} className="flex items-center justify-between py-1.5 gap-2">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <Switch
                          checked={h.enabled}
                          onCheckedChange={(v) =>
                            setHours((prev) => ({ ...prev, [key]: { ...prev[key], enabled: v } }))
                          }
                        />
                        <span className="text-sm font-medium text-foreground">{day}</span>
                      </div>
                      {h.enabled ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            className="w-[72px] text-center text-sm h-8"
                            value={h.open}
                            onChange={(e) =>
                              setHours((prev) => ({ ...prev, [key]: { ...prev[key], open: e.target.value } }))
                            }
                          />
                          <span className="text-muted-foreground text-xs">–</span>
                          <Input
                            className="w-[72px] text-center text-sm h-8"
                            value={h.close}
                            onChange={(e) =>
                              setHours((prev) => ({ ...prev, [key]: { ...prev[key], close: e.target.value } }))
                            }
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t("settings.closed")}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>
                  {t("common.back")}
                </Button>
                <Button variant="hero" className="flex-1" onClick={finish} disabled={saving}>
                  {saving ? t("common.loading") : t("onboarding.finish")}
                  <PartyPopper className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {[0, 1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? "w-6 bg-primary" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
