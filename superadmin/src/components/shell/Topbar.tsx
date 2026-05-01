import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Command, Menu, LogOut, User as UserIcon } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { BrandMark } from "../ui/Brand";
import { users } from "../../lib/mock";
import { useMobileNav } from "./MobileNav";
import { useCommandPalette } from "./CommandPalette";
import { useNotifications } from "../ui/NotificationsPanel";
import { t } from "../../lib/i18n";
import { useAuth } from "../../lib/auth";

export function Topbar() {
  const navigate = useNavigate();
  const { profile, configured, signOut } = useAuth();
  // Se loggato uso il profilo, altrimenti fallback al primo user dei mock (modalità demo)
  const displayName = profile?.name ?? users[0].name;
  const displayEmail = profile?.email ?? users[0].email;
  const avatarColor = profile?.avatar_color ?? users[0].avatarColor;

  const { toggle } = useMobileNav();
  const { setOpen: openCmd } = useCommandPalette();
  const { toggle: toggleNotif } = useNotifications();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl border-b border-slate-200/70 sticky top-0 z-30 px-4 md:px-6 py-3 flex items-center gap-3">
      {/* Mobile burger */}
      <button
        onClick={toggle}
        className="lg:hidden w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:border-cyan-300 hover:bg-cyan-50/50 transition-all text-slate-600"
        aria-label="Apri menu"
      >
        <Menu size={16} />
      </button>

      {/* Mobile brand */}
      <div className="lg:hidden flex items-center gap-2.5">
        <BrandMark size={32} />
        <span className="heading-md text-slate-900" style={{ fontSize: "15px" }}>
          TheraFlow
        </span>
      </div>

      {/* Search (desktop only) — apre command palette */}
      <button
        onClick={() => openCmd(true)}
        className="hidden md:flex items-center gap-2.5 flex-1 max-w-md bg-slate-100/70 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-soft rounded-xl px-3.5 py-2 transition-all text-left"
      >
        <Search size={14} className="text-slate-400" />
        <span className="flex-1 text-[13px] text-slate-400">
          {t("topbar.search_placeholder")}
        </span>
        <kbd className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 flex items-center gap-1">
          <Command size={10} /> K
        </kbd>
      </button>

      {/* Mobile search button */}
      <button
        onClick={() => openCmd(true)}
        className="md:hidden ml-auto w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:border-cyan-300 transition-all"
      >
        <Search size={15} />
      </button>

      <div className="hidden md:block flex-1" />

      {/* Notifications */}
      <button
        data-bell-button
        onClick={toggleNotif}
        className="relative w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:border-cyan-300 hover:bg-cyan-50 transition-all group"
      >
        <Bell size={14} className="text-slate-500 group-hover:text-cyan-600" />
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white animate-pulse"
          style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)" }}
        />
      </button>

      {/* Profile menu */}
      <div ref={menuRef} className="relative flex items-center gap-3 pl-3 border-l border-slate-200">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-3 group"
        >
          <div className="hidden sm:block text-right leading-tight">
            <div className="text-[13px] font-semibold text-slate-900">{displayName.split(" ")[0]}</div>
            <div className="text-[10px] uppercase tracking-wider gradient-text font-bold">
              {t("topbar.role_superadmin")}
            </div>
          </div>
          <Avatar name={displayName} color={avatarColor} size="md" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl border border-slate-200 shadow-lift z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="text-[13px] font-semibold text-slate-900 truncate">{displayName}</div>
              <div className="text-[11.5px] text-slate-500 truncate font-mono">{displayEmail}</div>
            </div>
            <div className="py-1">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/settings");
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <UserIcon size={13} className="text-slate-400" /> Profilo &amp; impostazioni
              </button>
              {configured ? (
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut size={13} /> Disconnetti
                </button>
              ) : (
                <div className="px-4 py-2.5 text-[11.5px] text-slate-400 italic leading-snug">
                  Modalità demo — login reale dopo aver configurato Supabase
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
