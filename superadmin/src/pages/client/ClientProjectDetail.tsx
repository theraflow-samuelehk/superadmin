import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Globe, Copy, Eye, EyeOff, ChevronDown,
  ExternalLink, GitBranch, Shield, Check,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { getSupabase } from "../../lib/supabase";
import type { Database } from "../../lib/database.types";

type Project = Database["public"]["Tables"]["projects"]["Row"];

type LinkEntry = {
  label: string;
  url: string;
  type: "site" | "admin" | "github" | "local";
};

type Credential = {
  label: string;
  value: string;
  hidden: boolean;
};

type Script = {
  id: string;
  title: string;
  color: string;
  content: string;
};

type ProjectMetadata = {
  domain_label: string;
  links: LinkEntry[];
  credentials: Credential[];
  scripts: Script[];
};

type ProjectWithMeta = Project & { metadata: ProjectMetadata };

const LINK_STYLES: Record<LinkEntry["type"], { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  site:   { bg: "bg-cyan-50",    text: "text-cyan-700",   border: "border-cyan-200",   icon: <Globe size={12} /> },
  admin:  { bg: "bg-violet-50",  text: "text-violet-700", border: "border-violet-200", icon: <Shield size={12} /> },
  github: { bg: "bg-slate-100",  text: "text-slate-700",  border: "border-slate-200",  icon: <GitBranch size={12} /> },
  local:  { bg: "bg-emerald-50", text: "text-emerald-700",border: "border-emerald-200",icon: <Globe size={12} /> },
};

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (value: string, key: string) => {
    void navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };
  return { copied, copy };
}

