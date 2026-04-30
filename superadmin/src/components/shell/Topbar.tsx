import { useEffect, useState } from "react";
import { Search, Bell, Command } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { users } from "../../lib/mock";

export function Topbar() {
  const [time, setTime] = useState<string>("");
  const me = users[0];

  useEffect(() => {
    const update = () => {
      const d = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      setTime(
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hairline-b bg-paper-50/85 backdrop-blur-md sticky top-0 z-40 px-6 py-3 flex items-center gap-6">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md panel px-3 py-1.5 hover:border-accent/30 transition-colors">
        <Search size={13} className="text-ink-100" />
        <input
          placeholder="Cerca workspace, progetti, utenti…"
          className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-ink-100 text-ink-400"
        />
        <kbd className="text-[9px] font-mono text-ink-100 hairline rounded-sm px-1.5 py-0.5 flex items-center gap-1 bg-paper-100">
          <Command size={10} /> K
        </kbd>
      </div>

      <div className="flex-1" />

      {/* Live status */}
      <div className="hidden lg:flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-ink-100">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-accent animate-blink rounded-full" />
          <span>Uptime 99.98%</span>
        </div>
        <div className="w-px h-3 bg-paper-300" />
        <div className="flex items-center gap-1.5 font-mono">
          <span className="w-1.5 h-1.5 bg-sage rounded-full" />
          <span>{time}</span>
          <span className="text-ink-50 normal-case">UTC+1</span>
        </div>
      </div>

      {/* Notifications */}
      <button className="relative w-9 h-9 panel flex items-center justify-center hover:border-accent/30 hover:shadow-soft transition-all group">
        <Bell size={14} className="text-ink-200 group-hover:text-accent" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-lacquer rounded-full" />
      </button>

      {/* Profile */}
      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <div className="text-[13px] font-medium text-ink-500">
            {me.name.split(" ")[0]}
          </div>
          <div className="text-[9px] uppercase tracking-[0.18em] text-accent font-semibold">
            Super Admin
          </div>
        </div>
        <Avatar name={me.name} color={me.avatarColor} size="sm" />
      </div>
    </div>
  );
}
