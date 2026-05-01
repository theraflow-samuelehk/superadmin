import { NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { cn } from "../../lib/utils";
import { t } from "../../lib/i18n";
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
  ChevronRight,
  X,
} from "lucide-react";
import { useMobileNav } from "./MobileNav";
import { BrandLockup } from "../ui/Brand";

const items = [
  { to: "/",          label: () => t("nav.overview"),   icon: LayoutDashboard, group: "intel",  color: "cyan" },
  { to: "/workspaces",label: () => t("nav.workspaces"), icon: Building2,       group: "intel",  color: "blue" },
  { to: "/projects",  label: () => t("nav.projects"),   icon: FolderKanban,    group: "intel",  color: "indigo" },
  { to: "/users",     label: () => t("nav.users"),      icon: Users,           group: "intel",  color: "emerald" },
  { to: "/domains",   label: () => t("nav.domains"),    icon: Globe,           group: "ops",    color: "sky" },
  { to: "/billing",   label: () => t("nav.billing"),    icon: CreditCard,      group: "ops",    color: "violet" },
  { to: "/activity",  label: () => t("nav.activity"),   icon: Activity,        group: "ops",    color: "amber" },
  { to: "/settings",  label: () => t("nav.settings"),   icon: Settings,        group: "system", color: "slate" },
];

const colorMap: Record<string, { active: string; bg: string; ring: string }> = {
  cyan:    { active: "text-cyan-300",    bg: "bg-cyan-500/15",    ring: "ring-cyan-400/30" },
  blue:    { active: "text-blue-300",    bg: "bg-blue-500/15",    ring: "ring-blue-400/30" },
  indigo:  { active: "text-indigo-300",  bg: "bg-indigo-500/15",  ring: "ring-indigo-400/30" },
  sky:     { active: "text-sky-300",     bg: "bg-sky-500/15",     ring: "ring-sky-400/30" },
  emerald: { active: "text-emerald-300", bg: "bg-emerald-500/15", ring: "ring-emerald-400/30" },
  violet:  { active: "text-violet-300",  bg: "bg-violet-500/15",  ring: "ring-violet-400/30" },
  amber:   { active: "text-amber-300",   bg: "bg-amber-500/15",   ring: "ring-amber-400/30" },
  slate:   { active: "text-slate-300",   bg: "bg-slate-500/15",   ring: "ring-slate-400/30" },
};

export function Sidebar() {
  const { open, setOpen } = useMobileNav();
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname, setOpen]);

  const groups = {
    intel:  items.filter((i) => i.group === "intel"),
    ops:    items.filter((i) => i.group === "ops"),
    system: items.filter((i) => i.group === "system"),
  };

  return (
    <>
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "w-[260px] shrink-0 flex flex-col overflow-hidden z-50",
          "lg:sticky lg:top-0 lg:self-start lg:h-screen",
          "max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:bottom-0 max-lg:transition-transform max-lg:duration-300 max-lg:ease-out",
          !open && "max-lg:-translate-x-full"
        )}
        style={{ background: "linear-gradient(180deg, #0b0a1f 0%, #0f0e22 50%, #0a0a1a 100%)" }}
      >
        {/* Glow decorations */}
        <div className="absolute -top-32 -right-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.28), transparent 70%)", filter: "blur(48px)" }} />
        <div className="absolute bottom-0 -left-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.22), transparent 70%)", filter: "blur(48px)" }} />
        <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-cyan-400/30 via-blue-500/20 to-transparent" />

        {/* Brand + mobile close */}
        <div className="relative px-5 py-5 border-b border-white/[0.06] flex items-center justify-between">
          <BrandLockup variant="dark" size="md" online />
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/70 flex items-center justify-center hover:bg-white/10"
          >
            <X size={14} />
          </button>
        </div>

        {/* Search hint */}
        <div className="relative px-4 pt-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[12px] text-slate-400 hover:bg-white/[0.06] transition-colors cursor-pointer">
            <span className="text-slate-500">⌘</span>
            <span>{t("nav.quick_find")}</span>
            <span className="ml-auto text-[10px] font-mono text-slate-500 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">K</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
          <NavGroup label={t("nav.groups.intelligence")} items={groups.intel} />
          <NavGroup label={t("nav.groups.operations")}   items={groups.ops}   className="mt-6" />
          <NavGroup label={t("nav.groups.system")}       items={groups.system} className="mt-6" />
        </nav>

        {/* Pro Tip */}
        <div className="relative px-3 pb-3">
          <div
            className="relative rounded-2xl p-4 overflow-hidden border border-white/[0.06]"
            style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.22) 0%, rgba(59,130,246,0.18) 50%, rgba(99,102,241,0.14) 100%)" }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={12} className="text-cyan-300" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200">
                {t("sidebar.pro_tip_label")}
              </span>
            </div>
            <p className="text-[12px] text-white/80 leading-relaxed mb-3">
              {t("sidebar.pro_tip_text")}
            </p>
            <button className="text-[11px] font-bold text-white/95 hover:text-white flex items-center gap-1 group">
              {t("sidebar.pro_tip_cta")}
              <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* Footer status */}
        <div className="relative px-5 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 text-[11px] font-medium">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-slate-300">{t("nav.all_systems")}</span>
            <span className="ml-auto text-emerald-300 font-bold">99.98%</span>
          </div>
        </div>
      </aside>
    </>
  );
}

type NavItem = { to: string; label: () => string; icon: React.ElementType; group: string; color: string };
function NavGroup({ label, items, className }: { label: string; items: NavItem[]; className?: string }) {
  return (
    <div className={className}>
      <div className="px-3 mb-2 text-[9px] uppercase tracking-[0.22em] text-slate-500 font-bold">
        {label}
      </div>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const c = colorMap[item.color];
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-3 px-3 py-2 text-[13.5px] rounded-xl transition-all",
                    isActive ? "bg-white/[0.06] text-white" : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                      isActive ? cn(c.bg, "ring-1", c.ring, c.active) : "text-slate-500 group-hover:text-slate-300"
                    )}>
                      <Icon size={14} strokeWidth={2} />
                    </span>
                    <span className="font-medium tracking-tight">{item.label()}</span>
                    {isActive && (
                      <span className="ml-auto w-1 h-4 rounded-full"
                        style={{ background: "linear-gradient(180deg, #06b6d4, #6366f1)" }} />
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
