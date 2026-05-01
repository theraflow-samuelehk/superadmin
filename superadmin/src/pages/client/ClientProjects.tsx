import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Globe, Rocket, Search, Filter } from "lucide-react";
import type { ClientContext } from "../../components/shell/ClientLayout";
import { SpotlightCard } from "../../components/ui/SpotlightCard";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { CreateProjectModal } from "../../components/client/CreateProjectModal";
import { getSupabase } from "../../lib/supabase";
import { formatNumber, formatCurrency } from "../../lib/utils";
import type { Database } from "../../lib/database.types";

type Project = Database["public"]["Tables"]["projects"]["Row"];

const STATUS_TABS = [
  { key: "all",       label: "Tutti" },
  { key: "live",      label: "Live" },
  { key: "draft",     label: "Bozza" },
  { key: "archived",  label: "Archiviati" },
] as const;

type FilterKey = (typeof STATUS_TABS)[number]["key"];

export function ClientProjects() {
  const { workspace, loading } = useOutletContext<ClientContext>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

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

  const filtered = projects.filter((p) => {
    const matchFilter = filter === "all" || p.status === filter;
    const matchSearch = search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.subdomain.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) return <PageShell><div className="text-[13px] text-slate-400">Caricamento…</div></PageShell>;
  if (!workspace) return null;

  return (
    <PageShell>
      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        workspaceId={workspace.id}
        onCreated={(p) => setProjects((prev) => [p, ...prev])}
      />

      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-8">
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] tracking-[0.18em] text-violet-600 uppercase font-bold pt-1">01</span>
          <div>
            <h1 className="font-black text-slate-900 tracking-tight" style={{ fontSize: "28px" }}>
              I tuoi <span className="italic font-light text-slate-600">progetti</span>.
            </h1>
            <p className="text-[13px] text-slate-500 mt-1">
              {projects.length} totali · {projects.filter((p) => p.status === "live").length} live
            </p>
          </div>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Nuovo progetto
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* tabs filtro */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`text-[12px] px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filter === t.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              {t.label}
              {t.key !== "all" && (
                <span className="ml-1.5 text-[10px] opacity-60">
                  {projects.filter((p) => p.status === t.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* search */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca progetto…"
            className="flex-1 bg-transparent text-[13px] text-slate-900 placeholder-slate-300 outline-none"
          />
        </div>
      </div>

      {/* Grid */}
      {projectsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          {search || filter !== "all" ? (
            <>
              <Filter size={28} className="text-slate-300 mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-slate-700 mb-1">Nessun risultato</p>
              <p className="text-[13px] text-slate-400">Prova a cambiare filtro o ricerca.</p>
            </>
          ) : (
            <>
              <Rocket size={32} className="text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 text-[17px] mb-2">Nessun progetto ancora</h3>
              <p className="text-[13px] text-slate-500 max-w-sm mx-auto mb-5">
                Crea il tuo primo progetto. Avrai un sottodominio su theraflow.io pronto in un secondo.
              </p>
              <Button variant="primary" onClick={() => setShowCreate(true)}>
                <Plus size={14} /> Crea primo progetto
              </Button>
            </>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <ProjectCard project={p} />
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

/* ─── Project Card ─────────────────────────────────────────── */
function ProjectCard({ project: p }: { project: Project }) {
  return (
    <SpotlightCard className="p-5 flex flex-col gap-4 cursor-pointer hover:shadow-md transition-shadow">
      {/* top */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            {p.category}
          </div>
          <div className="font-bold text-slate-900 text-[16px] truncate">{p.name}</div>
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

      {/* dominio */}
      <div className="flex items-center gap-2 text-[12px] bg-slate-50 px-3 py-2 rounded-lg overflow-hidden">
        <Globe size={11} className="text-slate-400 shrink-0" />
        {p.custom_domain ? (
          <span className="font-semibold gradient-text truncate">{p.custom_domain}</span>
        ) : (
          <span className="font-mono text-slate-500 truncate">{p.subdomain}.theraflow.io</span>
        )}
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
        <Stat label="Visite" value={formatNumber(p.visits_30d)} />
        <Stat label="Lead" value={formatNumber(p.leads_30d)} />
        <Stat label="€/30gg" value={p.revenue_30d ? formatCurrency(p.revenue_30d) : "—"} />
      </div>
    </SpotlightCard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-bold text-slate-900 text-[16px] tabular-nums leading-none">{value}</div>
      <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">{label}</div>
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 md:px-6 lg:px-12 py-8 max-w-[1600px] mx-auto">
      {children}
    </div>
  );
}
