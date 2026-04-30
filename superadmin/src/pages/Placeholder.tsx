import { Globe, CreditCard, Activity, Settings } from "lucide-react";
import { Card } from "../components/ui/Card";
import { motion } from "framer-motion";

const configs: Record<string, {
  icon: React.ReactNode;
  color: string;
  bg: string;
  desc: string;
  items: string[];
}> = {
  "Domini & DNS": {
    icon: <Globe size={22} className="text-white" />,
    color: "from-sky-500 to-cyan-500",
    bg: "from-sky-50 via-white to-cyan-50",
    desc: "Gestione centralizzata di tutti i domini e sottodomini attivi su TheraFlow. Ogni workspace ha i suoi sottodomini su theraflow.io — qui potrai collegare domini reali, verificare i DNS e monitorare lo stato di ogni dominio.",
    items: ["Panoramica domini attivi per workspace", "Collegamento dominio personalizzato → sottodominio", "Verifica DNS e stato propagazione", "Rinnovi e scadenze"],
  },
  "Billing & Revenue": {
    icon: <CreditCard size={22} className="text-white" />,
    color: "from-violet-500 to-indigo-500",
    bg: "from-violet-50 via-white to-indigo-50",
    desc: "Gestione abbonamenti e fatturazione di tutti i workspace clienti. Qui vedrai entrate mensili, piani attivi, pagamenti falliti e storico fatture.",
    items: ["MRR per workspace e totale piattaforma", "Storico pagamenti e fatture", "Upgrade / downgrade piani", "Alert pagamenti falliti"],
  },
  "Audit & Attività": {
    icon: <Activity size={22} className="text-white" />,
    color: "from-emerald-500 to-teal-500",
    bg: "from-emerald-50 via-white to-teal-50",
    desc: "Log completo di ogni azione su tutti i workspace. Deploy, inviti, modifiche, accessi. Filtrabile per workspace, utente, tipo di evento e data.",
    items: ["Log in tempo reale di deploy e modifiche", "Filtro per workspace, utente, tipo evento", "Export CSV per audit", "Alert su azioni anomale"],
  },
  "Impostazioni": {
    icon: <Settings size={22} className="text-white" />,
    color: "from-slate-600 to-slate-800",
    bg: "from-slate-50 via-white to-slate-50",
    desc: "Configurazioni globali della piattaforma TheraFlow. Gestione super admin, chiavi API, configurazione domini, webhook e notifiche di sistema.",
    items: ["Gestione account super admin", "Chiavi API e webhook", "Configurazione dominio madre theraflow.io", "Notifiche di sistema (email, Slack)"],
  },
};

export function Placeholder({ title, index }: { title: string; index: string }) {
  const cfg = configs[title] || {
    icon: <Settings size={22} className="text-white" />,
    color: "from-slate-500 to-slate-700",
    bg: "from-slate-50 via-white to-slate-50",
    desc: "Questa sezione è in sviluppo.",
    items: [],
  };

  return (
    <div className="px-4 md:px-6 lg:px-10 py-6 md:py-8 max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] text-white"
              style={{ background: "linear-gradient(135deg, #06b6d4, #6366f1)" }}
            >
              {index} — {title}
            </span>
            <span className="text-[12px] text-slate-400 font-medium bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full font-semibold">
              In sviluppo
            </span>
          </div>
          <h1
            className="font-display font-bold text-slate-900 leading-tight"
            style={{ fontSize: "clamp(32px, 5vw, 52px)" }}
          >
            {title}
          </h1>
        </div>

        {/* Main card */}
        <Card className={`p-8 md:p-10 bg-gradient-to-br ${cfg.bg} border mb-6`}>
          <div className="flex items-start gap-6 flex-wrap">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br ${cfg.color}`}
            >
              {cfg.icon}
            </div>
            <div className="flex-1 min-w-[260px]">
              <p className="text-[15px] text-slate-700 leading-relaxed mb-6 max-w-2xl">
                {cfg.desc}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {cfg.items.map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-[13.5px] text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <p className="text-[12.5px] text-slate-400 text-center">
          Sarà costruito dopo l'approvazione della demo grafica attuale. Roadmap Ondata 2.
        </p>
      </motion.div>
    </div>
  );
}
