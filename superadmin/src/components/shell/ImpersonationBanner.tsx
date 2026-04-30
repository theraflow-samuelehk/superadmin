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
          className="bg-acid text-ink-950 hairline-b border-acid-deep relative z-50"
        >
          <div className="px-6 py-2.5 flex items-center gap-4">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
              <Eye size={12} />
              <span className="font-bold">VIEWING AS</span>
            </div>

            <div className="flex items-center gap-2">
              <Avatar name={user.name} color="#050505" size="xs" />
              <div className="text-xs font-semibold tracking-tight">
                {user.name}
              </div>
              <div className="font-mono text-[10px] tracking-tight opacity-70">
                · {workspace.name}
              </div>
            </div>

            <div className="flex-1" />

            <div className="hidden md:flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.14em] opacity-70">
              <span>SESSION 0042 · READ ONLY</span>
            </div>

            <button
              onClick={onExit}
              className="flex items-center gap-1.5 bg-ink-950 text-acid px-2.5 py-1 rounded-sm text-[10px] font-mono uppercase tracking-[0.14em] hover:bg-ink-900 transition-colors"
            >
              <X size={11} /> Esci
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
