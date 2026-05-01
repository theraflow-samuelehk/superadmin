import { Globe, CreditCard, Activity, Settings, CheckCircle2, Clock } from "lucide-react";
import { Card } from "../components/ui/Card";
import { motion } from "framer-motion";

const configs: Record<string, {
  icon: React.ReactNode;
  gradient: string;
  cardBg: string;
  accent: string;
  desc: string;
  items: { label: string; done: boolean }[];
}> = {
  "Domini & DNS": {
    icon: <Globe size={22} className="text-white" />,
    gradient: "from-sky-500 to-cyan-500",
    cardBg: "from-sky-50/80 via-white to-cyan-50/60",
    accent: "text-sky-600",
    desc: "Gestione centralizzata di tutti i domini e sottodomini attivi su TheraFlow. Ogni workspace ha i suoi sottodomini — qui potrai collegare domini reali, verificare DNS e monitorare ogni dominio.",
    items: [
      { label: "Panoramica domini attivi per workspace", done: false },
      { label: "Collegamento dominio personalizzato → sottodominio", done: false },
      { label: "Verifica DNS e stato propagazione", done: false },
      { label: "Rinnovi e scadenze", done: false },
    ],
  },
  "Billing & Revenue": {
    icon: <CreditCard size={22} className="text-white" />,
    gradient: "from-violet-500 to-indigo-600",
    cardBg: "from-violet-50/80 via-white to-indigo-50/60",
    accent: "text-violet-600",
    desc: "Gestione abbonamenti e fatturazione di tutti i workspace clienti. Entrate mensili, piani attivi, pagamenti falliti e storico fatture in un posto solo.",
    items: [
      { label: "MRR per workspace e totale piattaforma", done: false },
      { label: "Storico pagamenti e fatture PDF", done: false },
      { label: "Upgrade / downgrade piani in un click", done: false },
      { label: "Alert automatici su pagamenti falliti", done: false },
    ],
  },
  "Audit & Attività": {
    icon: <Activity size={22} className="text-white" />,
    gradient: "from-emerald-500 to-teal-600",
    cardBg: "from-emerald-50/80 via-white to-teal-50/60",
    accent: "text-emerald-600",
    desc: "Log completo di ogni azione su tutti i workspace. Deploy, inviti, modifiche, accessi. Filtrabile per workspace, utente, tipo di evento e data.",
    items: [
      { label: "Log real-time di deploy e modifiche", done: false },
      { label: "Filtro per workspace, utente, tipo evento", done: false },
      { label: "Export CSV per audit esterno", done: false },
      { label: "Alert su azioni anomale o sospette", done: false },
    ],
  },
  "Impostazioni": {
    icon: <Settings size={22} className="text-white" />,
    gradient: "from-slate-600 to-slate-900",
    cardBg: "from-slate-50/80 via-white to-slate-50/60",
    accent: "text-slate-600",
    desc: "Configurazioni globali della piattaforma TheraFlow. Super admin, chiavi API, configurazione domini, webhook e notifiche di sistema.",
    items: [
      { label: "Gestione account super admin", done: false },
      { label: "Chiavi API e webhook platform", done: false },
      { label: "Configurazione dominio madre theraflow.io", done: false },
      { label: "Notifiche sistema (email, Slack, Telegram)", done: false },
    ],
  },
};

export function Placeholder({ title, index }: { title: string; index: string }) {
  const cfg = configs[title] || {
    icon: <Settings size={22} className="text-white" />,
    gradient: "from-slate-500 to-slate-700",
    cardBg: "from-slate-50/80 via-white to-slate-50/60",
    accent: "text-slate-600",
    desc: "Questa sezione è in sviluppo.",
    items: [],
  };

  return (
    <div className="px-4 md:px-6 lg:px-10 py-6 md:py-8 max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] text-white"
              style={{ background: "linear-gradient(135deg, #06b6d4, #6366f1)" }}
            >
              {index} — {title}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full font-semibold">
              <Clock size={11} /> In sviluppo · Ondata 2
            </span>
          </div>
          <h1
            className="display font-black text-slate-900"
            style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
          >
            {title}
          </h1>
        </div>

        {/* Main card */}
        <Card className={`p-8 md:p-10 bg-gradient-to-br ${cfg.cardBg} mb-6`}>
          <div className="flex items-start gap-6 flex-wrap">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-lift ${cfg.gradient}`}
            >
              {cfg.icon}
            </div>
            <div className="flex-1 min-w-[260px]">
              <p className="text-[15px] text-slate-700 leading-relaxed mb-7 max-w-2xl">
                {cfg.desc}
              </p>
              <div className="grid sm:grid-cols-2 gap-y-3 gap-x-6">
                {cfg.items.map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 text-[13.5px] text-slate-700">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${cfg.gradient} bg-gradient-to-br`}>
                      <CheckCircle2 size={11} className="text-white" />
                    </span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Timeline hint */}
        <div className="flex items-center gap-3 justify-center py-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <p className="text-[12px] text-slate-400 text-center px-4">
            Disponibile dopo l'approvazione della demo grafica attuale — roadmap <span className="font-semibold text-slate-500">Ondata 2</span>
          </p>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        </div>
      </motion.div>
    </div>
  );
}
