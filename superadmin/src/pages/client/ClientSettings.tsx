import { useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Save, Loader2, Check, Building2, Globe, CreditCard,
  Shield, AlertTriangle, ExternalLink,
} from "lucide-react";
import type { ClientContext } from "../../components/shell/ClientLayout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { getSupabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import type { Database } from "../../lib/database.types";

type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  growth: "Growth",
  scale: "Scale",
  enterprise: "Enterprise",
};

const PLAN_COLORS: Record<string, string> = {
  free:       "bg-slate-100 text-slate-600",
  starter:    "bg-blue-50 text-blue-600",
  growth:     "bg-cyan-50 text-cyan-700",
  scale:      "bg-violet-50 text-violet-700",
  enterprise: "bg-amber-50 text-amber-700",
};

export function ClientSettings() {
  const { workspace, loading } = useOutletContext<ClientContext>();
  const { profile, isSuperAdmin } = useAuth();

  if (loading) return <PageShell><div className="text-[13px] text-slate-400">Caricamento…</div></PageShell>;
  if (!workspace) return null;

  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-baseline gap-3 mb-8">
        <span className="text-[11px] tracking-[0.18em] text-violet-600 uppercase font-bold pt-1">05</span>
        <div>
          <h1 className="font-black text-slate-900 tracking-tight" style={{ fontSize: "28px" }}>
            Impostazioni <span className="italic font-light text-slate-600">workspace</span>.
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">Gestisci nome, piano e preferenze.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonna principale */}
        <div className="lg:col-span-2 space-y-5">
          <WorkspaceNameSection workspace={workspace} canEdit={isSuperAdmin || workspace.owner_id === profile?.id} />
          <DomainSection workspace={workspace} />
        </div>

        {/* Sidebar destra */}
        <div className="space-y-5">
          <PlanSection workspace={workspace} />
          <StatusSection workspace={workspace} />
        </div>
      </div>
    </PageShell>
  );
}

/* ─── Sezione nome workspace ────────────────────────────────── */
function WorkspaceNameSection({ workspace, canEdit }: { workspace: Workspace; canEdit: boolean }) {
  const [name, setName] = useState(workspace.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = name.trim() !== workspace.name;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setError(null);
    const sb = getSupabase();
    if (!sb) return;
    setSaving(true);
    const { error: err } = await sb
      .from("workspaces")
      .update({ name: name.trim() })
      .eq("id", workspace.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <Building2 size={15} className="text-slate-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-[15px]">Nome workspace</h3>
          <p className="text-[12px] text-slate-400">Visibile a tutti i membri.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1.5">
            Nome
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 outline-none focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100 font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1.5">
            Slug (identificatore)
          </label>
          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 gap-2">
            <span className="text-[13px] text-slate-400 font-mono">{workspace.slug}</span>
            <span className="ml-auto text-[10.5px] text-slate-400 bg-slate-200 px-2 py-0.5 rounded font-medium">
              non modificabile
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-[12.5px] text-rose-700">
            {error}
          </div>
        )}

        {canEdit && (
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="md" disabled={!dirty || saving}>
              {saving ? (
                <><Loader2 size={14} className="animate-spin" /> Salvo…</>
              ) : saved ? (
                <><Check size={14} /> Salvato!</>
              ) : (
                <><Save size={14} /> Salva modifiche</>
              )}
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}

/* ─── Sezione dominio ───────────────────────────────────────── */
function DomainSection({ workspace: _ }: { workspace: Workspace }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <Globe size={15} className="text-slate-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-[15px]">Dominio custom</h3>
          <p className="text-[12px] text-slate-400">Collega il tuo dominio ai progetti.</p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center">
        <Globe size={24} className="text-slate-300 mx-auto mb-3" />
        <p className="text-[13.5px] font-semibold text-slate-700 mb-1">Dominio custom — prossimamente</p>
        <p className="text-[12.5px] text-slate-400 max-w-xs mx-auto">
          Potrai collegare il tuo dominio ai singoli progetti. Per ora ogni progetto usa{" "}
          <span className="font-mono text-slate-600">nomeprogetto.theraflow.io</span>.
        </p>
      </div>
    </Card>
  );
}

/* ─── Sezione piano ─────────────────────────────────────────── */
function PlanSection({ workspace }: { workspace: Workspace }) {
  const PLAN_FEATURES: Record<string, string[]> = {
    free:       ["3 progetti", "Sottodominio theraflow.io", "Lead illimitati"],
    starter:    ["10 progetti", "1 dominio custom", "Analytics base"],
    growth:     ["Progetti illimitati", "3 domini custom", "Analytics avanzata", "Team fino a 5 membri"],
    scale:      ["Progetti illimitati", "Domini illimitati", "Analytics pro", "Team illimitato"],
    enterprise: ["Tutto di Scale", "SLA dedicato", "Onboarding personalizzato"],
  };

  const features = PLAN_FEATURES[workspace.plan] ?? [];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <CreditCard size={15} className="text-slate-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-[14px]">Piano attivo</h3>
        </div>
      </div>

      <div className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[12px] font-bold uppercase tracking-wide mb-4 ${PLAN_COLORS[workspace.plan] ?? "bg-slate-100 text-slate-600"}`}>
        {PLAN_LABELS[workspace.plan] ?? workspace.plan}
      </div>

      <ul className="space-y-2 mb-5">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-[12.5px] text-slate-600">
            <Check size={11} className="text-emerald-500 shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      {workspace.plan !== "enterprise" && (
        <button className="w-full text-[12.5px] font-semibold text-cyan-600 hover:text-cyan-700 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 transition-colors">
          <ExternalLink size={12} /> Aggiorna piano
        </button>
      )}
    </Card>
  );
}

/* ─── Sezione status ────────────────────────────────────────── */
function StatusSection({ workspace }: { workspace: Workspace }) {
  const STATUS_INFO = {
    active:    { label: "Attivo",    color: "live",  icon: <Check size={12} />,         desc: "Workspace operativo al 100%." },
    trial:     { label: "Trial",     color: "draft",  icon: <Shield size={12} />,         desc: "Periodo di prova in corso." },
    paused:    { label: "In pausa",  color: "archived", icon: <AlertTriangle size={12} />, desc: "Il workspace è sospeso." },
    suspended: { label: "Sospeso",   color: "archived", icon: <AlertTriangle size={12} />, desc: "Contatta il supporto." },
  } as const;

  const info = STATUS_INFO[workspace.status as keyof typeof STATUS_INFO];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-900 text-[14px]">Stato</h3>
        <Badge variant={info?.color as "live" | "draft" | "archived" | "deploying" | "trial"} dot>
          {info?.label ?? workspace.status}
        </Badge>
      </div>
      <p className="text-[12.5px] text-slate-500">{info?.desc}</p>

      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-slate-400">Revenue 30gg</span>
          <span className="font-semibold text-slate-700">
            €{workspace.monthly_revenue.toLocaleString("it-IT")}
          </span>
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-slate-400">Storage</span>
          <span className="font-semibold text-slate-700">
            {workspace.storage_mb} / {workspace.storage_limit_mb} MB
          </span>
        </div>
        <div className="mt-2">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((workspace.storage_mb / workspace.storage_limit_mb) * 100, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 md:px-6 lg:px-12 py-8 max-w-[1600px] mx-auto">
      {children}
    </div>
  );
}
