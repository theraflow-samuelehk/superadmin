import { motion, AnimatePresence } from "framer-motion";
import { Eye, X } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import type { User, Workspace } from "../../lib/mock";

export function ImpersonationBanner({
  user,
  workspace,
  onExit,
}: {
  user: User | null;
  workspace: Workspace | null;
  onExit: () => void;
}) {
  return (
    <AnimatePresence>
      {user && workspace && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-accent text-paper-50 hairline-b border-accent-deep relative z-50 shadow-accent"
        >
          <div className="px-6 py-2.5 flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] font-semibold">
              <Eye size={12} />
              <span>Viewing As</span>
            </div>

            <div className="flex items-center gap-2">
              <Avatar name={user.name} color="#fbf9f4" size="xs" />
              <div className="text-[13px] font-medium">{user.name}</div>
              <div className="text-[11px] text-paper-50/70">
                · {workspace.name}
              </div>
            </div>

            <div className="flex-1" />

            <div className="hidden md:flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.14em] text-paper-50/60">
              <span>Session 0042 · Read only</span>
            </div>

            <button
              onClick={onExit}
              className="flex items-center gap-1.5 bg-paper-50 text-accent px-2.5 py-1 rounded-sm text-[11px] font-medium uppercase tracking-[0.1em] hover:bg-white transition-colors"
            >
              <X size={11} /> Esci
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
