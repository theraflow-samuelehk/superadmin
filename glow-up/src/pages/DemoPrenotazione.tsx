import { useState, useEffect, useCallback, useRef } from "react";
import { trackFunnelStep, trackFunnelCTA } from "@/lib/funnelTracking";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Phone, PhoneOff, Calendar, Clock, CheckCircle2,
  ChevronRight, ChevronDown, Bell, MessageCircle, Smartphone,
  ArrowRight, ArrowLeft, Sparkles, X, User, TrendingUp, Ban,
  AlertTriangle, Euro, BarChart3, Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLocalization } from "@/hooks/useLocalization";
import demoStressedEsthetician from "@/assets/hero-stressed-real.png";
import demoIgProfile from "@/assets/demo-ig-profile.jpg";
import demoIgPost1 from "@/assets/demo-ig-post1.jpg";
import demoIgPost2 from "@/assets/demo-ig-post2.jpg";
import demoIgPost3 from "@/assets/demo-ig-post3.jpg";
import glowUpIcon from "@/assets/glow-up-icon.png";
import serviceManicure from "@/assets/service-manicure.jpg";
import serviceWaxing from "@/assets/service-waxing.jpg";
import serviceFacial from "@/assets/service-facial.jpg";
import serviceMassage from "@/assets/service-massage.jpg";
import serviceLashes from "@/assets/service-lashes.jpg";
import serviceAnticellulite from "@/assets/service-anticellulite.jpg";
import operatorSara from "@/assets/operator-sara.jpg";
import operatorGiulia from "@/assets/operator-giulia.jpg";
import benefitRelax from "@/assets/benefit-relax.png";
import benefitNoshow from "@/assets/benefit-noshow.png";
import benefitCancel from "@/assets/benefit-cancel.png";
import benefitOntime from "@/assets/benefit-ontime.png";
import benefitRevenue from "@/assets/benefit-revenue.png";

/* ─── Mock Data ─── */
const SERVICES = [
  { id: "1", name: "Manicure Semipermanente", duration: "45 min", price: "€35", img: serviceManicure },
  { id: "2", name: "Ceretta Gambe Intere", duration: "60 min", price: "€30", img: serviceWaxing },
  { id: "3", name: "Pulizia Viso Profonda", duration: "75 min", price: "€55", img: serviceFacial },
  { id: "4", name: "Massaggio Rilassante", duration: "60 min", price: "€45", img: serviceMassage },
  { id: "5", name: "Extension Ciglia", duration: "90 min", price: "€75", img: serviceLashes },
  { id: "6", name: "Trattamento Anticellulite", duration: "50 min", price: "€50", img: serviceAnticellulite },
];

type DemoOperatorId = "any" | "sara" | "giulia";
type ConcreteOperatorId = Exclude<DemoOperatorId, "any">;

type DemoAgendaAppointment = {
  start: string;
  duration: number;
  name: string;
  service: string;
};

const DEMO_YEAR = 2026;
const DEMO_MONTH = 2;
// Generate slots every 15 min from 09:00 to 16:45
const ALL_TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let h = 9; h <= 16; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
})();
const AGENDA_START_MINUTES = 9 * 60;
const AGENDA_END_MINUTES = 17 * 60;
const AGENDA_TOTAL_MINUTES = AGENDA_END_MINUTES - AGENDA_START_MINUTES;

const OPERATORS: { id: DemoOperatorId; name: string; photo: string | null }[] = [
  { id: "any", name: "Prima disponibile", photo: null },
  { id: "sara", name: "Sara", photo: operatorSara },
  { id: "giulia", name: "Giulia", photo: operatorGiulia },
];

const OPERATOR_PRIORITY: ConcreteOperatorId[] = ["sara", "giulia"];

const parseDurationMinutes = (duration: string) => Number.parseInt(duration, 10) || 0;
const parsePriceAmount = (price: string) => Number.parseFloat(price.replace("€", "").replace(",", ".").trim()) || 0;
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const getAppointmentStyle = (start: string, duration: number) => ({
  top: `${((timeToMinutes(start) - AGENDA_START_MINUTES) / AGENDA_TOTAL_MINUTES) * 100}%`,
  height: `${(duration / AGENDA_TOTAL_MINUTES) * 100}%`,
});

const appointmentOverlaps = (start: string, duration: number, appointments: DemoAgendaAppointment[]) => {
  const BUFFER_MINUTES = 5;
  const startMinutes = timeToMinutes(start);
  const endMinutes = startMinutes + duration;

  return appointments.some((appointment) => {
    const appointmentStart = timeToMinutes(appointment.start);
    const appointmentEnd = appointmentStart + appointment.duration;
    return startMinutes < (appointmentEnd + BUFFER_MINUTES) && endMinutes > (appointmentStart - BUFFER_MINUTES);
  });
};

const getAgendaForDay = (day: number): Record<ConcreteOperatorId, DemoAgendaAppointment[]> => {
  switch (day % 3) {
    case 0:
      return {
        sara: [
          { start: "09:00", duration: 60, name: "Laura B.", service: "Ceretta gambe" },
          { start: "13:00", duration: 45, name: "Chiara M.", service: "Manicure" },
        ],
        giulia: [
          { start: "10:00", duration: 75, name: "Anna T.", service: "Pulizia viso" },
          { start: "14:30", duration: 60, name: "Elena R.", service: "Massaggio" },
        ],
      };
    case 1:
      return {
        sara: [
          { start: "09:30", duration: 60, name: "Laura B.", service: "Ceretta gambe" },
          { start: "14:00", duration: 50, name: "Chiara M.", service: "Anticellulite" },
        ],
        giulia: [
          { start: "11:00", duration: 75, name: "Anna T.", service: "Pulizia viso" },
          { start: "15:00", duration: 60, name: "Elena R.", service: "Massaggio" },
        ],
      };
    default:
      return {
        sara: [
          { start: "09:00", duration: 60, name: "Laura B.", service: "Ceretta gambe" },
          { start: "11:30", duration: 45, name: "Chiara M.", service: "Manicure" },
        ],
        giulia: [
          { start: "10:00", duration: 75, name: "Anna T.", service: "Pulizia viso" },
          { start: "14:30", duration: 60, name: "Elena R.", service: "Massaggio" },
        ],
      };
  }
};

const getAvailableSlotsForOperator = (day: number, operatorId: ConcreteOperatorId, duration: number) => {
  const agenda = getAgendaForDay(day)[operatorId];
  const endLimit = AGENDA_END_MINUTES; // 17:00
  return ALL_TIME_SLOTS.filter((slot) => {
    const startMin = timeToMinutes(slot);
    const endMin = startMin + duration;
    if (endMin > endLimit) return false; // don't overflow past 17:00
    return !appointmentOverlaps(slot, duration, agenda);
  });
};

const getFirstAvailableAssignments = (day: number, duration: number) => {
  const agenda = getAgendaForDay(day);
  const endLimit = AGENDA_END_MINUTES;

  return ALL_TIME_SLOTS.flatMap((slot) => {
    const startMin = timeToMinutes(slot);
    const endMin = startMin + duration;
    if (endMin > endLimit) return [];
    const operatorId = OPERATOR_PRIORITY.find((candidate) => !appointmentOverlaps(slot, duration, agenda[candidate]));
    return operatorId ? [{ time: slot, operatorId }] : [];
  });
};

/* ─── Case Study Data ─── */
const CASE = {
  name: "Centro Estetico Bella Vita",
  city: "Milano",
  month: "Gennaio 2025",
  before: {
    appointments: 240,
    noShows: 48, // 20%
    noShowPct: 20,
    avgTicket: 55,
    lostRevenue: 2640, // 48 * 55
    revenue: 10560, // (240-48)*55
  },
  after: {
    appointments: 240,
    noShows: 5, // ~2%
    noShowPct: 2,
    recovered: 43, // appointments saved
    recoveredRevenue: 2365, // 43 * 55
    revenue: 12925, // (240-5)*55
    revenueLift: 22, // % increase
  },
};

/* ─── Step Components ─── */

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 justify-center mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-500 ${
            i === current ? "w-8 bg-primary" : i < current ? "w-4 bg-primary/40" : "w-4 bg-border"
          }`}
        />
      ))}
    </div>
  );
}

function HeroStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center text-center px-6 pt-2"
    >
      {/* Illustration with vibration + glow behind */}
       <div className="relative mb-5">
        <div className="absolute inset-0 -m-8 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(340 65% 55% / 0.25), hsl(340 45% 80% / 0.1) 60%, transparent 80%)" }} />
        <motion.img
          src={demoStressedEsthetician}
          alt="Estetista stressata dal telefono"
          className="relative w-full max-w-[320px] h-auto rounded-2xl shadow-xl object-cover"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <h1 className="text-[26px] font-bold text-foreground mb-1 leading-tight">
        Stai facendo un trattamento.
      </h1>
      <h2 className="text-[24px] font-bold text-primary mb-4 leading-tight">
        Ma il telefono squilla.<br />Di nuovo.
      </h2>

      <div className="bg-card rounded-2xl shadow-soft border border-border/40 px-5 py-4 mb-5 max-w-xs w-full">
        <p className="text-muted-foreground text-sm mb-3">
          Ogni chiamata persa è un cliente<br />che non prenota.
        </p>
        <p className="text-foreground text-lg font-bold leading-snug">
          E se invece i clienti prenotassero{" "}
          <span className="text-gradient-primary text-xl">da soli?</span>
        </p>
      </div>

      <Button 
        variant="hero" 
        size="lg" 
        onClick={onNext}
        className="w-full max-w-xs gap-2 shadow-lg"
      >
        Vedi come funziona
        <ArrowRight className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-2 mt-4">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
        <p className="text-xs font-medium text-primary/70">
          Nessun account richiesto • Demo interattiva
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Animated finger tap indicator ─── */
function TapHere({ label, delay = 1 }: { label?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring" }}
      className="flex items-center gap-1"
    >
      <motion.span
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.6 }}
        className="text-base"
      >
        👆
      </motion.span>
      {label && <span className="text-[10px] font-bold text-primary">{label}</span>}
    </motion.div>
  );
}

/* ─── Animated tap circle indicator for mockup CTAs (positioned right) ─── */
function TapCircle({ delay = 1 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="absolute right-2 -bottom-2 flex items-center justify-center pointer-events-none z-10"
    >
      {/* Expanding ripple rings */}
      <motion.div
        animate={{ scale: [0.7, 1.3], opacity: [0.6, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.3 }}
        className="absolute w-12 h-12 rounded-full border-2 border-primary"
      />
      <motion.div
        animate={{ scale: [0.7, 1.5], opacity: [0.4, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.3, delay: 0.2 }}
        className="absolute w-12 h-12 rounded-full border border-primary/50"
      />
      {/* Finger + label */}
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 0.5 }}
        className="flex flex-col items-center z-10 bg-primary/90 rounded-full px-2 py-1 shadow-lg"
      >
        <span className="text-xs">👆</span>
        <span className="text-[7px] font-bold text-primary-foreground leading-none">TAP!</span>
      </motion.div>
    </motion.div>
  );
}

/* ─── Mini Instagram Profile Mockup (realistic with AI images) ─── */
function InstagramMockup({ onTap, disabled }: { onTap: () => void; disabled: boolean }) {
  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${disabled ? "opacity-30 scale-95 pointer-events-none" : "border-border shadow-soft"}`}>
      {/* IG gradient top bar */}
      <div className="h-1 bg-gradient-to-r from-[hsl(45_95%_55%)] via-[hsl(340_80%_55%)] to-[hsl(280_70%_55%)]" />
      
      {/* IG header */}
      <div className="bg-card px-3 py-1.5 flex items-center justify-between border-b border-border/50">
        <svg className="w-[65px] h-[18px]" viewBox="0 0 120 34" fill="currentColor" opacity="0.8">
          <text x="0" y="26" fontFamily="serif" fontStyle="italic" fontSize="22" fontWeight="600" className="text-foreground">Instagram</text>
        </svg>
        <div className="flex gap-2.5">
          <span className="text-foreground/40 text-xs">♡</span>
          <span className="text-foreground/40 text-xs">✉</span>
        </div>
      </div>

      {/* Profile section */}
      <div className="bg-card px-3 py-2.5">
        <div className="flex items-center gap-3 mb-2">
          {/* Profile picture */}
          <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-[hsl(45_95%_55%)] via-[hsl(340_80%_55%)] to-[hsl(280_70%_55%)] shrink-0">
            <div className="w-full h-full rounded-full bg-card p-[2px]">
              <img src={demoIgProfile} alt="Profile" className="w-full h-full rounded-full object-cover" />
            </div>
          </div>
          {/* Stats centered */}
          <div className="flex flex-1 justify-around text-center">
            <div><p className="text-sm font-bold text-foreground">847</p><p className="text-[9px] text-muted-foreground">Post</p></div>
            <div><p className="text-sm font-bold text-foreground">12.4k</p><p className="text-[9px] text-muted-foreground">Follower</p></div>
            <div><p className="text-sm font-bold text-foreground">534</p><p className="text-[9px] text-muted-foreground">Seguiti</p></div>
          </div>
        </div>
        <p className="text-[11px] font-bold text-foreground">Centro Estetico Bella Vita ✨</p>
        <p className="text-[9px] text-muted-foreground leading-snug">
          💅 Estetica professionale a Milano
        </p>
        <p className="text-[9px] text-muted-foreground leading-snug mb-2">
          📍 Via Roma 42 • 🕐 Lun-Sab 9-19
        </p>

        {/* LINK IN BIO - the key tappable element with animated dashed border */}
        <button onClick={onTap} className="w-full relative group">
          <div className="relative flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2.5 transition-all group-hover:bg-primary/20 group-active:scale-95 group-active:bg-primary/25 overflow-visible">
            {/* Animated dashed border via SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "visible" }}>
              <rect x="0" y="0" width="100%" height="100%" rx="8" ry="8" fill="none"
                stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="8 5"
              >
                <animate attributeName="stroke-dashoffset" from="26" to="0" dur="2.2s" repeatCount="indefinite" />
              </rect>
            </svg>
            <span className="text-[10px]">🔗</span>
            <span className="text-[10px] font-semibold text-primary truncate">glow-up.it/prenota/bella-vita</span>
          </div>
          <TapCircle delay={1} />
        </button>
      </div>
      
      {/* Grid preview - 3 AI-generated photos */}
      <div className="grid grid-cols-3 gap-[1px] bg-border/30">
        <div className="aspect-square"><img src={demoIgPost1} alt="" className="w-full h-full object-cover" /></div>
        <div className="aspect-square"><img src={demoIgPost2} alt="" className="w-full h-full object-cover" /></div>
        <div className="aspect-square"><img src={demoIgPost3} alt="" className="w-full h-full object-cover" /></div>
      </div>
    </div>
  );
}

