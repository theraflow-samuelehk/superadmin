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
          className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white relative z-50 shadow-lg"
        >
          <div className="px-6 py-3 flex items-center gap-4">
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider">
              <Eye size={14} />
              <span>Viewing As</span>
            </div>

            <div className="flex items-center gap-2.5">
              <Avatar name={user.name} color={user.avatarColor} size="xs" className="ring-2 ring-white/40" />
              <div className="text-[13.5px] font-semibold">{user.name}</div>
              <div className="text-[12px] text-white/75">· {workspace.name}</div>
            </div>

            <div className="flex-1" />

            <div className="hidden md:flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-white/70">
              <span>Session 0042 · Read only</span>
            </div>

            <button
              onClick={onExit}
              className="flex items-center gap-1.5 bg-white text-blue-700 px-3 py-1.5 rounded-lg text-[12px] font-semibold uppercase tracking-wide hover:bg-cyan-50 hover:scale-[1.02] transition-all shadow-sm"
            >
              <X size={12} /> Esci
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
