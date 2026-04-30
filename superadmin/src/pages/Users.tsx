import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Shield, Users as UsersIcon } from "lucide-react";
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
      <div className="mb-8 pt-4">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[10px] uppercase tracking-[0.22em] text-accent font-semibold">
            04 — Utenti
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-paper-300 to-transparent" />
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="font-display font-light text-ink-900 tracking-monster leading-[0.95]"
              style={{ fontSize: "clamp(40px, 5vw, 60px)", fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
            >
              Chi vede cosa.
            </h1>
            <p className="mt-3 text-[15px] text-ink-200 max-w-lg">
              Tre livelli di accesso: <span className="text-accent font-semibold">Super Admin</span> assoluti,
              <span className="text-ink-400 font-semibold"> Admin</span> di workspace,
              <span className="text-ink-300 font-semibold"> Staff</span> con visibilità granulare.
            </p>
          </div>
          <Button variant="primary">
            <Mail size={12} /> Invita per email
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Card className="grid grid-cols-2 lg:grid-cols-4 mb-8 overflow-hidden p-0">
        <div className="p-5 hairline-r">
          <Stat label="Super Admin" value={counts.superadmin} unit="assoluti" />
        </div>
        <div className="p-5 hairline-r">
          <Stat label="Admin di workspace" value={counts.admin} />
        </div>
        <div className="p-5 hairline-r">
          <Stat label="Staff" value={counts.staff} />
        </div>
        <div className="p-5">
          <Stat label="Inviti pendenti" value={counts.invites} />
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 hairline rounded-md bg-paper-100/50 p-1 w-fit">
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
              "text-[11px] px-3 py-1.5 rounded-sm transition-colors font-medium",
              tab === k
                ? "bg-accent text-paper-50 shadow-soft"
                : "text-ink-200 hover:text-ink-400 hover:bg-paper-50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "invites" ? (
        <Card className="p-0">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_140px] gap-4 px-5 py-3 hairline-b text-[10px] uppercase tracking-[0.14em] text-ink-100 font-semibold bg-paper-100/40">
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
              className="grid grid-cols-[2fr_1.5fr_1fr_1fr_140px] gap-4 px-5 py-4 items-center hairline-b last:border-b-0 hover:bg-paper-100/40 group transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 hairline rounded-md flex items-center justify-center bg-saffron/10">
                  <Mail size={12} className="text-saffron" />
                </div>
                <span className="text-[13px] text-ink-400 truncate font-medium">{inv.email}</span>
              </div>
              <div className="text-[12.5px] text-ink-300">{inv.workspace}</div>
              <div>
                <Badge variant="warn">{inv.role}</Badge>
              </div>
              <div className="text-[11px] text-ink-200 font-mono">
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
        <Card className="p-0">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_120px] gap-4 px-5 py-3 hairline-b text-[10px] uppercase tracking-[0.14em] text-ink-100 font-semibold bg-paper-100/40">
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
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[2fr_2fr_1fr_1fr_120px] gap-4 px-5 py-4 items-center hairline-b last:border-b-0 hover:bg-paper-100/40 group transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={u.name} color={u.avatarColor} size="sm" />
                  <div className="min-w-0">
                    <div className="text-[13px] text-ink-900 truncate font-medium">{u.name}</div>
                    <div className="text-[11px] text-ink-100 truncate font-mono">{u.email}</div>
                  </div>
                </div>
                <div className="text-[12.5px] text-ink-300 truncate">
                  {u.role === "superadmin" ? <span className="text-accent font-medium">— Tutta la piattaforma —</span> : ws?.name || "—"}
                </div>
                <div>
                  <Badge variant={u.role === "superadmin" ? "accent" : u.role === "admin" ? "live" : "neutral"} dot>
                    {u.role === "superadmin" ? "super" : u.role}
                  </Badge>
                </div>
                <div className="text-[11px] text-ink-200 font-mono">
                  {relativeTime(u.lastSeen)}
                </div>
                <div className="flex justify-end gap-1.5">
                  <Button variant="ghost" size="sm" className="opacity-60 group-hover:opacity-100">
                    Permessi
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </Card>
      )}

      {/* Roles legend */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <RoleCard
          icon={<Shield size={14} />}
          color="accent"
          name="Super Admin"
          desc="Vede tutti i workspace di tutti gli utenti. Può impersonare chiunque, modificare billing, sospendere account. Solo Samuele e Thomas."
        />
        <RoleCard
          icon={<UsersIcon size={14} />}
          color="sage"
          name="Admin di workspace"
          desc="Padrone del proprio workspace. Crea progetti, invita membri, gestisce categorie e domini. Non vede gli altri workspace."
        />
        <RoleCard
          icon={<UsersIcon size={14} />}
          color="ink"
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
  color: "accent" | "sage" | "ink";
  name: string;
  desc: string;
}) {
  const colorMap = {
    accent: "text-accent",
    sage: "text-sage",
    ink: "text-ink-400",
  };
  return (
    <Card className="p-5">
      <div className={cn("flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] mb-3 font-semibold", colorMap[color])}>
        {icon}
        <span>{name}</span>
      </div>
      <p className="text-[13px] text-ink-300 leading-relaxed">{desc}</p>
    </Card>
  );
}
