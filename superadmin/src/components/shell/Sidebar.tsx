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
    <aside className="w-[244px] shrink-0 hairline-r bg-paper-50 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5 hairline-b">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-accent flex items-center justify-center rounded-md shadow-accent">
            <span
              className="font-display text-paper-50 text-lg leading-none"
              style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
            >
              w
            </span>
          </div>
          <div className="leading-tight">
            <div
              className="font-display text-base text-ink-900 tracking-ultra-tight font-medium"
              style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 50" }}
            >
              workspace
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-accent font-medium mt-px">
              Atelier
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        <NavGroup label="Intelligence" items={groups.intel} />
        <NavGroup label="Operations" items={groups.ops} className="mt-7" />
        <NavGroup label="System" items={groups.system} className="mt-7" />
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 hairline-t">
        <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] uppercase tracking-[0.14em]">
          <span className="w-1.5 h-1.5 bg-sage rounded-full animate-pulse" />
          <span className="text-ink-200">Tutti i sistemi</span>
          <span className="text-sage ml-auto font-medium">OK</span>
        </div>
        <div className="px-2 mt-1 text-[9px] font-mono text-ink-50 uppercase tracking-[0.18em]">
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
      <div className="px-2 mb-2 text-[9px] uppercase tracking-[0.22em] text-ink-100 font-semibold">
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
                    "group relative flex items-center gap-3 px-2.5 py-2 text-[13px] rounded-md transition-all",
                    isActive
                      ? "bg-white text-accent shadow-soft"
                      : "text-ink-200 hover:bg-white/60 hover:text-ink-400"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-accent rounded-full" />
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
