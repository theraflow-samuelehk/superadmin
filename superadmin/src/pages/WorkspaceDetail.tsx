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
  Rocket,
  UserPlus,
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
import { Avatar, gradientFor } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Stat } from "../components/ui/Stat";
import { CategoryBadge, getCategoryStyle } from "../components/ui/CategoryIcon";
import { useToast } from "../components/ui/Toaster";
import { useImpersonation } from "../components/shell/Layout";
import { formatCurrency, formatNumber, relativeTime, cn } from "../lib/utils";

export function WorkspaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enter, user: impersonatedUser } = useImpersonation();
  const { push: toast } = useToast();
  const ws = workspaces.find((w) => w.id === id);

  const [activeCategory, setActiveCategory] = useState<string>("Tutti");

  if (!ws) return <div className="p-10 text-slate-600">Workspace non trovato.</div>;

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
    <div className="px-4 md:px-6 lg:px-10 py-6 md:py-8 max-w-[1600px] mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate("/workspaces")}
        className="flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-violet-600 mb-6 transition-colors font-medium"
      >
        <ArrowLeft size={13} /> Tutti i workspace
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-start gap-6 flex-wrap">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center font-display font-bold text-white text-4xl shrink-0 shadow-lift"
            style={{ backgroundImage: gradientFor(owner?.avatarColor || ws.id) }}
          >
            {ws.name[0]}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-3 flex-wrap">
              <span className="text-[12px] text-slate-500 font-mono">
                /{ws.slug}
              </span>
              <span className="text-[12px] text-slate-400">·</span>
              <span className="text-[12px] text-slate-500">
                creato {relativeTime(ws.createdAt)}
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
              {ws.badge && <Badge variant="violet">{ws.badge}</Badge>}
            </div>

            <h1
              className="display-tight font-bold text-slate-900"
              style={{ fontSize: "clamp(38px, 5vw, 64px)" }}
            >
              {ws.name}
            </h1>

            <div className="mt-4 flex items-center gap-2.5 flex-wrap text-[13px] text-slate-600">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Owner</span>
              {owner && (
                <div className="flex items-center gap-2">
                  <Avatar name={owner.name} color={owner.avatarColor} size="xs" />
                  <span className="text-slate-900 font-semibold">{owner.name}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500 font-mono text-[12px]">{owner.email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {!impersonatedUser && owner && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  enter(owner, ws);
                  toast({
                    variant: "info",
                    title: `Modalità View As attiva`,
                    description: `Stai vedendo come ${owner.name}`,
                  });
                }}
              >
                <Eye size={14} /> View as {owner.name.split(" ")[0]}
              </Button>
            )}
            <Button
              variant="secondary"
              size="lg"
              onClick={() =>
                toast({
                  variant: "success",
                  title: "Pannello admin aperto",
                  description: `Stai accedendo a ${ws.name}`,
                })
              }
            >
              Apri come admin
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
        <Card className="p-5"><Stat label="Progetti" value={wsProjects.length} unit={`${wsProjects.filter((p) => p.status === "live").length} live`} /></Card>
        <Card className="p-5"><Stat label="Visite (30gg)" value={formatNumber(totalVisits)} delta={{ value: "+18%", positive: true }} /></Card>
        <Card className="p-5"><Stat label="Lead (30gg)" value={formatNumber(totalLeads)} delta={{ value: "+22%", positive: true }} /></Card>
        <Card className="p-5"><Stat label="Revenue (30gg)" value={totalRevenue > 0 ? formatCurrency(totalRevenue) : "—"} emphasis /></Card>
        <Card className="p-5"><Stat label="Plan" value={ws.plan.toUpperCase()} unit={`MRR ${formatCurrency(ws.monthlyRevenue)}`} /></Card>
      </div>

      {/* Two-column main */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        {/* Left: projects */}
        <div>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div className="flex items-baseline gap-3">
              <span className="text-[11px] tracking-wider text-violet-600 uppercase font-bold pt-1">03</span>
              <h2 className="heading-xl text-slate-900" style={{ fontSize: "26px" }}>
                Progetti del <span className="editorial-italic font-light text-slate-700">workspace</span>
              </h2>
            </div>
            <Button variant="primary" size="sm">
              <Plus size={13} /> Nuovo progetto
            </Button>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "text-[12px] px-3.5 py-1.5 rounded-full transition-all font-semibold border",
                  activeCategory === cat
                    ? "bg-slate-900 text-white border-slate-900"
                    : "text-slate-600 bg-white border-slate-200 hover:border-violet-300 hover:text-violet-700"
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
            <button className="text-[12px] px-3.5 py-1.5 rounded-full border border-dashed border-slate-300 text-slate-500 hover:border-violet-400 hover:text-violet-600 transition-colors font-semibold">
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
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <CategoryBadge category={p.category} />
                      <div className="min-w-0">
                        <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${getCategoryStyle(p.category).text}`}>
                          {p.category}
                        </div>
                        <div className="heading-md text-slate-900" style={{ fontSize: "17px" }}>
                          {p.name}
                        </div>
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

                  <div className="flex items-center gap-1.5 text-[12px] mb-4 bg-slate-50 px-3 py-2 rounded-lg">
                    <Globe size={12} className="text-slate-400" />
                    {p.customDomain ? (
                      <>
                        <span className="font-semibold gradient-text">{p.customDomain}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500 font-mono text-[11px]">{p.subdomain}</span>
                      </>
                    ) : (
                      <span className="font-mono text-slate-600">{p.subdomain}.theraflow.io</span>
                    )}
                    <ExternalLink size={11} className="text-slate-400 ml-auto" />
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                    <Mini label="Visite" value={formatNumber(p.visits30d)} />
                    <Mini label="Lead" value={formatNumber(p.leads30d)} />
                    <Mini label="€/30gg" value={p.revenue30d ? formatCurrency(p.revenue30d) : "—"} />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex gap-1">
                      {p.techStack.slice(0, 2).map((t) => (
                        <span key={t} className="bg-slate-100 text-slate-600 rounded-md px-1.5 py-0.5 font-mono text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="font-medium">Deploy {relativeTime(p.lastDeploy)}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: sidebar info */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <UsersIcon size={13} />
                </span>
                <span className="text-[13px] font-bold text-slate-900">Membri ({members.length})</span>
              </div>
              <button className="text-[11px] text-violet-600 font-semibold hover:text-violet-700">+ Invita</button>
            </div>
            <div className="space-y-2.5">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5">
                  <Avatar name={m.name} color={m.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-slate-800 truncate font-semibold">{m.name}</div>
                    <div className="text-[10.5px] text-slate-500 uppercase tracking-wide font-medium">
                      {m.role}
                    </div>
                  </div>
                </div>
              ))}
              <button className="w-full mt-3 border border-dashed border-slate-300 rounded-xl py-2.5 text-[12px] text-slate-500 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50/40 transition-colors font-semibold flex items-center justify-center gap-1.5">
                <UserPlus size={12} /> Invita membro
              </button>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                <Database size={13} />
              </span>
              <span className="text-[13px] font-bold text-slate-900">Storage</span>
            </div>
            <div className="font-display text-[28px] text-slate-900 font-bold tabular-nums leading-none">
              {(ws.storageMb / 1024).toFixed(2)}<span className="text-slate-400 text-[16px] font-medium">/{(ws.storageLimitMb / 1024).toFixed(0)} GB</span>
            </div>
            <div className="mt-3 h-1.5 bg-slate-100 relative overflow-hidden rounded-full">
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: "linear-gradient(90deg, #8b5cf6, #ec4899)",
                  width: `${(ws.storageMb / ws.storageLimitMb) * 100}%`,
                }}
              />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <ActivityIcon size={13} />
              </span>
              <span className="text-[13px] font-bold text-slate-900">Ultime attività</span>
            </div>
            <div className="space-y-3">
              {events.slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-start gap-2 group">
                  <span className="w-1 self-stretch bg-gradient-to-b from-violet-400 to-pink-400 rounded-full shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] text-slate-700 leading-snug">{e.message}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      <span className="font-medium text-slate-500">{e.actor}</span> · {relativeTime(e.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 relative overflow-hidden bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50 border-white">
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(circle at 70% 0%, rgba(236, 72, 153, 0.18), transparent 60%)",
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
                >
                  <Rocket size={13} />
                </span>
                <span className="text-[13px] font-bold text-slate-900">Promuovi a dominio</span>
              </div>
              <p className="text-[12.5px] text-slate-600 leading-relaxed mb-3.5">
                Collega un dominio reale a qualsiasi sottodominio di questo workspace per portarlo live.
              </p>
              <Button variant="primary" size="sm" className="w-full justify-center">
                Collega dominio <ChevronRight size={13} />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-[17px] text-slate-900 font-bold tabular-nums leading-none">{value}</div>
      <div className="text-[10.5px] text-slate-500 mt-1.5 uppercase tracking-wider font-semibold">{label}</div>
    </div>
  );
}