/* ─── Realistic Google Maps Mockup ─── */
function GoogleMapsMockup({ onTap, disabled }: { onTap: () => void; disabled: boolean }) {
  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${disabled ? "opacity-30 scale-95 pointer-events-none" : "border-border shadow-lg"}`}>
      {/* Search bar */}
      <div className="bg-card px-2.5 py-2 flex items-center gap-2 border-b border-border/40">
        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#4285f4" }}>
          <span className="text-[8px] text-white font-bold">G</span>
        </div>
        <div className="flex-1 rounded-full px-3 py-1" style={{ background: "#f1f3f4" }}>
          <span className="text-[9px]" style={{ color: "#5f6368" }}>Centro Estetico Bella Vita</span>
        </div>
      </div>

      {/* Map area — urban city style */}
      <div className="relative" style={{ height: 80 }}>
        <div className="absolute inset-0" style={{ background: "#f2efe9" }}>
          {/* Main roads (grey) */}
          <div className="absolute top-[38%] left-0 right-0 h-[4px]" style={{ background: "#ffffff", boxShadow: "0 0.5px 0 rgba(0,0,0,0.08)" }} />
          <div className="absolute top-[70%] left-0 right-[30%] h-[3px]" style={{ background: "#ffffff" }} />
          <div className="absolute top-0 bottom-0 left-[22%] w-[4px]" style={{ background: "#ffffff", boxShadow: "0.5px 0 0 rgba(0,0,0,0.08)" }} />
          <div className="absolute top-0 bottom-0 left-[55%] w-[3px]" style={{ background: "#ffffff" }} />
          <div className="absolute top-0 bottom-0 right-[18%] w-[3px]" style={{ background: "#ffffff" }} />
          <div className="absolute top-[15%] left-[65%] right-[22%] h-[2px]" style={{ background: "#ffffff" }} />
          {/* Buildings (beige/grey blocks) */}
          <div className="absolute top-[5%] left-[26%] w-[26%] h-[28%] rounded-[1px]" style={{ background: "#e6e2da" }} />
          <div className="absolute top-[5%] left-[58%] w-[20%] h-[28%] rounded-[1px]" style={{ background: "#e8e4dc" }} />
          <div className="absolute top-[44%] left-[3%] w-[16%] h-[22%] rounded-[1px]" style={{ background: "#e6e2da" }} />
          <div className="absolute top-[44%] left-[26%] w-[26%] h-[22%] rounded-[1px]" style={{ background: "#dfdbd3" }} />
          <div className="absolute top-[44%] left-[58%] w-[22%] h-[50%] rounded-[1px]" style={{ background: "#e6e2da" }} />
          <div className="absolute top-[74%] left-[3%] w-[16%] h-[22%] rounded-[1px]" style={{ background: "#e8e4dc" }} />
          <div className="absolute top-[74%] left-[26%] w-[12%] h-[22%] rounded-[1px]" style={{ background: "#e2ded6" }} />
          {/* Green area / park */}
          <div className="absolute top-[5%] left-[3%] w-[16%] h-[28%] rounded-[2px]" style={{ background: "#d4e8c2" }} />
        </div>
        {/* Pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10">
          <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <svg width="20" height="28" viewBox="0 0 20 28">
              <path d="M10 0C4.5 0 0 4.5 0 10c0 7.5 10 18 10 18s10-10.5 10-18C20 4.5 15.5 0 10 0z" fill="#ea4335"/>
              <circle cx="10" cy="10" r="4" fill="#b31412"/>
            </svg>
          </motion.div>
        </div>
        <div className="absolute top-[52%] left-1/2 -translate-x-1/2 w-4 h-1 rounded-full" style={{ background: "rgba(0,0,0,0.12)" }} />
      </div>

      {/* Business info card */}
      <div className="bg-card px-3 py-2.5">
        <p className="text-[13px] font-bold text-foreground leading-tight">Centro Estetico Bella Vita</p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px] font-bold" style={{ color: "#fbbc04" }}>4.8</span>
          <div className="flex gap-px">
            {[1,2,3,4,5].map(i => (
              <svg key={i} width="9" height="9" viewBox="0 0 24 24" fill={i <= 4 ? "#fbbc04" : "none"} stroke="#fbbc04" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground">(312)</span>
        </div>
        <p className="text-[9px] text-muted-foreground mt-0.5">Centro estetico • Via Roma 42</p>

        {/* Action buttons — centered, closer together */}
        <div className="flex justify-center gap-4 mt-2.5">
          {[
            { icon: <Phone className="w-3.5 h-3.5 text-white" />, label: "Chiama" },
            { icon: <ArrowRight className="w-3.5 h-3.5 text-white -rotate-45" />, label: "Indicazioni" },
            { icon: <Smartphone className="w-3.5 h-3.5 text-white" />, label: "Sito web" },
          ].map(b => (
            <div key={b.label} className="flex flex-col items-center gap-0.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#4285f4" }}>
                {b.icon}
              </div>
              <span className="text-[7px] text-muted-foreground">{b.label}</span>
            </div>
          ))}

          {/* Prenota with marching ants — strokeWidth 2 like IG link */}
          <button onClick={onTap} className="flex flex-col items-center gap-0.5 relative group">
            <div className="relative">
              <svg className="absolute -inset-[5px]" width="46" height="46" viewBox="0 0 46 46">
                <circle cx="23" cy="23" r="21" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="8 5" strokeLinecap="round" opacity="0.9">
                  <animate attributeName="stroke-dashoffset" from="0" to="-26" dur="2.2s" repeatCount="indefinite" />
                </circle>
              </svg>
              <div className="w-9 h-9 rounded-full flex items-center justify-center group-active:scale-90 group-active:brightness-75 transition-all" style={{ background: "#4285f4" }}>
                <Calendar className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <span className="text-[7px] font-bold" style={{ color: "#4285f4" }}>Prenota</span>
            <motion.div
              className="absolute -bottom-1 -right-6 pointer-events-none"
              animate={{ scale: [0.85, 1.05, 0.85], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center shadow-md">
                <span className="text-[8px]">👆</span>
              </div>
            </motion.div>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Realistic iPhone Mockup — narrow, marching-ants rounded-rect selection ─── */
function AppMockup({ onTap, disabled }: { onTap: () => void; disabled: boolean }) {
  return (
    <div className={`mx-auto transition-all duration-300 ${disabled ? "opacity-30 scale-95 pointer-events-none" : ""}`} style={{ maxWidth: 150 }}>
      {/* iPhone frame */}
      <div className="relative border-[3px] border-foreground/80 bg-black shadow-xl overflow-hidden rounded-[22px]">
        {/* Dynamic Island */}
        <div className="absolute top-[3px] left-1/2 -translate-x-1/2 w-[48px] h-[10px] bg-black rounded-full z-30" />

        {/* Screen */}
        <div className="relative rounded-[19px] overflow-hidden">
          {/* Status bar */}
          <div className="relative pt-[14px] px-3 pb-0.5 flex items-center justify-between" style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)" }}>
            <span className="text-[7px] text-white/90 font-semibold">9:41</span>
            <div className="flex items-center gap-1">
              <svg width="10" height="7" viewBox="0 0 16 12"><path d="M1 9h2v3H1zM5 6h2v6H5zM9 3h2v9H9zM13 0h2v12h-2z" fill="white" opacity="0.8"/></svg>
              <svg width="14" height="7" viewBox="0 0 28 12"><rect x="0" y="1" width="22" height="10" rx="2.5" fill="none" stroke="white" strokeWidth="1" opacity="0.4"/><rect x="1.5" y="2.5" width="17" height="7" rx="1.5" fill="white" opacity="0.7"/></svg>
            </div>
          </div>

          {/* Wallpaper */}
          <div className="relative flex flex-col items-center" style={{ 
            background: "linear-gradient(170deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #533483 85%, #e94560 100%)",
            minHeight: 180,
            paddingTop: 16,
            paddingBottom: 6,
          }}>
            <p className="text-[6px] text-white/40 font-medium tracking-wider uppercase mb-6">Martedì 18 Marzo</p>

            {/* Glow Up icon */}
            <button onClick={onTap} className="flex flex-col items-center gap-1 relative group">
              <div className="relative">
                {/* Marching ants rounded-rect */}
                <svg className="absolute -inset-[6px]" width="52" height="52" viewBox="0 0 52 52">
                  <rect x="2" y="2" width="48" height="48" rx="13" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="8 5" strokeLinecap="round" opacity="0.9">
                    <animate attributeName="stroke-dashoffset" from="0" to="-26" dur="2.2s" repeatCount="indefinite" />
                  </rect>
                </svg>
                <div className="w-[40px] h-[40px] rounded-[10px] overflow-hidden shadow-lg group-active:scale-90 group-active:brightness-75 transition-all ring-1 ring-white/20">
                  <img src={glowUpIcon} alt="Glow Up" className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="text-[7px] text-white font-medium drop-shadow-sm">Glow Up</span>
              {/* Tap hint */}
              <motion.div
                className="absolute -bottom-3 -right-6 pointer-events-none"
                animate={{ scale: [0.85, 1.05, 0.85], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="w-5 h-5 rounded-full bg-primary/80 flex items-center justify-center shadow-md">
                  <span className="text-[8px]">👆</span>
                </div>
              </motion.div>
            </button>
          </div>

          {/* Dock */}
          <div className="px-3 py-1.5 flex justify-center gap-3" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(20px)" }}>
            <div className="w-[22px] h-[22px] rounded-[6px] bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center">
              <Phone className="w-2.5 h-2.5 text-white" />
            </div>
            <div className="w-[22px] h-[22px] rounded-[6px] bg-gradient-to-b from-blue-500 to-indigo-600 flex items-center justify-center">
              <MessageCircle className="w-2.5 h-2.5 text-white" />
            </div>
            <div className="w-[22px] h-[22px] rounded-[6px] bg-gradient-to-b from-sky-400 to-blue-500 flex items-center justify-center">
              <ArrowRight className="w-2.5 h-2.5 text-white rotate-45" />
            </div>
            <div className="w-[22px] h-[22px] rounded-[6px] bg-gradient-to-b from-green-500 to-green-700 flex items-center justify-center">
              <span className="text-[8px]">💬</span>
            </div>
          </div>

          {/* Home indicator */}
          <div className="flex justify-center py-1" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="w-[40px] h-[2.5px] rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Compact WhatsApp Business Mockup ─── */
function WhatsAppBusinessMockup({ onTap, disabled }: { onTap: () => void; disabled: boolean }) {
  return (
    <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${disabled ? "opacity-30 scale-95 pointer-events-none" : "border-border shadow-soft"}`}>
      <div className="px-3 py-1.5 flex items-center gap-2" style={{ background: "hsl(142 50% 30%)" }}>
        <ArrowRight className="w-3.5 h-3.5 text-white/60 rotate-180" />
        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "hsl(142 30% 50%)" }}>
          <span className="text-xs">💆‍♀️</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-white truncate">Centro Estetico Bella Vita</p>
          <p className="text-[8px] text-white/60">Account Business</p>
        </div>
      </div>
      <div className="p-2.5 flex flex-col justify-end gap-2" style={{ background: "hsl(30 25% 90%)", backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M30 30c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10zM10 10c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10S10 15.5 10 10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>
        <div className="max-w-[90%] self-start">
          <div className="rounded-xl rounded-bl-sm px-2.5 py-2 shadow-sm bg-white">
            <p className="text-[8px] font-bold mb-0.5" style={{ color: "hsl(142 60% 35%)" }}>Centro Estetico Bella Vita</p>
            <p className="text-[9px] text-foreground leading-snug">Ciao! 👋 Prenota il tuo appuntamento online 💅</p>
            <button onClick={onTap} className="mt-1.5 w-full relative group">
              <div className="relative rounded-lg px-2.5 py-1.5 text-left transition-all group-active:scale-95 group-active:brightness-90 overflow-visible" style={{ background: "hsl(142 40% 95%)", border: "1px solid hsl(142 40% 85%)" }}>
                {/* Marching ants border */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "visible" }}>
                  <rect x="0" y="0" width="100%" height="100%" rx="8" ry="8" fill="none"
                    stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="8 5"
                  >
                    <animate attributeName="stroke-dashoffset" from="26" to="0" dur="2.2s" repeatCount="indefinite" />
                  </rect>
                </svg>
                <p className="text-[9px] font-semibold" style={{ color: "hsl(142 50% 35%)" }}>📅 Prenota appuntamento</p>
                <p className="text-[8px] text-muted-foreground">glow-up.it/prenota/bella-vita</p>
              </div>
              <TapCircle delay={1.3} />
            </button>
          </div>
        </div>
      </div>
      {/* Message input bar */}
      <div className="flex items-center gap-1.5 px-2 py-1.5" style={{ background: "hsl(30 25% 90%)" }}>
        <div className="flex-1 flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1.5 shadow-sm">
          <span className="text-[10px]">😊</span>
          <span className="text-[9px] text-muted-foreground flex-1">Messaggio</span>
          <span className="text-[10px]">📎</span>
          <span className="text-[10px]">📷</span>
        </div>
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "hsl(142 50% 35%)" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
        </div>
      </div>
    </div>
  );
}

