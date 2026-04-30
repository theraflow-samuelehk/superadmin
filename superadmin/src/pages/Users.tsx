import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Shield, Users as UsersIcon, Briefcase } from "lucide-react";
import { users, getWorkspace } from "../lib/mock";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Stat } from "../components/ui/Stat";
import { relativeTime, cn } from "../lib/utils";

const PENDING_INVITES = [
  { email: "elena@gracecosmetics.it", workspace: "Studio Marchetti Beauty", role: "staff", sentAt: new Date(Date.now() - 2 * 86400000) },
  { email: "paolo@plantbased.life", workspace: "PlantBased Life", role: "admin", sentAt: new Date(Date.now() - 1 * 86400000) },
  { email: "valentina@nordico.studio", workspace: "Nordico Studio", role: "staff", sentAt: new Date(Date.now() - 5 * 3600000) },
];

export function Users() {
  const [tab, setTab] = useState<"all" | "superadmin" | "admin" | "staff" | "invites">("all");

  const counts = {
    all: users.length,
    superadmin: users.filter((u) => u.role === "superadmin").length,
    admin: users.filter((u) => u.role === "admin").length,
    staff: users.filter((u) => u.role === "staff").length,
    invites: PENDING_INVITES.length,
  };

  const filtered =
    tab === "all" ? users :
    tab === "invites" ? [] :
    users.filter((u) => u.role === tab);

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1600px] mx-auto">
      <div className="mb-8 pt-2">
        <div className="flex items-center gap-3 mb-5">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white"
            style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)" }}
          >
            04 — Utenti
          </span>
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="font-display font-bold text-slate-900 tracking-monster leading-[1]"
              style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
            >
              Chi vede <span className="gradient-text">cosa</span>.
            </h1>
            <p className="mt-3 text-[15px] text-slate-600 max-w-xl">
              Tre livelli di accesso: <span className="text-violet-600 font-semibold">Super Admin</span> assoluti,
              <span className="text-emerald-600 font-semibold"> Admin</span> di workspace,
              <span className="text-sky-600 font-semibold"> Staff</span> con visibilità granulare.
            </p>
          </div>
          <Button variant="primary" size="lg">
            <Mail size={14} /> Invita per email
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Card className="p-5"><Stat label="Super Admin" value={counts.superadmin} unit="assoluti" /></Card>
        <Card className="p-5"><Stat label="Admin di workspace" value={counts.admin} /></Card>
        <Card className="p-5"><Stat label="Staff" value={counts.staff} /></Card>
        <Card className="p-5"><Stat label="Inviti pendenti" value={counts.invites} /></Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-slate-100/70 p-1 rounded-xl w-fit">
        {([
          ["all", `Tutti · ${counts.all}`],
          ["superadmin", `Super Admin · ${counts.superadmin}`],
          ["admin", `Admin · ${counts.admin}`],
          ["staff", `Staff · ${counts.staff}`],
          ["invites", `Inviti · ${counts.invites}`],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "text-[12px] px-3.5 py-1.5 rounded-lg transition-all font-semibold",
              tab === k
                ? "bg-white text-slate-900 shadow-soft"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "invites" ? (
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_140px] gap-4 px-5 py-3.5 border-b border-slate-100 text-[10.5px] uppercase tracking-wider text-slate-500 font-bold bg-slate-50/50">
            <div>Email</div>
            <div>Workspace</div>
            <div>Ruolo</div>
            <div>Inviato</div>
            <div className="text-right">Azioni</div>
          </div>
          {PENDING_INVITES.map((inv, i) => (
            <motion.div
              key={inv.email}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="grid grid-cols-[2fr_1.5fr_1fr_1fr_140px] gap-4 px-5 py-4 items-center border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 group transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                  <Mail size={14} />
                </div>
                <span className="text-[13.5px] text-slate-900 truncate font-semibold">{inv.email}</span>
              </div>
              <div className="text-[13px] text-slate-600">{inv.workspace}</div>
              <div>
                <Badge variant="warn">{inv.role}</Badge>
              </div>
              <div className="text-[12px] text-slate-500 font-mono">
                {relativeTime(inv.sentAt)}
              </div>
              <div className="flex justify-end gap-1.5">
                <Button variant="ghost" size="sm">Re-invia</Button>
                <Button variant="danger" size="sm">Annulla</Button>
              </div>
            </motion.div>
          ))}
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_120px] gap-4 px-5 py-3.5 border-b border-slate-100 text-[10.5px] uppercase tracking-wider text-slate-500 font-bold bg-slate-50/50">
            <div>Utente</div>
            <div>Workspace</div>
            <div>Ruolo</div>
            <div>Ultimo accesso</div>
            <div className="text-right">Azioni</div>
          </div>
          {filtered.map((u, i) => {
            const ws = u.workspaceId ? getWorkspace(u.workspaceId) : null;
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025 }}
                className="grid grid-cols-[2fr_2fr_1fr_1fr_120px] gap-4 px-5 py-4 items-center border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 group transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={u.name} color={u.avatarColor} size="md" />
                  <div className="min-w-0">
                    <div className="text-[13.5px] text-slate-900 truncate font-semibold">{u.name}</div>
                    <div className="text-[11.5px] text-slate-500 truncate font-mono">{u.email}</div>
                  </div>
                </div>
                <div className="text-[13px] text-slate-600 truncate">
                  {u.role === "superadmin" ? <span className="gradient-text font-semibold">— Tutta la piattaforma —</span> : ws?.name || "—"}
                </div>
                <div>
                  <Badge variant={u.role === "superadmin" ? "violet" : u.role === "admin" ? "live" : "info"} dot>
                    {u.role === "superadmin" ? "super" : u.role}
                  </Badge>
                </div>
                <div className="text-[12px] text-slate-500 font-mono">
                  {relativeTime(u.lastSeen)}
                </div>
                <div className="flex justify-end gap-1.5">
                  <Button variant="ghost" size="sm" className="opacity-50 group-hover:opacity-100">
                    Permessi
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </Card>
      )}

      {/* Roles legend */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
        <RoleCard
          icon={<Shield size={18} />}
          color="violet"
          name="Super Admin"
          desc="Vede tutti i workspace di tutti gli utenti. Può impersonare chiunque, modificare billing, sospendere account. Solo Samuele e Thomas."
        />
        <RoleCard
          icon={<Briefcase size={18} />}
          color="emerald"
          name="Admin di workspace"
          desc="Padrone del proprio workspace. Crea progetti, invita membri, gestisce categorie e domini. Non vede gli altri workspace."
        />
        <RoleCard
          icon={<UsersIcon size={18} />}
          color="sky"
          name="Staff"
          desc="Invitato dentro un workspace con permessi specifici per progetto. L'admin decide cosa può vedere e cosa può modificare."
        />
      </div>
    </div>
  );
}

function RoleCard({
  icon,
  color,
  name,
  desc,
}: {
  icon: React.ReactNode;
  color: "violet" | "emerald" | "sky";
  name: string;
  desc: string;
}) {
  const bg = {
    violet: "bg-violet-100 text-violet-600",
    emerald: "bg-emerald-100 text-emerald-600",
    sky: "bg-sky-100 text-sky-600",
  };
  return (
    <Card className="p-5">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-4", bg[color])}>
        {icon}
      </div>
      <div className="font-display text-[18px] text-slate-900 font-bold tracking-tight mb-2">{name}</div>
      <p className="text-[13px] text-slate-600 leading-relaxed">{desc}</p>
    </Card>
  );
}
