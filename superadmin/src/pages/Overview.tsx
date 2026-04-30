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
import { AvatarStack } from "../components/ui/Avatar";
import { SectionLabel } from "../components/ui/SectionLabel";
import { Button } from "../components/ui/Button";
import { useImpersonation } from "../components/shell/Layout";
import { formatCurrency, formatNumber, relativeTime, cn } from "../lib/utils";
import { membersByWorkspace } from "../lib/mock";

export function Overview() {
  const navigate = useNavigate();
  const { enter } = useImpersonation();

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1600px] mx-auto">
      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12 pt-4"
      >
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[10px] uppercase tracking-[0.22em] text-accent font-semibold">
            01 — Overview
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-paper-300 to-transparent" />
          <span className="text-[10px] uppercase tracking-[0.16em] text-ink-100 font-medium">
            {new Date().toLocaleDateString("it-IT", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <h1
          className="font-display font-light text-ink-900 tracking-monster leading-[0.95] text-balance"
          style={{
            fontSize: "clamp(48px, 7vw, 92px)",
            fontVariationSettings: "'opsz' 144, 'SOFT' 30",
          }}
        >
          Il tuo palazzo,
          <br />
          <em className="text-accent not-italic">visto dall'alto.</em>
        </h1>
        <p className="mt-6 max-w-xl text-[15px] text-ink-200 leading-relaxed">
          Sei super admin di {platformKPIs.totalWorkspaces} workspace,{" "}
          {platformKPIs.totalProjects} progetti, {platformKPIs.totalUsers} utenti.
          Per intervenire dentro un workspace, attiva la modalità{" "}
          <span className="text-accent font-semibold">View As</span>.
        </p>
      </motion.div>

      {/* KPI strip */}
      <Card className="grid grid-cols-2 lg:grid-cols-5 mb-12 overflow-hidden p-0">
        {[
          {
            label: "Workspace attivi",
            value: platformKPIs.activeWorkspaces,
            unit: `/ ${platformKPIs.totalWorkspaces}`,
            delta: { value: "+2 questa settimana", positive: true },
          },
          {
            label: "Progetti live",
            value: platformKPIs.liveProjects,
            unit: `/ ${platformKPIs.totalProjects}`,
            delta: { value: "+5 ultimi 7gg", positive: true },
          },
          {
            label: "MRR totale",
            value: formatCurrency(platformKPIs.mrr),
            delta: { value: "+12.4% MoM", positive: true },
            emphasis: true,
          },
          {
            label: "Visite (30gg)",
            value: formatNumber(platformKPIs.totalVisits30d),
            delta: { value: "+18% vs prec.", positive: true },
          },
          {
            label: "Lead (30gg)",
            value: formatNumber(platformKPIs.totalLeads30d),
            delta: { value: "+22% vs prec.", positive: true },
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
            className={cn(
              "p-5 lg:p-6 hairline-r last:border-r-0",
              i >= 2 && "lg:hairline-r"
            )}
          >
            <Stat {...kpi} />
          </motion.div>
        ))}
      </Card>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-ink-100 mb-2 font-semibold">
                Andamento piattaforma · 14 giorni
              </div>
              <h3
                className="font-display text-[26px] text-ink-900 font-light tracking-ultra-tight"
                style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
              >
                Visite, lead, fatturato
              </h3>
            </div>
            <div className="flex gap-2">
              <Badge variant="accent">Visite</Badge>
              <Badge variant="neutral" dot>Lead</Badge>
              <Badge variant="neutral" dot>€</Badge>
            </div>
          </div>

          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={platformTimeseries}>
                <defs>
                  <linearGradient id="acc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1a2548" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#1a2548" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lac" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a62b1f" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#a62b1f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e9e2d2" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#a59676"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  style={{ fontFamily: "JetBrains Mono" }}
                />
                <YAxis
                  stroke="#a59676"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  style={{ fontFamily: "JetBrains Mono" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e9e2d2",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontFamily: "Inter Tight",
                    boxShadow: "0 4px 12px -4px rgba(20, 18, 13, 0.08)",
                  }}
                  labelStyle={{ color: "#2e2820", fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="visite"
                  stroke="#1a2548"
                  strokeWidth={1.75}
                  fill="url(#acc)"
                />
                <Area
                  type="monotone"
                  dataKey="lead"
                  stroke="#a62b1f"
                  strokeWidth={1.25}
                  fill="url(#lac)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-[10px] uppercase tracking-[0.16em] text-ink-100 mb-4 font-semibold">
            Attività in tempo reale
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 -mr-2">
            {activity.slice(0, 8).map((evt, i) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 group"
              >
                <span
                  className={cn(
                    "w-0.5 self-stretch shrink-0 mt-1.5 rounded-full",
                    evt.type === "deploy" && "bg-accent",
                    evt.type === "invite" && "bg-sage",
                    evt.type === "domain" && "bg-accent",
                    evt.type === "billing" && "bg-saffron",
                    evt.type === "alert" && "bg-lacquer",
                    evt.type === "create" && "bg-ink-100"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] text-ink-400 leading-snug">
                    {evt.message}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] uppercase tracking-[0.1em] text-ink-100">
                    <span className="font-medium">{evt.actor}</span>
                    <span>·</span>
                    <span className="font-mono normal-case tracking-normal">{relativeTime(evt.timestamp)}</span>
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
        title="I workspace"
        subtitle={`${workspaces.length} totali · click sulla card per ispezionare · View As per impersonare`}
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/workspaces")}
          >
            Vedi tutti <ArrowUpRight size={12} />
          </Button>
        }
        className="mb-6"
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
              transition={{ delay: 0.08 + i * 0.04, duration: 0.4 }}
            >
              <Card interactive className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-md flex items-center justify-center font-display font-medium text-base"
                      style={{
                        backgroundColor: `${owner?.avatarColor}1a`,
                        color: shade(owner?.avatarColor || "#999999"),
                        boxShadow: `inset 0 0 0 1px ${owner?.avatarColor}55`,
                      }}
                    >
                      {ws.name[0]}
                    </div>
                    <div>
                      <div className="text-[14.5px] font-medium text-ink-900 tracking-tight">
                        {ws.name}
                      </div>
                      <div className="text-[11px] text-ink-100 mt-0.5">
                        /{ws.slug}
                        {ws.badge && (
                          <span className="ml-2 text-accent font-semibold uppercase tracking-[0.1em]">
                            · {ws.badge}
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

                <div className="grid grid-cols-3 gap-2 mb-4 panel-soft p-3">
                  <div>
                    <div className="font-display text-[26px] text-ink-900 font-light tabular-nums leading-none" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}>
                      {wsProjects.length}
                    </div>
                    <div className="text-[10px] text-ink-100 mt-1.5 uppercase tracking-[0.1em] font-medium">
                      Progetti
                    </div>
                  </div>
                  <div className="hairline-l pl-3">
                    <div className="font-display text-[26px] text-accent font-light tabular-nums leading-none" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}>
                      {liveCount}
                    </div>
                    <div className="text-[10px] text-ink-100 mt-1.5 uppercase tracking-[0.1em] font-medium">
                      Live
                    </div>
                  </div>
                  <div className="hairline-l pl-3">
                    <div className="font-display text-[26px] text-ink-900 font-light tabular-nums leading-none" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}>
                      {ws.monthlyRevenue > 0
                        ? "€" + formatNumber(ws.monthlyRevenue)
                        : "—"}
                    </div>
                    <div className="text-[10px] text-ink-100 mt-1.5 uppercase tracking-[0.1em] font-medium">
                      MRR
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-ink-200 mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-ink-100 uppercase tracking-[0.1em] font-medium">Plan</span>
                    <span className="text-ink-400 font-medium uppercase tracking-[0.06em]">{ws.plan}</span>
                  </div>
                  <AvatarStack
                    members={members.map((m) => ({
                      name: m.name,
                      color: m.avatarColor,
                    }))}
                  />
                </div>

                {/* Storage bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] text-ink-100 mb-1.5 uppercase tracking-[0.1em] font-medium">
                    <span>Storage</span>
                    <span className="text-ink-200 tabular-nums normal-case font-mono">
                      {(ws.storageMb / 1024).toFixed(1)}/{ws.storageLimitMb / 1024}GB
                    </span>
                  </div>
                  <div className="h-1 bg-paper-200 relative overflow-hidden rounded-full">
                    <div
                      className="absolute inset-y-0 left-0 bg-accent rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (ws.storageMb / ws.storageLimitMb) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 hairline-t pt-3 -mx-5 px-5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/workspaces/${ws.id}`)}
                  >
                    Apri <ArrowUpRight size={11} />
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
                    <Eye size={11} /> View as
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
          )} negli ultimi 30gg`}
        />
        <FooterTile
          icon={<TrendingUp size={14} />}
          label="Workspace in crescita"
          value="Studio Marchetti"
          sub="+38% lead rispetto al mese scorso"
        />
        <FooterTile
          icon={<AlertCircle size={14} />}
          label="Attenzione richiesta"
          value="2 alert attivi"
          sub="Pagamento Romano fallito · Trial PlantBased in scadenza"
          warn
        />
      </div>
    </div>
  );
}

function FooterTile({
  icon,
  label,
  value,
  sub,
  warn = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  warn?: boolean;
}) {
  return (
    <Card className="p-5">
      <div
        className={cn(
          "flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] mb-3 font-semibold",
          warn ? "text-lacquer" : "text-accent"
        )}
      >
        {icon}
        <span>{label}</span>
      </div>
      <div
        className="font-display text-xl text-ink-900 font-normal tracking-ultra-tight leading-tight mb-1"
        style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
      >
        {value}
      </div>
      <div className="text-[12px] text-ink-200">
        {sub}
      </div>
    </Card>
  );
}

function shade(hex: string) {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 70);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 70);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 70);
  return `rgb(${r}, ${g}, ${b})`;
}
