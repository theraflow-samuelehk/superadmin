import { useEffect, useRef } from "react";
import { create } from "zustand";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  UserPlus,
  AlertCircle,
  Wallet,
  Globe,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { activity, getWorkspace } from "../../lib/mock";
import { relativeTime } from "../../lib/utils";

interface NotificationsState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useNotifications = create<NotificationsState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));

const typeStyles: Record<string, { icon: React.ReactNode; bg: string }> = {
  deploy: { icon: <Rocket size={13} />, bg: "bg-violet-100 text-violet-600" },
  invite: { icon: <UserPlus size={13} />, bg: "bg-emerald-100 text-emerald-600" },
  domain: { icon: <Globe size={13} />, bg: "bg-sky-100 text-sky-600" },
  billing: { icon: <Wallet size={13} />, bg: "bg-amber-100 text-amber-600" },
  alert: { icon: <AlertCircle size={13} />, bg: "bg-rose-100 text-rose-600" },
  create: { icon: <Sparkles size={13} />, bg: "bg-fuchsia-100 text-fuchsia-600" },
};

export function NotificationsPanel() {
  const { open, setOpen } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if click is on bell button (it'd reopen immediately)
      if (target.closest("[data-bell-button]")) return;
      if (panelRef.current && !panelRef.current.contains(target)) {
        setOpen(false);
      }
    };
    setTimeout(() => document.addEventListener("click", onClick), 0);
    return () => document.removeEventListener("click", onClick);
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-[60px] right-4 md:right-6 z-[70] w-[360px] max-w-[calc(100vw-32px)] card-3d overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
              style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6, #6366f1)" }}
            >
              <Sparkles size={14} />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-slate-900">Notifiche</div>
              <div className="text-[11px] text-slate-500">{activity.length} eventi recenti</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
            {activity.slice(0, 8).map((evt, i) => {
              const ws = getWorkspace(evt.workspaceId);
              const s = typeStyles[evt.type] || typeStyles.create;
              return (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "px-4 py-3 flex items-start gap-3 hover:bg-slate-50/70 transition-colors cursor-pointer relative",
                    i === 0 && "bg-cyan-50/30"
                  )}
                >
                  {/* Unread dot */}
                  {i < 3 && (
                    <span
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                      style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)" }}
                    />
                  )}
                  <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", s.bg)}>
                    {s.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-slate-800 leading-snug">
                      {evt.message}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                      <span className="font-medium text-slate-500 truncate max-w-[120px]">
                        {ws?.name || evt.actor}
                      </span>
                      <span>·</span>
                      <span>{relativeTime(evt.timestamp)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
            <button className="text-[12px] text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1.5">
              <Check size={12} /> Segna tutte come lette
            </button>
            <button className="text-[12px] text-cyan-600 hover:text-cyan-700 font-bold">
              Vedi tutto →
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