/* ─── Source tabs config ─── */
const SOURCE_TABS = [
  { key: "instagram", icon: "📸", label: "Instagram", where: "Link in bio" },
  { key: "app", icon: "📱", label: "App", where: "Icona dell'App" },
  { key: "google", icon: "📍", label: "Maps", where: "Pulsante Prenota" },
  { key: "whatsapp", icon: "💬", label: "WhatsApp", where: "Link nel messaggio" },
] as const;

function ServicePickStep({ onNext, onRegisterBack, onRegisterNext }: { onNext: (serviceId: string) => void; onRegisterBack: (fn: (() => boolean) | null) => void; onRegisterNext: (fn: (() => boolean) | null) => void }) {
  const [showBooking, setShowBooking] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [tappedSource, setTappedSource] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Register a custom back handler: if in booking/loading, go back to mockups
  useEffect(() => {
    onRegisterBack(() => {
      if (showBooking || showLoading) {
        setShowBooking(false);
        setShowLoading(false);
        setTappedSource(null);
        return true; // handled
      }
      return false; // not handled, let parent go prev step
    });
    return () => onRegisterBack(null);
  }, [showBooking, showLoading, onRegisterBack]);

  // Register custom next handler so top Avanti triggers handleSourceTap
  useEffect(() => {
    if (!tappedSource) {
      onRegisterNext(() => {
        handleSourceTapRef.current();
        return true;
      });
    } else {
      onRegisterNext(null);
    }
    return () => onRegisterNext(null);
  }, [tappedSource, onRegisterNext]);

  const handleSourceTap = useCallback((source: string) => {
    setTappedSource(source);
    setShowLoading(true);
    setTimeout(() => {
      setShowLoading(false);
      setShowBooking(true);
    }, 5500);
  }, []);

  const handleSourceTapRef = useRef<() => void>(() => {});
  handleSourceTapRef.current = () => handleSourceTap(SOURCE_TABS[activeTab].key);

  /* Label shown inside the mockup CTA zone */
  const ctaLabels: Record<string, string> = {
    instagram: "Clicca sul link in bio!",
    app: "Clicca su Prenota Ora!",
    google: "Clicca su Prenota!",
    whatsapp: "Clicca sul link!",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4 }}
      className="px-4"
    >
      <AnimatePresence mode="wait">
        {!showBooking && !showLoading ? (
          <motion.div
            key="source-pick"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35 }}
          >
            {/* ── Storytelling header (LARGE) ── */}
            <div className="text-center mb-4">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-muted-foreground mb-1"
              >
                Una tua cliente{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 font-semibold text-foreground">vuole prenotare.</span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
                    className="absolute bottom-0 left-0 right-0 h-[40%] bg-primary/15 -z-0 rounded-sm"
                    style={{ transformOrigin: "left" }}
                  />
                </span>
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-[26px] font-bold text-foreground leading-tight mb-1"
              >
                Non chiama. Non aspetta.
              </motion.h2>
              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-[26px] font-bold leading-tight mb-2"
              >
                <span className="text-primary">Prenota da sola.</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xl font-bold text-foreground mt-3"
              >
                Da dove può farlo? 👇
              </motion.p>
            </div>

            {/* ── Animated dashed arrows SVG (steeper angle) ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="max-w-sm mx-auto"
            >
              <svg className="w-full h-12 overflow-visible" viewBox="0 0 320 48" fill="none" preserveAspectRatio="xMidYMid meet">
                {[0, 1, 2, 3].map(i => {
                   const x = 40 + i * 80;
                   const isActive = activeTab === i;
                   return (
                     <line
                       key={i}
                       x1="160" y1="0" x2={x} y2="48"
                       stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                       strokeWidth={isActive ? 2 : 1.5}
                       strokeDasharray="6 4"
                       strokeLinecap="round"
                       opacity={isActive ? 0.9 : 0.3}
                       className="transition-all duration-300"
                     />
                   );
                 })}
              </svg>
            </motion.div>

            {/* ── Source cards with numbered badges (appear in sequence) ── */}
            <div className="grid grid-cols-4 gap-2 mb-2 max-w-sm mx-auto">
              {SOURCE_TABS.map((tab, i) => (
                <motion.button
                  key={tab.key}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 1.0 + i * 0.4, type: "spring", stiffness: 250, damping: 22 }}
                  onClick={() => setActiveTab(i)}
                  className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    activeTab === i
                      ? "border-2 border-primary bg-primary/10 shadow-md scale-[1.04] ring-2 ring-primary/20"
                      : "border-2 border-primary/40 bg-card hover:border-primary/60"
                  }`}
                >
                  {/* Numbered badge with border */}
                  <div className={`absolute -top-2 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm border-2 ${
                    activeTab === i
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-primary border-primary/50"
                  }`}>
                    {i + 1}
                  </div>
                  <span className="text-lg">{tab.icon}</span>
                  <span className={`text-[10px] font-bold leading-tight ${activeTab === i ? "text-primary" : "text-foreground"}`}>{tab.label}</span>
                  <span className="text-[8px] text-muted-foreground leading-tight text-center">{tab.where}</span>
                </motion.button>
              ))}
            </div>

            {/* ── Vertical dashed arrow from active card down to mockup (animated) ── */}
            <motion.div
              key={`arrow-${activeTab}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center mb-1 h-6"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <line x1="12" y1="0" x2="12" y2="18" stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4 3">
                  <animate attributeName="stroke-dashoffset" from="14" to="0" dur="2s" repeatCount="indefinite" />
                </line>
                <polygon points="7,16 17,16 12,23" fill="hsl(var(--primary))" />
              </svg>
            </motion.div>

            {/* ── Visual mockup area ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
              className="max-w-[320px] mx-auto"
            >
              <AnimatePresence mode="wait">
                {activeTab === 0 && (
                  <motion.div key="ig" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                    <InstagramMockup onTap={() => handleSourceTap("instagram")} disabled={!!tappedSource} />
                  </motion.div>
                )}
                {activeTab === 1 && (
                  <motion.div key="app" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                    <AppMockup onTap={() => handleSourceTap("app")} disabled={!!tappedSource} />
                  </motion.div>
                )}
                {activeTab === 2 && (
                  <motion.div key="gm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                    <GoogleMapsMockup onTap={() => handleSourceTap("google")} disabled={!!tappedSource} />
                  </motion.div>
                )}
                {activeTab === 3 && (
                  <motion.div key="wa" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                    <WhatsAppBusinessMockup onTap={() => handleSourceTap("whatsapp")} disabled={!!tappedSource} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ── Hint below mockup ── */}
            {!tappedSource && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="flex flex-col items-center gap-3 mt-4"
              >
                <span className="text-xs font-semibold text-muted-foreground">
                  Premi sul {SOURCE_TABS[activeTab].where} oppure
                </span>
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full max-w-xs gap-2"
                  onClick={() => handleSourceTap(SOURCE_TABS[activeTab].key)}
                >
                  Avanti
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {/* Loading feedback — inline small */}
            <AnimatePresence>
              {tappedSource && !showLoading && !showBooking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center justify-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                  />
                  <span className="text-sm text-primary font-medium">Si apre la prenotazione...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : showLoading ? (
          /* ── Fullscreen loading screen ── */
          <motion.div
            key="loading-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-20 gap-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-14 h-14 border-[3px] border-primary border-t-transparent rounded-full"
            />
            <div className="text-center space-y-3 max-w-xs">
              <p className="text-2xl font-extrabold text-foreground">📱 La tua cliente ha cliccato.</p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Ecco cosa si apre sul suo telefono...
              </p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-base font-semibold text-foreground/80 mt-4"
              >
                ⚡ Nessun download richiesto.<br />
                <span className="text-muted-foreground font-normal">Nessuna registrazione. Si apre subito nel browser.</span>
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2 }}
                className="text-sm text-primary font-bold mt-4 bg-primary/10 rounded-full px-3 py-1.5 inline-block"
              >
                {tappedSource === "instagram" ? "📸 Arrivata da Instagram" : tappedSource === "app" ? "📱 Arrivata dall'App" : tappedSource === "google" ? "📍 Arrivata da Google Maps" : "💬 Arrivata da WhatsApp"}
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="booking-page"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="text-center mb-5">
              {/* Perspective-shift banner — prominent simulation notice */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 20 }}
                className="bg-primary/10 border-2 border-primary/25 rounded-2xl px-5 py-3 mb-4"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-lg">📱</span>
                  <span className="text-[15px] font-extrabold text-primary">Simulazione in corso</span>
                </div>
                <p className="text-[13px] text-primary/80 font-medium leading-snug">
                  Stai vedendo il telefono della tua cliente.
                  <br />
                  Nessun evento verrà creato davvero.
                </p>
              </motion.div>
              <div className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 rounded-full px-3 py-1 text-[12px] font-semibold text-green-700 dark:text-green-400 mb-3">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {tappedSource === "instagram" ? "Arrivata da Instagram" : tappedSource === "app" ? "Arrivata dall'App" : tappedSource === "google" ? "Arrivata da Google Maps" : "Arrivata da WhatsApp"}
              </div>
              <h2 className="text-[26px] font-extrabold text-foreground leading-tight mb-1">
                La tua cliente sceglie
              </h2>
              <h2 className="text-[26px] font-extrabold leading-tight">
                <span className="text-primary">il servizio</span> 👇
              </h2>
            </div>
            <div className="mx-auto max-w-sm bg-gradient-to-b from-card to-accent/30 rounded-3xl border border-border/60 shadow-lg overflow-hidden">
              {/* Browser bar */}
              <div className="bg-muted/40 px-4 py-2.5 flex items-center gap-2 border-b border-border/40">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
                </div>
                <div className="flex-1 bg-background rounded-md px-2.5 py-1 ml-1">
                  <span className="text-[10px] text-muted-foreground">🔒 glow-up.it/prenota/bella-vita</span>
                </div>
              </div>
              {/* Service list */}
              <div className="p-3 space-y-2">
                {SERVICES.map((s, i) => (
                  <motion.button
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                    onClick={() => onNext(s.id)}
                    className="w-full text-left p-3 rounded-2xl border border-border/60 hover:border-primary/50 hover:shadow-md active:scale-[0.97] bg-card hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 ring-1 ring-border/30">
                        <img src={s.img} alt={s.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground">{s.duration}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[14px] font-bold text-foreground">{s.price}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TimePickStep({
  serviceId,
  operatorId,
  selectedDay,
  onDayChange,
  onNext,
}: {
  serviceId: string;
  operatorId: DemoOperatorId;
  selectedDay: number;
  onDayChange: (day: number) => void;
  onNext: (time: string) => void;
}) {
  const { t } = useTranslation();
  const { formatDate } = useLocalization();
  const service = SERVICES.find((item) => item.id === serviceId) || SERVICES[0];
  const durationMinutes = parseDurationMinutes(service.duration);

  const slotAssignments =
    operatorId === "any"
      ? getFirstAvailableAssignments(selectedDay, durationMinutes)
      : getAvailableSlotsForOperator(selectedDay, operatorId, durationMinutes).map((time) => ({
          time,
          operatorId,
        }));

  const daysInMonth = 31;
  const startOffset = 6;
  const selectedDate = new Date(DEMO_YEAR, DEMO_MONTH, selectedDay);
  const selectedDateLabel = capitalize(
    selectedDate.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="px-4"
    >
      <div className="text-center mb-5">
        <h2 className="text-[26px] font-bold text-foreground leading-tight">
          {t("demoBooking.timeTitleBefore")}<br /><span className="text-primary">{t("demoBooking.timeTitleHighlight1")}</span> <span className="text-primary">{t("demoBooking.timeTitleHighlight2")}</span>
        </h2>
        <p className="text-[17px] text-muted-foreground mt-2 leading-relaxed">
          {operatorId === "any" ? t("demoBooking.timeSubtitleAny") : t("demoBooking.timeSubtitleSpecific")}
        </p>
      </div>

      <div className="mx-auto max-w-sm bg-card rounded-3xl border border-border shadow-soft overflow-hidden">
        <div className="p-4 space-y-4">
          <div>
            <p className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              {selectedDateLabel}
            </p>
            <div className="grid grid-cols-7 gap-1 text-center text-[12px]">
              {(t("agenda.days", { returnObjects: true }) as string[]).map((dayLabel, index) => (
                <span key={`${dayLabel}-${index}`} className="text-muted-foreground font-semibold py-1">
                  {dayLabel.charAt(0)}
                </span>
              ))}
              {Array.from({ length: startOffset }, (_, index) => (
                <span key={`empty-${index}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1;
                const isSelected = day === selectedDay;
                const currentDate = new Date(DEMO_YEAR, DEMO_MONTH, day);
                const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

                return (
                  <button
                    key={day}
                    onClick={() => onDayChange(day)}
                    className={`py-2 rounded-full text-[13px] font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold scale-110 shadow-md"
                        : isWeekend
                          ? "text-muted-foreground hover:bg-accent"
                          : "text-foreground hover:bg-primary/10 active:scale-95"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-accent/40 p-3">
            <p className="text-sm font-semibold text-foreground mb-1">{selectedDateLabel}</p>
            <p className="text-[13px] text-muted-foreground">
              {operatorId === "any"
                ? t("demoBooking.timeAvailabilityNarrativeAny")
                : t("demoBooking.timeAvailabilityNarrativeSpecific")}
            </p>
          </div>

          <div>
            <p className="text-[15px] text-muted-foreground mb-3 flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4" />
              {t("demoBooking.availableTimeSlots")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {slotAssignments.map(({ time, operatorId: assignedOperatorId }) => {
                const assignedOperator = OPERATORS.find((item) => item.id === assignedOperatorId);
                return (
                  <button
                    key={`${assignedOperatorId}-${time}`}
                    onClick={() => onNext(time)}
                    className="rounded-2xl border border-border bg-background px-2 py-3 text-center hover:border-primary hover:bg-primary/5 active:scale-95 transition-all"
                  >
                    <p className="text-[16px] font-bold text-foreground">{time}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{assignedOperator?.name}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function OperatorPickStep({ serviceId, onNext }: { serviceId: string; onNext: (operatorId: DemoOperatorId) => void }) {
  const { t } = useTranslation();
  const service = SERVICES.find((item) => item.id === serviceId) || SERVICES[0];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="px-4"
    >
      <div className="text-center mb-5">
        <h2 className="text-[26px] font-bold text-foreground leading-tight">
          {t("demoBooking.operatorTitleBefore")} <span className="text-primary">{t("demoBooking.operatorTitleHighlight")}</span>
        </h2>
        <p className="text-[17px] text-muted-foreground mt-2 leading-relaxed">
          {t("demoBooking.operatorSubtitle", { service: service.name })}
        </p>
      </div>

      <div className="mx-auto max-w-sm space-y-3">
        {OPERATORS.map((operator, index) => (
          <motion.button
            key={operator.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
            onClick={() => onNext(operator.id)}
            className="w-full text-left p-4 rounded-3xl border border-border/60 hover:border-primary/50 hover:shadow-md active:scale-[0.97] bg-card hover:bg-accent/40 transition-all group"
          >
            <div className="flex items-center gap-4">
              {operator.photo ? (
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 ring-2 ring-border/30">
                  <img src={operator.photo} alt={operator.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-7 h-7 text-primary" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-[18px] font-bold text-foreground group-hover:text-primary transition-colors">
                  {operator.name}
                </p>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                  {operator.id === "any"
                    ? t("demoBooking.operatorAnyDescription")
                    : t("demoBooking.operatorSpecificDescription")}
                </p>
              </div>

              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function ConfirmStep({
  day,
  time,
  operatorId,
  serviceId,
  onNext,
}: {
  day: number;
  time: string;
  operatorId: DemoOperatorId;
  serviceId: string;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const { formatDate, formatCurrency } = useLocalization();
  const [confirmed, setConfirmed] = useState(false);
  const service = SERVICES.find((item) => item.id === serviceId) || SERVICES[0];
  const durationMinutes = parseDurationMinutes(service.duration);
  const priceAmount = parsePriceAmount(service.price);
  const confirmedOperatorId = operatorId === "any"
    ? getFirstAvailableAssignments(day, durationMinutes).find((assignment) => assignment.time === time)?.operatorId ?? "sara"
    : operatorId;
  const operator = OPERATORS.find((item) => item.id === confirmedOperatorId);
  const appointmentDate = new Date(DEMO_YEAR, DEMO_MONTH, day);
  const dateLabel = capitalize(
    formatDate(appointmentDate, {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  );

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(onNext, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="px-4"
    >
      <div className="text-center mb-5">
        <h2 className="text-[26px] font-bold text-foreground leading-tight">
          {t("demoBooking.confirmTitleBefore")} <span className="text-primary">{t("demoBooking.confirmTitleHighlight1")}</span><br /><span className="text-primary">{t("demoBooking.confirmTitleHighlight2")}</span>
        </h2>
        <p className="text-[17px] text-muted-foreground mt-2 leading-relaxed">
          {t("demoBooking.confirmSubtitle")}
        </p>
      </div>

      <div className="mx-auto max-w-sm bg-card rounded-3xl border border-border shadow-soft overflow-hidden">
        <div className="p-5">
          <div className="rounded-[28px] overflow-hidden mb-4 aspect-[16/9]">
            <img src={service.img} alt={service.name} className="w-full h-full object-cover" />
          </div>

          <div className="mb-4">
            <p className="text-[22px] font-bold text-foreground leading-tight">{service.name}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[13px] font-semibold text-primary">
                {formatCurrency(priceAmount)}
              </span>
              <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-[13px] font-semibold text-foreground">
                {service.duration}
              </span>
            </div>
          </div>

          <div className="bg-accent/40 rounded-3xl p-4 mb-4 space-y-3">
            <div className="flex justify-between items-start gap-4">
              <span className="text-[14px] text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" /> {t("agenda.date")}
              </span>
              <span className="text-[15px] font-semibold text-foreground text-right">{dateLabel}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-[14px] text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> {t("agenda.time")}
              </span>
              <span className="text-[15px] font-semibold text-foreground">{time}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-[14px] text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> {t("demoBooking.durationLabel")}
              </span>
              <span className="text-[15px] font-semibold text-foreground">{durationMinutes} min</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-[14px] text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" /> {t("agenda.operator")}
              </span>
              <span className="text-[15px] font-semibold text-foreground">{operator?.name ?? "Sara"}</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!confirmed ? (
              <motion.div key="btn" exit={{ scale: 0.9, opacity: 0 }} className="space-y-2">
                {/* Arrow pointing down to button */}
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                  className="flex flex-col items-center"
                >
                  <p className="text-[14px] font-bold text-primary mb-1">La cliente preme qui per confermare 👇</p>
                  <ChevronDown className="w-5 h-5 text-primary" />
                </motion.div>
                <Button variant="hero" size="lg" className="w-full text-[16px]" onClick={handleConfirm}>
                  {t("demoBooking.confirmButton")}
                </Button>
                <p className="text-center text-[17px] font-bold text-muted-foreground">
                  😊 {t("demoBooking.confirmReassurance")}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="done"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center py-3"
              >
                <CheckCircle2 className="w-14 h-14 text-primary mb-2" />
                <p className="text-[16px] font-bold text-foreground">{t("demoBooking.confirmed")}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function AgendaStep({
  day,
  time,
  operatorId,
  serviceId,
  onNext,
}: {
  day: number;
  time: string;
  operatorId: DemoOperatorId;
  serviceId: string;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const { formatDate } = useLocalization();
  const [showEvent, setShowEvent] = useState(false);
  const service = SERVICES.find((item) => item.id === serviceId) || SERVICES[0];
  const durationMinutes = parseDurationMinutes(service.duration);
  const agendaByOperator = getAgendaForDay(day);
  const chosenOperatorId = operatorId === "any"
    ? getFirstAvailableAssignments(day, durationMinutes).find((assignment) => assignment.time === time)?.operatorId ?? "sara"
    : operatorId;
  const dateLabel = capitalize(
    new Date(DEMO_YEAR, DEMO_MONTH, day).toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  );

  const OP_COLORS: Record<ConcreteOperatorId, string> = {
    sara: "hsl(340 65% 55%)",
    giulia: "hsl(220 65% 55%)",
  };
  const OP_PHOTOS: Record<ConcreteOperatorId, string> = {
    sara: operatorSara,
    giulia: operatorGiulia,
  };

  const SLOT_H = 34;
  const GRID_START = AGENDA_START_MINUTES;
  const GRID_END = AGENDA_END_MINUTES;
  const TOTAL_SLOTS = (GRID_END - GRID_START) / 30;
  const GRID_HEIGHT = TOTAL_SLOTS * SLOT_H;

  const hourLabels: string[] = [];
  for (let h = 9; h <= 17; h++) {
    hourLabels.push(`${String(h).padStart(2, "0")}:00`);
  }

  const getBlockStyle = (start: string, duration: number) => {
    const startMin = timeToMinutes(start);
    const topPx = ((startMin - GRID_START) / 30) * SLOT_H;
    const heightPx = Math.max((duration / 30) * SLOT_H - 3, 12);
    return { top: topPx + 1, height: heightPx };
  };

  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Show event after a delay so users see it appear
    const showTimer = setTimeout(() => setShowEvent(true), 1200);
    // Auto-scroll to CTA after event appears
    const scrollTimer = setTimeout(() => {
      ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 3200);
    return () => { clearTimeout(showTimer); clearTimeout(scrollTimer); };
  }, []);

  const renderBlock = (
    appointment: DemoAgendaAppointment,
    opColor: string,
    columnOpId: ConcreteOperatorId,
    isNew = false,
  ) => {
    const blockStyle = getBlockStyle(appointment.start, appointment.duration);
    const showService = appointment.duration > 35;
    const showTime = appointment.duration >= 45;

    const content = (
      <>
        {isNew && (
          <p className="text-[9px] font-bold flex items-center gap-0.5 leading-none mb-0.5" style={{ color: opColor }}>
            <Sparkles className="w-2.5 h-2.5 shrink-0" /> {t("demoBooking.newAppointmentBadge")}
          </p>
        )}
        <p
          className={`text-[10px] font-semibold leading-tight ${isNew ? "" : "truncate"}`}
          style={{ color: `color-mix(in srgb, ${opColor} 20%, hsl(var(--foreground)))` }}
        >
          {isNew ? service.name : appointment.name}
        </p>
        {isNew ? (
          <p className="text-[8px] tabular-nums leading-tight mt-0.5 whitespace-nowrap" style={{ color: `color-mix(in srgb, ${opColor} 15%, hsl(var(--muted-foreground)))` }}>
            {time} · {durationMinutes} min
          </p>
        ) : (
          <>
            {showService && (
              <p className="text-[8px] truncate leading-tight mt-0.5" style={{ color: `color-mix(in srgb, ${opColor} 15%, hsl(var(--muted-foreground)))` }}>
                {appointment.service}
              </p>
            )}
            {showTime && (
              <p className="text-[7px] tabular-nums mt-0.5" style={{ color: `color-mix(in srgb, ${opColor} 10%, hsl(var(--muted-foreground)))` }}>
                {appointment.start} · {appointment.duration}′
              </p>
            )}
          </>
        )}
      </>
    );

    const classes = `absolute left-[3px] right-[3px] rounded-[10px] overflow-hidden border-l-[3px] px-2 py-1 flex flex-col justify-center ${
      isNew ? "shadow-lg z-10" : "shadow-sm"
    }`;

    const baseStyle: React.CSSProperties = {
      ...blockStyle,
      borderLeftColor: opColor,
      backgroundColor: isNew
        ? `color-mix(in srgb, ${opColor} 16%, hsl(var(--card)))`
        : `color-mix(in srgb, ${opColor} 10%, hsl(var(--card)))`,
    };

    if (isNew) {
      return (
        <motion.div
          key="new-appointment"
          initial={{ opacity: 0, scale: 0.7, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 14, mass: 1.2 }}
          className={`${classes} relative`}
          style={{
            ...baseStyle,
            boxShadow: `0 4px 20px -4px color-mix(in srgb, ${opColor} 30%, transparent), 0 0 0 2.5px color-mix(in srgb, ${opColor} 40%, transparent)`,
          }}
        >
          {content}
          {/* Radiating glow rings */}
          <motion.div
            className="absolute -inset-1 rounded-[14px] pointer-events-none"
            animate={{ 
              boxShadow: [
                `0 0 0 0px color-mix(in srgb, ${opColor} 40%, transparent), 0 0 8px 2px color-mix(in srgb, ${opColor} 20%, transparent)`,
                `0 0 0 6px color-mix(in srgb, ${opColor} 0%, transparent), 0 0 20px 8px color-mix(in srgb, ${opColor} 15%, transparent)`,
                `0 0 0 0px color-mix(in srgb, ${opColor} 40%, transparent), 0 0 8px 2px color-mix(in srgb, ${opColor} 20%, transparent)`,
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -inset-2 rounded-[18px] pointer-events-none"
            animate={{ 
              boxShadow: [
                `0 0 0 0px color-mix(in srgb, ${opColor} 20%, transparent)`,
                `0 0 0 8px color-mix(in srgb, ${opColor} 0%, transparent)`,
                `0 0 0 0px color-mix(in srgb, ${opColor} 20%, transparent)`,
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
          {/* Inner pulsing border */}
          <motion.div
            className="absolute inset-0 rounded-[10px] pointer-events-none"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ boxShadow: `inset 0 0 0 2px color-mix(in srgb, ${opColor} 60%, transparent)` }}
          />
        </motion.div>
      );
    }

    return (
      <div
        key={`${columnOpId}-${appointment.start}-${appointment.name}`}
        className={classes}
        style={baseStyle}
      >
        {content}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="px-4"
    >
      {/* Perspective shift: now on owner's phone */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 18 }}
        className="text-center mb-4"
      >
        <div className="inline-flex items-center gap-2 bg-green-50 border-2 border-green-200/60 rounded-2xl px-5 py-3 mb-2">
          <span className="text-lg">🔄</span>
          <div className="text-left">
            <p className="text-[14px] font-extrabold text-green-700 leading-tight">Ora sei sul TUO telefono</p>
            <p className="text-[11px] text-green-600/80 font-medium">Questo è ciò che vedi tu, nella tua app.</p>
          </div>
        </div>
      </motion.div>

      <div className="text-center mb-5">
        <h2 className="text-[26px] font-bold text-foreground leading-tight">
          {t("demoBooking.agendaTitleBefore")} <span className="text-primary">{t("demoBooking.agendaTitleHighlight")}</span>
        </h2>
        <p className="text-[17px] text-muted-foreground mt-2 leading-relaxed">
          {t("demoBooking.agendaSubtitle")}
        </p>
      </div>

      <div className="mx-auto max-w-sm bg-card rounded-3xl border border-border shadow-soft overflow-hidden">
        {/* Header */}
        <div className="bg-card border-b border-border/60">
          <div className="px-4 pt-3 pb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <p className="text-[14px] font-bold text-foreground">{dateLabel}</p>
          </div>
          {/* Operator column headers with avatars */}
          <div className="grid grid-cols-[36px_1fr_1fr] pb-2">
            <div />
            {(["sara", "giulia"] as ConcreteOperatorId[]).map((opId) => (
              <div key={opId} className="flex items-center justify-center gap-1.5 pb-1">
                <img
                  src={OP_PHOTOS[opId]}
                  alt={opId}
                  className="w-5 h-5 rounded-full object-cover ring-1"
                  style={{ '--tw-ring-color': `color-mix(in srgb, ${OP_COLORS[opId]} 40%, transparent)` } as React.CSSProperties}
                />
                <span
                  className="text-[11px] font-bold"
                  style={{ color: OP_COLORS[opId] }}
                >
                  {opId === "sara" ? "Sara" : "Giulia"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Grid body */}
        <div className="relative" style={{ height: GRID_HEIGHT }}>
          {/* Column backgrounds */}
          <div className="absolute top-0 bottom-0" style={{ left: 36, right: "50%" }}>
            <div className="w-full h-full" style={{ backgroundColor: `color-mix(in srgb, ${OP_COLORS.sara} 5%, hsl(var(--card)))` }} />
          </div>
          <div className="absolute top-0 bottom-0" style={{ left: "50%", right: 0 }}>
            <div className="w-full h-full" style={{ backgroundColor: `color-mix(in srgb, ${OP_COLORS.giulia} 5%, hsl(var(--card)))` }} />
          </div>

          {/* Vertical separator */}
          <div className="absolute top-0 bottom-0 w-px" style={{ left: "50%", backgroundColor: `hsl(var(--border) / 0.5)` }} />

          {/* Hour grid lines */}
          {hourLabels.map((label) => {
            const h = parseInt(label);
            const topPx = ((h * 60 - GRID_START) / 30) * SLOT_H;
            return (
              <div key={label} className="absolute left-0 right-0" style={{ top: topPx }}>
                <div className="flex items-start">
                  <span className="text-[9px] text-muted-foreground/70 w-[36px] shrink-0 text-right pr-1.5 -mt-[5px] font-medium tabular-nums select-none">{label}</span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
              </div>
            );
          })}

          {/* Half-hour dashed lines */}
          {hourLabels.slice(0, -1).map((label) => {
            const h = parseInt(label);
            const topPx = ((h * 60 + 30 - GRID_START) / 30) * SLOT_H;
            return (
              <div key={`half-${label}`} className="absolute" style={{ top: topPx, left: 36, right: 0 }}>
                <div className="w-full h-px" style={{ backgroundImage: "repeating-linear-gradient(to right, hsl(var(--border) / 0.3) 0 4px, transparent 4px 8px)" }} />
              </div>
            );
          })}

          {/* Appointment blocks per operator */}
          {(["sara", "giulia"] as ConcreteOperatorId[]).map((columnOpId) => {
            const isLeft = columnOpId === "sara";
            const appointments = agendaByOperator[columnOpId];
            const opColor = OP_COLORS[columnOpId];

            return (
              <div
                key={columnOpId}
                className="absolute top-0 bottom-0"
                style={isLeft ? { left: 38, right: "calc(50% + 1px)" } : { left: "calc(50% + 1px)", right: 2 }}
              >
                {appointments.map((appointment) => renderBlock(appointment, opColor, columnOpId))}

                <AnimatePresence>
                  {showEvent && chosenOperatorId === columnOpId && renderBlock(
                    { start: time, duration: durationMinutes, name: "", service: "" },
                    opColor,
                    columnOpId,
                    true,
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      <div ref={ctaRef} className="text-center mt-5">
        <Button variant="hero" size="lg" onClick={onNext} className="w-full max-w-sm gap-2 text-[15px]">
          C'è però dell'altro…
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

/* ─── Problem Step: Show the no-show cost ─── */
function ProblemStep({ onNext }: { onNext: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2800),
      setTimeout(() => setPhase(4), 4000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const agendaSlots = [
    { time: "09:00", name: "Anna M.", ok: true },
    { time: "10:00", name: "Buco — no-show", ok: false },
    { time: "11:00", name: "Carla F.", ok: true },
    { time: "12:00", name: "Buco — no-show", ok: false },
    { time: "14:00", name: "Elena R.", ok: true },
    { time: "15:00", name: "Francesca L.", ok: true },
    { time: "16:00", name: "Buco — cancellato", ok: false },
    { time: "17:00", name: "Giada P.", ok: true },
  ];

  const holes = agendaSlots.filter((s) => !s.ok);
  const dailyLoss = holes.length * CASE.before.avgTicket;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="px-4"
    >
      {/* Context intro */}
      <div className="text-center mb-5">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[17px] font-bold text-destructive mb-1.5"
        >
          📍 {CASE.name}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-2"
        >
          <span className="text-[18px] text-foreground font-semibold">{CASE.month}</span>
          <span className="text-[18px] text-muted-foreground">—</span>
          <span className="text-[18px] text-muted-foreground font-medium">ecco cosa è successo</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 5, 0] }}
          transition={{ delay: 0.5, y: { repeat: Infinity, duration: 1.2 } }}
          className="mt-3"
        >
          <ChevronDown className="w-6 h-6 mx-auto text-destructive/60" />
        </motion.div>
      </div>

      {/* Title */}
      <div className="text-center mb-6">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[28px] font-extrabold text-foreground leading-[1.15]"
        >
          Il <span className="text-gradient-primary text-[30px]">{CASE.before.noShowPct}%</span> dei clienti
        </motion.h2>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-[28px] font-extrabold leading-[1.15] mt-0.5"
        >
          <span className="text-gradient-primary">non si è presentato</span>
        </motion.h2>
      </div>

      <div className="mx-auto max-w-sm space-y-4">
        {/* Agenda table */}
        <AnimatePresence>
          {phase >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden bg-white shadow-md border border-border/60"
            >
              <div className="px-4 pt-3.5 pb-2.5 flex items-center gap-2.5 border-b border-border/40">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <p className="text-[15px] font-bold text-foreground">Una giornata tipica in agenda:</p>
                <motion.div
                  animate={{ y: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  className="ml-auto"
                >
                  <ChevronDown className="w-4 h-4 text-destructive/50" />
                </motion.div>
              </div>
              <div className="px-2 py-1">
                {agendaSlots.map((slot, i) => (
                  <motion.div
                    key={slot.time}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl mx-1 my-0.5 text-[14px] relative overflow-hidden ${
                      !slot.ok
                        ? "border border-destructive/20"
                        : ""
                    }`}
                  >
                    {/* Diagonal stripe pattern for no-show slots */}
                    {!slot.ok && (
                      <div className="absolute inset-0 pointer-events-none" style={{
                        backgroundImage: `repeating-linear-gradient(
                          -45deg,
                          transparent,
                          transparent 6px,
                          hsl(0 84% 60% / 0.06) 6px,
                          hsl(0 84% 60% / 0.06) 8px
                        )`,
                        backgroundColor: 'hsl(0 84% 60% / 0.06)',
                      }} />
                    )}
                    <span
                      className={`font-mono w-[48px] shrink-0 font-bold tabular-nums text-[13px] relative z-10 ${
                        slot.ok ? "text-muted-foreground" : "text-destructive"
                      }`}
                    >
                      {slot.time}
                    </span>
                    <span
                      className={`relative z-10 ${slot.ok ? "font-medium text-foreground" : "font-bold text-destructive"}`}
                    >
                      {slot.name}
                    </span>
                    {!slot.ok && <X className="w-4 h-4 ml-auto shrink-0 text-destructive/60 relative z-10" />}
                  </motion.div>
                ))}
              </div>
              {/* Daily summary */}
              <AnimatePresence>
                {phase >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="border-t border-border/50 bg-destructive/5"
                  >
                    <div className="px-4 py-3 flex items-center justify-center gap-2">
                      <span className="text-[13px] text-foreground font-medium">
                        {holes.length} buchi su {agendaSlots.length} slot =
                      </span>
                      <span className="text-[16px] font-extrabold text-destructive">
                        −€{dailyLoss}
                      </span>
                      <span className="text-[13px] text-muted-foreground">in un giorno</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Monthly revenue lost — big impact card */}
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 18 }}
              className="relative overflow-hidden rounded-2xl bg-white border border-destructive/20 shadow-lg"
            >
              {/* Red accent bar */}
              <div className="h-1.5 bg-gradient-to-r from-destructive/80 via-destructive to-destructive/60" />
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
                    <Euro className="w-7 h-7 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-destructive/70 tracking-widest uppercase">
                      Fatturato perso ogni mese
                    </p>
                    <motion.p
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3, type: "spring", damping: 12 }}
                      className="text-[38px] font-black leading-none mt-1.5 text-destructive"
                    >
                      −€{CASE.before.lostRevenue.toLocaleString("it-IT")}
                    </motion.p>
                    <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed">
                      {CASE.before.noShows} slot vuoti × €{CASE.before.avgTicket} scontrino medio
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CTA */}
      <AnimatePresence>
        {phase >= 4 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8"
          >
            <Button variant="hero" size="lg" onClick={onNext} className="w-full max-w-sm gap-2 text-[15px]">
              Vedi come ha risolto questo problema
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Mini Phone Frame for inline previews ─── */
function MiniPhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative rounded-[18px] overflow-hidden mx-auto border-2 w-full"
      style={{
        maxWidth: 280,
        aspectRatio: "280 / 320",
        background: "linear-gradient(160deg, hsl(220 15% 18%), hsl(220 12% 10%))",
        borderColor: "hsl(0 0% 30% / 0.3)",
      }}
    >
      {/* Status bar */}
      <div className="relative z-30 flex items-center justify-end px-3 pt-1.5 pb-0.5">
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
  );
}

/* ─── Mini notification banner for inline phone previews ─── */
function MiniNotifBanner({ type, title, body }: {
  type: "push" | "whatsapp" | "sms";
  title?: string;
  body: string;
}) {
  const configs = {
    push: {
      bg: "hsl(346 25% 28% / 0.92)",
      iconBg: "hsl(340 65% 55%)",
      icon: <Bell className="h-2.5 w-2.5 text-white" />,
      appName: "Glow Up",
    },
    whatsapp: {
      bg: "hsl(142 30% 22% / 0.92)",
      iconBg: "hsl(142 60% 40%)",
      icon: <MessageCircle className="h-2.5 w-2.5 text-white" />,
      appName: "WhatsApp",
    },
    sms: {
      bg: "hsl(210 20% 25% / 0.92)",
      iconBg: "hsl(210 100% 50%)",
      icon: <Smartphone className="h-2.5 w-2.5 text-white" />,
      appName: "Messaggi",
    },
  };
  const cfg = configs[type];

  return (
    <motion.div
      initial={{ y: -60, opacity: 0, scale: 0.92 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", damping: 22, stiffness: 260 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: cfg.bg, backdropFilter: "blur(20px)" }}
    >
      <div className="flex items-center gap-1.5 px-3 pt-2 pb-0.5">
        <div className="w-4 h-4 rounded-md flex items-center justify-center" style={{ background: cfg.iconBg }}>
          {cfg.icon}
        </div>
        <span className="text-[10px] text-white/60 font-medium">{cfg.appName}</span>
        <span className="text-[10px] text-white/50 ml-auto">Adesso</span>
      </div>
      <div className="px-3 pb-2.5 flex gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: cfg.iconBg }}>
          {type === "push" ? <Bell className="h-3.5 w-3.5 text-white" /> :
           type === "whatsapp" ? <MessageCircle className="h-3.5 w-3.5 text-white" /> :
           <Smartphone className="h-3.5 w-3.5 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          {title && <p className="text-[11px] font-bold text-white leading-tight">{title}</p>}
          <p className="text-[10px] text-white/70 leading-snug mt-0.5 line-clamp-3">{body}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Mini GlowUp App Screen ─── */
function MiniGlowUpScreen({ onBack }: { onBack: () => void }) {
  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="absolute inset-0 z-20 flex flex-col"
      style={{ background: "hsl(350 30% 97%)" }}
    >
      <div className="flex items-center gap-1.5 px-2 py-1.5 shrink-0"
        style={{ background: "linear-gradient(135deg, hsl(346 60% 58%), hsl(346 50% 52%))" }}>
        <button onClick={onBack} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/25 hover:bg-white/35 transition-colors shrink-0">
          <ArrowLeft className="h-3 w-3 text-white" />
          <span className="text-[8px] font-semibold text-white">Indietro</span>
        </button>
        <div className="flex items-center gap-1 ml-0.5 min-w-0">
          <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-[7px]">✨</span>
          </div>
          <p className="text-[8px] font-bold text-white truncate">{CASE.name}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <p className="text-[10px] font-bold text-gray-800 mb-1.5">Prossimi appuntamenti</p>
        <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
          <p className="text-[10px] font-bold text-gray-900">Manicure Semipermanente</p>
          <div className="flex items-center gap-1 mt-1">
            <Calendar className="h-2.5 w-2.5 text-gray-400" />
            <span className="text-[8px] text-gray-600">venerdì 20 marzo 2026</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="h-2.5 w-2.5 text-gray-400" />
            <span className="text-[8px] text-gray-600">10:15 - 11:00</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <User className="h-2.5 w-2.5 text-gray-400" />
            <span className="text-[8px] text-gray-600">Sara</span>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="text-[7px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: "hsl(346 60% 92%)", color: "hsl(346 60% 45%)" }}>✓ Confermato</span>
          </div>
        </div>
      </div>
      <div className="shrink-0 flex items-center justify-around py-1.5 border-t border-gray-200 bg-white">
        {["📋 Prenota", "📅 Appuntamenti", "💬 Chat", "⭐ Fedeltà"].map(item => {
          const [icon, label] = item.split(" ");
          const active = label === "Appuntamenti";
          return (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="text-[8px]">{icon}</span>
              <span className="text-[6px] font-medium" style={{ color: active ? "hsl(346 60% 50%)" : "hsl(0 0% 60%)" }}>{label}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── Mini WhatsApp Screen ─── */
function MiniWhatsAppScreen({ onBack, body }: { onBack: () => void; body: string }) {
  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="absolute inset-0 z-20 flex flex-col"
      style={{ background: "hsl(30 25% 90%)" }}
    >
      <div className="flex items-center gap-1.5 px-2 py-1.5 shrink-0" style={{ background: "hsl(142 50% 30%)" }}>
        <button onClick={onBack} className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg hover:bg-white/10 transition-colors shrink-0">
          <ArrowLeft className="h-3 w-3 text-white" />
        </button>
        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "hsl(142 30% 50%)" }}>
          <span className="text-[8px] font-bold text-white">B</span>
        </div>
        <div className="min-w-0">
          <p className="text-[8px] font-bold text-white truncate">{CASE.name}</p>
          <p className="text-[6px] text-white/60">online</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col justify-end">
        <div className="max-w-[85%] self-start">
          <div className="rounded-xl rounded-bl-sm px-2.5 py-2 shadow-sm bg-white">
            <p className="text-[8px] font-bold mb-0.5" style={{ color: "hsl(142 60% 35%)" }}>{CASE.name}</p>
            <p className="text-[9px] text-gray-900 whitespace-pre-wrap leading-relaxed">{body}</p>
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-[7px] text-gray-400">10:15</span>
              <CheckCircle2 className="h-2 w-2 text-blue-400" />
            </div>
          </div>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-1.5 px-2 py-1.5 bg-white/80 border-t border-gray-200">
        <div className="flex-1 rounded-full bg-white border border-gray-200 px-2.5 py-1.5">
          <span className="text-[8px] text-gray-400">Messaggio</span>
        </div>
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "hsl(142 50% 40%)" }}>
          <ArrowRight className="h-2.5 w-2.5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Mini SMS Screen ─── */
function MiniSmsScreen({ onBack, body }: { onBack: () => void; body: string }) {
  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="absolute inset-0 z-20 flex flex-col"
      style={{ background: "hsl(0 0% 96%)" }}
    >
      <div className="flex items-center gap-1.5 px-2 py-2 shrink-0 border-b border-gray-200 bg-white">
        <button onClick={onBack} className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
          style={{ color: "hsl(210 100% 50%)" }}>
          <ArrowLeft className="h-3 w-3" />
        </button>
        <div className="flex-1 flex flex-col items-center min-w-0">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "hsl(210 15% 88%)" }}>
            <span className="text-[9px] font-bold" style={{ color: "hsl(210 15% 50%)" }}>B</span>
          </div>
          <p className="text-[8px] font-semibold text-gray-800 truncate">{CASE.name}</p>
        </div>
        <div className="w-8" />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col justify-end">
        <div className="max-w-[85%] self-start">
          <div className="rounded-2xl rounded-bl-sm px-2.5 py-2" style={{ background: "hsl(0 0% 90%)" }}>
            <p className="text-[9px] text-gray-900 whitespace-pre-wrap leading-relaxed">{body}</p>
          </div>
          <p className="text-[7px] text-gray-400 mt-0.5 ml-1">10:15</p>
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2 px-2 py-1.5 border-t border-gray-200 bg-white">
        <div className="flex-1 rounded-full border border-gray-300 px-2.5 py-1.5">
          <span className="text-[8px] text-gray-400">Messaggio</span>
        </div>
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "hsl(210 100% 50%)" }}>
          <ArrowRight className="h-2.5 w-2.5 text-white rotate-[-90deg]" />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Reminder Step (enhanced with interactive previews) ─── */
function ReminderStep({ onNext }: { onNext: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1200),
      setTimeout(() => setPhase(2), 3000),
      setTimeout(() => setPhase(3), 5000),
      setTimeout(() => setPhase(4), 7000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

   const PUSH_BODY = `${CASE.name}:\nAppuntamento confermato\nVen, 20 Mar 10:15\n\nApri l'app per annullare o spostare`;
   const WA_BODY = `${CASE.name}:\nPromemoria oggi alle 10:15\n\nConferma, sposta o annulla clicca qui:\nhttps://glow-up.it/app/abc123`;
   const SMS_BODY = WA_BODY;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="px-4"
    >
      {/* Title block */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-[15px] font-bold mb-5"
          style={{ background: "hsl(142 40% 88%)", color: "hsl(142 50% 25%)" }}
        >
          <Sparkles className="w-4 h-4" />
          La soluzione di {CASE.name}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-[28px] font-extrabold text-foreground leading-[1.15]"
        >
          Attivando un sistema di promemoria automatici
        </motion.h2>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-[28px] font-extrabold leading-[1.15]"
        >
          che fa <span className="text-gradient-primary">tutto da solo...</span>
        </motion.h2>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 space-y-1"
        >
          <p className="text-[18px] leading-snug">
            La cliente <span className="font-bold text-foreground">non potrà dimenticarsi</span>.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 5, 0] }}
          transition={{ delay: 0.8, y: { repeat: Infinity, duration: 1.2 } }}
          className="mt-4"
        >
          <ChevronDown className="w-6 h-6 mx-auto text-primary/50" />
        </motion.div>
      </div>

      {/* Timeline */}
      <div className="mx-auto max-w-sm space-y-0">
        <ReminderNode 
          visible={phase >= 0}
          icon={<Calendar className="w-4 h-4" />}
          iconBg="bg-primary/10 text-primary"
          title="Appuntamento creato"
          subtitle="La cliente prenota dal link in bio"
          time="Subito"
          isFirst
        />
        
        <ReminderNode
          visible={phase >= 1}
          icon={<Bell className="w-4 h-4" />}
          iconBg="bg-green-100 text-green-600"
          title="Promemoria Push"
          subtitle="24 ore prima dell'appuntamento"
          time="-24h"
          interactive={{
            type: "push",
            title: CASE.name,
            body: PUSH_BODY,
            defaultOpen: true,
          }}
        />

        <ReminderNode
          visible={phase >= 2}
          icon={<MessageCircle className="w-4 h-4" />}
          iconBg="bg-green-100 text-green-600"
          title="Promemoria WhatsApp"
          subtitle="2 ore prima dell'appuntamento"
          time="-2h"
          interactive={{
            type: "whatsapp",
            title: CASE.name,
            body: WA_BODY,
            defaultOpen: true,
          }}
        />

        <ReminderNode
          visible={phase >= 2}
          icon={<Smartphone className="w-4 h-4" />}
          iconBg="bg-blue-100 text-blue-600"
          title="Promemoria SMS"
          subtitle="2 ore prima dell'appuntamento"
          time="-2h"
          interactive={{
            type: "sms",
            title: CASE.name,
            body: SMS_BODY,
            defaultOpen: true,
          }}
        />

        <ReminderNode
          visible={phase >= 3}
          icon={<CheckCircle2 className="w-4 h-4" />}
          iconBg="bg-green-100 text-green-600"
          title="La cliente arriva puntuale ✨"
          subtitle="Nessun buco in agenda"
          time="10:15"
          isLast
        />
      </div>

      {/* Explanatory text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={phase >= 3 ? { opacity: 1 } : {}}
        transition={{ delay: 0.5 }}
        className="mx-auto max-w-sm mt-6 bg-card rounded-2xl border border-border/60 shadow-soft p-4 space-y-3"
      >
        <div className="flex items-start gap-2.5">
          <Bell className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[14px] text-foreground leading-relaxed">
            <span className="font-bold">Promemoria 24h e 2h prima</span> dell'appuntamento, in automatico su Push, WhatsApp e SMS.
          </p>
        </div>
        <div className="flex items-start gap-2.5">
          <X className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-[14px] text-foreground leading-relaxed">
            <span className="font-bold">Se la cliente ha un imprevisto?</span> Può annullarsi da sola con un tap direttamente dal promemoria ricevuto, senza dover chiamare. L'appuntamento scompare dalla tua agenda automaticamente e lo slot si libera per un'altra cliente.
          </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {phase >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8"
          >
            <Button variant="hero" size="lg" onClick={onNext} className="w-full max-w-sm gap-2 text-[15px]">
              Vedi i risultati concreti 📈
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Results Step: Case study transformation ─── */
function ResultsStep({ onNext }: { onNext: () => void }) {
  const [phase, setPhase] = useState(0);
  const [animatedPct, setAnimatedPct] = useState(20);
  const [countUp, setCountUp] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase < 1) return;
    const start = 20, end = 2, duration = 1200, startTime = Date.now();
    const frame = () => {
      const p = Math.min((Date.now() - startTime) / duration, 1);
      setAnimatedPct(Math.round(start - (start - end) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [phase]);

  useEffect(() => {
    if (phase < 2) return;
    const target = CASE.after.recoveredRevenue, duration = 1000, startTime = Date.now();
    const frame = () => {
      const p = Math.min((Date.now() - startTime) / duration, 1);
      setCountUp(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [phase]);

  const C = 2 * Math.PI * 34;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="px-5"
    >
      {/* Header */}
      <div className="text-center mb-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="inline-flex items-center gap-2 bg-green-50 border border-green-200/60 rounded-full px-4 py-1.5 text-[13px] font-semibold text-green-700 mb-3"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Risultati dopo 30 giorni con i promemoria attivi
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-[26px] font-extrabold text-foreground leading-[1.15]"
        >
          I risultati di
          <br />
          <span className="text-gradient-primary">{CASE.name}</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[14px] text-muted-foreground mt-1"
        >
          {CASE.city} · Febbraio 2025
        </motion.p>
      </div>

      <div className="mx-auto max-w-sm space-y-3.5">
        {/* No-show gauge card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 22 }}
          className="bg-card rounded-2xl border-2 border-border shadow-soft p-5"
        >
          <p className="text-[15px] font-bold text-foreground mb-4 text-center">Tasso no-show</p>
          <div className="flex items-center justify-center gap-5">
            <div className="text-center">
              <div className="relative w-[88px] h-[88px] mx-auto mb-2.5">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" strokeWidth="6" className="stroke-muted/40" />
                  <circle cx="40" cy="40" r="34" fill="none" strokeWidth="6" className="stroke-destructive/70"
                    strokeDasharray={`${C * 0.2} ${C * 0.8}`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[22px] font-extrabold text-destructive">20%</span>
              </div>
              <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase">Prima</p>
              <p className="text-[13px] text-destructive font-semibold mt-0.5">{CASE.before.noShows} no-show</p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={phase >= 1 ? { opacity: 1, scale: 1 } : {}}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="shrink-0"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-100 to-green-200/80 flex items-center justify-center shadow-sm">
                <ArrowRight className="w-4 h-4 text-green-600" />
              </div>
            </motion.div>

            <AnimatePresence>
              {phase >= 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 16 }}
                  className="text-center"
                >
                  <div className="relative w-[88px] h-[88px] mx-auto mb-2.5">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" strokeWidth="6" className="stroke-muted/40" />
                      <motion.circle cx="40" cy="40" r="34" fill="none" strokeWidth="6"
                        className="stroke-green-500" strokeLinecap="round"
                        initial={{ strokeDasharray: `${C * 0.2} ${C * 0.8}` }}
                        animate={{ strokeDasharray: `${C * 0.02} ${C * 0.98}` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[22px] font-extrabold text-green-600">{animatedPct}%</span>
                  </div>
                  <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase">Dopo</p>
                  <p className="text-[13px] text-green-600 font-semibold mt-0.5">Solo {CASE.after.noShows} no-show</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Revenue comparison */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="bg-card rounded-2xl border-2 border-border shadow-soft p-5"
            >
              <p className="text-[15px] font-bold text-foreground mb-4 text-center">Fatturato mensile</p>
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-[14px] mb-1.5">
                    <span className="text-muted-foreground font-semibold">Prima — Gennaio</span>
                    <span className="font-bold text-destructive">€{CASE.before.revenue.toLocaleString("it-IT")}</span>
                  </div>
                  <div className="h-3.5 rounded-full bg-destructive/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-destructive/40 to-destructive/60" style={{ width: "82%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[14px] mb-1.5">
                    <span className="text-muted-foreground font-semibold">Dopo — Febbraio</span>
                    <span className="font-bold text-green-600">€{CASE.after.revenue.toLocaleString("it-IT")}</span>
                  </div>
                  <div className="h-3.5 rounded-full bg-green-100/60 overflow-hidden">
                    <motion.div
                      initial={{ width: "82%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-500"
                    />
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-2 pt-1.5"
                >
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-green-300/50" />
                  <span className="text-[14px] font-bold text-green-600">+€{countUp.toLocaleString("it-IT")}/mese</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-green-300/50" />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Impact metrics */}
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-2 gap-2.5">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  className="bg-green-50/80 rounded-xl p-4 text-center border-2 border-green-200/50">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-4.5 h-4.5 text-green-600" />
                  </div>
                  <p className="text-[22px] font-extrabold text-green-600 leading-none">+€{CASE.after.recoveredRevenue.toLocaleString("it-IT")}</p>
                  <p className="text-[12px] text-muted-foreground mt-1.5 font-semibold leading-tight">Recuperati<br />ogni mese</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="bg-green-50/80 rounded-xl p-4 text-center border-2 border-green-200/50">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <Users className="w-4.5 h-4.5 text-green-600" />
                  </div>
                  <p className="text-[22px] font-extrabold text-green-600 leading-none">{CASE.after.recovered}</p>
                  <p className="text-[12px] text-muted-foreground mt-1.5 font-semibold leading-tight">Clienti salvati<br />al mese</p>
                </motion.div>
              </div>

              {/* Annual projection */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 300 }}
                className="relative overflow-hidden bg-card rounded-2xl border-2 border-primary/20 shadow-soft"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] to-primary/[0.02]" />
                <div className="relative p-5 text-center">
                  <p className="text-[14px] font-semibold text-muted-foreground mb-1">In un anno sono</p>
                  <p className="text-[32px] font-extrabold text-primary leading-none">
                    €{(CASE.after.recoveredRevenue * 12).toLocaleString("it-IT")}
                  </p>
                  <p className="text-[15px] font-bold text-foreground mt-1.5">in più nel tuo cassetto</p>
                  <p className="text-[13px] text-muted-foreground mt-1 leading-snug">Solo recuperando chi si dimentica</p>
                </div>
              </motion.div>

              {/* Pricing narrative */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, type: "spring", stiffness: 300 }}
                className="relative overflow-hidden bg-card rounded-2xl border border-border/60 shadow-card"
              >
                <div className="p-6 text-center space-y-4">
                  <p className="text-[16px] font-semibold text-muted-foreground">E tutto questo investendo solo</p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-[48px] font-extrabold text-foreground leading-none">€1</span>
                    <span className="text-[18px] font-bold text-muted-foreground">/al giorno</span>
                  </div>
                  <div className="h-px bg-border/60 mx-6" />
                  <div className="space-y-1.5">
                    <p className="text-[15px] text-muted-foreground leading-snug">
                      Il piano base è di soli <span className="font-bold text-foreground">€29/mese</span>
                    </p>
                  </div>
                  <div className="h-px bg-border/60 mx-6" />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold"
                    style={{ background: "hsl(142 40% 88%)", color: "hsl(142 50% 25%)" }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Prova gratuita di 14 giorni — nessuna carta richiesta
                  </motion.div>
                </div>
              </motion.div>

              {/* Scroll hint */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }} className="flex justify-center">
                <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                  <ChevronDown className="w-5 h-5 text-muted-foreground/50" />
                </motion.div>
              </motion.div>

              {/* CTA */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}>
                <Button variant="hero" size="lg" onClick={onNext} className="w-full gap-2 shadow-glow">
                  Cominciamo! 🚀
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ReminderNode({ visible, icon, iconBg, title, subtitle, time, interactive, isFirst, isLast }: {
  visible: boolean;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  time: string;
  interactive?: {
    type: "push" | "whatsapp" | "sms";
    title?: string;
    body: string;
    defaultOpen?: boolean;
  };
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const [appOpen, setAppOpen] = useState(false);

  // Auto-toggle: open app after 3s, close after 7s, repeat — slower for readability
  useEffect(() => {
    if (!interactive || !visible) return;
    const openTimer = setTimeout(() => setAppOpen(true), 3000);
    const closeTimer = setTimeout(() => setAppOpen(false), 9000);
    const interval = setInterval(() => {
      setAppOpen(true);
      setTimeout(() => setAppOpen(false), 6000);
    }, 12000);
    return () => { clearTimeout(openTimer); clearTimeout(closeTimer); clearInterval(interval); };
  }, [interactive, visible]);

  // Time badge colors
  const timeBadgeStyle = time === "Istantanea"
    ? "bg-green-100 text-green-700 border-green-200"
    : time.startsWith("-")
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : time === "Subito"
    ? "bg-primary/10 text-primary border-primary/20"
    : "bg-green-100 text-green-700 border-green-200";

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={visible ? { scale: 1, opacity: 1 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}
        >
          {icon}
        </motion.div>
        {!isLast && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={visible ? { scaleY: 1 } : {}}
            transition={{ delay: 0.3, duration: 1.2, ease: "easeInOut" }}
            className="w-0.5 flex-1 bg-border origin-top min-h-[2rem]"
          />
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={visible ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: 0.1 }}
        className={`pb-6 flex-1 ${isLast ? 'pb-0' : ''}`}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-bold text-foreground leading-snug">{title}</p>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${timeBadgeStyle}`}>
            {time}
          </span>
        </div>
        <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>

        {interactive && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
            className="mt-3"
          >
            <MiniPhoneFrame>
              {!appOpen ? (
                <div className="absolute inset-0 z-10 pt-6">
                  <p className="text-[9px] font-medium text-white/50 px-3 mb-1.5 mt-0.5">Notifiche</p>
                  <div className="px-2 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setAppOpen(true)}>
                    <MiniNotifBanner
                      type={interactive.type}
                      title={interactive.title}
                      body={interactive.body}
                    />
                  </div>
                </div>
              ) : null}
              <AnimatePresence>
                {appOpen && interactive.type === "push" && (
                  <MiniGlowUpScreen onBack={() => setAppOpen(false)} />
                )}
                {appOpen && interactive.type === "whatsapp" && (
                  <MiniWhatsAppScreen onBack={() => setAppOpen(false)} body={interactive.body} />
                )}
                {appOpen && interactive.type === "sms" && (
                  <MiniSmsScreen onBack={() => setAppOpen(false)} body={interactive.body} />
                )}
              </AnimatePresence>
            </MiniPhoneFrame>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function CTAStep() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 650),
      setTimeout(() => setPhase(3), 1000),
      setTimeout(() => setPhase(4), 1350),
      setTimeout(() => setPhase(5), 1700),
      setTimeout(() => setPhase(6), 2400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const benefits = [
    {
      img: benefitRelax,
      title: "Zero telefonate",
      desc: "Le clienti prenotano da sole, anche alle 23 di sera. Tu respiri.",
      accent: "from-primary/10 to-primary/5",
      border: "border-primary/15",
    },
    {
      img: benefitNoshow,
      title: "Basta buchi in agenda",
      desc: "3 reminder automatici su 3 canali diversi. Nessuno si dimentica più.",
      accent: "from-green-50 to-green-100/50",
      border: "border-green-200/40",
    },
    {
      img: benefitCancel,
      title: "Cancellazioni in anticipo",
      desc: "Chi non può venire, disdice con un tap. Tu hai tempo per riempire lo slot che si è liberato automaticamente.",
      accent: "from-blue-50 to-blue-100/50",
      border: "border-blue-200/40",
    },
    {
      img: benefitOntime,
      title: "Clienti sempre puntuali",
      desc: "Il promemoria arriva al momento perfetto. Niente più \"scusa, sono in ritardo\".",
      accent: "from-amber-50 to-amber-100/50",
      border: "border-amber-200/40",
    },
    {
      img: benefitRevenue,
      title: `+€${CASE.after.recoveredRevenue.toLocaleString("it-IT")} ogni mese`,
      desc: "Soldi che oggi perdi. Recuperati in automatico, senza fare nulla.",
      accent: "from-emerald-50 to-emerald-100/50",
      border: "border-emerald-200/40",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-5"
    >
      {/* Header */}
      <div className="text-center mb-5">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
          className="text-[28px] font-extrabold text-foreground leading-[1.1] whitespace-nowrap"
        >
          I vantaggi di <span className="text-gradient-primary">GlowUp</span>
        </motion.h2>
      </div>

      {/* Benefit cards */}
      <div className="space-y-3 max-w-sm mx-auto">
        {benefits.map((b, i) => (
          <AnimatePresence key={i}>
            {phase >= i + 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                className={`flex items-center gap-4 bg-gradient-to-br ${b.accent} rounded-2xl p-4 border-2 ${b.border}`}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                  className="shrink-0"
                >
                  <img src={b.img} alt={b.title} className="w-14 h-14 object-contain" />
                </motion.div>
                <div className="min-w-0">
                  <p className="text-[16px] font-extrabold text-foreground leading-tight">{b.title}</p>
                  <p className="text-[13px] text-muted-foreground mt-1 leading-[1.4]">{b.desc}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>

      {/* Social proof */}
      <AnimatePresence>
        {phase >= 5 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 max-w-sm mx-auto"
          >
            <div className="flex items-center justify-center gap-3 bg-card rounded-2xl border border-border/60 px-4 py-3 shadow-card">
              <div className="flex -space-x-2">
                {[operatorSara, operatorGiulia].map((src, i) => (
                  <img key={i} src={src} alt="" className="w-8 h-8 rounded-full border-2 border-card object-cover" />
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-card bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                  +48
                </div>
              </div>
              <div className="text-left">
                <p className="text-[13px] font-bold text-foreground leading-tight">Usato da 500+ centri estetici</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="flex gap-px">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} className="text-[10px]" style={{ color: "#fbbc04" }}>★</span>
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">4.9/5</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <AnimatePresence>
        {phase >= 6 && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mt-5 max-w-sm mx-auto"
          >
            <div className="relative overflow-hidden rounded-3xl shadow-glow">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-hero" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

              <div className="relative px-6 py-7 text-center">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-[14px] font-medium text-primary-foreground/80 mb-2"
                >
                  Attivalo per il tuo centro
                </motion.p>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-[16px] font-semibold text-primary-foreground/90 leading-snug mb-5"
                >
                  Setup in pochi minuti, ti guidiamo noi passo passo e ti mostriamo come funziona per il tuo caso specifico.
                </motion.p>

                <a
                  href={`https://wa.me/393661988644?text=${encodeURIComponent("Ciao! Ho visto la demo e vorrei provare GlowUp gratuitamente.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  onClick={() => trackFunnelCTA("whatsapp_cta_main")}
                >
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    className="w-full bg-primary-foreground text-primary font-extrabold text-[18px] rounded-2xl py-4 px-6 flex items-center justify-center gap-3 shadow-lg active:shadow-md transition-shadow"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Scrivici su WhatsApp
                  </motion.div>
                </a>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4"
                >
                  <p className="text-[14px] font-bold text-primary-foreground">
                    ✨ 14 giorni gratis · Nessuna carta
                  </p>
                </motion.div>

                {/* Soft urgency */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-4 flex items-center justify-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-[12px] text-primary-foreground/60 font-medium">
                    8 centri si sono attivati questa settimana
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main Page ─── */
const TOTAL_STEPS = 10;

export default function DemoPrenotazione() {
  const [step, setStep] = useState(0);
  const [showAvantiHint, setShowAvantiHint] = useState(false);
  const [selectedDay, setSelectedDay] = useState(20);

  // Track step views & scroll to top
  useEffect(() => {
    trackFunnelStep(step);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);
  const [selectedTime, setSelectedTime] = useState("10:15");
  const [selectedOperator, setSelectedOperator] = useState<DemoOperatorId>("sara");
  const [selectedService, setSelectedService] = useState("1");
  const customBackRef = useRef<(() => boolean) | null>(null);
  const customNextRef = useRef<(() => boolean) | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Track the highest step the user has completed via in-step interaction
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Steps that require in-step interaction before "Avanti" is enabled
  // Step 1 (source pick) is excluded — Avanti always works there
  const INTERACTIVE_STEPS = new Set([2, 3]);
  const isAvantiDisabled = INTERACTIVE_STEPS.has(step) && !completedSteps.has(step);

  const markStepCompleted = useCallback((s: number) => {
    setCompletedSteps((prev) => new Set(prev).add(s));
  }, []);

  const next = useCallback(() => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)), []);
  const prev = useCallback(() => {
    if (customBackRef.current) {
      const handled = customBackRef.current();
      if (handled) return;
    }
    setStep((s) => Math.max(s - 1, 0));
  }, []);
  const registerBack = useCallback((fn: (() => boolean) | null) => {
    customBackRef.current = fn;
  }, []);
  const registerNext = useCallback((fn: (() => boolean) | null) => {
    customNextRef.current = fn;
  }, []);

  return (
    <div ref={scrollContainerRef} className="h-full overflow-auto bg-gradient-to-b from-accent via-background to-accent/50 relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, hsl(340 65% 55% / 0.15), transparent 70%)" }} />
        <div className="absolute top-1/3 -left-20 w-60 h-60 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, hsl(340 45% 70% / 0.2), transparent 70%)" }} />
        <div className="absolute bottom-20 right-0 w-72 h-72 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, hsl(30 75% 55% / 0.15), transparent 70%)" }} />
      </div>

      <nav className="sticky top-0 z-50 bg-accent/60 backdrop-blur-xl border-b border-primary/10">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <button onClick={prev} className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 active:bg-primary/30 active:scale-95 rounded-full px-3 py-1.5 transition-all">
                <ArrowRight className="w-4 h-4 text-primary rotate-180" />
                <span className="text-sm font-semibold text-primary">Indietro</span>
              </button>
            ) : (
              <>
                <img src="/icon-512.png" alt="GlowUp" className="h-7 w-7 rounded-lg" />
                <span className="text-lg font-bold text-foreground">GlowUp</span>
              </>
            )}
          </div>
          {step < TOTAL_STEPS - 1 ? (
            <div className="relative">
              <Button
                variant="hero"
                size="sm"
                onClick={() => {
                  if (isAvantiDisabled) {
                    setShowAvantiHint(true);
                    setTimeout(() => setShowAvantiHint(false), 2500);
                  } else if (customNextRef.current) {
                    customNextRef.current();
                  } else {
                    next();
                  }
                }}
                className={`gap-1.5 transition-all ${isAvantiDisabled ? "opacity-50 saturate-50" : ""}`}
              >
                Avanti
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
              <AnimatePresence>
                {showAvantiHint && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 bg-foreground text-background text-xs font-medium rounded-lg px-3 py-2 shadow-lg whitespace-nowrap z-50"
                  >
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-foreground rotate-45" />
                    Completa l'azione qui sotto 👇
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <a
              href={`https://wa.me/393661988644?text=${encodeURIComponent("Ciao! Ho visto la demo e vorrei provare GlowUp gratuitamente.")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackFunnelCTA("whatsapp_navbar")}
            >
              <Button variant="hero" size="sm" className="gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                Contattaci
              </Button>
            </a>
          )}
        </div>
      </nav>

      <div className="py-6 pb-20 relative z-10">
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <StepIndicator current={step - 1} total={TOTAL_STEPS - 2} />
        )}

        <AnimatePresence mode="wait">
          {step === 0 && <HeroStep key="hero" onNext={next} />}
          {step === 1 && <ServicePickStep key="service" onNext={(serviceId) => { setSelectedService(serviceId); markStepCompleted(1); next(); }} onRegisterBack={registerBack} onRegisterNext={registerNext} />}
          {step === 2 && <OperatorPickStep key="operator" serviceId={selectedService} onNext={(operatorId) => { setSelectedOperator(operatorId); markStepCompleted(2); next(); }} />}
          {step === 3 && <TimePickStep key="time" serviceId={selectedService} operatorId={selectedOperator} selectedDay={selectedDay} onDayChange={setSelectedDay} onNext={(time) => { setSelectedTime(time); markStepCompleted(3); next(); }} />}
          {step === 4 && <ConfirmStep key="confirm" day={selectedDay} time={selectedTime} operatorId={selectedOperator} serviceId={selectedService} onNext={() => { markStepCompleted(4); next(); }} />}
          {step === 5 && <AgendaStep key="agenda" day={selectedDay} time={selectedTime} operatorId={selectedOperator} serviceId={selectedService} onNext={() => { markStepCompleted(5); next(); }} />}
          {step === 6 && <ProblemStep key="problem" onNext={next} />}
          {step === 7 && <ReminderStep key="reminder" onNext={next} />}
          {step === 8 && <ResultsStep key="results" onNext={next} />}
          {step === 9 && <CTAStep key="cta" />}
        </AnimatePresence>
      </div>
    </div>
  );
}
