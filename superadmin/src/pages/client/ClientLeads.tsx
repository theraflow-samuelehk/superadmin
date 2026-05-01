import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Phone, Globe, Clock, UserPlus, Search } from "lucide-react";
import type { ClientContext } from "../../components/shell/ClientLayout";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { getSupabase } from "../../lib/supabase";
import { relativeTime } from "../../lib/utils";
import type { Database } from "../../lib/database.types";

type Lead = Database["public"]["Tables"]["project_leads"]["Row"];
type Project = Pick<Database["public"]["Tables"]["projects"]["Row"], "id" | "name">;
type LeadStatus = Database["public"]["Tables"]["project_leads"]["Row"]["status"];

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nuovo",
  contacted: "Contattato",
  won: "Vinto",
  lost: "Perso",
};

const STATUS_COLORS: Record<LeadStatus, "live" | "draft" | "deploying" | "archived"> = {
  new: "live",
  contacted: "deploying",
  won: "live",
  lost: "archived",
};

export function ClientLeads() {
  const { workspace, loading } = useOutletContext<ClientContext>();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<LeadStatus | "all">("all");

  useEffect(() => {
    async function load() {
      if (!workspace) return;
      const sb = getSupabase();
      if (!sb) return;

      // Carica i progetti del workspace per mappare i nomi
      const { data: projs } = await sb
        .from("projects")
        .select("id, name")
        .eq("workspace_id", workspace.id);
      setProjects(projs ?? []);

      const projectIds = (projs ?? []).map((p) => p.id);
      if (projectIds.length === 0) { setLeadsLoading(false); return; }

      const { data } = await sb
        .from("project_leads")
        .select("*")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false });

      setLeads(data ?? []);
      setLeadsLoading(false);
    }
    void load();
  }, [workspace]);

  async function updateStatus(leadId: string, status: LeadStatus) {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from("project_leads").update({ status }).eq("id", leadId);
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status } : l));
  }

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "—";

  const filtered = leads.filter((l) => {
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (l.name ?? "").toLowerCase().includes(q) ||
      (l.email ?? "").toLowerCase().includes(q) ||
      (l.phone ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  if (loading) return <PageShell><div className="text-[13px] text-slate-400">Caricamento…</div></PageShell>;
  if (!workspace) return null;

  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-8">
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] tracking-[0.18em] text-violet-600 uppercase font-bold pt-1">03</span>
          <div>
            <h1 className="font-black text-slate-900 tracking-tight" style={{ fontSize: "28px" }}>
              I tuoi <span className="italic font-light text-slate-600">lead</span>.
            </h1>
            <p className="text-[13px] text-slate-500 mt-1">
              {leads.length} totali · {leads.filter((l) => l.status === "new").length} nuovi
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(["all", "new", "contacted", "won", "lost"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-[12px] px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterStatus === s
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              {s === "all" ? "Tutti" : STATUS_LABELS[s]}
              {s !== "all" && (
                <span className="ml-1.5 text-[10px] opacity-60">
                  {leads.filter((l) => l.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-[160px] max-w-xs">
          <Search size={13} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca lead…"
            className="flex-1 bg-transparent text-[13px] text-slate-900 placeholder-slate-300 outline-none"
          />
        </div>
      </div>

      {/* Lista */}
      {leadsLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <UserPlus size={32} className="text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 text-[17px] mb-2">
            {leads.length === 0 ? "Nessun lead ancora" : "Nessun risultato"}
          </h3>
          <p className="text-[13px] text-slate-500 max-w-sm mx-auto">
            {leads.length === 0
              ? "I lead arriveranno qui quando qualcuno compila un form sulle tue pagine."
              : "Prova a cambiare filtro o ricerca."}
          </p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((lead, i) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <LeadRow
                lead={lead}
                projectName={projectName(lead.project_id)}
                onStatusChange={(s) => updateStatus(lead.id, s)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

/* ─── Lead Row ──────────────────────────────────────────────── */
function LeadRow({
  lead: l,
  projectName,
  onStatusChange,
}: {
  lead: Lead;
  projectName: string;
  onStatusChange: (s: LeadStatus) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-slate-300 transition-colors">
      {/* avatar */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-100 to-indigo-100 flex items-center justify-center shrink-0 text-[14px] font-bold text-indigo-600">
        {(l.name ?? l.email ?? "?")[0].toUpperCase()}
      </div>

      {/* info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-900 text-[14px]">{l.name ?? "Senza nome"}</span>
          <Badge variant={STATUS_COLORS[l.status]} dot className="text-[10px]">
            {STATUS_LABELS[l.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-4 mt-1 flex-wrap">
          {l.email && (
            <span className="flex items-center gap-1 text-[12px] text-slate-500">
              <Mail size={11} /> {l.email}
            </span>
          )}
          {l.phone && (
            <span className="flex items-center gap-1 text-[12px] text-slate-500">
              <Phone size={11} /> {l.phone}
            </span>
          )}
          <span className="flex items-center gap-1 text-[12px] text-slate-400">
            <Globe size={11} /> {projectName}
          </span>
          <span className="flex items-center gap-1 text-[12px] text-slate-400">
            <Clock size={11} /> {relativeTime(new Date(l.created_at))}
          </span>
        </div>
      </div>

      {/* status changer */}
      <div className="relative shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          className="text-[12px]"
        >
          Aggiorna
        </Button>
        {open && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1 min-w-[140px]">
            {(["new", "contacted", "won", "lost"] as LeadStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => { onStatusChange(s); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-[12.5px] text-slate-700 hover:bg-slate-50 font-medium"
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        )}
      </div>
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
