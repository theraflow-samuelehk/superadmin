import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Filter, Eye, ArrowUpRight, Plus } from "lucide-react";
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
import { Avatar, AvatarStack } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { SectionLabel } from "../components/ui/SectionLabel";
import { useImpersonation } from "../components/shell/Layout";
import { formatCurrency, formatNumber, cn } from "../lib/utils";

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

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1600px] mx-auto">
      <div className="mb-8 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-acid">
            02 / Workspaces
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-acid/40 to-transparent" />
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="font-display font-light text-ink-50 tracking-monster leading-[0.95]"
              style={{ fontSize: "clamp(40px, 5vw, 64px)", fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
            >
              Tutti i workspace.
            </h1>
            <p className="mt-3 text-sm text-ink-300 max-w-lg">
              Ogni riga è un mondo a sé. Filtra, ispeziona, oppure entra in modalità{" "}
              <span className="text-acid font-mono uppercase tracking-wide">View As</span> per vedere quello che vede l'admin.
            </p>
          </div>
          <Button variant="acid">
            <Plus size={12} /> Nuovo workspace
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <Card className="p-4 mb-6 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[260px] hairline rounded-sm bg-ink-950 px-3 py-2">
          <Search size={13} className="text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca per nome…"
            className="flex-1 bg-transparent outline-none text-xs font-mono text-ink-100 placeholder:text-ink-500"
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

        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.14em] text-ink-400 ml-auto">
          <Filter size={11} />
          {filtered.length} di {workspaces.length}
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_140px] gap-4 px-5 py-3 hairline-b text-[9px] font-mono uppercase tracking-[0.18em] text-ink-400">
          <div>Workspace</div>
          <div>Owner</div>
          <div>Plan</div>
          <div className="text-right">Progetti</div>
          <div className="text-right">MRR</div>
          <div>Membri</div>
          <div className="text-right">Azioni</div>
        </div>

        <div className="divide-y divide-ink-800">
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
                transition={{ delay: i * 0.03, duration: 0.3 }}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_140px] gap-4 px-5 py-4 items-center hover:bg-ink-850 group transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-sm flex items-center justify-center font-display text-sm shrink-0"
                    style={{
                      backgroundColor: `${owner?.avatarColor}15`,
                      color: owner?.avatarColor,
                      boxShadow: `inset 0 0 0 1px ${owner?.avatarColor}30`,
                    }}
                  >
                    {ws.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink-50 truncate flex items-center gap-2">
                      {ws.name}
                      {ws.badge && <span className="text-[8px] font-mono text-acid uppercase tracking-[0.14em]">· {ws.badge}</span>}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400 mt-0.5 flex items-center gap-2">
                      /{ws.slug}
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
                  <span className="text-xs text-ink-100 truncate">{owner?.name}</span>
                </div>

                <div className="text-xs font-mono uppercase tracking-[0.14em] text-ink-200">{ws.plan}</div>

                <div className="text-right">
                  <span className="font-display text-lg text-ink-50 font-light tabular-nums">
                    {wsProjects.length}
                  </span>
                  <span className="font-mono text-[10px] text-ink-400 ml-1.5">{liveCount} live</span>
                </div>

                <div className="text-right font-display text-lg text-ink-50 font-light tabular-nums">
                  {ws.monthlyRevenue > 0 ? formatCurrency(ws.monthlyRevenue) : <span className="text-ink-500">—</span>}
                </div>

                <div>
                  <AvatarStack
                    members={members.map((m) => ({ name: m.name, color: m.avatarColor }))}
                    max={4}
                  />
                </div>

                <div className="flex justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/workspaces/${ws.id}`)}
                    className="opacity-60 group-hover:opacity-100"
                  >
                    <ArrowUpRight size={11} />
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
                    <Eye size={11} /> AS
                  </Button>
                </div>
              </motion.div>
            );
          })}
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
    <div className="flex items-center gap-1 hairline rounded-sm bg-ink-950 p-1">
      <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-ink-400 px-2">
        {label}
      </span>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "text-[10px] font-mono uppercase tracking-[0.14em] px-2 py-1 rounded-sm transition-colors",
            value === opt
              ? "bg-acid text-ink-950"
              : "text-ink-300 hover:text-ink-100 hover:bg-ink-800"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
