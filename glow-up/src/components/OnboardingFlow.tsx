import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useImpersonation } from "@/lib/impersonation";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { GooglePlacesAutocomplete } from "@/components/GooglePlacesAutocomplete";
import {
  ChevronRight, ArrowLeft, Check, User, Users, Scissors,
  Heart, Sparkles, Armchair, Sun, Dumbbell, Footprints,
  Plus, Droplets, Flower2, Dog, Syringe, Store,
  MapPin, Building2, Home, Monitor, CheckCircle2,
  Bell, MessageCircle, Smartphone, Calendar, Link2, Copy, ExternalLink, ChevronDown,
  Paintbrush, Leaf, Pen, Activity, Hand,
} from "lucide-react";
import onboardingHero from "@/assets/onboarding-hero.png";

const TOTAL_STEPS = 11; // 0=welcome, 1-7=wizard, 8=flow, 9=success, 10=booking-link
const WIZARD_STEPS = 8;

const STEP_BG = [
  "radial-gradient(ellipse at 50% 40%, hsl(340 65% 55% / 0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, hsl(38 75% 55% / 0.10) 0%, transparent 50%)",
  "radial-gradient(ellipse at 85% 15%, hsl(340 65% 55% / 0.12) 0%, transparent 60%)",
  "radial-gradient(ellipse at 15% 20%, hsl(340 65% 55% / 0.10) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, hsl(38 75% 55% / 0.08) 0%, transparent 50%)",
  "radial-gradient(ellipse at 50% 10%, hsl(340 65% 55% / 0.10) 0%, transparent 50%)",
  "radial-gradient(ellipse at 80% 30%, hsl(340 65% 55% / 0.12) 0%, transparent 55%)",
  "radial-gradient(ellipse at 20% 70%, hsl(340 65% 55% / 0.10) 0%, transparent 50%)",
  "radial-gradient(ellipse at 60% 20%, hsl(340 65% 55% / 0.10) 0%, transparent 55%)",
  "radial-gradient(ellipse at 40% 60%, hsl(340 65% 55% / 0.12) 0%, transparent 50%)",
  "radial-gradient(ellipse at 30% 30%, hsl(260 60% 55% / 0.10) 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, hsl(340 65% 55% / 0.12) 0%, transparent 50%)",
  "radial-gradient(ellipse at 50% 50%, hsl(340 65% 55% / 0.18) 0%, transparent 60%)",
  "radial-gradient(ellipse at 40% 20%, hsl(210 80% 55% / 0.12) 0%, transparent 55%), radial-gradient(ellipse at 60% 80%, hsl(340 65% 55% / 0.10) 0%, transparent 50%)",
];

const STEP_BADGES = ["✨", "🎨", "👥", "📍", "🏠", "💻", "📣"];

const BUSINESS_CATEGORIES = [
  { id: "centro_estetico", icon: Sparkles, label: "Centro estetico" },
  { id: "parrucchiere", icon: Scissors, label: "Parrucchiere" },
  { id: "barbiere", icon: Armchair, label: "Barbiere" },
  { id: "nail_studio", icon: Hand, label: "Nail studio" },
  { id: "lash_brow_studio", icon: Heart, label: "Lash & Brow studio" },
  { id: "salone_bellezza", icon: Store, label: "Salone di bellezza" },
  { id: "medspa", icon: Syringe, label: "MedSpa" },
  { id: "centro_massaggi", icon: Flower2, label: "Centro massaggi" },
  { id: "spa_benessere", icon: Droplets, label: "Spa e centro benessere" },
  { id: "epilazione", icon: Sparkles, label: "Centro epilazione" },
  { id: "tatuaggi_piercing", icon: Pen, label: "Studio tatuaggi e piercing" },
  { id: "abbronzatura", icon: Sun, label: "Centro abbronzatura" },
  { id: "trucco_makeup", icon: Paintbrush, label: "Trucco e make-up artist" },
  { id: "centro_olistico", icon: Leaf, label: "Centro olistico" },
  { id: "fitness", icon: Dumbbell, label: "Fitness e recupero" },
  { id: "fisioterapia", icon: Footprints, label: "Fisioterapia e riabilitazione" },
  { id: "centro_sanitario", icon: Activity, label: "Centro sanitario" },
  { id: "toelettatura", icon: Dog, label: "Toelettatura animali" },
  { id: "altro", icon: Plus, label: "Altro" },
];

const SERVICE_LOCATIONS = [
  { id: "fisico", icon: Building2, label: "Ricevo i clienti nel mio centro" },
  { id: "domicilio", icon: Home, label: "Raggiungo i clienti a casa loro" },
  { id: "online", icon: Monitor, label: "Fornisco servizi virtuali online" },
];

const SOFTWARE_FULL_WIDTH_TOP = [
  "Agenda cartacea",
];
const SOFTWARE_GRID = [
  "Booksy",
  "Treatwell",
  "Uala",
  "Fresha",
  "Mindbody",
  "Square Appoint.",
  "Calendly",
  "Timely",
  "Vagaro",
  "Zenoti",
  "Acuity Scheduling",
  "Phorest",
  "Shortcuts",
  "Rosy Salon",
  "Salon Iris",
  "Boulevard",
  "GlossGenius",
  "Mangomint",
  "Goldie",
  "Janeapp",
  "Setmore",
  "Styleseat",
];
const SOFTWARE_OTHER = "Uso un gestionale NON in questa lista";
const SOFTWARE_FULL_WIDTH_BOTTOM = [
  SOFTWARE_OTHER,
  "Non utilizzo alcun gestionale",
];
const SOFTWARE_ALL = [...SOFTWARE_FULL_WIDTH_TOP, ...SOFTWARE_GRID, ...SOFTWARE_FULL_WIDTH_BOTTOM];

const REFERRAL_OPTIONS = [
  "Pubblicità sui social",
  "Cercando su Google",
  "Passaparola",
  "Altro",
];

