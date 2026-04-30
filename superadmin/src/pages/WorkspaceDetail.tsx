import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Globe,
  Plus,
  Eye,
  ExternalLink,
  Users as UsersIcon,
  Activity as ActivityIcon,
  Calendar,
  Database,
  ChevronRight,
} from "lucide-react";
import {
  workspaces,
  projects,
  getUser,
  membersByWorkspace,
  activityByWorkspace,
} from "../lib/mock";
import { Card, CardCorner } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Stat } from "../components/ui/Stat";
import { useImpersonation } from "../components/shell/Layout";
import { formatCurrency, formatNumber, relativeTime, cn } from "../lib/utils";

export function WorkspaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enter, user: impersonatedUser } = useImpersonation();
  const ws = workspaces.find((w) => w.id === id);

  const [activeCategory, setActiveCategory] = useState<string>("Tutti");

  if (!ws) return <div className="p-10 text-ink-300">Workspace non trovato.</div>;

  const owner = getUser(ws.ownerId);
  const wsProjects = projects.filter((p) => p.workspaceId === ws.id);
  const members = membersByWorkspace(ws.id);
  const events = activityByWorkspace(ws.id);

  const categories = useMemo(() => {
    const set = new Set(wsProjects.map((p) => p.category));
    return ["Tutti", ...Array.from(set)];
  }, [wsProjects]);

  const filteredProjects =
    activeCategory === "Tutti"
      ? wsProjects
      : wsProjects.filter((p) => p.category === activeCategory);

  const totalRevenue = wsProjects.reduce((s, p) => s + (p.revenue30d || 0), 0);
  const totalVisits = wsProjects.reduce((s, p) => s + p.visits30d, 0);
  const totalLeads = wsProjects.reduce((s, p) => s + p.leads30d, 0);

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1600px] mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate("/workspaces")}
        className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-ink-400 hover:text-acid mb-6 transition-colors"
      >
        <ArrowLeft size={11} /> Tutti i workspace
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-start gap-6 flex-wrap">
          <div
            className="w-20 h-20 rounded-sm flex items-center justify-center font-display font-light text-3xl shrink-0"
            style={{
              backgroundColor: `${owner?.avatarColor}15`,
              color: owner?.avatarColor,
              boxShadow: `inset 0 0 0 1px ${owner?.avatarColor}40`,
            }}
          >
            {ws.name[0]}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
                /{ws.slug} · creato {relativeTime(ws.createdAt)}
              </span>
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
              {ws.badge && <Badge variant="acid">{ws.badge}</Badge>}
            </div>

            <h1
              className="font-display font-light text-ink-50 tracking-monster leading-[0.95]"
              style={{ fontSize: "clamp(36px, 4.5vw, 56px)", fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
            >
              {ws.name}
            </h1>

            <div className="mt-4 flex items-center gap-3 flex-wrap text-xs font-mono uppercase tracking-[0.14em] text-ink-300">
              <span>Owner</span>
              {owner && (
                <div className="flex items-center gap-1.5">
                  <Avatar name={owner.name} color={owner.avatarColor} size="xs" />
                  <span className="text-ink-100">{owner.name}</span>
                  <span className="text-ink-500">· {owner.email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {!impersonatedUser && owner && (
              <Button variant="acid" onClick={() => enter(owner, ws)}>
                <Eye size={12} /> View as {owner.name.split(" ")[0]}
              </Button>
            )}
            <Button variant="secondary">Apri come admin</Button>
          </div>
        </div>
      </motion.div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 hairline rounded-sm bg-ink-900 mb-10 overflow-hidden">
        <div className="p-5 hairline-r">
          <Stat label="Progetti" value={wsProjects.length} unit={`${wsProjects.filter((p) => p.status === "live").length} live`} />
        </div>
        <div className="p-5 hairline-r">
          <Stat label="Visite (30gg)" value={formatNumber(totalVisits)} delta={{ value: "+18% vs prec.", positive: true }} />
        </div>
        <div className="p-5 hairline-r">
          <Stat label="Lead (30gg)" value={formatNumber(totalLeads)} delta={{ value: "+22% vs prec.", positive: true }} />
        </div>
        <div className="p-5 hairline-r">
          <Stat label="Revenue (30gg)" value={totalRevenue > 0 ? formatCurrency(totalRevenue) : "—"} emphasis />
        </div>
        <div className="p-5">
          <Stat label="Plan" value={ws.plan.toUpperCase()} unit={`MRR ${formatCurrency(ws.monthlyRevenue)}`} />
        </div>
      </div>

      {/* Two-column main */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Left: projects */}
        <div>
          <div className="flex items-end justify-between gap-4 hairline-b pb-3 mb-5">
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-[10px] tracking-[0.18em] text-acid uppercase">03</span>
              <h2
                className="font-display text-2xl text-ink-50 tracking-ultra-tight font-light leading-none"
                style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
              >
                Progetti del workspace
              </h2>
            </div>
            <Button variant="acid" size="sm">
              <Plus size={11} /> Nuovo progetto
            </Button>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "text-[10px] font-mono uppercase tracking-[0.14em] px-2.5 py-1 rounded-sm border transition-colors",
                  activeCategory === cat
                    ? "bg-acid text-ink-950 border-acid"
                    : "text-ink-300 hairline hover:border-ink-500 hover:text-ink-100"
                )}
              >
                {cat}
                <span className="ml-1.5 opacity-60">
                  {cat === "Tutti"
                    ? wsProjects.length
                    : wsProjects.filter((p) => p.category === cat).length}
                </span>
              </button>
            ))}
            <button className="text-[10px] font-mono uppercase tracking-[0.14em] px-2.5 py-1 rounded-sm border border-dashed border-ink-600 text-ink-400 hover:border-acid hover:text-acid transition-colors">
              + Categoria
            </button>
          </div>

          {/* Project cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredProjects.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card interactive className="p-5" >
                  <CardCorner />
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-acid mb-1">
                        {p.category}
                      </div>
                      <div
                        className="font-display text-xl text-ink-50 font-light tracking-ultra-tight"
                        style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
                      >
                        {p.name}
                      </div>
                    </div>
                    <Badge
                      variant={
                        p.status === "live" ? "live"
                        : p.status === "deploying" ? "deploying"
                        : p.status === "draft" ? "draft"
                        : "archived"
                      }
                      dot
                    >
                      {p.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-ink-400 mb-4">
                    <Globe size={11} />
                    {p.customDomain ? (
                      <>
                        <span className="text-acid">{p.customDomain}</span>
                        <span className="text-ink-500">·</span>
                        <span className="text-ink-500">{p.subdomain}</span>
                      </>
                    ) : (
                      <span>{p.subdomain}.workspace.io</span>
                    )}
                    <ExternalLink size={10} className="text-ink-500 ml-auto" />
                  </div>

                  <div className="grid grid-cols-3 gap-3 hairline-t pt-3">
                    <Mini label="Visite" value={formatNumber(p.visits30d)} />
                    <Mini label="Lead" value={formatNumber(p.leads30d)} />
                    <Mini label="€/30gg" value={p.revenue30d ? formatCurrency(p.revenue30d) : "—"} />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.14em] text-ink-500">
                    <div className="flex gap-1">
                      {p.techStack.slice(0, 2).map((t) => (
                        <span key={t} className="hairline rounded-sm px-1.5 py-0.5 text-ink-300">{t}</span>
                      ))}
                    </div>
                    <span>Deploy {relativeTime(p.lastDeploy)}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: sidebar info */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-300 mb-4">
              <UsersIcon size={11} className="text-acid" /> Membri ({members.length})
            </div>
            <div className="space-y-2.5">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5">
                  <Avatar name={m.name} color={m.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-ink-100 truncate">{m.name}</div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-400">
                      {m.role}
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full mt-2 hairline border-dashed rounded-sm py-2 text-[10px] font-mono uppercase tracking-[0.14em] text-ink-400 hover:border-acid hover:text-acid transition-colors">
                + Invita membro
              </button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-300 mb-4">
              <Database size={11} className="text-acid" /> Storage
            </div>
            <div className="font-display text-3xl text-ink-50 font-light tabular-nums">
              {(ws.storageMb / 1024).toFixed(2)}<span className="text-ink-400 text-base">/{(ws.storageLimitMb / 1024).toFixed(0)} GB</span>
            </div>
            <div className="mt-3 h-1 bg-ink-700 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-acid" style={{ width: `${(ws.storageMb / ws.storageLimitMb) * 100}%` }} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-300 mb-4">
              <ActivityIcon size={11} className="text-acid" /> Ultime attività
            </div>
            <div className="space-y-3">
              {events.slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-start gap-2">
                  <span className="w-px h-full bg-ink-700 mt-1.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-ink-100 leading-snug">{e.message}</div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-400 mt-0.5">
                      {e.actor} · {relativeTime(e.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 bg-acid/5 border-acid/20">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-acid mb-2">
              <Calendar size={11} /> Promuovi sottodominio
            </div>
            <p className="text-xs text-ink-200 leading-relaxed mb-3">
              Hai un progetto pronto per pubblicità? Collega un dominio reale a un sottodominio esistente.
            </p>
            <Button variant="acid" size="sm" className="w-full justify-center">
              Collega dominio reale <ChevronRight size={11} />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-base text-ink-50 font-light tabular-nums leading-none">{value}</div>
      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-400 mt-1">{label}</div>
    </div>
  );
}