export function ClientProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectWithMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [openScript, setOpenScript] = useState<string | null>(null);
  const { copied, copy } = useCopy();

  useEffect(() => {
    async function load() {
      if (!id) return;
      const sb = getSupabase();
      if (!sb) { setError("Supabase non disponibile."); setLoading(false); return; }
      const { data, error: err } = await sb
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
      if (err || !data) {
        setError("Progetto non trovato.");
      } else {
        const raw = data as Project & { metadata?: unknown };
        const meta: ProjectMetadata = (raw.metadata as ProjectMetadata) ?? {
          domain_label: "",
          links: [],
          credentials: [],
          scripts: [],
        };
        setProject({ ...raw, metadata: meta });
      }
      setLoading(false);
    }
    void load();
  }, [id]);

  const toggleReveal = (i: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  if (loading) {
    return (
      <PageShell>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </PageShell>
    );
  }

  if (error || !project) {
    return (
      <PageShell>
        <div className="mt-12 text-center">
          <p className="text-[14px] text-slate-500 mb-4">{error ?? "Errore sconosciuto."}</p>
          <Link to="/app/projects">
            <Button variant="secondary" size="sm">
              <ArrowLeft size={13} /> Torna ai progetti
            </Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  const meta = project.metadata;
  const statusVariant =
    project.status === "live" ? "live"
    : project.status === "deploying" ? "deploying"
    : project.status === "draft" ? "draft"
    : "archived";

  const projectIndex = project.slug
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0) % 90 + 10;

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          to="/app/projects"
          className="inline-flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-violet-600 transition-colors font-medium"
        >
          <ArrowLeft size={12} /> Progetti
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] tracking-[0.18em] text-violet-600 uppercase font-bold pt-1">
            {String(projectIndex).padStart(2, "0")}
          </span>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-black text-slate-900 tracking-tight" style={{ fontSize: "28px" }}>
                {project.name}
              </h1>
              <Badge variant={statusVariant} dot>{project.status}</Badge>
            </div>
            <div className="flex items-center gap-3">
              {project.category && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {project.category}
                </span>
              )}
              {meta.domain_label && (
                <span className="text-[12px] font-mono text-slate-400">{meta.domain_label}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonna sinistra */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Links */}
          {meta.links.length > 0 && (
            <Card flat className="p-6">
              <SectionTitle>Link utili</SectionTitle>
              <div className="flex flex-wrap gap-2 mt-4">
                {meta.links.map((link, i) => {
                  const s = LINK_STYLES[link.type];
                  return (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold border transition-all hover:shadow-sm hover:scale-[1.02] ${s.bg} ${s.text} ${s.border}`}
                    >
                      {s.icon}
                      {link.label}
                      <ExternalLink size={10} className="opacity-50" />
                    </a>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Scripts */}
          {meta.scripts.length > 0 && (
            <div className="flex flex-col gap-4">
              <SectionTitle>Script</SectionTitle>
              {meta.scripts.map((script) => {
                const isOpen = openScript === script.id;
                return (
                  <Card key={script.id} flat className="overflow-hidden">
                    <div
                      className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer select-none"
                      style={{ backgroundColor: script.color + "18", borderBottom: isOpen ? `1px solid ${script.color}30` : undefined }}
                      onClick={() => setOpenScript(isOpen ? null : script.id)}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: script.color }}
                        />
                        <span className="font-bold text-[14px] text-slate-800">{script.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copy(script.content, `script-${script.id}`);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white/70 border border-slate-200 text-slate-600 hover:bg-white transition-all"
                        >
                          {copied === `script-${script.id}` ? (
                            <><Check size={11} className="text-emerald-500" /> Copiato</>
                          ) : (
                            <><Copy size={11} /> Copia</>
                          )}
                        </button>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown size={15} className="text-slate-400" />
                        </motion.div>
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <pre className="px-5 py-4 text-[12.5px] leading-relaxed text-slate-700 font-mono whitespace-pre-wrap bg-slate-50/60 overflow-x-auto">
                            {script.content}
                          </pre>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonna destra */}
        <div className="flex flex-col gap-6">
          {/* Credenziali */}
          {meta.credentials.length > 0 && (
            <Card flat className="p-6">
              <SectionTitle>Credenziali</SectionTitle>
              <div className="mt-4 flex flex-col divide-y divide-slate-100">
                {meta.credentials.map((cred, i) => {
                  const show = !cred.hidden || revealed.has(i);
                  return (
                    <div key={i} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                          {cred.label}
                        </div>
                        <div className={`text-[13px] font-mono truncate ${cred.hidden && !show ? "tracking-[0.2em] text-slate-400" : "text-slate-800"}`}>
                          {show ? cred.value : "••••••••"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {cred.hidden && (
                          <button
                            onClick={() => toggleReveal(i)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            {show ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        )}
                        <button
                          onClick={() => copy(cred.value, `cred-${i}`)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          {copied === `cred-${i}` ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Info */}
          <Card flat className="p-6">
            <SectionTitle>Info progetto</SectionTitle>
            <div className="mt-4 flex flex-col gap-3">
              <InfoRow label="Stato">
                <Badge variant={statusVariant} dot>{project.status}</Badge>
              </InfoRow>
              {project.category && (
                <InfoRow label="Categoria">
                  <span className="text-[13px] text-slate-700 font-medium">{project.category}</span>
                </InfoRow>
              )}
              {project.tech_stack.length > 0 && (
                <InfoRow label="Stack">
                  <div className="flex flex-wrap gap-1">
                    {project.tech_stack.map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                </InfoRow>
              )}
              <InfoRow label="Sottodominio">
                <span className="text-[12px] font-mono text-slate-500">{project.subdomain}.theraflow.io</span>
              </InfoRow>
              {project.custom_domain && (
                <InfoRow label="Dominio custom">
                  <span className="text-[12px] font-mono text-cyan-600">{project.custom_domain}</span>
                </InfoRow>
              )}
              <InfoRow label="Creato il">
                <span className="text-[13px] text-slate-500">
                  {new Date(project.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </InfoRow>
              {project.last_deploy_at && (
                <InfoRow label="Ultimo deploy">
                  <span className="text-[13px] text-slate-500">
                    {new Date(project.last_deploy_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </InfoRow>
              )}
            </div>
          </Card>

          {/* Stats */}
          <Card flat className="p-6">
            <SectionTitle>Statistiche (30gg)</SectionTitle>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <StatBox label="Visite" value={project.visits_30d.toLocaleString("it-IT")} />
              <StatBox label="Lead" value={project.leads_30d.toLocaleString("it-IT")} />
              <StatBox
                label="€ / mese"
                value={project.revenue_30d > 0
                  ? project.revenue_30d.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
                  : "—"}
              />
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
      {children}
    </h2>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pt-0.5 shrink-0">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 text-center">
      <div className="font-bold text-slate-900 text-[15px] tabular-nums leading-none">{value}</div>
      <div className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">{label}</div>
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
