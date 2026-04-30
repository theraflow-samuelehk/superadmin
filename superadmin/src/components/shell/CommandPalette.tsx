import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { create } from "zustand";
import {
  Search,
  ArrowRight,
  Building2,
  FolderKanban,
  Users as UsersIcon,
  LayoutDashboard,
  Globe,
  CreditCard,
  Activity,
  Settings,
  Sparkles,
  Eye,
  Plus,
  Command,
  CornerDownLeft,
} from "lucide-react";
import { workspaces, projects, users, getWorkspace } from "../../lib/mock";
import { cn } from "../../lib/utils";
import { Avatar, gradientFor } from "../ui/Avatar";
import { useImpersonation } from "./Layout";

interface CommandPaletteState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useCommandPalette = create<CommandPaletteState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: React.ReactNode;
  iconBg?: string;
  action: () => void;
  keywords?: string;
}

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const { enter } = useImpersonation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        useCommandPalette.getState().toggle();
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const items: CommandItem[] = useMemo(() => {
    const navItems: CommandItem[] = [
      { id: "nav-overview", label: "Overview", group: "Navigazione", icon: <LayoutDashboard size={14} />, iconBg: "bg-cyan-100 text-cyan-700", action: () => navigate("/") },
      { id: "nav-workspaces", label: "Workspaces", group: "Navigazione", icon: <Building2 size={14} />, iconBg: "bg-blue-100 text-blue-700", action: () => navigate("/workspaces") },
      { id: "nav-projects", label: "Tutti i progetti", group: "Navigazione", icon: <FolderKanban size={14} />, iconBg: "bg-indigo-100 text-indigo-700", action: () => navigate("/projects") },
      { id: "nav-users", label: "Utenti & Inviti", group: "Navigazione", icon: <UsersIcon size={14} />, iconBg: "bg-emerald-100 text-emerald-700", action: () => navigate("/users") },
      { id: "nav-domains", label: "Domini & DNS", group: "Navigazione", icon: <Globe size={14} />, iconBg: "bg-sky-100 text-sky-700", action: () => navigate("/domains") },
      { id: "nav-billing", label: "Billing", group: "Navigazione", icon: <CreditCard size={14} />, iconBg: "bg-violet-100 text-violet-700", action: () => navigate("/billing") },
      { id: "nav-activity", label: "Attività", group: "Navigazione", icon: <Activity size={14} />, iconBg: "bg-amber-100 text-amber-700", action: () => navigate("/activity") },
      { id: "nav-settings", label: "Impostazioni", group: "Navigazione", icon: <Settings size={14} />, iconBg: "bg-slate-100 text-slate-700", action: () => navigate("/settings") },
    ];

    const actions: CommandItem[] = [
      { id: "action-new-ws", label: "Crea nuovo workspace", group: "Azioni", icon: <Plus size={14} />, iconBg: "bg-gradient-to-br from-cyan-500 to-blue-500 text-white", action: () => navigate("/workspaces") },
      { id: "action-invite", label: "Invita utente per email", group: "Azioni", icon: <Sparkles size={14} />, iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white", action: () => navigate("/users") },
    ];

    const wsItems: CommandItem[] = workspaces.map((ws) => ({
      id: `ws-${ws.id}`,
      label: ws.name,
      hint: `/${ws.slug} · ${ws.plan}`,
      group: "Workspaces",
      icon: <span className="display font-black text-white text-[11px]">{ws.name[0]}</span>,
      iconBg: "",
      keywords: ws.slug + " " + ws.plan,
      action: () => navigate(`/workspaces/${ws.id}`),
    }));

    const wsViewAs: CommandItem[] = workspaces.map((ws) => {
      const owner = users.find((u) => u.id === ws.ownerId);
      return {
        id: `viewas-${ws.id}`,
        label: `View as → ${ws.name}`,
        hint: owner ? `come ${owner.name}` : undefined,
        group: "View As",
        icon: <Eye size={14} />,
        iconBg: "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white",
        keywords: ws.slug + " " + (owner?.name || ""),
        action: () => {
          if (owner) {
            enter(owner, ws);
            navigate(`/workspaces/${ws.id}`);
          }
        },
      };
    });

    const projItems: CommandItem[] = projects.map((p) => {
      const ws = getWorkspace(p.workspaceId);
      return {
        id: `proj-${p.id}`,
        label: p.name,
        hint: `${p.category} · ${ws?.name || ""}`,
        group: "Progetti",
        icon: <FolderKanban size={14} />,
        iconBg: "bg-indigo-100 text-indigo-700",
        keywords: p.category + " " + (ws?.name || "") + " " + p.subdomain,
        action: () => navigate(`/projects`),
      };
    });

    const userItems: CommandItem[] = users.map((u) => ({
      id: `user-${u.id}`,
      label: u.name,
      hint: u.email,
      group: "Utenti",
      icon: <Avatar name={u.name} color={u.avatarColor} size="xs" />,
      iconBg: "",
      keywords: u.email + " " + u.role,
      action: () => navigate("/users"),
    }));

    return [...actions, ...navItems, ...wsItems, ...wsViewAs, ...projItems, ...userItems];
  }, [navigate, enter]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i) =>
      i.label.toLowerCase().includes(q) ||
      (i.hint && i.hint.toLowerCase().includes(q)) ||
      (i.keywords && i.keywords.toLowerCase().includes(q))
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const map: Record<string, CommandItem[]> = {};
    filtered.forEach((item) => {
      if (!map[item.group]) map[item.group] = [];
      map[item.group].push(item);
    });
    return map;
  }, [filtered]);

  // Reset active when filter changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const flatList = filtered;

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(flatList.length - 1, i + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = flatList[activeIndex];
        if (item) {
          item.action();
          setOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, flatList, activeIndex, setOpen]);

  const handleSelect = (item: CommandItem) => {
    item.action();
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[80] flex items-start justify-center pt-[10vh] px-4"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-md" />

          {/* Panel */}
          <motion.div
            initial={{ y: -16, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -16, scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[640px] rounded-2xl bg-white shadow-2xl overflow-hidden"
            style={{
              boxShadow:
                "0 0 0 1px rgba(15, 23, 42, 0.06), 0 24px 64px -12px rgba(15, 23, 42, 0.4), 0 0 0 4px rgba(6, 182, 212, 0.04)",
            }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cerca workspace, progetti, utenti, azioni…"
                className="flex-1 bg-transparent outline-none text-[15px] text-slate-800 placeholder:text-slate-400"
              />
              <kbd className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto scrollbar-thin py-2">
              {filtered.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-[14px] text-slate-500 font-medium">
                    Nessun risultato
                  </div>
                  <div className="text-[12px] text-slate-400 mt-1">
                    Prova con un'altra parola
                  </div>
                </div>
              ) : (
                <>
                  {Object.entries(grouped).map(([group, list]) => (
                    <div key={group} className="px-2 pb-2">
                      <div className="px-2 py-1.5 text-[10px] uppercase tracking-[0.16em] text-slate-400 font-bold">
                        {group}
                      </div>
                      {list.map((item) => {
                        const flatIdx = flatList.indexOf(item);
                        const isActive = flatIdx === activeIndex;
                        return (
                          <button
                            key={item.id}
                            onMouseEnter={() => setActiveIndex(flatIdx)}
                            onClick={() => handleSelect(item)}
                            className={cn(
                              "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors",
                              isActive ? "bg-slate-100/80" : "hover:bg-slate-50"
                            )}
                          >
                            <span
                              className={cn(
                                "w-7 h-7 shrink-0 rounded-lg flex items-center justify-center",
                                item.iconBg
                              )}
                              style={
                                item.id.startsWith("ws-") || item.id.startsWith("viewas-")
                                  ? {
                                      backgroundImage: gradientFor(
                                        workspaces.find((w) => `ws-${w.id}` === item.id || `viewas-${w.id}` === item.id)?.id || "default"
                                      ),
                                    }
                                  : undefined
                              }
                            >
                              {item.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13.5px] font-medium text-slate-800 truncate">
                                {item.label}
                              </div>
                              {item.hint && (
                                <div className="text-[11.5px] text-slate-500 truncate">
                                  {item.hint}
                                </div>
                              )}
                            </div>
                            {isActive && (
                              <span className="text-slate-400 shrink-0">
                                <CornerDownLeft size={13} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <kbd className="font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px]">↑↓</kbd>
                <span>naviga</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px]">↵</kbd>
                <span>seleziona</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <kbd className="font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] flex items-center gap-0.5">
                  <Command size={10} /> K
                </kbd>
                <span>apri/chiudi</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
