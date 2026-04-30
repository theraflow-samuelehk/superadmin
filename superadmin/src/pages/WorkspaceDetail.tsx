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
import { Card } from "../components/ui/Card";
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

  if (!ws) return <div className="p-10 text-ink-200">Workspace non trovato.</div>;

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
        className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-ink-200 hover:text-accent mb-6 transition-colors font-medium"
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
            className="w-20 h-20 rounded-lg flex items-center justify-center font-display font-light text-3xl shrink-0"
            style={{
              backgroundColor: `${owner?.avatarColor}1a`,
              color: shade(owner?.avatarColor || "#999"),
              boxShadow: `inset 0 0 0 1px ${owner?.avatarColor}55`,
              fontVariationSettings: "'opsz' 144, 'SOFT' 30",
            }}
          >
            {ws.name[0]}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="text-[11px] uppercase tracking-[0.14em] text-ink-100 font-medium">
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
              {ws.badge && <Badge variant="accent">{ws.badge}</Badge>}
            </div>

            <h1
              className="font-display font-light text-ink-900 tracking-monster leading-[0.95]"
              style={{ fontSize: "clamp(36px, 4.5vw, 56px)", fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
            >
              {ws.name}
            </h1>

            <div className="mt-4 flex items-center gap-3 flex-wrap text-[12px] text-ink-200">
              <span className="uppercase tracking-[0.12em] font-medium text-ink-100">Owner</span>
              {owner && (
                <div className="flex items-center gap-1.5">
                  <Avatar name={owner.name} color={owner.avatarColor} size="xs" />
                  <span className="text-ink-400 font-medium">{owner.name}</span>
                  <span className="text-ink-100">· {owner.email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {!impersonatedUser && owner && (
              <Button variant="primary" onClick={() => enter(owner, ws)}>
                <Eye size={12} /> View as {owner.name.split(" ")[0]}
              </Button>
            )}
            <Button variant="secondary">Apri come admin</Button>
          </div>
        </div>
      </motion.div>

      {/* Stats strip */}
      <Card className="grid grid-cols-2 lg:grid-cols-5 mb-10 overflow-hidden p-0">
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
      </Card>

      {/* Two-column main */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Left: projects */}
        <div>
          <div className="flex items-end justify-between gap-4 hairline-b pb-4 mb-5">
            <div className="flex items-baseline gap-4">
              <span className="text-[10px] tracking-[0.18em] text-accent uppercase font-semibold">03</span>
              <h2
                className="font-display text-[26px] text-ink-900 tracking-ultra-tight font-normal leading-none"
                style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
              >
                Progetti del workspace
              </h2>
            </div>
            <Button variant="primary" size="sm">
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
                  "text-[11px] uppercase tracking-[0.1em] px-3 py-1.5 rounded-full border transition-all font-medium",
                  activeCategory === cat
                    ? "bg-accent text-paper-50 border-accent shadow-soft"
                    : "text-ink-200 hairline bg-white hover:border-accent/40 hover:text-accent"
                )}
              >
                {cat}
                <span className="ml-1.5 opacity-60 tabular-nums">
                  {cat === "Tutti"
                    ? wsProjects.length
                    : wsProjects.filter((p) => p.category === cat).length}
                </span>
              </button>
            ))}
            <button className="text-[11px] uppercase tracking-[0.1em] px-3 py-1.5 rounded-full border border-dashed border-paper-300 text-ink-100 hover:border-accent hover:text-accent transition-colors font-medium">
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
                <Card interactive className="p-5">
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-accent mb-1.5 font-semibold">
                        {p.category}
                      </div>
                      <div
                        className="font-display text-xl text-ink-900 font-normal tracking-ultra-tight"
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

                  <div className="flex items-center gap-1.5 text-[11px] text-ink-200 mb-4">
                    <Globe size={11} className="text-ink-100" />
                    {p.customDomain ? (
                      <>
                        <span className="text-accent font-medium">{p.customDomain}</span>
                        <span className="text-ink-100">·</span>
                        <span className="text-ink-100 font-mono">{p.subdomain}</span>
                      </>
                    ) : (
                      <span className="font-mono">{p.subdomain}.workspace.io</span>
                    )}
                    <ExternalLink size={10} className="text-ink-100 ml-auto" />
                  </div>

                  <div className="grid grid-cols-3 gap-3 hairline-t pt-3">
                    <Mini label="Visite" value={formatNumber(p.visits30d)} />
                    <Mini label="Lead" value={formatNumber(p.leads30d)} />
                    <Mini label="€/30gg" value={p.revenue30d ? formatCurrency(p.revenue30d) : "—"} />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.1em] text-ink-100 font-medium">
                    <div className="flex gap-1">
                      {p.techStack.slice(0, 2).map((t) => (
                        <span key={t} className="hairline rounded-sm px-1.5 py-0.5 text-ink-200 bg-paper-100/50 normal-case font-mono tracking-normal">
                          {t}
                        </span>
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
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-ink-100 mb-4 font-semibold">
              <UsersIcon size={11} className="text-accent" /> Membri ({members.length})
            </div>
            <div className="space-y-2.5">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5">
                  <Avatar name={m.name} color={m.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] text-ink-400 truncate font-medium">{m.name}</div>
                    <div className="text-[10px] uppercase tracking-[0.1em] text-ink-100 font-medium">
                      {m.role}
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full mt-2 hairline border-dashed rounded-md py-2.5 text-[11px] uppercase tracking-[0.1em] text-ink-100 hover:border-accent hover:text-accent transition-colors font-medium bg-paper-100/30">
                + Invita membro
              </button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-ink-100 mb-4 font-semibold">
              <Database size={11} className="text-accent" /> Storage
            </div>
            <div className="font-display text-3xl text-ink-900 font-light tabular-nums" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}>
              {(ws.storageMb / 1024).toFixed(2)}<span className="text-ink-100 text-base">/{(ws.storageLimitMb / 1024).toFixed(0)} GB</span>
            </div>
            <div className="mt-3 h-1 bg-paper-200 relative overflow-hidden rounded-full">
              <div className="absolute inset-y-0 left-0 bg-accent rounded-full" style={{ width: `${(ws.storageMb / ws.storageLimitMb) * 100}%` }} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-ink-100 mb-4 font-semibold">
              <ActivityIcon size={11} className="text-accent" /> Ultime attività
            </div>
            <div className="space-y-3">
              {events.slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-start gap-2">
                  <span className="w-px h-full bg-paper-300 mt-1.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-ink-400 leading-snug">{e.message}</div>
                    <div className="text-[10px] text-ink-100 mt-0.5">
                      <span className="font-medium">{e.actor}</span> · <span className="font-mono">{relativeTime(e.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 bg-accent/5 border-accent/20">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-accent mb-2 font-semibold">
              Promuovi a dominio reale
            </div>
            <p className="text-[12.5px] text-ink-300 leading-relaxed mb-3">
              Hai un progetto pronto per pubblicità? Collega un dominio reale a un sottodominio esistente.
            </p>
            <Button variant="primary" size="sm" className="w-full justify-center">
              Collega dominio <ChevronRight size={11} />
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
      <div className="font-display text-base text-ink-900 font-normal tabular-nums leading-none" style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}>{value}</div>
      <div className="text-[10px] uppercase tracking-[0.1em] text-ink-100 mt-1.5 font-medium">{label}</div>
    </div>
  );
}

function shade(hex: string) {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 70);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 70);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 70);
  return `rgb(${r}, ${g}, ${b})`;
}
