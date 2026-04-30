import { create } from "zustand";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, ...t }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

const styles: Record<ToastVariant, { icon: React.ReactNode; ring: string; bg: string }> = {
  success: {
    icon: <CheckCircle2 size={18} />,
    ring: "ring-emerald-200/50",
    bg: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white",
  },
  error: {
    icon: <AlertCircle size={18} />,
    ring: "ring-rose-200/50",
    bg: "bg-gradient-to-br from-rose-500 to-orange-500 text-white",
  },
  info: {
    icon: <Info size={18} />,
    ring: "ring-cyan-200/50",
    bg: "bg-gradient-to-br from-cyan-500 to-blue-500 text-white",
  },
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2 max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const s = styles[t.variant];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "card-3d pointer-events-auto p-3.5 flex items-start gap-3 ring-1 shadow-lift max-w-sm w-[320px]",
                s.ring
              )}
            >
              <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                {s.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-semibold text-slate-900 leading-tight">
                  {t.title}
                </div>
                {t.description && (
                  <div className="text-[12px] text-slate-500 mt-0.5 leading-snug">
                    {t.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-slate-400 hover:text-slate-700 transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