/* ─── Rich text helper ─── */
function RichText({ text, className, as: Tag = "p" }: { text: string; className?: string; as?: "h1" | "p" | "span" }) {
  const normalized = text.replace(/\\n|\n/g, "<br/>");
  const parts = normalized.split(/(<em>.*?<\/em>|<strong>.*?<\/strong>|<br\s*\/?>)/g);
  return (
    <Tag className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("<em>")) return <span key={i} className="text-primary">{part.replace(/<\/?em>/g, "")}</span>;
        if (part.startsWith("<strong>")) return <strong key={i} className="font-bold text-foreground">{part.replace(/<\/?strong>/g, "")}</strong>;
        if (/^<br\s*\/?>$/.test(part)) return <br key={i} />;
        return <span key={i}>{part}</span>;
      })}
    </Tag>
  );
}

export default function OnboardingFlow() {
  const { t } = useTranslation();
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const { isImpersonating } = useImpersonation();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [debugResetKey, setDebugResetKey] = useState(0);
  const [showPhoneStep, setShowPhoneStep] = useState(false);
  const [onboardingPhone, setOnboardingPhone] = useState("");
  const [onboardingPhonePrefix, setOnboardingPhonePrefix] = useState("+39");

  // State fields
  const [salonName, setSalonName] = useState("");
  const [website, setWebsite] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");
  const [accountType, setAccountType] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<string | null>(null);
  const [serviceLocations, setServiceLocations] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [currentSoftware, setCurrentSoftware] = useState<string | null>(null);
  const [softwareOtherText, setSoftwareOtherText] = useState("");
  const [referralSource, setReferralSource] = useState<string | null>(null);
  const [referralOtherText, setReferralOtherText] = useState("");

  const createdAt = useMemo(() => {
    const raw = user?.created_at;
    if (!raw) return null;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [user?.created_at]);

  useEffect(() => {
    const handler = () => setDebugResetKey((prev) => prev + 1);
    window.addEventListener("glowup:onboarding-debug-reset", handler as EventListener);
    return () => window.removeEventListener("glowup:onboarding-debug-reset", handler as EventListener);
  }, []);

  // Detect country prefix from timezone
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const tzMap: Record<string, string> = {
        "Europe/Rome": "+39", "Europe/Malta": "+356", "America/New_York": "+1",
        "America/Chicago": "+1", "America/Los_Angeles": "+1", "Europe/London": "+44",
        "Europe/Berlin": "+49", "Europe/Paris": "+33", "Europe/Madrid": "+34",
        "Europe/Lisbon": "+351", "Europe/Vienna": "+43", "Europe/Zurich": "+41",
        "Europe/Brussels": "+32", "Europe/Amsterdam": "+31", "Europe/Dublin": "+353",
        "Europe/Athens": "+30", "Europe/Warsaw": "+48", "Europe/Bucharest": "+40",
        "Europe/Zagreb": "+385", "Europe/Prague": "+420", "Europe/Budapest": "+36",
        "Europe/Stockholm": "+46", "Europe/Copenhagen": "+45", "Europe/Helsinki": "+358",
        "Europe/Oslo": "+47", "Europe/Istanbul": "+90", "Australia/Sydney": "+61",
        "Asia/Tokyo": "+81", "Asia/Dubai": "+971",
      };
      if (tz && tzMap[tz]) setOnboardingPhonePrefix(tzMap[tz]);
    } catch {}
  }, []);

  // Detect if user signed up via Google (needs phone step)
  const isGoogleUser = useMemo(() => {
    if (!user) return false;
    const provider = user.app_metadata?.provider;
    return provider === "google";
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const hideOnboarding = () => {
      if (cancelled) return;
      setShowOnboarding(false);
      setShowPhoneStep(false);
      setStep(0);
      setLoading(false);
    };

    if (authLoading) {
      setLoading(true);
      return () => {
        cancelled = true;
      };
    }

    if (!user || isSuperAdmin || isImpersonating) {
      hideOnboarding();
      return () => {
        cancelled = true;
      };
    }

    const debugReplayKey = `debug_onboarding_replay_${user.id}`;
    const isForcedDebugReplay = isSuperAdmin && localStorage.getItem(debugReplayKey) === "1";
    const rolloutDate = new Date("2026-03-20T20:50:56.000Z");
    const isNewCenter = createdAt ? createdAt.getTime() >= rolloutDate.getTime() : false;

    if (!isNewCenter && !isForcedDebugReplay) {
      localStorage.removeItem(debugReplayKey);
      hideOnboarding();
      return () => {
        cancelled = true;
      };
    }

    const fetchPhase = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_phase, salon_name, phone, website, business_category, account_type, team_size, service_locations, current_software, referral_source")
        .eq("user_id", user.id)
        .single();

      if (!data) {
        hideOnboarding();
        return;
      }

      const p = (data as any).onboarding_phase ?? 0;
      const hasExistingSetup = Boolean(
        (data as any).website ||
        (Array.isArray((data as any).business_category) && (data as any).business_category.length > 0) ||
        (data as any).account_type ||
        (data as any).team_size ||
        (Array.isArray((data as any).service_locations) && (data as any).service_locations.length > 0) ||
        (data as any).current_software ||
        (data as any).referral_source
      );

      if ((p >= WIZARD_STEPS || (p === 0 && hasExistingSetup)) && !isForcedDebugReplay) {
        hideOnboarding();
        return;
      }

      if (cancelled) return;
      if (data.salon_name) setSalonName(data.salon_name);
      setStep(p === 0 ? 0 : p);
      setShowOnboarding(true);
      setLoading(false);
    };

    fetchPhase();

    return () => {
      cancelled = true;
    };
  }, [authLoading, createdAt, debugResetKey, isImpersonating, isSuperAdmin, user]);

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(id)) return prev.filter(c => c !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const toggleServiceLocation = (id: string) => {
    setServiceLocations(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const canContinue = useMemo(() => {
    if (step === 0) return true;
    if (step === 1) return salonName.trim().length > 0;
    if (step === 2) {
      if (selectedCategories.length === 0) return false;
      if (selectedCategories.includes("altro") && otherText.trim().length === 0) return false;
      return true;
    }
    if (step === 3) {
      if (accountType === null) return false;
      if (accountType === "team" && teamSize === null) return false;
      return true;
    }
    if (step === 4) return serviceLocations.length > 0;
    if (step === 5) return true; // address is optional
    if (step === 6) return currentSoftware !== null;
    if (step === 7) return referralSource !== null;
    if (step === 8) return true; // flow diagram
    if (step === 9) return true; // success
    if (step === 10) return true; // booking link
    return false;
  }, [step, salonName, selectedCategories, accountType, otherText, teamSize, serviceLocations, currentSoftware, referralSource]);

  const handleContinue = async () => {
    if (!user || !canContinue) return;

    if (step === 0) {
      if (isGoogleUser && !showPhoneStep) {
        // Show phone collection step for Google users
        setShowPhoneStep(true);
        return;
      }
      // Save phone if provided (for Google users)
      if (showPhoneStep && onboardingPhone.trim()) {
        const fullPhone = `${onboardingPhonePrefix}${onboardingPhone.trim().replace(/\s/g, "")}`;
        await supabase.from("profiles").update({ phone: fullPhone } as any).eq("user_id", user.id);
      }
      setStep(1);
      return;
    }

    if (step === 10) {
      localStorage.removeItem(`debug_onboarding_replay_${user.id}`);
      localStorage.setItem(`agenda_tour_pending_${user.id}`, "1");
      setShowOnboarding(false);
      window.dispatchEvent(new CustomEvent("glowup:onboarding-completed", { detail: { userId: user.id } }));
      navigate("/agenda");
      return;
    }

    setSaving(true);
    // Save per-step data
    if (step === 1) {
      await supabase.from("profiles").update({ salon_name: salonName.trim(), website: website.trim() || null, onboarding_phase: 1 } as any).eq("user_id", user.id);
    } else if (step === 2) {
      await supabase.from("profiles").update({ business_category: selectedCategories, other_category_text: selectedCategories.includes("altro") ? otherText.trim() || null : null, onboarding_phase: 2 } as any).eq("user_id", user.id);
    } else if (step === 3) {
      await supabase.from("profiles").update({ account_type: accountType, team_size: accountType === "team" ? teamSize : null, onboarding_phase: 3 } as any).eq("user_id", user.id);
    } else if (step === 4) {
      await supabase.from("profiles").update({ service_locations: serviceLocations, onboarding_phase: 4 } as any).eq("user_id", user.id);
    } else if (step === 5) {
      await supabase.from("profiles").update({ address: address.trim() || null, onboarding_phase: 5 } as any).eq("user_id", user.id);
    } else if (step === 6) {
      const softwareValue = currentSoftware === SOFTWARE_OTHER && softwareOtherText.trim()
        ? `${SOFTWARE_OTHER}: ${softwareOtherText.trim()}`
        : currentSoftware;
      await supabase.from("profiles").update({ current_software: softwareValue, onboarding_phase: 6 } as any).eq("user_id", user.id);
    } else if (step === 7) {
      await supabase.from("profiles").update({ referral_source: referralSource, referral_other_text: referralSource === "Altro" ? referralOtherText.trim() || null : null, onboarding_phase: WIZARD_STEPS } as any).eq("user_id", user.id);
    }
    setSaving(false);

    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    }
  };

  if (loading || !showOnboarding) return null;

  const isWelcome = step === 0 && !showPhoneStep;
  const isPhoneStep = step === 0 && showPhoneStep;
  const isSuccess = step === 9;
  const isFlowDiagram = step === 8;
  const isBookingLink = step === 10;
  const wizardStep = step - 1;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: "hsl(30 30% 98%)", backgroundImage: STEP_BG[step] || STEP_BG[0] }}
    >
      {/* Header — hidden on welcome & success */}
      {!isWelcome && !isPhoneStep && !isSuccess && !isFlowDiagram && !isBookingLink && (
        <div className="px-4 pt-4 pb-1">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setStep(step - 1)}
              className="p-1.5 -ml-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 flex gap-1.5">
              {Array.from({ length: WIZARD_STEPS }).map((_, i) => (
                <div key={i} className="h-1 flex-1 rounded-full overflow-hidden bg-muted">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "var(--gradient-hero)" }}
                    initial={{ width: i < wizardStep ? "100%" : "0%" }}
                    animate={{ width: i <= wizardStep ? "100%" : "0%" }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              ))}
            </div>
            <span className="text-xs font-medium text-muted-foreground tabular-nums min-w-[2.5rem] text-right">
              {wizardStep + 1}/{WIZARD_STEPS}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 overflow-auto px-5 sm:px-8 ${isWelcome || isPhoneStep || isSuccess || isFlowDiagram || isBookingLink ? "pb-32" : "pb-28"}`}>
        <div className="max-w-lg mx-auto pt-4 sm:pt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${step}-${showPhoneStep ? "phone" : "main"}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 0 && !showPhoneStep && <StepWelcome />}
              {step === 0 && showPhoneStep && (
                <StepPhoneCollection
                  phone={onboardingPhone}
                  setPhone={setOnboardingPhone}
                  prefix={onboardingPhonePrefix}
                  setPrefix={setOnboardingPhonePrefix}
                />
              )}
              {step === 1 && <StepBusinessName salonName={salonName} setSalonName={setSalonName} website={website} setWebsite={setWebsite} />}
              {step === 2 && <StepCategories selected={selectedCategories} onToggle={toggleCategory} otherText={otherText} setOtherText={setOtherText} />}
              {step === 3 && <StepAccountType selected={accountType} onSelect={setAccountType} teamSize={teamSize} onSelectTeamSize={setTeamSize} />}
              {step === 4 && <StepServiceLocation selected={serviceLocations} onToggle={toggleServiceLocation} />}
              {step === 5 && <StepAddress address={address} setAddress={setAddress} />}
              {step === 6 && <StepCurrentSoftware selected={currentSoftware} onSelect={setCurrentSoftware} otherText={softwareOtherText} setOtherText={setSoftwareOtherText} />}
              {step === 7 && <StepReferral selected={referralSource} onSelect={setReferralSource} otherText={referralOtherText} setOtherText={setReferralOtherText} />}
              {step === 8 && <StepFlowDiagram />}
              {step === 9 && <StepSuccess />}
              {step === 10 && <StepBookingLink userId={user?.id} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0">
        <div className="h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        <div className="bg-background px-5 sm:px-8 pb-6 pt-3">
          <div className="max-w-lg mx-auto">
            <motion.button
              onClick={handleContinue}
              disabled={!canContinue || saving}
              className="w-full h-14 text-base font-bold rounded-2xl text-primary-foreground flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              style={{ background: canContinue ? "var(--gradient-hero)" : "hsl(var(--muted))", color: canContinue ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))" }}
              whileTap={{ scale: 0.97 }}
            >
              {saving ? (
                <motion.div
                  className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                />
              ) : (
                <>
                  {isWelcome ? t("onboarding.start") : isPhoneStep ? t("auth.phoneStepContinue") : isBookingLink ? t("onboarding.flowBookingLinkCta") : isSuccess ? t("onboarding.successCta") : isFlowDiagram ? t("onboarding.flowDiagramCta") : step === 7 ? t("onboarding.finish") : t("onboarding.continue")}
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 0: Welcome Splash ─── */
function StepWelcome() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center text-center pt-2 sm:pt-6 space-y-5">
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="relative"
      >
        <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl scale-125" />
        <img src="/icon-512.png" alt="GlowUp" className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl shadow-xl ring-4 ring-primary/10" />
      </motion.div>

      <div className="space-y-3 max-w-sm">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <RichText text={t("onboarding.welcomeSplashTitle")} as="h1" className="text-[1.75rem] sm:text-4xl font-extrabold text-foreground leading-[1.15] tracking-tight" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <RichText text={t("onboarding.welcomeSplashDesc")} as="p" className="text-muted-foreground text-base sm:text-lg leading-relaxed" />
        </motion.div>
      </div>

      <motion.div className="w-full max-w-[260px] sm:max-w-[320px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.6 }}>
        <img src={onboardingHero} alt="" className="w-full h-auto drop-shadow-lg" />
      </motion.div>

      <motion.div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Sparkles className="h-4.5 w-4.5 text-primary shrink-0" />
        <span className="text-[15px] text-foreground/80">{t("onboarding.welcomeInstallHint")}</span>
      </motion.div>
    </div>
  );
}

/* ─── Step 0b: Phone Collection (Google OAuth users) ─── */
const COUNTRY_PREFIXES_ONBOARDING: Record<string, string> = {
  IT: "+39", MT: "+356", US: "+1", GB: "+44", DE: "+49", FR: "+33",
  ES: "+34", PT: "+351", AT: "+43", CH: "+41", BE: "+32", NL: "+31",
  IE: "+353", GR: "+30", PL: "+48", RO: "+40", HR: "+385", CZ: "+420",
  SK: "+421", HU: "+36", SI: "+386", BG: "+359", SE: "+46", DK: "+45",
  FI: "+358", NO: "+47", LT: "+370", LV: "+371", EE: "+372",
  CY: "+357", LU: "+352", AL: "+355", RS: "+381", BA: "+387",
  ME: "+382", MK: "+389", TR: "+90", RU: "+7", UA: "+380",
  BR: "+55", AR: "+54", MX: "+52", CO: "+57", CL: "+56",
  AU: "+61", NZ: "+64", JP: "+81", CN: "+86", IN: "+91",
  AE: "+971", SA: "+966", IL: "+972", ZA: "+27", EG: "+20",
  MA: "+212", TN: "+216", KE: "+254", NG: "+234",
};

function StepPhoneCollection({ phone, setPhone, prefix, setPrefix }: { phone: string; setPhone: (v: string) => void; prefix: string; setPrefix: (v: string) => void }) {
  const { t } = useTranslation();
  const [prefixOpen, setPrefixOpen] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center text-center pt-6 sm:pt-10 space-y-6">
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="relative"
      >
        <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl scale-125" />
        <div className="relative h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Smartphone className="h-8 w-8 text-primary" />
        </div>
      </motion.div>

      <div className="space-y-3 max-w-sm">
        <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-[1.75rem] sm:text-3xl font-extrabold text-foreground leading-[1.15] tracking-tight">
          {t("auth.phoneStepTitle")}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="text-muted-foreground text-base leading-relaxed">
          {t("auth.phoneStepSubtitle")}
        </motion.p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="w-full max-w-sm">
        <Label className="text-left block mb-2 text-sm font-medium">{t("auth.phone")}</Label>
        <div className="flex gap-2">
          <Popover open={prefixOpen} onOpenChange={setPrefixOpen} modal>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPrefixOpen(!prefixOpen); }}
                className="flex items-center gap-1 rounded-xl border border-input bg-muted/50 px-3 text-sm text-foreground h-12 shrink-0 hover:bg-muted transition-colors cursor-pointer font-medium"
              >
                <span>{prefix}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1 z-[9999]" align="start">
              <ScrollArea className="h-60">
                {Object.entries(COUNTRY_PREFIXES_ONBOARDING).map(([code, p]) => (
                  <button
                    key={code}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPrefix(p); setPrefixOpen(false); }}
                    className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors cursor-pointer ${
                      prefix === p
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <span>{code}</span>
                    <span className="text-muted-foreground">{p}</span>
                  </button>
                ))}
              </ScrollArea>
            </PopoverContent>
          </Popover>
          <Input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder={t("auth.phoneNumberPlaceholder")}
            className="flex-1 h-12 text-base rounded-xl"
            autoFocus
          />
        </div>
      </motion.div>
    </div>
  );
}


function StepHeader({ step, title, desc }: { step: number; title: string; desc: string }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <motion.div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        {STEP_BADGES[step]} {t("onboarding.configTitle")}
      </motion.div>
      <RichText text={title} as="h1" className="text-[1.75rem] sm:text-4xl font-extrabold text-foreground leading-[1.15] tracking-tight" />
      <RichText text={desc} as="p" className="text-muted-foreground text-[15px] leading-relaxed" />
    </div>
  );
}

/* ─── Step 1: Business Name ─── */
function StepBusinessName({ salonName, setSalonName, website, setWebsite }: { salonName: string; setSalonName: (v: string) => void; website: string; setWebsite: (v: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-8">
      <StepHeader step={0} title={t("onboarding.step1Title")} desc={t("onboarding.step1Desc")} />
      <div className="space-y-5">
        <motion.div className="space-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Label className="font-semibold text-sm">{t("onboarding.businessNameLabel")}</Label>
          <Input value={salonName} onChange={(e) => setSalonName(e.target.value)} placeholder={t("onboarding.businessNamePlaceholder")} className="h-13 rounded-xl bg-card border-border text-base shadow-sm focus:shadow-md focus:border-primary/50 transition-all placeholder:text-muted-foreground/40" autoFocus />
        </motion.div>
        <motion.div className="space-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Label className="font-semibold text-sm">{t("onboarding.websiteLabel")} <span className="font-normal text-muted-foreground">({t("onboarding.optional")})</span></Label>
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="www.iltuosito.it" className="h-13 rounded-xl bg-card border-border text-base shadow-sm focus:shadow-md focus:border-primary/50 transition-all placeholder:text-muted-foreground/40" />
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Step 2: Category Selection ─── */
function StepCategories({ selected, onToggle, otherText, setOtherText }: { selected: string[]; onToggle: (id: string) => void; otherText: string; setOtherText: (v: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <StepHeader step={1} title={t("onboarding.step2Title")} desc={t("onboarding.step2Desc")} />
      <div className="grid grid-cols-2 gap-2">
        {BUSINESS_CATEGORIES.map(({ id, icon: Icon, label }, index) => {
          const isSelected = selected.includes(id);
          const isDisabled = !isSelected && selected.length >= 3;
          return (
            <motion.button key={id} onClick={() => !isDisabled && onToggle(id)} disabled={isDisabled} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02, duration: 0.3 }}
              className={`relative flex items-center gap-2.5 p-2.5 rounded-xl border-2 transition-all text-left ${isSelected ? "border-primary bg-primary/5 shadow-md" : isDisabled ? "border-border bg-muted/20 opacity-40 cursor-not-allowed" : "border-border bg-card hover:border-primary/30 hover:shadow-sm"}`}
              whileTap={!isDisabled ? { scale: 0.96 } : undefined}
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-primary/15" : "bg-muted/60"}`}>
                <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <span className={`text-xs font-medium leading-tight flex-1 ${isSelected ? "text-foreground" : "text-foreground/80"}`}>{label}</span>
              <motion.div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/30 bg-transparent"}`} animate={isSelected ? { scale: [1, 1.2, 1] } : { scale: 1 }} transition={{ duration: 0.25 }}>
                {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
              </motion.div>
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {selected.includes("altro") && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
            onAnimationComplete={() => { document.getElementById("onboarding-other-input")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>
            <div className="pt-2 pb-4">
              <Input id="onboarding-other-input" value={otherText} onChange={(e) => setOtherText(e.target.value)} placeholder={t("onboarding.step2OtherPlaceholder")} className="h-13 rounded-xl bg-card border-border text-base shadow-sm focus:border-primary/50 transition-all" autoFocus />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Step 3: Account Type ─── */
function StepAccountType({ selected, onSelect, teamSize, onSelectTeamSize }: { selected: string | null; onSelect: (v: string) => void; teamSize: string | null; onSelectTeamSize: (v: string) => void }) {
  const { t } = useTranslation();
  const options = [
    { id: "team", icon: Users, title: t("onboarding.accountTypeTeam"), desc: t("onboarding.accountTypeTeamDesc") },
    { id: "solo", icon: User, title: t("onboarding.accountTypeSolo"), desc: t("onboarding.accountTypeSoloDesc") },
  ];
  const teamSizes = [
    { id: "2-5", label: "2-5 persone" },
    { id: "6-10", label: "6-10 persone" },
    { id: "11+", label: "+ di 11 persone" },
  ];

  return (
    <div className="space-y-6">
      <StepHeader step={2} title={t("onboarding.step3Title")} desc={t("onboarding.step3Desc")} />
      <div className="space-y-2.5">
        {options.map(({ id, icon: Icon, title, desc }, index) => {
          const isSelected = selected === id;
          return (
            <React.Fragment key={id}>
              <motion.button onClick={() => onSelect(id)} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.35 }}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${isSelected ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/30 hover:shadow-sm"}`}
                whileTap={{ scale: 0.97 }}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-primary/15" : "bg-muted/60"}`}>
                  <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-[14px]">{title}</p>
                  <p className="text-[13px] text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                </div>
                <RadioDot selected={isSelected} />
              </motion.button>
              {/* Team size sub-selection inline after "Ho un team" */}
              <AnimatePresence>
                {id === "team" && selected === "team" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="space-y-2 pt-1 pl-4">
                      <p className="font-semibold text-foreground text-[13px]">{t("onboarding.teamSizeTitle")}</p>
                      {teamSizes.map(({ id: sizeId, label }) => (
                        <motion.button key={sizeId} onClick={() => onSelectTeamSize(sizeId)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${teamSize === sizeId ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"}`}
                          whileTap={{ scale: 0.97 }}
                        >
                          <span className="font-medium text-foreground text-[13px]">{label}</span>
                          <RadioDot selected={teamSize === sizeId} />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step 4: Service Location ─── */
function StepServiceLocation({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-7">
      <StepHeader step={3} title={t("onboarding.step4Title")} desc={t("onboarding.step4Desc")} />
      <div className="space-y-2.5">
        {SERVICE_LOCATIONS.map(({ id, icon: Icon, label }, index) => {
          const isSelected = selected.includes(id);
          return (
            <motion.button key={id} onClick={() => onToggle(id)} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.35 }}
              className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all text-left ${isSelected ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/30 hover:shadow-sm"}`}
              whileTap={{ scale: 0.97 }}
            >
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-primary/15" : "bg-muted/60"}`}>
                <Icon className={`h-5.5 w-5.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-medium text-foreground text-[14px] leading-snug">{label}</p>
              </div>
              <RadioDot selected={isSelected} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Step 5: Address ─── */
function StepAddress({ address, setAddress }: { address: string; setAddress: (v: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-8">
      <StepHeader step={4} title={t("onboarding.step5Title")} desc={t("onboarding.step5Desc")} />
      <motion.div className="space-y-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Label className="font-semibold text-sm">{t("onboarding.addressLabel")} <span className="font-normal text-muted-foreground">({t("onboarding.optional")})</span></Label>
        <GooglePlacesAutocomplete
          value={address}
          onChange={setAddress}
          placeholder={t("onboarding.addressPlaceholder")}
          className="h-13 rounded-xl bg-card border-border text-base shadow-sm focus:shadow-md focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
        />
        {!address && <p className="text-xs text-muted-foreground/70">{t("onboarding.addressHint")}</p>}
      </motion.div>
    </div>
  );
}

/* ─── Step 6: Current Software ─── */
function StepCurrentSoftware({ selected, onSelect, otherText, setOtherText }: { selected: string | null; onSelect: (v: string) => void; otherText: string; setOtherText: (v: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <StepHeader step={5} title={t("onboarding.step6Title")} desc={t("onboarding.step6Desc")} />
      <div className="grid grid-cols-2 gap-2">
        {SOFTWARE_FULL_WIDTH_TOP.map((opt, index) => {
          const isSelected = selected === opt;
          return (
            <motion.button key={opt} onClick={() => onSelect(opt)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02, duration: 0.25 }}
              className={`col-span-2 flex items-center justify-between gap-2 p-3 rounded-xl border-2 transition-all text-left ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"}`}
              whileTap={{ scale: 0.97 }}
            >
              <span className="font-medium text-foreground text-[13px] leading-tight">{opt}</span>
              <RadioDot selected={isSelected} />
            </motion.button>
          );
        })}
        {SOFTWARE_GRID.map((opt, index) => {
          const isSelected = selected === opt;
          return (
            <motion.button key={opt} onClick={() => onSelect(opt)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (1 + index) * 0.02, duration: 0.25 }}
              className={`flex items-center justify-between gap-2 p-3 rounded-xl border-2 transition-all text-left ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"}`}
              whileTap={{ scale: 0.97 }}
            >
              <span className="font-medium text-foreground text-[13px] leading-tight">{opt}</span>
              <RadioDot selected={isSelected} />
            </motion.button>
          );
        })}
        {/* "Uso un gestionale NON in questa lista" — con input inline */}
        {(() => {
          const isSelected = selected === SOFTWARE_OTHER;
          return (
            <>
              <motion.button key={SOFTWARE_OTHER} onClick={() => onSelect(SOFTWARE_OTHER)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (1 + SOFTWARE_GRID.length) * 0.02, duration: 0.25 }}
                className={`col-span-2 flex items-center justify-between gap-2 p-3 rounded-xl border-2 transition-all text-left ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"}`}
                whileTap={{ scale: 0.97 }}
              >
                <span className="font-medium text-foreground text-[13px] leading-tight">{SOFTWARE_OTHER}</span>
                <RadioDot selected={isSelected} />
              </motion.button>
              <AnimatePresence>
                {isSelected && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="col-span-2 overflow-hidden">
                    <Input
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      placeholder="Scrivi il nome, se lo ricordi"
                      className="h-12 rounded-xl bg-card border-border text-base"
                      autoFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          );
        })()}
        {/* "Non utilizzo alcun gestionale" */}
        {SOFTWARE_FULL_WIDTH_BOTTOM.filter(opt => opt !== SOFTWARE_OTHER).map((opt, index) => {
          const isSelected = selected === opt;
          return (
            <motion.button key={opt} onClick={() => onSelect(opt)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (2 + SOFTWARE_GRID.length + index) * 0.02, duration: 0.25 }}
              className={`col-span-2 flex items-center justify-between gap-2 p-3 rounded-xl border-2 transition-all text-left ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"}`}
              whileTap={{ scale: 0.97 }}
            >
              <span className="font-medium text-foreground text-[13px] leading-tight">{opt}</span>
              <RadioDot selected={isSelected} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
/* ─── Step 7: Referral ─── */
function StepReferral({ selected, onSelect, otherText, setOtherText }: { selected: string | null; onSelect: (v: string) => void; otherText: string; setOtherText: (v: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <StepHeader step={6} title={t("onboarding.step7Title")} desc={t("onboarding.step7Desc")} />
      <div className="space-y-2">
        {REFERRAL_OPTIONS.map((opt, index) => {
          const isSelected = selected === opt;
          return (
            <motion.button key={opt} onClick={() => onSelect(opt)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03, duration: 0.25 }}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"}`}
              whileTap={{ scale: 0.97 }}
            >
              <span className="font-medium text-foreground text-[15px]">{opt}</span>
              <RadioDot selected={isSelected} />
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {selected === "Altro" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="pt-1 pb-4">
              <Input value={otherText} onChange={(e) => setOtherText(e.target.value)} placeholder="Dicci di più (facoltativo)" className="h-13 rounded-xl bg-card border-border text-base shadow-sm focus:border-primary/50 transition-all placeholder:text-muted-foreground/40" autoFocus />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Step 8: Flow Diagram ─── */
function StepFlowDiagram() {
  const { t } = useTranslation();

  const stages = [
    {
      icon: Link2,
      label: t("onboarding.flowStep1Label"),
      desc: t("onboarding.flowStep1Desc"),
      gradient: "linear-gradient(135deg, hsl(210 80% 55%), hsl(210 75% 45%))",
      bgTint: "hsl(210 80% 55% / 0.06)",
      borderTint: "hsl(210 80% 55% / 0.15)",
      delay: 0.4,
    },
    {
      icon: Calendar,
      label: t("onboarding.flowStep2Label"),
      desc: t("onboarding.flowStep2Desc"),
      gradient: "var(--gradient-hero)",
      bgTint: "hsl(340 65% 55% / 0.06)",
      borderTint: "hsl(340 65% 55% / 0.15)",
      delay: 0.8,
    },
    {
      icon: Bell,
      label: t("onboarding.flowStep3Label"),
      desc: t("onboarding.flowStep3Desc"),
      gradient: "linear-gradient(135deg, hsl(142 70% 42%), hsl(142 65% 35%))",
      bgTint: "hsl(142 70% 40% / 0.06)",
      borderTint: "hsl(142 70% 40% / 0.15)",
      delay: 1.2,
    },
  ];

  const channels = [
    { icon: Bell, label: "Push", gradient: "linear-gradient(135deg, hsl(340 65% 55%), hsl(340 60% 45%))" },
    { icon: MessageCircle, label: "WhatsApp", gradient: "linear-gradient(135deg, hsl(142 70% 42%), hsl(142 65% 35%))" },
    { icon: Smartphone, label: "SMS", gradient: "linear-gradient(135deg, hsl(210 80% 55%), hsl(210 75% 45%))" },
  ];

  return (
    <div className="flex flex-col items-center text-center pt-2 sm:pt-4 space-y-6">
      {/* Title */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-2 max-w-sm">
        <RichText text={t("onboarding.flowDiagramTitle")} as="h1" className="text-[1.65rem] sm:text-3xl font-extrabold text-foreground leading-[1.15] tracking-tight" />
        <RichText text={t("onboarding.flowDiagramDesc")} as="p" className="text-muted-foreground text-sm leading-relaxed" />
      </motion.div>

      {/* Vertical flow */}
      <div className="w-full max-w-sm space-y-0 pt-1">
        {stages.map((s, i) => (
          <div key={i}>
            <motion.div
              className="relative flex items-start gap-3.5 p-4 rounded-2xl border shadow-sm"
              style={{ background: s.bgTint, borderColor: s.borderTint }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: s.delay, type: "spring", stiffness: 160, damping: 18 }}
            >
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                style={{ background: s.gradient }}
              >
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-left space-y-0.5 min-w-0 flex-1">
                <p className="text-[15px] font-bold text-foreground leading-snug">{s.label}</p>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>

              {/* Channel badges inside the notification card */}
              {i === stages.length - 1 && (
                <motion.div
                  className="flex flex-col gap-1 shrink-0 pt-0.5"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: s.delay + 0.3 }}
                >
                  {channels.map((ch, ci) => (
                    <div key={ci} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: "hsl(142 70% 42% / 0.10)", borderWidth: 1, borderColor: "hsl(142 70% 42% / 0.18)" }}>
                      <ch.icon className="h-2.5 w-2.5" style={{ color: "hsl(142 70% 35%)" }} />
                      <span className="text-[9px] font-bold whitespace-nowrap" style={{ color: "hsl(142 70% 35%)" }}>{ch.label}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>

            {i < stages.length - 1 && (
              <motion.div
                className="flex justify-center py-2"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: s.delay + 0.25, duration: 0.35 }}
                style={{ transformOrigin: "top" }}
              >
                <svg width="24" height="28" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2 L12 18" stroke="hsl(340 65% 55% / 0.4)" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M6 16 L12 24 L18 16" stroke="hsl(340 65% 55% / 0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </motion.div>
            )}
          </div>
        ))}

      </div>
    </div>
  );
}

/* ─── Step 10: Booking Link ─── */
function StepBookingLink({ userId }: { userId?: string }) {
  const { t } = useTranslation();
  const [bookingSlug, setBookingSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  useEffect(() => {
    if (!userId) return;

    const slugify = (name: string) =>
      name
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);

    const randomSuffix = () => {
      const chars = "abcdefghjkmnpqrstuvwxyz23456789";
      let s = "";
      for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
      return s;
    };

    const init = async () => {
      const { data } = await supabase.from("profiles").select("booking_slug, salon_name").eq("user_id", userId).single();

      const baseName = data?.salon_name ? slugify(data.salon_name) : "";
      const currentSlug = data?.booking_slug?.trim() || "";
      const shouldUseSalonSlug = Boolean(baseName);
      const alreadyMatchesSalonName = shouldUseSalonSlug && (currentSlug === baseName || currentSlug.startsWith(`${baseName}-`));

      if (currentSlug && alreadyMatchesSalonName) {
        setBookingSlug(currentSlug);
        return;
      }

      let slug = shouldUseSalonSlug ? baseName : currentSlug || randomSuffix();

      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("booking_slug", slug)
        .neq("user_id", userId)
        .maybeSingle();

      if (existing) {
        slug = `${slug}-${randomSuffix()}`;
      }

      await supabase.from("profiles").update({ booking_slug: slug, booking_enabled: true } as any).eq("user_id", userId);
      setBookingSlug(slug);
    };
    init();
  }, [userId]);

  const bookingUrl = bookingSlug
    ? `glow-up.it/app/${bookingSlug}`
    : null;
  const bookingUrlFull = bookingSlug
    ? `${window.location.origin}/app/${bookingSlug}`
    : null;

  const handleCopy = () => {
    if (!bookingUrlFull) return;
    navigator.clipboard.writeText(bookingUrlFull);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const useCases = [
    { icon: Sparkles, text: t("onboarding.flowBookingUse1") },
    { icon: MapPin, text: t("onboarding.flowBookingUse2") },
    { icon: Monitor, text: t("onboarding.flowBookingUse3") },
    { icon: MessageCircle, text: t("onboarding.flowBookingUse4") },
  ];

  return (
    <div className="flex flex-col items-center justify-center text-center pt-2 sm:pt-6 space-y-5 px-1">
      {/* Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
        className="relative"
      >
        <div className="absolute inset-0 rounded-full bg-primary/25 blur-2xl scale-[2]" />
        <div className="relative h-16 w-16 rounded-full flex items-center justify-center shadow-lg" style={{ background: "var(--gradient-hero)" }}>
          <Link2 className="h-8 w-8 text-primary-foreground" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.div className="space-y-1.5 max-w-sm" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <RichText text={t("onboarding.flowBookingLinkTitle")} as="h1" className="text-[1.5rem] sm:text-3xl font-extrabold text-foreground leading-[1.1] tracking-tight" />
        <RichText text={t("onboarding.flowBookingLinkDesc")} as="p" className="text-muted-foreground text-sm leading-relaxed" />
      </motion.div>

      {/* Copyable link card */}
      {bookingUrl ? (
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.45, type: "spring" }}
        >
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] bg-white shadow-md"
            style={{
              borderColor: copied ? "hsl(142 70% 45% / 0.4)" : "hsl(var(--primary) / 0.25)",
            }}
          >
            <div className="flex-1 text-center">
              <p className="text-[13px] font-mono text-foreground break-all leading-relaxed">{bookingUrl}</p>
            </div>
            <div
              className="shrink-0 h-11 w-11 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: copied ? "linear-gradient(135deg, hsl(142 70% 45%), hsl(142 65% 38%))" : "var(--gradient-hero)" }}
            >
              {copied ? <Check className="h-5 w-5 text-white" /> : <Copy className="h-5 w-5 text-primary-foreground" />}
            </div>
          </button>

          <motion.p
            className="text-xs font-medium mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            style={{ color: copied ? "hsl(142 70% 40%)" : "hsl(var(--muted-foreground))" }}
          >
            {copied ? t("onboarding.flowBookingLinkCopied") : t("onboarding.flowBookingLinkHint")}
          </motion.p>
        </motion.div>
      ) : (
        <motion.div className="w-full max-w-sm h-16 rounded-2xl bg-muted/40 animate-pulse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      )}

      {/* Use cases */}
      <motion.div
        className="w-full max-w-sm grid grid-cols-2 gap-2 pt-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85 }}
      >
        {useCases.map((uc, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-border/50 shadow-sm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95 + i * 0.08 }}
          >
            <uc.icon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-[11px] font-semibold text-foreground/80 text-left leading-tight">{uc.text}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* PWA install hint */}
      <motion.div
        className="w-full max-w-sm flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/30 mt-1"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <Smartphone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-left space-y-2">
          <p className="text-[13px] font-semibold text-foreground">
            {t("onboarding.flowPwaTitle")}
          </p>
          {(() => {
            const ua = navigator.userAgent;
            const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
            const isSafari = isIOSDevice && !/CriOS|FxiOS/i.test(ua);

            const steps = isSafari
              ? [
                  { label: "Tocca", badge: "↑", desc: "Condividi" },
                  { label: "Poi", badge: null, desc: "Aggiungi alla schermata Home" },
                ]
              : [
                  { label: "Tocca", badge: "⋮", desc: "Menu" },
                  { label: "Poi", badge: null, desc: "Condividi" },
                  { label: "Infine", badge: null, desc: "Installa app o Aggiungi alla schermata Home" },
                ];

            return (
              <table className="w-full border-separate border-spacing-y-1">
                <tbody>
                  {steps.map((s, i) => (
                    <tr key={i}>
                      <td className="text-[10px] font-bold uppercase tracking-wide text-primary pr-2 align-middle whitespace-nowrap w-0">{s.label}</td>
                      <td className="align-middle">
                        <div className="flex items-center gap-1.5">
                          {s.badge && (
                            <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-foreground/10 text-foreground font-black text-base shrink-0">
                              {s.badge}
                            </span>
                          )}
                          {s.badge && <span className="text-muted-foreground text-xs">→</span>}
                          <span className="text-[12px] text-foreground/80 font-medium leading-tight">{s.desc}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Step 9: Success ─── */
function StepSuccess() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center text-center pt-8 sm:pt-14 space-y-6 px-2">
      {/* Animated check icon with glow */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.1 }}
        className="relative"
      >
        <div className="absolute inset-0 rounded-full bg-primary/30 blur-3xl scale-[2]" />
        <div className="absolute inset-0 rounded-full bg-primary/15 blur-xl scale-[1.6] animate-pulse" />
        <div className="relative h-28 w-28 rounded-full flex items-center justify-center shadow-xl" style={{ background: "var(--gradient-hero)" }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.4 }}
          >
            <CheckCircle2 className="h-14 w-14 text-primary-foreground drop-shadow-md" />
          </motion.div>
        </div>
      </motion.div>

      {/* Title */}
      <motion.div className="space-y-2 max-w-sm" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <RichText text={t("onboarding.successTitle")} as="h1" className="text-[1.85rem] sm:text-4xl font-extrabold text-foreground leading-[1.1] tracking-tight" />
      </motion.div>

      {/* Trial info card */}
      <motion.div
        className="w-full max-w-sm rounded-2xl border border-primary/15 bg-white p-5 space-y-4 shadow-lg shadow-primary/5"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
      >
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[15px] font-bold shadow-md"
          style={{ background: "var(--gradient-hero)", color: "hsl(var(--primary-foreground))" }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.65, type: "spring", stiffness: 300 }}
        >
          <Sparkles className="h-4 w-4" />
          {t("onboarding.successTrialBadge")}
        </motion.div>

        {/* Description */}
        <RichText text={t("onboarding.successTrialDesc")} as="p" className="text-foreground/90 text-[17px] leading-relaxed" />

        {/* Bullet points */}
        <div className="flex flex-col items-start gap-2.5 pt-1">
          {[
            "Tutte le funzionalità sbloccate",
            "Nessuna carta di credito necessaria",
            "Disdici quando vuoi, zero vincoli",
          ].map((item, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2.5 text-[15px] text-foreground/80"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.75 + i * 0.1 }}
            >
              <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--gradient-hero)" }}>
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="font-medium">{item}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Shared Radio Dot ─── */
function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "border-primary bg-primary" : "border-muted-foreground/30 bg-transparent"}`}>
      {selected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
          <Check className="h-3 w-3 text-primary-foreground" />
        </motion.div>
      )}
    </div>
  );
}
