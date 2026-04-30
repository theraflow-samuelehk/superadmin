import { Search, Bell, Command, Plus } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { users } from "../../lib/mock";

export function Topbar() {
  const me = users[0];

  return (
    <div className="bg-white/70 backdrop-blur-xl border-b border-slate-200/70 sticky top-0 z-40 px-6 py-3 flex items-center gap-4">
      {/* Search */}
      <div className="flex items-center gap-2.5 flex-1 max-w-md bg-slate-100/70 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl px-3.5 py-2 transition-all">
        <Search size={14} className="text-slate-400" />
        <input
          placeholder="Cerca workspace, progetti, utenti…"
          className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-slate-400 text-slate-700"
        />
        <kbd className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 flex items-center gap-1">
          <Command size={10} /> K
        </kbd>
      </div>

      <div className="flex-1" />

      {/* Quick actions */}
      <button className="hidden md:flex items-center gap-2 px-3 h-9 rounded-xl bg-violet-50 text-violet-700 text-[12px] font-semibold hover:bg-violet-100 transition-colors">
        <Plus size={13} strokeWidth={2.5} /> Nuovo
      </button>

      {/* Notifications */}
      <button className="relative w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:border-violet-300 hover:bg-violet-50 transition-all group">
        <Bell size={14} className="text-slate-500 group-hover:text-violet-600" />
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white"
          style={{ background: "linear-gradient(135deg, #ec4899, #f97316)" }}
        />
      </button>

      {/* Profile */}
      <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
        <div className="text-right leading-tight">
          <div className="text-[13px] font-semibold text-slate-900">{me.name.split(" ")[0]}</div>
          <div className="text-[10px] uppercase tracking-wider gradient-text font-bold">
            Super Admin
          </div>
        </div>
        <Avatar name={me.name} color={me.avatarColor} size="md" />
      </div>
    </div>
  );
}
