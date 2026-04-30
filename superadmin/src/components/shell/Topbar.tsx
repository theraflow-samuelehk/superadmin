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
    <div className="hairline-b bg-ink-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3 flex items-center gap-6">
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md hairline rounded-sm bg-ink-900 px-3 py-1.5 hover:border-ink-500 transition-colors">
        <Search size={13} className="text-ink-400" />
        <input
          placeholder="Cerca workspace, progetti, utenti…"
          className="flex-1 bg-transparent outline-none text-xs font-mono placeholder:text-ink-500 text-ink-100"
        />
        <kbd className="text-[9px] font-mono text-ink-400 hairline rounded-sm px-1.5 py-0.5 flex items-center gap-1">
          <Command size={10} /> K
        </kbd>
      </div>

      <div className="flex-1" />

      {/* Live status */}
      <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.14em] text-ink-400">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-acid animate-blink"></span>
          <span>UPTIME 99.98%</span>
        </div>
        <div className="w-px h-3 bg-ink-700"></div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-good rounded-full"></span>
          <span>{time}</span>
          <span className="text-ink-500">UTC+1</span>
        </div>
      </div>

      {/* Notifications */}
      <button className="relative w-8 h-8 hairline rounded-sm flex items-center justify-center hover:border-acid/40 hover:bg-ink-900 transition-colors group">
        <Bell size={13} className="text-ink-300 group-hover:text-ink-100" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-acid rounded-full"></span>
      </button>

      {/* Profile */}
      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <div className="text-xs font-medium text-ink-100">{me.name.split(" ")[0]}</div>
          <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-acid">
            Super Admin
          </div>
        </div>
        <Avatar name={me.name} color={me.avatarColor} size="sm" />
      </div>
    </div>
  );
}
