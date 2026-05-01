import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Rocket, Globe, ArrowRight, Sparkles, TrendingUp,
  MousePointerClick, UserPlus, Plus, Mail, Clock, FolderKanban,
} from "lucide-react";
import type { ClientContext } from "../../components/shell/ClientLayout";
import { Card } from "../../components/ui/Card";
import { SpotlightCard } from "../../components/ui/SpotlightCard";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { CreateProjectModal } from "../../components/client/CreateProjectModal";
import { useAuth } from "../../lib/auth";
import { getSupabase } from "../../lib/supabase";
import { formatNumber, formatCurrency, relativeTime, cn } from "../../lib/utils";
import type { Database } from "../../lib/database.types";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type Lead    = Database["public"]["Tables"]["project_leads"]["Row"];

export function ClientDashboard() {
  const { workspace, loading } = useOutletContext<ClientContext>();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects]             = useState<Project[]>([]);
  const [recentLeads, setRecentLeads]       = useState<Lead[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [showCreate, setShowCreate]         = useState(false);

  useEffect(() => {
    async function load() {
      if (!workspace) return;
      const sb = getSupabase();
      if (!sb) return;

      const [projRes] = await Promise.all([
        sb.from("projects").select("*")
          .eq("workspace_id", workspace.id)
          .order("created_at", { ascending: false }),
      ]);
      const projs = projRes.data ?? [];
      setProjects(projs);

      // lead recenti (ultimi 5) dai progetti visibili
      if (projs.length > 0) {
        const { data: leads } = await sb
          .from("project_leads")
          .select("*")
          .in("project_id", projs.map((p) => p.id))
          .order("created_at", { ascending: false })
          .limit(5);
        setRecentLeads(leads ?? []);
      }

      setProjectsLoading(false);
    }
    void load();
  }, [workspace]);

  if (loading) {
    return (
      <div className="px-4 md:px-6 lg:px-12 py-10 max-w-[1600px] mx-auto">
        <div className="text-[13px] text-slate-400">Caricamento workspace…</div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="px-4 md:px-6 lg:px-12 py-10 max-w-[1600px] mx-auto">
        <Card className="p-10 text-center">
          <h2 className="font-black text-[28px] text-slate-900 mb-3">Nessun workspace</h2>
          <p className="text-[14px] text-slate-500">
            Non sei membro di nessun workspace. Contatta il team TheraFlow per essere invitato.
          </p>
        </Card>
      </div>
    );
  }

  const liveCount    = projects.filter((p) => p.status === "live").length;
  const totalVisits  = projects.reduce((s, p) => s + p.visits_30d, 0);
  const totalLeads   = projects.reduce((s, p) => s + p.leads_30d, 0);
  const totalRevenue = projects.reduce((s, p) => s + p.revenue_30d, 0);
  const firstName    = profile?.name.split(" ")[0] ?? "";

  return (
    <div className="px-4 md:px-6 lg:px-12 py-6 md:py-8 max-w-[1600px] mx-auto">
      {workspace && (
        <CreateProjectModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          workspaceId={workspace.id}
          onCreated={(p) => setProjects((prev) => [p, ...prev])}
        />
      )}

      {/* ── HERO ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl overflow-hidden mb-8"
        style={{
          backgroundImage:
            "radial-gradient(at 0% 0%, rgba(6,182,212,0.45) 0px, transparent 50%), " +
            "radial-gradient(at 100% 0%, rgba(59,130,246,0.4) 0px, transparent 55%), " +
            "radial-gradient(at 100% 100%, rgba(139,92,246,0.28) 0px, transparent 55%), " +
            "linear-gradient(180deg, #0a1628 0%, #0e1d3a 50%, #0a1838 100%)",
        }}
      >
        <div className="absolute inset-0 dot-pattern-dark opacity-40" />
        <div className="relative p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] text-white border border-white/20"
              style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.35), rgba(99,102,241,0.35))", backdropFilter: "blur(8px)" }}
            >
              <Sparkles size={11} /> {workspace.plan.toUpperCase()}
            </span>
            <Badge variant={workspace.status === "active" ? "live" : "trial"} dot>
              {workspace.status}
            </Badge>
          </div>

          <h1 className="font-black text-white leading-[0.95] tracking-tight"
            style={{ fontSize: "clamp(32px, 5vw, 64px)" }}>
            Ciao{firstName ? ` ${firstName}` : ""},
            <br />
            <span className="italic font-extralight text-white/50">bentornato.</span>
          </h1>

          <p className="mt-4 text-[14px] text-white/60 leading-relaxed max-w-sm">
            Workspace <span className="text-cyan-300 font-semibold">{workspace.name}</span> — {liveCount} progett{liveCount === 1 ? "o" : "i"} live.
          </p>

          {/* quick actions */}
          <div className="mt-7 flex gap-3 flex-wrap">
            <Button variant="primary" size="lg" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Nuovo progetto
            </Button>
            <button
              onClick={() => navigate("/app/projects")}
              className="text-[13px] px-5 h-12 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 font-semibold flex items-center gap-2 transition-colors"
            >
              Vedi progetti <ArrowRight size={13} />
            </button>
            <button
              onClick={() => navigate("/app/leads")}
              className="text-[13px] px-5 h-12 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 font-semibold flex items-center gap-2 transition-colors"
            >
              Lead <span className="text-cyan-300 font-bold">{totalLeads}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── KPI ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Progetti live",  value: liveCount,   total: projects.length, icon: <Rocket size={14} />,           color: "cyan" },
          { label: "Visite 30gg",   value: formatNumber(totalVisits),             icon: <MousePointerClick size={14} />, color: "blue" },
          { label: "Lead 30gg",     value: formatNumber(totalLeads),              icon: <UserPlus size={14} />,          color: "emerald" },
          { label: "Revenue 30gg",  value: totalRevenue > 0 ? formatCurrency(totalRevenue) : "—", icon: <TrendingUp size={14} />, color: "indigo", emphasis: true },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.05 }}
          >
            <SpotlightCard className={cn("p-5 h-full", kpi.emphasis && "gradient-border")}>
              <div className={cn(
                "inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3",
                kpi.color === "cyan"    && "bg-cyan-100 text-cyan-700",
                kpi.color === "blue"    && "bg-blue-100 text-blue-700",
                kpi.color === "emerald" && "bg-emerald-100 text-emerald-700",
                kpi.color === "indigo"  && "bg-indigo-100 text-indigo-700",
              )}>
                {kpi.icon}
              </div>
              <div className="text-[10.5px] text-slate-400 font-bold uppercase tracking-[0.1em] mb-1">
                {kpi.label}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className={cn("font-black tabular-nums",
                  kpi.emphasis ? "gradient-text-rich text-[32px]" : "text-slate-900 text-[28px]"
                )}>
                  {"(total)" in kpi ? kpi.value : kpi.value}
                </span>
                {"total" in kpi && kpi.total !== undefined && (
                  <span className="text-[13px] text-slate-400 font-semibold">/ {kpi.total}</span>
                )}
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>

      {/* ── GRID: progetti recenti + lead recenti ─────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

        {/* Progetti recenti */}
        <div>
          <SectionHeader index="02" title="Progetti" subtitle={`${projects.length} totali · ${liveCount} live`}>
            <Button variant="ghost" size="sm" onClick={() => navigate("/app/projects")}>
              Vedi tutti <ArrowRight size={12} />
            </Button>
          </SectionHeader>

          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-36 rounded-2xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : projects.length === 0 ? (
            <Card className="p-10 text-center">
              <Rocket size={28} className="text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-900 text-[16px] mb-2">Nessun progetto ancora</h3>
              <p className="text-[13px] text-slate-500 max-w-xs mx-auto mb-4">
                Crea il tuo primo progetto in 30 secondi.
              </p>
              <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
                <Plus size={13} /> Crea progetto
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.slice(0, 4).map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <SpotlightCard className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/app/projects")}>
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{p.category}</div>
                        <div className="font-bold text-slate-900 text-[15px] truncate">{p.name}</div>
                      </div>
                      <Badge variant={p.status === "live" ? "live" : p.status === "draft" ? "draft" : p.status === "deploying" ? "deploying" : "archived"} dot>
                        {p.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11.5px] bg-slate-50 px-2.5 py-1.5 rounded-lg mb-3 overflow-hidden">
                      <Globe size={10} className="text-slate-400 shrink-0" />
                      <span className="font-mono text-slate-500 truncate">{p.subdomain}.theraflow.io</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                      <Mini label="Visite" value={formatNumber(p.visits_30d)} />
                      <Mini label="Lead" value={formatNumber(p.leads_30d)} />
                      <Mini label="€" value={p.revenue_30d ? formatCurrency(p.revenue_30d) : "—"} />
                    </div>
                  </SpotlightCard>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Lead recenti */}
        <div>
          <SectionHeader index="03" title="Lead recenti" subtitle={`Ultimi ${recentLeads.length}`}>
            <Button variant="ghost" size="sm" onClick={() => navigate("/app/leads")}>
              Tutti <ArrowRight size={12} />
            </Button>
          </SectionHeader>

          {recentLeads.length === 0 ? (
            <Card className="p-8 text-center">
              <UserPlus size={24} className="text-slate-300 mx-auto mb-3" />
              <p className="text-[13px] text-slate-400">I lead arriveranno qui quando qualcuno compila un form.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentLeads.map((lead, i) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:border-slate-300 cursor-pointer transition-colors"
                  onClick={() => navigate("/app/leads")}
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-100 to-indigo-100 flex items-center justify-center text-[12px] font-bold text-indigo-600 shrink-0">
                    {(lead.name ?? lead.email ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 text-[13px] truncate">
                      {lead.name ?? lead.email ?? "Senza nome"}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {lead.email && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
                          <Mail size={10} /> {lead.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      lead.status === "new" ? "bg-emerald-50 text-emerald-600" :
                      lead.status === "won" ? "bg-blue-50 text-blue-600" :
                      "bg-slate-100 text-slate-500"
                    }`}>
                      {lead.status === "new" ? "Nuovo" : lead.status === "contacted" ? "Contattato" : lead.status === "won" ? "Vinto" : "Perso"}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-slate-300">
                      <Clock size={9} /> {relativeTime(new Date(lead.created_at))}
                    </span>
                  </div>
                </motion.div>
              ))}

              <button
                onClick={() => navigate("/app/leads")}
                className="w-full text-[12px] text-cyan-600 font-semibold py-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 transition-colors flex items-center justify-center gap-1.5 mt-1"
              >
                Vedi tutti i lead <ArrowRight size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick actions bottom ───────────────────────────────── */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Crea progetto",   icon: <Plus size={15} />,           color: "cyan",    action: () => setShowCreate(true) },
          { label: "Vedi lead",       icon: <UserPlus size={15} />,       color: "emerald", action: () => navigate("/app/leads") },
          { label: "Gestisci team",   icon: <FolderKanban size={15} />,   color: "violet",  action: () => navigate("/app/team") },
          { label: "Impostazioni",    icon: <Sparkles size={15} />,       color: "slate",   action: () => navigate("/app/settings") },
        ].map((qa, i) => (
          <motion.button
            key={qa.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            onClick={qa.action}
            className={cn(
              "flex items-center gap-2.5 px-4 py-3.5 rounded-2xl border text-[13px] font-semibold transition-all text-left hover:shadow-sm",
              qa.color === "cyan"    && "bg-cyan-50 border-cyan-200/60 text-cyan-700 hover:bg-cyan-100",
              qa.color === "emerald" && "bg-emerald-50 border-emerald-200/60 text-emerald-700 hover:bg-emerald-100",
              qa.color === "violet"  && "bg-violet-50 border-violet-200/60 text-violet-700 hover:bg-violet-100",
              qa.color === "slate"   && "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100",
            )}
          >
            {qa.icon} {qa.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ─── helpers ───────────────────────────────────────────────── */
function SectionHeader({ index, title, subtitle, children }: {
  index: string; title: string; subtitle: string; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div className="flex items-baseline gap-2.5">
        <span className="text-[11px] tracking-[0.18em] text-violet-600 uppercase font-bold">{index}</span>
        <div>
          <h2 className="font-black text-slate-900 tracking-tight text-[22px] leading-tight">
            {title}
          </h2>
          <p className="text-[12px] text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-bold text-slate-900 text-[15px] tabular-nums leading-none">{value}</div>
      <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">{label}</div>
    </div>
  );
}
