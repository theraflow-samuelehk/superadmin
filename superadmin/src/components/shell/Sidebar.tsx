import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Users,
  Globe,
  CreditCard,
  Activity,
  Settings,
  ShieldCheck,
} from "lucide-react";

const items = [
  { to: "/", label: "Overview", icon: LayoutDashboard, group: "intel" },
  { to: "/workspaces", label: "Workspaces", icon: Building2, group: "intel" },
  { to: "/projects", label: "Tutti i progetti", icon: FolderKanban, group: "intel" },
  { to: "/users", label: "Utenti & Inviti", icon: Users, group: "intel" },

  { to: "/domains", label: "Domini & DNS", icon: Globe, group: "ops" },
  { to: "/billing", label: "Billing", icon: CreditCard, group: "ops" },
  { to: "/activity", label: "Attività", icon: Activity, group: "ops" },

  { to: "/settings", label: "Impostazioni", icon: Settings, group: "system" },
];

export function Sidebar() {
  const groups = {
    intel: items.filter((i) => i.group === "intel"),
    ops: items.filter((i) => i.group === "ops"),
    system: items.filter((i) => i.group === "system"),
  };

  return (
    <aside className="w-[232px] shrink-0 hairline-r bg-ink-950 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5 hairline-b">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-acid flex items-center justify-center rounded-sm">
            <ShieldCheck size={14} className="text-ink-950" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div
              className="font-display text-base text-ink-50 tracking-ultra-tight"
              style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
            >
              workspace
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-acid">
              Super Admin
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        <NavGroup label="Intelligence" items={groups.intel} />
        <NavGroup label="Operations" items={groups.ops} className="mt-6" />
        <NavGroup label="System" items={groups.system} className="mt-6" />
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 hairline-t">
        <div className="flex items-center gap-2 px-2 py-1.5 text-[9px] font-mono uppercase tracking-[0.18em]">
          <span className="w-1.5 h-1.5 bg-good rounded-full animate-pulse"></span>
          <span className="text-ink-300">Tutti i sistemi</span>
          <span className="text-good ml-auto">OK</span>
        </div>
        <div className="px-2 mt-1 text-[9px] font-mono text-ink-500 uppercase tracking-[0.18em]">
          v0.1.0 · build a3f4e1
        </div>
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  items,
  className,
}: {
  label: string;
  items: typeof items;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="px-2 mb-2 text-[9px] font-mono uppercase tracking-[0.22em] text-ink-500">
        {label}
      </div>
      <ul className="space-y-px">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-3 px-2.5 py-2 text-xs rounded-sm transition-all",
                    isActive
                      ? "bg-acid/10 text-acid"
                      : "text-ink-300 hover:bg-ink-800 hover:text-ink-100"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-acid"></span>
                    )}
                    <Icon size={14} strokeWidth={1.75} />
                    <span className="font-medium tracking-tight">
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
