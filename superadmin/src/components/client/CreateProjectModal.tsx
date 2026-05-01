import { useState, type FormEvent } from "react";
import { Loader2, Rocket } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { getSupabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import type { Database } from "../../lib/database.types";

type Project = Database["public"]["Tables"]["projects"]["Row"];

const CATEGORIES = [
  "Landing page",
  "Sito web",
  "Funnel vendita",
  "Portfolio",
  "E-commerce",
  "Blog",
  "Altro",
];

interface Props {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onCreated: (project: Project) => void;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function CreateProjectModal({ open, onClose, workspaceId, onCreated }: Props) {
  const { profile } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subdomain, setSubdomain] = useState("");
  const [subdomainManual, setSubdomainManual] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(v: string) {
    setName(v);
    if (!subdomainManual) setSubdomain(slugify(v));
  }

  function handleSubdomainChange(v: string) {
    setSubdomainManual(true);
    setSubdomain(slugify(v));
  }

  function reset() {
    setName(""); setCategory(CATEGORIES[0]);
    setSubdomain(""); setSubdomainManual(false);
    setError(null);
  }

  function handleClose() { reset(); onClose(); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Inserisci il nome del progetto."); return; }
    if (!subdomain.trim()) { setError("Il sottodominio non può essere vuoto."); return; }

    const sb = getSupabase();
    if (!sb) { setError("Supabase non configurato."); return; }

    setSubmitting(true);

    // Verifica che il sottodominio sia disponibile
    const { data: existing } = await sb
      .from("projects")
      .select("id")
      .eq("subdomain", subdomain)
      .maybeSingle();

    if (existing) {
      setError("Sottodominio già in uso. Scegline un altro.");
      setSubmitting(false);
      return;
    }

    const { data, error: err } = await sb
      .from("projects")
      .insert({
        workspace_id: workspaceId,
        name: name.trim(),
        slug: subdomain,
        subdomain,
        category,
        status: "draft",
      })
      .select()
      .single();

    setSubmitting(false);

    if (err || !data) {
      setError(err?.message ?? "Errore durante la creazione.");
      return;
    }

    // Se l'utente non è workspace admin, aggiungilo come editor del progetto
    if (profile) {
      await sb.from("project_members").insert({
        project_id: data.id,
        user_id: profile.id,
        role: "editor",
        invited_by: profile.id,
      }).then(() => {});
    }

    reset();
    onCreated(data);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nuovo progetto"
      description="Scegli un nome e un sottodominio. Potrai modificare tutto dopo."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1.5">
            Nome progetto
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="es. Landing Studio Rossi"
            required
            autoFocus
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 placeholder-slate-300 outline-none focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100 font-medium transition-all"
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1.5">
            Tipo di progetto
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 outline-none focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100 font-medium transition-all appearance-none cursor-pointer"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Sottodominio */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1.5">
            Sottodominio
          </label>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-100 transition-all">
            <input
              type="text"
              value={subdomain}
              onChange={(e) => handleSubdomainChange(e.target.value)}
              placeholder="il-mio-progetto"
              required
              className="flex-1 bg-transparent px-4 py-3 text-[14px] text-slate-900 placeholder-slate-300 outline-none font-medium min-w-0"
            />
            <span className="text-[12px] text-slate-400 font-medium pr-4 shrink-0">.theraflow.io</span>
          </div>
          {subdomain && (
            <p className="text-[11.5px] text-slate-400 mt-1.5 ml-1">
              → <span className="text-cyan-600 font-medium">{subdomain}.theraflow.io</span>
            </p>
          )}
        </div>

        {/* Errore */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-[12.5px] text-rose-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" size="md" onClick={handleClose} disabled={submitting}>
            Annulla
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={submitting || !name.trim()}>
            {submitting ? (
              <><Loader2 size={14} className="animate-spin" /> Creazione…</>
            ) : (
              <><Rocket size={14} /> Crea progetto</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
