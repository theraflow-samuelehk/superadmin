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
import { Card, CardCorner } from "../components/ui/Card";
import { Stat } from "../components/ui/Stat";
import { Badge } from "../components/ui/Badge";
import { Avatar, AvatarStack } from "../components/ui/Avatar";
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
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-acid">
            01 / Overview
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-acid/40 to-transparent"></div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
            {new Date().toLocaleDateString("it-IT", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <h1
          className="font-display font-light text-ink-50 tracking-monster leading-[0.9] text-balance"
          style={{
            fontSize: "clamp(48px, 7vw, 96px)",
            fontVariationSettings: "'opsz' 144, 'SOFT' 30",
          }}
        >
          Vedi <em className="text-acid not-italic font-normal">tutto</em> di tutti.
          <br />
          <span className="text-ink-300">Comanda nessuno per default.</span>
        </h1>
        <p className="mt-6 max-w-xl text-sm text-ink-300 leading-relaxed">
          Sei super admin di {platformKPIs.totalWorkspaces} workspace,{" "}
          {platformKPIs.totalProjects} progetti, {platformKPIs.totalUsers} utenti.
          Per intervenire dentro un workspace, attiva la modalità{" "}
          <span className="text-acid font-mono uppercase tracking-wide">
            View As
          </span>
          .
        </p>
      </motion.div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 hairline rounded-sm bg-ink-900 mb-12 overflow-hidden">
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
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-300 mb-1">
                ◇ Andamento piattaforma · 14 giorni
              </div>
              <div className="flex items-baseline gap-3">
                <h3
                  className="font-display text-2xl text-ink-50 font-light tracking-ultra-tight"
                  style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
                >
                  Visite, lead, fatturato
                </h3>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="acid">Visite</Badge>
              <Badge variant="neutral" dot>Lead</Badge>
              <Badge variant="neutral" dot>€</Badge>
            </div>
          </div>

          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={platformTimeseries}>
                <defs>
                  <linearGradient id="acid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4ff4f" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#d4ff4f" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cool" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4fd4ff" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#4fd4ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1d1d20" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#56565d"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  style={{ fontFamily: "JetBrains Mono" }}
                />
                <YAxis
                  stroke="#56565d"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  style={{ fontFamily: "JetBrains Mono" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0a0a0a",
                    border: "1px solid #26262a",
                    borderRadius: "2px",
                    fontSize: "11px",
                    fontFamily: "JetBrains Mono",
                  }}
                  labelStyle={{ color: "#cfcfd4" }}
                />
                <Area
                  type="monotone"
                  dataKey="visite"
                  stroke="#d4ff4f"
                  strokeWidth={1.5}
                  fill="url(#acid)"
                />
                <Area
                  type="monotone"
                  dataKey="lead"
                  stroke="#4fd4ff"
                  strokeWidth={1}
                  fill="url(#cool)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-300 mb-4">
            ◇ Live activity feed
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
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
                    "w-1 self-stretch shrink-0 mt-1",
                    evt.type === "deploy" && "bg-acid",
                    evt.type === "invite" && "bg-good",
                    evt.type === "domain" && "bg-acid",
                    evt.type === "billing" && "bg-warn",
                    evt.type === "alert" && "bg-bad",
                    evt.type === "create" && "bg-ink-300"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-ink-100 leading-snug">
                    {evt.message}
                  </div>
                  <div className="flex items-center gap-2 mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-400">
                    <span>{evt.actor}</span>
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
        subtitle={`${workspaces.length} workspace · click per ispezionare · click View As per impersonare`}
        action={
          <Button
            variant="acid"
            size="sm"
            onClick={() => navigate("/workspaces")}
          >
            Vedi tutti <ArrowUpRight size={12} />
          </Button>
        }
        className="mb-6"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                <CardCorner />

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-sm flex items-center justify-center font-display font-medium text-sm"
                      style={{
                        backgroundColor: `${owner?.avatarColor}15`,
                        color: owner?.avatarColor,
                        boxShadow: `inset 0 0 0 1px ${owner?.avatarColor}30`,
                      }}
                    >
                      {ws.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-ink-50 tracking-tight">
                        {ws.name}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400 mt-0.5">
                        /{ws.slug}
                        {ws.badge && (
                          <span className="ml-2 text-acid">· {ws.badge}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      ws.status === "active"
                        ? "live"
                        : ws.status === "trial"
                        ? "trial"
                        : ws.status === "paused"
                        ? "paused"
                        : "suspended"
                    }
                    dot
                  >
                    {ws.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 hairline rounded-sm bg-ink-950 p-3">
                  <div>
                    <div className="font-display text-2xl text-ink-50 font-light tabular-nums leading-none">
                      {wsProjects.length}
                    </div>
                    <div className="text-[9px] font-mono uppercase tracking-[0.14em] text-ink-400 mt-1">
                      Progetti
                    </div>
                  </div>
                  <div className="hairline-l pl-2">
                    <div className="font-display text-2xl text-acid font-light tabular-nums leading-none">
                      {liveCount}
                    </div>
                    <div className="text-[9px] font-mono uppercase tracking-[0.14em] text-ink-400 mt-1">
                      Live
                    </div>
                  </div>
                  <div className="hairline-l pl-2">
                    <div className="font-display text-2xl text-ink-50 font-light tabular-nums leading-none">
                      {ws.monthlyRevenue > 0
                        ? "€" + formatNumber(ws.monthlyRevenue)
                        : "—"}
                    </div>
                    <div className="text-[9px] font-mono uppercase tracking-[0.14em] text-ink-400 mt-1">
                      MRR
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-ink-400 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-ink-300">Plan</span>
                    <span className="text-ink-100">{ws.plan}</span>
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
                  <div className="flex justify-between text-[9px] font-mono uppercase tracking-[0.14em] text-ink-400 mb-1.5">
                    <span>Storage</span>
                    <span className="text-ink-200 tabular-nums">
                      {(ws.storageMb / 1024).toFixed(1)}/{ws.storageLimitMb / 1024}GB
                    </span>
                  </div>
                  <div className="h-px bg-ink-700 relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-acid"
                      style={{
                        width: `${Math.min(
                          100,
                          (ws.storageMb / ws.storageLimitMb) * 100
                        )}%`,
                      }}
                    ></div>
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
                    variant="acid"
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
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
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
          sub="Pagamento Romano fallito · Trial PlantBased"
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
          "flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] mb-3",
          warn ? "text-warn" : "text-acid"
        )}
      >
        {icon}
        <span>{label}</span>
      </div>
      <div
        className="font-display text-xl text-ink-50 font-light tracking-ultra-tight leading-tight mb-1"
        style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
      >
        {value}
      </div>
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-ink-400">
        {sub}
      </div>
    </Card>
  );
}
