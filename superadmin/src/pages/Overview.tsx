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
import { Stat } from "../components/ui/Stat";
import { Badge } from "../components/ui/Badge";
import { Avatar, AvatarStack, gradientFor } from "../components/ui/Avatar";
import { SectionLabel } from "../components/ui/SectionLabel";
import { Button } from "../components/ui/Button";
import { useImpersonation } from "../components/shell/Layout";
import { formatCurrency, formatNumber, relativeTime, cn } from "../lib/utils";
import { membersByWorkspace } from "../lib/mock";

export function Overview() {
  const navigate = useNavigate();
  const { enter } = useImpersonation();

  const kpis = [
    {
      label: "Workspace attivi",
      value: platformKPIs.activeWorkspaces,
      unit: `/ ${platformKPIs.totalWorkspaces}`,
      delta: { value: "+2 questa settimana", positive: true },
      icon: <Building2 size={13} />,
    },
    {
      label: "Progetti live",
      value: platformKPIs.liveProjects,
      unit: `/ ${platformKPIs.totalProjects}`,
      delta: { value: "+5 ultimi 7gg", positive: true },
      icon: <Rocket size={13} />,
    },
    {
      label: "MRR totale",
      value: formatCurrency(platformKPIs.mrr),
      delta: { value: "+12.4% MoM", positive: true },
      emphasis: true,
      icon: <Wallet size={13} />,
    },
    {
      label: "Visite (30gg)",
      value: formatNumber(platformKPIs.totalVisits30d),
      delta: { value: "+18% vs prec.", positive: true },
      icon: <MousePointerClick size={13} />,
    },
    {
      label: "Lead (30gg)",
      value: formatNumber(platformKPIs.totalLeads30d),
      delta: { value: "+22% vs prec.", positive: true },
      icon: <UserPlus size={13} />,
    },
  ];

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1600px] mx-auto">
      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12 pt-2"
      >
        <div className="flex items-center gap-3 mb-6">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white"
            style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)" }}
          >
            <Sparkles size={12} /> Super Admin
          </span>
          <span className="text-[12px] text-slate-500">
            {new Date().toLocaleDateString("it-IT", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </span>
          <div className="flex-1" />
          <Button variant="primary" size="md">
            <Plus size={14} /> Nuovo workspace
          </Button>
        </div>

        <h1
          className="font-display font-bold text-slate-900 tracking-monster leading-[1] text-balance"
          style={{ fontSize: "clamp(40px, 6.5vw, 80px)" }}
        >
          Il palazzo che hai costruito,
          <br />
          <span className="gradient-text">in un colpo d'occhio.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[16px] text-slate-600 leading-relaxed">
          Sei super admin di <strong className="text-slate-900">{platformKPIs.totalWorkspaces} workspace</strong>,{" "}
          <strong className="text-slate-900">{platformKPIs.totalProjects} progetti</strong>, <strong className="text-slate-900">{platformKPIs.totalUsers} utenti</strong>.
          Per intervenire dentro un workspace, attiva la modalità <span className="font-semibold text-violet-600">View As</span>.
        </p>
      </motion.div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-12">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.04, duration: 0.4 }}
          >
            <Card className="p-5 h-full">
              <Stat {...kpi} />
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-12">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                <span className="text-[12px] text-slate-500 font-semibold uppercase tracking-wider">
                  Andamento · 14 giorni
                </span>
              </div>
              <h3 className="font-display text-[24px] text-slate-900 font-bold tracking-ultra-tight">
                Visite, lead e fatturato
              </h3>
            </div>
            <div className="flex gap-2">
              <Badge variant="violet">Visite</Badge>
              <Badge variant="info" dot>Lead</Badge>
              <Badge variant="trial" dot>€</Badge>
            </div>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={platformTimeseries}>
                <defs>
                  <linearGradient id="vio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pnk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  style={{ fontFamily: "Geist Mono" }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  style={{ fontFamily: "Geist Mono" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontFamily: "Geist",
                    boxShadow: "0 4px 16px -4px rgba(15, 23, 42, 0.1)",
                  }}
                  labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="visite"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fill="url(#vio)"
                />
                <Area
                  type="monotone"
                  dataKey="lead"
                  stroke="#ec4899"
                  strokeWidth={2}
                  fill="url(#pnk)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[12px] text-slate-500 font-semibold uppercase tracking-wider">
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
      <SectionLabel
        index="02"
        title="Tutti i workspace"
        subtitle={`${workspaces.length} totali · ognuno con i suoi progetti, membri e domini`}
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate("/workspaces")}>
            Vedi tutti <ArrowUpRight size={13} />
          </Button>
        }
      />

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
              <Card interactive className="p-5">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-white text-lg shrink-0"
                      style={{ backgroundImage: gradientFor(owner?.avatarColor || ws.id) }}
                    >
                      {ws.name[0]}
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold text-slate-900 tracking-tight">
                        {ws.name}
                      </div>
                      <div className="text-[12px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span className="font-mono">/{ws.slug}</span>
                        {ws.badge && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-md text-[9px] font-bold uppercase tracking-wider">
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

                <div className="grid grid-cols-3 gap-3 mb-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <div className="font-display text-[24px] text-slate-900 font-bold tabular-nums leading-none">
                      {wsProjects.length}
                    </div>
                    <div className="text-[10.5px] text-slate-500 mt-1.5 font-medium">Progetti</div>
                  </div>
                  <div className="border-l border-slate-200 pl-3">
                    <div className="font-display text-[24px] gradient-text font-bold tabular-nums leading-none">
                      {liveCount}
                    </div>
                    <div className="text-[10.5px] text-slate-500 mt-1.5 font-medium">Live</div>
                  </div>
                  <div className="border-l border-slate-200 pl-3">
                    <div className="font-display text-[24px] text-slate-900 font-bold tabular-nums leading-none">
                      {ws.monthlyRevenue > 0
                        ? "€" + formatNumber(ws.monthlyRevenue)
                        : "—"}
                    </div>
                    <div className="text-[10.5px] text-slate-500 mt-1.5 font-medium">MRR</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] text-slate-400 font-semibold uppercase tracking-wider">Plan</span>
                    <span className="text-[12px] text-slate-700 font-semibold">{ws.plan}</span>
                  </div>
                  <AvatarStack
                    members={members.map((m) => ({
                      name: m.name,
                      color: m.avatarColor,
                    }))}
                  />
                </div>

                {/* Storage bar */}
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
                        background: "linear-gradient(90deg, #8b5cf6, #ec4899)",
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
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Footer block */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5">
        <FooterTile
          icon={<Sparkles size={14} />}
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
          icon={<TrendingUp size={14} />}
          color="emerald"
          label="Workspace in crescita"
          value="Studio Marchetti"
          sub="+38% lead rispetto al mese scorso"
        />
        <FooterTile
          icon={<AlertCircle size={14} />}
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
    violet: "from-violet-50 to-fuchsia-50 border-violet-100",
    emerald: "from-emerald-50 to-sky-50 border-emerald-100",
    rose: "from-rose-50 to-amber-50 border-rose-100",
  };
  const iconColor = {
    violet: "bg-violet-100 text-violet-600",
    emerald: "bg-emerald-100 text-emerald-600",
    rose: "bg-rose-100 text-rose-600",
  };
  return (
    <Card className={`p-5 bg-gradient-to-br ${bg[color]} shadow-soft`}>
      <div className={cn("inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3", iconColor[color])}>
        {icon}
      </div>
      <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="font-display text-[22px] text-slate-900 font-bold tracking-ultra-tight leading-tight mb-1.5">
        {value}
      </div>
      <div className="text-[12.5px] text-slate-600">{sub}</div>
    </Card>
  );
}
