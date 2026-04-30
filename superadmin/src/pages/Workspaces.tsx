import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Eye, ArrowUpRight, Plus, SlidersHorizontal } from "lucide-react";
import {
  workspaces,
  getUser,
  projectsByWorkspace,
  membersByWorkspace,
  type Plan,
  type WorkspaceStatus,
} from "../lib/mock";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Avatar, AvatarStack, gradientFor } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Sparkline, generateTrend } from "../components/ui/Sparkline";
import { PageHero } from "../components/ui/PageHero";
import { useImpersonation } from "../components/shell/Layout";
import { formatCurrency, cn } from "../lib/utils";

const STATUSES: ("all" | WorkspaceStatus)[] = ["all", "active", "trial", "paused", "suspended"];
const PLANS: ("all" | Plan)[] = ["all", "free", "starter", "growth", "scale", "enterprise"];

export function Workspaces() {
  const navigate = useNavigate();
  const { enter } = useImpersonation();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<typeof STATUSES[number]>("all");
  const [plan, setPlan] = useState<typeof PLANS[number]>("all");

  const filtered = useMemo(() => {
    return workspaces.filter((w) => {
      if (q && !w.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (status !== "all" && w.status !== status) return false;
      if (plan !== "all" && w.plan !== plan) return false;
      return true;
    });
  }, [q, status, plan]);

  const activeCount = workspaces.filter((w) => w.status === "active").length;
  const totalMRR = workspaces.reduce((s, w) => s + w.monthlyRevenue, 0);

  return (
    <div className="px-4 md:px-6 lg:px-10 py-6 md:py-8 max-w-[1600px] mx-auto">
      <PageHero
        index="02 — Workspaces"
        title={
          <>
            Tutti i <span className="editorial-italic font-light text-white/80">workspace</span>.
            <br />
            <span className="text-white/65 font-light">Sotto controllo.</span>
          </>
        }
        description={
          <>
            Ogni riga è un mondo a sé. Filtra, ispeziona, oppure entra in modalità{" "}
            <span className="font-semibold text-cyan-300">View As</span> per vedere quello che vede l'admin.
          </>
        }
        action={
          <Button variant="primary" size="lg">
            <Plus size={14} /> Nuovo workspace
          </Button>
        }
        stats={[
          { label: "Totali", value: workspaces.length },
          { label: "Attivi", value: activeCount },
          { label: "MRR", value: "€" + (totalMRR / 1000).toFixed(1) + "K" },
        ]}
      />

      {/* Filter bar */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[260px] bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl px-3 py-2 transition-all">
            <Search size={14} className="text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca per nome…"
              className="flex-1 bg-transparent outline-none text-[13px] text-slate-700 placeholder:text-slate-400"
            />
          </div>

          <FilterPill
            label="Stato"
            options={STATUSES}
            value={status}
            onChange={(v) => setStatus(v as typeof status)}
          />
          <FilterPill
            label="Plan"
            options={PLANS}
            value={plan}
            onChange={(v) => setPlan(v as typeof plan)}
          />

          <div className="flex items-center gap-2 text-[12px] text-slate-500 ml-auto bg-slate-50 px-3 py-1.5 rounded-full">
            <SlidersHorizontal size={12} />
            <span className="tabular-nums font-semibold text-slate-700">{filtered.length}</span>
            <span>di {workspaces.length}</span>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[1100px]">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_100px_140px] gap-4 px-5 py-3.5 border-b border-slate-100 text-[10.5px] uppercase tracking-wider text-slate-500 font-bold bg-slate-50/50">
          <div>Workspace</div>
          <div>Owner</div>
          <div>Plan</div>
          <div className="text-right">Progetti</div>
          <div className="text-right">MRR</div>
          <div>Membri</div>
          <div>Trend</div>
          <div className="text-right">Azioni</div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.map((ws, i) => {
            const owner = getUser(ws.ownerId);
            const wsProjects = projectsByWorkspace(ws.id);
            const liveCount = wsProjects.filter((p) => p.status === "live").length;
            const members = membersByWorkspace(ws.id);
            return (
              <motion.div
                key={ws.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025, duration: 0.3 }}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_100px_140px] gap-4 px-5 py-4 items-center hover:bg-slate-50/60 group transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-white text-[15px] shrink-0"
                    style={{ backgroundImage: gradientFor(owner?.avatarColor || ws.id) }}
                  >
                    {ws.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="heading-md text-slate-900 truncate flex items-center gap-2" style={{ fontSize: "14.5px" }}>
                      {ws.name}
                      {ws.badge && (
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-md text-[9px] font-bold uppercase tracking-wider">
                          {ws.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11.5px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-mono">/{ws.slug}</span>
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
                  </div>
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  {owner && <Avatar name={owner.name} color={owner.avatarColor} size="xs" />}
                  <span className="text-[13px] text-slate-700 truncate font-medium">{owner?.name}</span>
                </div>

                <div className="text-[11.5px] uppercase tracking-wide text-slate-700 font-bold">{ws.plan}</div>

                <div className="text-right">
                  <span className="font-display text-[18px] text-slate-900 font-bold tabular-nums">
                    {wsProjects.length}
                  </span>
                  <span className="text-[10.5px] text-slate-500 ml-1.5 font-semibold">
                    {liveCount} live
                  </span>
                </div>

                <div className="text-right font-display text-[18px] text-slate-900 font-bold tabular-nums">
                  {ws.monthlyRevenue > 0 ? formatCurrency(ws.monthlyRevenue) : <span className="text-slate-300">—</span>}
                </div>

                <div>
                  <AvatarStack
                    members={members.map((m) => ({ name: m.name, color: m.avatarColor }))}
                    max={4}
                  />
                </div>

                <div>
                  <Sparkline
                    data={generateTrend(ws.id, 12, ws.status === "active" ? "up" : ws.status === "paused" ? "down" : "flat")}
                    width={88}
                    height={26}
                    stroke={ws.status === "active" ? "#06b6d4" : ws.status === "paused" ? "#f43f5e" : "#94a3b8"}
                    strokeWidth={1.5}
                  />
                </div>

                <div className="flex justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/workspaces/${ws.id}`)}
                    className="opacity-50 group-hover:opacity-100"
                  >
                    <ArrowUpRight size={13} />
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
                    <Eye size={12} /> View
                  </Button>
                </div>
              </motion.div>
            );
            })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function FilterPill<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl p-1">
      <span className="text-[10.5px] uppercase tracking-wider text-slate-500 px-2 font-bold">
        {label}
      </span>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "text-[11px] uppercase tracking-wide px-2.5 py-1 rounded-lg transition-all font-semibold",
            value === opt
              ? "bg-white text-slate-900 shadow-soft"
              : "text-slate-500 hover:text-slate-900"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
