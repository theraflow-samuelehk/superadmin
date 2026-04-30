import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  ArrowUpRight,
  Eye,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Building2,
  Rocket,
  Wallet,
  MousePointerClick,
  UserPlus,
  Plus,
  Zap,
} from "lucide-react";
import {
  workspaces,
  projects,
  activity,
  platformKPIs,
  platformTimeseries,
  getUser,
  projectsByWorkspace,
} from "../lib/mock";
import { Card } from "../components/ui/Card";
import { SpotlightCard } from "../components/ui/SpotlightCard";
import { Badge } from "../components/ui/Badge";
import { AvatarStack, gradientFor } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { CountUp } from "../components/ui/CountUp";
import { Sparkline, generateTrend } from "../components/ui/Sparkline";
import { OrbitalDecoration } from "../components/ui/OrbitalDecoration";
import { useImpersonation } from "../components/shell/Layout";
import { formatCurrency, formatNumber, relativeTime, cn } from "../lib/utils";
import { membersByWorkspace } from "../lib/mock";

export function Overview() {
  const navigate = useNavigate();
  const { enter } = useImpersonation();

  const heroStats = [
    { v: platformKPIs.totalWorkspaces, l: "Workspace", color: "violet" },
    { v: platformKPIs.totalProjects, l: "Progetti", color: "fuchsia" },
    { v: platformKPIs.totalUsers, l: "Utenti", color: "pink" },
  ];

  const kpis = [
    {
      label: "Workspace attivi",
      value: platformKPIs.activeWorkspaces,
      total: platformKPIs.totalWorkspaces,
      delta: "+2 settimana",
      icon: <Building2 size={14} />,
      color: "cyan",
    },
    {
      label: "Progetti live",
      value: platformKPIs.liveProjects,
      total: platformKPIs.totalProjects,
      delta: "+5 ultimi 7gg",
      icon: <Rocket size={14} />,
      color: "blue",
    },
    {
      label: "MRR totale",
      value: platformKPIs.mrr,
      currency: true,
      delta: "+12.4% MoM",
      icon: <Wallet size={14} />,
      color: "indigo",
      emphasis: true,
    },
    {
      label: "Visite (30gg)",
      value: platformKPIs.totalVisits30d,
      compact: true,
      delta: "+18% vs prec.",
      icon: <MousePointerClick size={14} />,
      color: "sky",
    },
    {
      label: "Lead (30gg)",
      value: platformKPIs.totalLeads30d,
      compact: true,
      delta: "+22% vs prec.",
      icon: <UserPlus size={14} />,
      color: "emerald",
    },
  ];

  const colorMap: Record<string, string> = {
    cyan: "from-cyan-100 to-cyan-50 text-cyan-700 ring-cyan-200/50",
    blue: "from-blue-100 to-blue-50 text-blue-700 ring-blue-200/50",
    indigo: "from-indigo-100 to-indigo-50 text-indigo-700 ring-indigo-200/50",
    sky: "from-sky-100 to-sky-50 text-sky-700 ring-sky-200/50",
    emerald: "from-emerald-100 to-emerald-50 text-emerald-700 ring-emerald-200/50",
    violet: "from-violet-100 to-violet-50 text-violet-700 ring-violet-200/50",
  };

  return (
    <div className="px-4 md:px-6 lg:px-12 py-6 md:py-8 max-w-[1600px] mx-auto">
      {/* HERO STATEMENT — dark card with everything */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl overflow-hidden mb-10 panel-dark"
        style={{
          backgroundImage:
            "radial-gradient(at 0% 0%, rgba(6, 182, 212, 0.45) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.4) 0px, transparent 55%), radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.28) 0px, transparent 55%), radial-gradient(at 0% 100%, rgba(56, 189, 248, 0.32) 0px, transparent 50%), linear-gradient(180deg, #0a1628 0%, #0e1d3a 50%, #0a1838 100%)",
        }}
      >
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 dot-pattern-dark opacity-60" />

        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] blob blob-cyan opacity-30" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] blob blob-blue opacity-25" style={{ animationDelay: "-4s" }} />
        <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] blob blob-indigo opacity-20" style={{ animationDelay: "-8s" }} />

        {/* Orbital SVG decoration */}
        <OrbitalDecoration
          variant="dark"
          className="absolute -right-32 -top-32 w-[700px] h-[700px] pointer-events-none opacity-90"
        />

        <div className="relative p-8 lg:p-12">
          {/* Top bar */}
          <div className="flex items-center gap-3 mb-10 flex-wrap">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] text-white border border-white/20"
              style={{ background: "linear-gradient(135deg, rgba(6, 182, 212, 0.45), rgba(99, 102, 241, 0.45))", backdropFilter: "blur(8px)" }}
            >
              <Sparkles size={12} /> Super Admin
            </span>
            <span className="text-[12.5px] text-white/60 font-medium">
              {new Date().toLocaleDateString("it-IT", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
            <div className="flex-1" />
            <button className="text-[11px] font-bold uppercase tracking-wider text-white/80 hover:text-white flex items-center gap-1.5">
              <Zap size={12} /> Tutti i sistemi <span className="text-emerald-400">·</span> Online
            </button>
          </div>

          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 items-end">
            {/* Left: massive headline */}
            <div>
              <h1
                className="display font-black text-white leading-[0.88] text-balance"
                style={{ fontSize: "clamp(48px, 7.5vw, 108px)" }}
              >
                Tutto.
                <br />
                Di tutti.
                <br />
                <span className="editorial-italic font-light text-white/70">Senza far rumore.</span>
              </h1>
              <p className="mt-7 max-w-md text-[15.5px] text-white/70 leading-relaxed">
                Sei super admin di una piattaforma multi-tenant. Vedi ogni workspace, ogni progetto, ogni utente. Per intervenire dentro un workspace, attiva la modalità{" "}
                <span className="text-cyan-300 font-semibold">View As</span>.
              </p>
              <div className="mt-7 flex gap-3 flex-wrap">
                <Button variant="primary" size="lg" onClick={() => navigate("/workspaces")}>
                  <Plus size={15} strokeWidth={2.5} /> Nuovo workspace
                </Button>
                <button
                  onClick={() => navigate("/users")}
                  className="text-[13px] px-5 h-12 rounded-xl border border-white/20 text-white/90 hover:bg-white/10 font-semibold flex items-center gap-2 transition-colors"
                >
                  Inviti utenti <ArrowUpRight size={14} />
                </button>
              </div>
            </div>

            {/* Right: stats stacked */}
            <div className="space-y-3">
              {heroStats.map((s, i) => (
                <motion.div
                  key={s.l}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex items-center justify-between gap-6 p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur"
                >
                  <span className="text-[13px] text-white/70 font-semibold uppercase tracking-wider">
                    {s.l}
                  </span>
                  <span className="display font-black tabular-nums text-white" style={{ fontSize: "56px" }}>
                    <CountUp to={s.v} duration={1.6} />
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom marquee */}
        <div className="relative border-t border-white/10 py-3 overflow-hidden bg-black/20">
          <div className="marquee-track text-[12px] text-white/60 font-mono uppercase tracking-[0.14em]">
            {[...Array(2)].flatMap((_, n) =>
              [
                "✦ Studio Marchetti · deploy live · 12m fa",
                "✦ Glow-Up · +38 lead questa settimana",
                "✦ Aromafit · €6.210 ultimi 30gg",
                "✦ Nordico Shop · €18.420 ecommerce",
                "✦ ReviewBooster · 89 nuovi clienti",
                "✦ De Santis · booking online deploying",
                "✦ Funnel Lash · 18.4K visite",
                "✦ Trial PlantBased · 3 giorni alla scadenza",
              ].map((t, i) => (
                <span key={`${n}-${i}`} className="shrink-0">
                  {t}
                </span>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.05, duration: 0.4 }}
          >
            <SpotlightCard className={cn("p-5 h-full relative", kpi.emphasis && "gradient-border")}>
              <div className="flex items-start justify-between mb-4">
                <div className={cn("inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ring-1", colorMap[kpi.color])}>
                  {kpi.icon}
                </div>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <TrendingUp size={11} /> {kpi.delta}
                </span>
              </div>
              <div className="text-[11.5px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">{kpi.label}</div>
              <div className="flex items-baseline gap-2">
                <span
                  className={cn(
                    "display font-black tabular-nums text-slate-900",
                    kpi.emphasis && "gradient-text-rich"
                  )}
                  style={{ fontSize: kpi.emphasis ? "44px" : "36px" }}
                >
                  {kpi.currency ? (
                    <CountUp to={kpi.value} format="currency" duration={1.6} />
                  ) : kpi.compact ? (
                    <CountUp to={kpi.value} format="compact" duration={1.4} />
                  ) : (
                    <CountUp to={kpi.value} duration={1.2} />
                  )}
                </span>
                {kpi.total !== undefined && (
                  <span className="text-[14px] text-slate-400 font-semibold tabular-nums">/ {kpi.total}</span>
                )}
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-14">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                <span className="text-[11.5px] text-slate-500 font-bold uppercase tracking-[0.14em]">
                  Andamento · 14 giorni
                </span>
              </div>
              <h3 className="heading-lg text-slate-900" style={{ fontSize: "24px" }}>
                Visite, lead e <span className="editorial-italic font-light gradient-text-warm">fatturato</span>
              </h3>
            </div>
            <div className="flex gap-2">
              <Badge variant="info">Visite</Badge>
              <Badge variant="violet" dot>Lead</Badge>
              <Badge variant="trial" dot>€</Badge>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={platformTimeseries}>
                <defs>
                  <linearGradient id="vio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pnk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} style={{ fontFamily: "JetBrains Mono" }} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} style={{ fontFamily: "JetBrains Mono" }} />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontFamily: "Switzer",
                    boxShadow: "0 4px 16px -4px rgba(15, 23, 42, 0.1)",
                  }}
                  labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="visite" stroke="#06b6d4" strokeWidth={2.5} fill="url(#vio)" />
                <Area type="monotone" dataKey="lead" stroke="#6366f1" strokeWidth={2} fill="url(#pnk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11.5px] text-slate-500 font-bold uppercase tracking-[0.14em]">
              Attività live
            </span>
          </div>
          <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-2 -mr-2 scrollbar-thin">
            {activity.slice(0, 8).map((evt, i) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 group"
              >
                <span
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    evt.type === "deploy" && "bg-violet-100 text-violet-600",
                    evt.type === "invite" && "bg-emerald-100 text-emerald-600",
                    evt.type === "domain" && "bg-sky-100 text-sky-600",
                    evt.type === "billing" && "bg-amber-100 text-amber-600",
                    evt.type === "alert" && "bg-rose-100 text-rose-600",
                    evt.type === "create" && "bg-fuchsia-100 text-fuchsia-600"
                  )}
                >
                  {evt.type === "deploy" && <Rocket size={13} />}
                  {evt.type === "invite" && <UserPlus size={13} />}
                  {evt.type === "domain" && <ArrowUpRight size={13} />}
                  {evt.type === "billing" && <Wallet size={13} />}
                  {evt.type === "alert" && <AlertCircle size={13} />}
                  {evt.type === "create" && <Plus size={13} />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-slate-800 leading-snug">
                    {evt.message}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                    <span className="font-medium text-slate-500">{evt.actor}</span>
                    <span>·</span>
                    <span>{relativeTime(evt.timestamp)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* Workspaces grid */}
      <div className="flex items-end justify-between gap-4 mb-7">
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] tracking-[0.18em] text-violet-600 uppercase font-bold pt-1">02</span>
          <div>
            <h2 className="heading-xl text-slate-900" style={{ fontSize: "30px" }}>
              I tuoi <span className="editorial-italic font-light text-slate-700">workspace</span>.
            </h2>
            <p className="text-[13.5px] text-slate-500 mt-1.5">
              {workspaces.length} totali · ognuno con i suoi progetti, membri, domini.
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/workspaces")}>
          Vedi tutti <ArrowUpRight size={13} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {workspaces.map((ws, i) => {
          const owner = getUser(ws.ownerId);
          const wsProjects = projectsByWorkspace(ws.id);
          const liveCount = wsProjects.filter((p) => p.status === "live").length;
          const members = membersByWorkspace(ws.id);

          return (
            <motion.div
              key={ws.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.03, duration: 0.4 }}
            >
              <SpotlightCard className="p-5">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center display font-black text-white text-[18px] shrink-0"
                      style={{ backgroundImage: gradientFor(owner?.avatarColor || ws.id) }}
                    >
                      {ws.name[0]}
                    </div>
                    <div>
                      <div className="heading-md text-slate-900" style={{ fontSize: "16px" }}>
                        {ws.name}
                      </div>
                      <div className="text-[12px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span className="font-mono">/{ws.slug}</span>
                        {ws.badge && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-md text-[9.5px] font-bold uppercase tracking-wider">
                            {ws.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      ws.status === "active" ? "live"
                      : ws.status === "trial" ? "trial"
                      : ws.status === "paused" ? "paused"
                      : "suspended"
                    }
                    dot
                  >
                    {ws.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5 p-4 bg-slate-50/70 rounded-2xl border border-slate-100">
                  <div>
                    <div className="display font-black text-slate-900 tabular-nums leading-none" style={{ fontSize: "30px" }}>
                      {wsProjects.length}
                    </div>
                    <div className="text-[10.5px] text-slate-500 mt-1.5 font-bold uppercase tracking-wider">Progetti</div>
                  </div>
                  <div className="border-l border-slate-200 pl-3">
                    <div className="display font-black gradient-text-rich tabular-nums leading-none" style={{ fontSize: "30px" }}>
                      {liveCount}
                    </div>
                    <div className="text-[10.5px] text-slate-500 mt-1.5 font-bold uppercase tracking-wider">Live</div>
                  </div>
                  <div className="border-l border-slate-200 pl-3">
                    <div className="display font-black text-slate-900 tabular-nums leading-none" style={{ fontSize: "30px" }}>
                      {ws.monthlyRevenue > 0
                        ? "€" + formatNumber(ws.monthlyRevenue)
                        : "—"}
                    </div>
                    <div className="text-[10.5px] text-slate-500 mt-1.5 font-bold uppercase tracking-wider">MRR</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">Plan</span>
                    <span className="text-[12px] text-slate-700 font-bold uppercase tracking-wide">{ws.plan}</span>
                  </div>
                  <AvatarStack
                    members={members.map((m) => ({
                      name: m.name,
                      color: m.avatarColor,
                    }))}
                  />
                </div>

                {/* Sparkline trend */}
                <div className="flex items-center justify-between mb-4 px-3 py-2.5 rounded-xl bg-gradient-to-br from-violet-50/60 via-pink-50/40 to-transparent border border-slate-100">
                  <div>
                    <div className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">
                      Trend visite · 14gg
                    </div>
                    <div className="text-[11px] text-emerald-600 font-bold mt-0.5">
                      ↗ +{12 + (i * 3)}% vs prec.
                    </div>
                  </div>
                  <Sparkline
                    data={generateTrend(ws.id, 14, ws.status === "active" ? "up" : ws.status === "paused" ? "down" : "flat")}
                    width={96}
                    height={32}
                    stroke={ws.status === "active" ? "#8b5cf6" : ws.status === "paused" ? "#f43f5e" : "#94a3b8"}
                    strokeWidth={1.75}
                  />
                </div>

                <div className="mb-5">
                  <div className="flex justify-between text-[11px] mb-2">
                    <span className="text-slate-500 font-medium">Storage</span>
                    <span className="text-slate-700 tabular-nums font-mono font-medium">
                      {(ws.storageMb / 1024).toFixed(1)}/{ws.storageLimitMb / 1024}GB
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 relative overflow-hidden rounded-full">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        background: "linear-gradient(90deg, #8b5cf6, #ec4899, #fb923c)",
                        width: `${Math.min(100, (ws.storageMb / ws.storageLimitMb) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-100 -mx-5 px-5">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 justify-center"
                    onClick={() => navigate(`/workspaces/${ws.id}`)}
                  >
                    Apri <ArrowUpRight size={12} />
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      if (owner) {
                        enter(owner, ws);
                        navigate(`/workspaces/${ws.id}`);
                      }
                    }}
                  >
                    <Eye size={12} /> View as
                  </Button>
                </div>
              </SpotlightCard>
            </motion.div>
          );
        })}
      </div>

      {/* Footer block */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-5">
        <FooterTile
          icon={<Sparkles size={18} />}
          color="violet"
          label="Top progetto del mese"
          value={
            projects
              .filter((p) => p.revenue30d)
              .sort((a, b) => (b.revenue30d || 0) - (a.revenue30d || 0))[0]
              ?.name || "—"
          }
          sub={`+${formatCurrency(
            projects.sort(
              (a, b) => (b.revenue30d || 0) - (a.revenue30d || 0)
            )[0]?.revenue30d || 0
          )} negli ultimi 30 giorni`}
        />
        <FooterTile
          icon={<TrendingUp size={18} />}
          color="emerald"
          label="Workspace in crescita"
          value="Studio Marchetti"
          sub="+38% lead rispetto al mese scorso"
        />
        <FooterTile
          icon={<AlertCircle size={18} />}
          color="rose"
          label="Attenzione richiesta"
          value="2 alert attivi"
          sub="Pagamento Romano fallito · Trial PlantBased in scadenza"
        />
      </div>
    </div>
  );
}

function FooterTile({
  icon,
  color,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  color: "violet" | "emerald" | "rose";
  label: string;
  value: string;
  sub: string;
}) {
  const bg = {
    violet: "from-violet-50 via-fuchsia-50 to-pink-50 border-violet-100",
    emerald: "from-emerald-50 via-teal-50 to-sky-50 border-emerald-100",
    rose: "from-rose-50 via-orange-50 to-amber-50 border-rose-100",
  };
  const iconBg = {
    violet: "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-glow",
    emerald: "bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 text-white",
    rose: "bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500 text-white",
  };
  return (
    <Card className={`p-6 bg-gradient-to-br ${bg[color]} border`}>
      <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4", iconBg[color])}>
        {icon}
      </div>
      <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
        {label}
      </div>
      <div className="heading-lg text-slate-900 mb-1.5" style={{ fontSize: "20px" }}>
        {value}
      </div>
      <div className="text-[12.5px] text-slate-600">{sub}</div>
    </Card>
  );
}
