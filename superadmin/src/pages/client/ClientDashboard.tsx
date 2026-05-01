import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Rocket, Globe, ArrowRight, Sparkles,
  TrendingUp, MousePointerClick, UserPlus,
} from "lucide-react";
import type { ClientContext } from "../../components/shell/ClientLayout";
import { Card } from "../../components/ui/Card";
import { SpotlightCard } from "../../components/ui/SpotlightCard";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../lib/auth";
import { getSupabase } from "../../lib/supabase";
import { formatNumber, formatCurrency, cn } from "../../lib/utils";
import type { Database } from "../../lib/database.types";

type Project = Database["public"]["Tables"]["projects"]["Row"];

export function ClientDashboard() {
  const { workspace, loading } = useOutletContext<ClientContext>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!workspace) return;
      const sb = getSupabase();
      if (!sb) return;
      const { data } = await sb
        .from("projects")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false });
      setProjects(data ?? []);
      setProjectsLoading(false);
    }
    void load();
  }, [workspace]);

  if (loading) {
    return (
      <div className="px-4 md:px-6 lg:px-12 py-10 max-w-[1600px] mx-auto">
        <div className="text-[14px] text-slate-500">Caricamento workspace…</div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="px-4 md:px-6 lg:px-12 py-10 max-w-[1600px] mx-auto">
        <Card className="p-10 text-center">
          <h2 className="display text-[28px] text-slate-900 mb-3">Nessun workspace</h2>
          <p className="text-[14px] text-slate-600">
            Non sei membro di nessun workspace. Contatta il team TheraFlow per essere invitato.
          </p>
        </Card>
      </div>
    );
  }

  const liveCount = projects.filter((p) => p.status === "live").length;
  const totalVisits = projects.reduce((s, p) => s + p.visits_30d, 0);
  const totalLeads = projects.reduce((s, p) => s + p.leads_30d, 0);
  const totalRevenue = projects.reduce((s, p) => s + p.revenue_30d, 0);
  const firstName = profile?.name.split(" ")[0] ?? "";

  return (
    <div className="px-4 md:px-6 lg:px-12 py-6 md:py-8 max-w-[1600px] mx-auto">
      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl overflow-hidden mb-10 panel-dark"
        style={{
          backgroundImage:
            "radial-gradient(at 0% 0%, rgba(6, 182, 212, 0.45) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.4) 0px, transparent 55%), radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.28) 0px, transparent 55%), linear-gradient(180deg, #0a1628 0%, #0e1d3a 50%, #0a1838 100%)",
        }}
      >
        <div className="absolute inset-0 dot-pattern-dark opacity-50" />
        <div className="relative p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8 flex-wrap">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] text-white border border-white/20"
              style={{ background: "linear-gradient(135deg, rgba(6, 182, 212, 0.45), rgba(99, 102, 241, 0.45))", backdropFilter: "blur(8px)" }}
            >
              <Sparkles size={12} /> {workspace.plan.toUpperCase()}
            </span>
            <Badge variant={workspace.status === "active" ? "live" : "trial"} dot>
              {workspace.status}
            </Badge>
          </div>

          <h1
            className="display font-black text-white"
            style={{ fontSize: "clamp(36px, 6vw, 80px)" }}
          >
            Ciao{firstName ? ` ${firstName}` : ""},
            <br />
            <span className="editorial-italic font-light text-white/70">benvenuto.</span>
          </h1>
          <p className="mt-5 text-[15px] text-white/70 leading-relaxed max-w-md">
            Il tuo workspace <span className="text-cyan-300 font-semibold">{workspace.name}</span> è online.
            Da qui gestisci progetti, pagine, team e impostazioni.
          </p>

          <div className="mt-7 flex gap-3 flex-wrap">
            <Button variant="primary" size="lg" onClick={() => navigate("/app/projects")}>
              I tuoi progetti <ArrowRight size={15} />
            </Button>
            <button
              onClick={() => navigate("/app/pages")}
              className="text-[13px] px-5 h-12 rounded-xl border border-white/20 text-white/90 hover:bg-white/10 font-semibold flex items-center gap-2 transition-colors"
            >
              Modifica pagine <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {[
          { label: "Progetti live", value: liveCount, total: projects.length, icon: <Rocket size={14} />, color: "cyan" },
          { label: "Visite 30gg", value: formatNumber(totalVisits), icon: <MousePointerClick size={14} />, color: "blue" },
          { label: "Lead 30gg", value: formatNumber(totalLeads), icon: <UserPlus size={14} />, color: "emerald" },
          { label: "Revenue 30gg", value: totalRevenue > 0 ? formatCurrency(totalRevenue) : "—", icon: <TrendingUp size={14} />, color: "indigo", emphasis: true },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.05 }}
          >
            <SpotlightCard className={cn("p-5 h-full", kpi.emphasis && "gradient-border")}>
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  "inline-flex items-center justify-center w-9 h-9 rounded-xl",
                  kpi.color === "cyan"    && "bg-cyan-100 text-cyan-700",
                  kpi.color === "blue"    && "bg-blue-100 text-blue-700",
                  kpi.color === "emerald" && "bg-emerald-100 text-emerald-700",
                  kpi.color === "indigo"  && "bg-indigo-100 text-indigo-700",
                )}>
                  {kpi.icon}
                </div>
              </div>
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.08em] mb-1.5">
                {kpi.label}
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={cn("display font-black tabular-nums", kpi.emphasis ? "gradient-text-rich text-[34px]" : "text-slate-900 text-[30px]")}
                >
                  {kpi.value}
                </span>
                {kpi.total !== undefined && (
                  <span className="text-[14px] text-slate-400 font-semibold tabular-nums">/ {kpi.total}</span>
                )}
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>

      {/* Projects list */}
      <div className="flex items-end justify-between gap-4 mb-7">
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] tracking-[0.18em] text-violet-600 uppercase font-bold pt-1">02</span>
          <div>
            <h2 className="heading-xl text-slate-900" style={{ fontSize: "28px" }}>
              I tuoi <span className="editorial-italic font-light text-slate-700">progetti</span>.
            </h2>
            <p className="text-[13.5px] text-slate-500 mt-1.5">
              {projects.length} progetti totali · {liveCount} live ora
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/projects")}>
          Vedi tutti <ArrowRight size={13} />
        </Button>
      </div>

      {projectsLoading ? (
        <div className="text-[13px] text-slate-500">Caricamento progetti…</div>
      ) : projects.length === 0 ? (
        <Card className="p-10 text-center">
          <Rocket size={32} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-[18px] font-bold text-slate-900 mb-2">Nessun progetto ancora</h3>
          <p className="text-[13.5px] text-slate-500 max-w-md mx-auto mb-5">
            Crea il tuo primo progetto per iniziare. Ti darà un sottodominio su theraflow.io e potrai modificarlo subito.
          </p>
          <Button variant="primary">Crea progetto</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.slice(0, 6).map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <SpotlightCard className="p-5">
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-500">
                      {p.category}
                    </div>
                    <div className="heading-md text-slate-900 truncate" style={{ fontSize: "17px" }}>
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

                <div className="flex items-center gap-1.5 text-[12px] mb-4 bg-slate-50 px-3 py-2 rounded-lg overflow-hidden">
                  <Globe size={12} className="text-slate-400 shrink-0" />
                  {p.custom_domain ? (
                    <span className="font-semibold gradient-text truncate min-w-0 flex-1">{p.custom_domain}</span>
                  ) : (
                    <span className="font-mono text-slate-600 truncate min-w-0 flex-1">{p.subdomain}.theraflow.io</span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                  <Mini label="Visite" value={formatNumber(p.visits_30d)} />
                  <Mini label="Lead" value={formatNumber(p.leads_30d)} />
                  <Mini label="€/30gg" value={p.revenue_30d ? formatCurrency(p.revenue_30d) : "—"} />
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      )}
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
