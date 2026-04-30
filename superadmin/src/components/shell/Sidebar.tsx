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
  Sparkles,
} from "lucide-react";

const items = [
  { to: "/", label: "Overview", icon: LayoutDashboard, group: "intel", color: "text-violet-500" },
  { to: "/workspaces", label: "Workspaces", icon: Building2, group: "intel", color: "text-pink-500" },
  { to: "/projects", label: "Tutti i progetti", icon: FolderKanban, group: "intel", color: "text-sky-500" },
  { to: "/users", label: "Utenti & Inviti", icon: Users, group: "intel", color: "text-emerald-500" },

  { to: "/domains", label: "Domini & DNS", icon: Globe, group: "ops", color: "text-amber-500" },
  { to: "/billing", label: "Billing", icon: CreditCard, group: "ops", color: "text-fuchsia-500" },
  { to: "/activity", label: "Attività", icon: Activity, group: "ops", color: "text-rose-500" },

  { to: "/settings", label: "Impostazioni", icon: Settings, group: "system", color: "text-slate-500" },
];

export function Sidebar() {
  const groups = {
    intel: items.filter((i) => i.group === "intel"),
    ops: items.filter((i) => i.group === "ops"),
    system: items.filter((i) => i.group === "system"),
  };

  return (
    <aside className="w-[256px] shrink-0 bg-white/70 backdrop-blur-xl border-r border-slate-200/70 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-200/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-glow"
            style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)" }}
          >
            <Sparkles size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-display text-[16px] text-slate-900 font-bold tracking-tight">
              workspace
            </div>
            <div className="text-[10px] uppercase tracking-[0.16em] gradient-text font-bold mt-px">
              Studio Hub
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        <NavGroup label="Intelligence" items={groups.intel} />
        <NavGroup label="Operations" items={groups.ops} className="mt-6" />
        <NavGroup label="System" items={groups.system} className="mt-6" />
      </nav>

      {/* Upgrade card */}
      <div className="px-3 pb-3">
        <div className="relative rounded-2xl p-4 overflow-hidden bg-gradient-to-br from-violet-50 via-pink-50 to-sky-50 border border-white">
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 0%, rgba(139, 92, 246, 0.15), transparent 60%)",
            }}
          />
          <div className="relative">
            <div className="text-[11px] font-bold gradient-text uppercase tracking-wider mb-1">
              Pro Tip
            </div>
            <p className="text-[12px] text-slate-600 leading-relaxed mb-3">
              Connetti il dominio madre Hostinger per attivare i sottodomini automatici.
            </p>
            <button className="text-[11px] font-bold text-violet-600 hover:text-violet-700">
              Configura →
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-200/70">
        <div className="flex items-center gap-2 text-[11px] font-medium">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-slate-500">Tutti i sistemi operativi</span>
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
      <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.16em] text-slate-400 font-bold">
        {label}
      </div>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-3 px-3 py-2 text-[13.5px] rounded-xl transition-all",
                    isActive
                      ? "bg-white text-slate-900 shadow-soft font-semibold"
                      : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      strokeWidth={2}
                      className={cn(
                        "transition-colors",
                        isActive ? item.color : "text-slate-400 group-hover:" + item.color
                      )}
                    />
                    <span className="tracking-tight">{item.label}</span>
                    {isActive && (
                      <span
                        className="ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
                      />
                    )}
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
