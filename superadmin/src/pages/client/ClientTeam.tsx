import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, Mail, Shield, Eye, Trash2,
  ChevronDown, FolderKanban, Check, Loader2, X,
} from "lucide-react";
import type { ClientContext } from "../../components/shell/ClientLayout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { getSupabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { initials } from "../../lib/utils";
import type { Database } from "../../lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type WorkspaceMember = Database["public"]["Tables"]["workspace_members"]["Row"];
type Project = Database["public"]["Tables"]["projects"]["Row"];
type ProjectMember = Database["public"]["Tables"]["project_members"]["Row"];
type MemberRole = "admin" | "staff";
type ProjectMemberRole = "viewer" | "editor";

interface MemberWithProfile extends WorkspaceMember {
  profile: Profile | null;
}

interface ProjectAccess {
  projectId: string;
  role: ProjectMemberRole;
}

const ROLE_LABELS: Record<MemberRole, string> = { admin: "Admin", staff: "Staff" };
const PROJ_ROLE_LABELS: Record<ProjectMemberRole, string> = { viewer: "Viewer", editor: "Editor" };

const AVATAR_COLORS = [
  "from-cyan-400 to-blue-500",
  "from-violet-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-rose-500",
  "from-pink-400 to-fuchsia-500",
];

function avatarGradient(id: string) {
  const idx = id.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

/* ══════════════════════════════════════════════════════════════ */
export function ClientTeam() {
  const { workspace, loading } = useOutletContext<ClientContext>();
  const { profile: myProfile, isSuperAdmin } = useAuth();

  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [showInvite, setShowInvite] = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  /* ── load ── */
  useEffect(() => {
    async function load() {
      if (!workspace) return;
      const sb = getSupabase();
      if (!sb) return;

      const [membersRes, projectsRes, pmRes] = await Promise.all([
        sb.from("workspace_members").select("*").eq("workspace_id", workspace.id),
        sb.from("projects").select("*").eq("workspace_id", workspace.id).order("name"),
        sb.from("project_members").select("*"),
      ]);

      const rawMembers = membersRes.data ?? [];
      const userIds = rawMembers.map((m) => m.user_id);

      let profiles: Profile[] = [];
      if (userIds.length > 0) {
        const { data } = await sb.from("profiles").select("*").in("id", userIds);
        profiles = data ?? [];
      }

      setMembers(
        rawMembers.map((m) => ({
          ...m,
          profile: profiles.find((p) => p.id === m.user_id) ?? null,
        }))
      );
      setProjects(projectsRes.data ?? []);
      setProjectMembers(pmRes.data ?? []);
      setDataLoading(false);
    }
    void load();
  }, [workspace]);

  function getProjectAccess(userId: string): ProjectAccess[] {
    return projectMembers
      .filter((pm) => pm.user_id === userId)
      .map((pm) => ({ projectId: pm.project_id, role: pm.role as ProjectMemberRole }));
  }

  async function toggleProjectAccess(userId: string, projectId: string, currentRole: ProjectMemberRole | null) {
    const sb = getSupabase();
    if (!sb) return;

    if (currentRole) {
      // rimuovi
      await sb.from("project_members").delete()
        .eq("user_id", userId).eq("project_id", projectId);
      setProjectMembers((prev) =>
        prev.filter((pm) => !(pm.user_id === userId && pm.project_id === projectId))
      );
    } else {
      // aggiungi come viewer
      const { data } = await sb.from("project_members").insert({
        user_id: userId,
        project_id: projectId,
        role: "viewer",
        invited_by: myProfile?.id ?? null,
      }).select().single();
      if (data) setProjectMembers((prev) => [...prev, data]);
    }
  }

  async function changeProjectRole(userId: string, projectId: string, role: ProjectMemberRole) {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from("project_members").update({ role })
      .eq("user_id", userId).eq("project_id", projectId);
    setProjectMembers((prev) =>
      prev.map((pm) =>
        pm.user_id === userId && pm.project_id === projectId ? { ...pm, role } : pm
      )
    );
  }

  async function removeMember(memberId: string, userId: string) {
    if (!confirm("Rimuovere questo membro dal workspace?")) return;
    const sb = getSupabase();
    if (!sb) return;
    await sb.from("workspace_members").delete().eq("id", memberId);
    await sb.from("project_members").delete().eq("user_id", userId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    setProjectMembers((prev) => prev.filter((pm) => pm.user_id !== userId));
  }

  const canManage = isSuperAdmin || (myProfile &&
    members.find((m) => m.user_id === myProfile.id)?.role === "admin");

  if (loading || dataLoading) return <PageShell><LoadingSkeleton /></PageShell>;
  if (!workspace) return null;

  return (
    <PageShell>
      <InviteModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        workspaceId={workspace.id}
        onInvited={(m, p) => setMembers((prev) => [...prev, { ...m, profile: p }])}
      />

      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-8">
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] tracking-[0.18em] text-violet-600 uppercase font-bold pt-1">04</span>
          <div>
            <h1 className="font-black text-slate-900 tracking-tight" style={{ fontSize: "28px" }}>
              Il tuo <span className="italic font-light text-slate-600">team</span>.
            </h1>
            <p className="text-[13px] text-slate-500 mt-1">
              {members.length} {members.length === 1 ? "membro" : "membri"} nel workspace
            </p>
          </div>
        </div>
        {canManage && (
          <Button variant="primary" size="md" onClick={() => setShowInvite(true)}>
            <UserPlus size={14} /> Invita membro
          </Button>
        )}
      </div>

      {/* Lista */}
      {members.length === 0 ? (
        <Card className="p-12 text-center">
          <UserPlus size={32} className="text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-900 text-[17px] mb-2">Nessun membro ancora</h3>
          <p className="text-[13px] text-slate-500 max-w-sm mx-auto mb-5">
            Invita collaboratori e assegnali ai singoli progetti.
          </p>
          {canManage && (
            <Button variant="primary" onClick={() => setShowInvite(true)}>
              <UserPlus size={14} /> Invita il primo membro
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {members.map((m, i) => {
            const p = m.profile;
            const access = getProjectAccess(m.user_id);
            const isExpanded = expandedMember === m.id;
            const isMe = myProfile?.id === m.user_id;

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:border-slate-300 transition-colors">
                  {/* row principale */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* avatar */}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradient(m.user_id)} flex items-center justify-center text-white text-[13px] font-bold shrink-0`}>
                      {initials(p?.name ?? p?.email ?? "?")}
                    </div>

                    {/* info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-[14px]">
                          {p?.name ?? "—"}
                        </span>
                        {isMe && (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-cyan-600 bg-cyan-50 px-1.5 py-0.5 rounded-md">
                            Tu
                          </span>
                        )}
                        <span className={`text-[10.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${
                          m.role === "admin"
                            ? "bg-violet-50 text-violet-600"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {ROLE_LABELS[m.role]}
                        </span>
                      </div>
                      <div className="text-[12px] text-slate-400 mt-0.5">{p?.email ?? "—"}</div>
                    </div>

                    {/* progetti assegnati count */}
                    <div className="flex items-center gap-1.5 text-[12px] text-slate-400 shrink-0">
                      <FolderKanban size={12} />
                      <span>{access.length} {access.length === 1 ? "progetto" : "progetti"}</span>
                    </div>

                    {/* azioni */}
                    {canManage && !isMe && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setExpandedMember(isExpanded ? null : m.id)}
                          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
                          title="Gestisci accessi"
                        >
                          <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                        <button
                          onClick={() => removeMember(m.id, m.user_id)}
                          className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                          title="Rimuovi membro"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                    {(!canManage || isMe) && (
                      <button
                        onClick={() => setExpandedMember(isExpanded ? null : m.id)}
                        className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
                      >
                        <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>

                  {/* Pannello progetti espanso */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50">
                          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-3">
                            Accesso ai progetti
                          </p>
                          {projects.length === 0 ? (
                            <p className="text-[12.5px] text-slate-400">Nessun progetto nel workspace.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {projects.map((proj) => {
                                const pm = projectMembers.find(
                                  (x) => x.user_id === m.user_id && x.project_id === proj.id
                                );
                                const hasAccess = !!pm;

                                return (
                                  <div key={proj.id} className="flex items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-xl px-3 py-2.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                                        proj.status === "live" ? "bg-emerald-400" : "bg-slate-300"
                                      }`} />
                                      <span className="text-[12.5px] font-medium text-slate-700 truncate">{proj.name}</span>
                                    </div>

                                    {canManage && !isMe ? (
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {hasAccess && (
                                          <select
                                            value={pm.role}
                                            onChange={(e) => changeProjectRole(m.user_id, proj.id, e.target.value as ProjectMemberRole)}
                                            className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-cyan-400 cursor-pointer"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <option value="viewer">Viewer</option>
                                            <option value="editor">Editor</option>
                                          </select>
                                        )}
                                        <button
                                          onClick={() => toggleProjectAccess(m.user_id, proj.id, hasAccess ? pm.role as ProjectMemberRole : null)}
                                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                            hasAccess
                                              ? "bg-emerald-50 text-emerald-600 hover:bg-rose-50 hover:text-rose-500"
                                              : "bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                                          }`}
                                          title={hasAccess ? "Rimuovi accesso" : "Dai accesso"}
                                        >
                                          {hasAccess ? <Check size={12} /> : <X size={12} />}
                                        </button>
                                      </div>
                                    ) : (
                                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                        hasAccess
                                          ? "bg-emerald-50 text-emerald-600"
                                          : "bg-slate-100 text-slate-400"
                                      }`}>
                                        {hasAccess ? PROJ_ROLE_LABELS[pm.role as ProjectMemberRole] : "Nessun accesso"}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

/* ─── Invite Modal ─────────────────────────────────────────── */
function InviteModal({
  open, onClose, workspaceId, onInvited,
}: {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onInvited: (member: WorkspaceMember, profile: Profile | null) => void;
}) {
  useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("staff");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function reset() { setEmail(""); setRole("staff"); setError(null); setSuccess(false); }
  function handleClose() { reset(); onClose(); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const sb = getSupabase();
    if (!sb) return;

    setSubmitting(true);

    // Cerca se l'utente esiste già
    const { data: existingProfile } = await sb
      .from("profiles")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (!existingProfile) {
      setError("Nessun account trovato con questa email. L'utente deve prima registrarsi su TheraFlow.");
      setSubmitting(false);
      return;
    }

    // Controlla se è già membro
    const { data: existing } = await sb
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", existingProfile.id)
      .maybeSingle();

    if (existing) {
      setError("Questo utente è già membro del workspace.");
      setSubmitting(false);
      return;
    }

    const { data: newMember, error: insertErr } = await sb
      .from("workspace_members")
      .insert({ workspace_id: workspaceId, user_id: existingProfile.id, role })
      .select()
      .single();

    setSubmitting(false);

    if (insertErr || !newMember) {
      setError(insertErr?.message ?? "Errore durante l'invito.");
      return;
    }

    setSuccess(true);
    onInvited(newMember, existingProfile);
    setTimeout(() => { reset(); onClose(); }, 1200);
  }

  return (
    <Modal open={open} onClose={handleClose} title="Invita membro" description="L'utente deve avere già un account TheraFlow.">
      {success ? (
        <div className="flex flex-col items-center py-6 gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <Check size={22} className="text-emerald-600" />
          </div>
          <p className="font-semibold text-slate-900">Membro aggiunto!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="collaboratore@email.com"
                required
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-[14px] text-slate-900 placeholder-slate-300 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1.5">
              Ruolo nel workspace
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["staff", "admin"] as MemberRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-[13px] font-semibold transition-all text-left ${
                    role === r
                      ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {r === "admin" ? <Shield size={14} /> : <Eye size={14} />}
                  <div>
                    <div>{r === "admin" ? "Admin" : "Staff"}</div>
                    <div className="text-[10.5px] font-normal text-slate-400 mt-0.5">
                      {r === "admin" ? "Vede tutto" : "Solo progetti assegnati"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-[12.5px] text-rose-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting}>Annulla</Button>
            <Button type="submit" variant="primary" disabled={submitting || !email.trim()}>
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Invio…</> : <><UserPlus size={14} /> Aggiungi membro</>}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ─── Helpers ───────────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
      ))}
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
