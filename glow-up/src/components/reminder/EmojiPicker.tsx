import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

const EMOJI_CATEGORIES = [
  {
    label: "Salone & Appuntamenti",
    emojis: ["✅", "📅", "⏱", "👤", "💆‍♂️", "💆‍♀️", "💇‍♂️", "💇‍♀️", "💅", "👉", "⚠️", "📞", "🔔", "⚡", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕"],
  },
  {
    label: "Frecce & Indicatori",
    emojis: ["➡️", "⬅️", "⬆️", "⬇️", "↗️", "↘️", "🔗", "📌", "📍", "🎯", "🔹", "🔸", "▶️", "◀️", "⭐", "🌟", "💡", "🔥", "❗", "❓"],
  },
  {
    label: "Conferme & Stato",
    emojis: ["✅", "❌", "✔️", "❎", "⭕", "🟢", "🔴", "🟡", "🟠", "🔵", "⬜", "⬛", "🟩", "🟥", "💚", "❤️", "💛", "🧡", "💙", "🤍"],
  },
  {
    label: "Comunicazione",
    emojis: ["💬", "📩", "📧", "✉️", "📱", "☎️", "🗓️", "📋", "📝", "✍️", "🤝", "👋", "🙏", "😊", "😃", "🎉", "🎊", "🥳", "💐", "🌸"],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const allEmojis = EMOJI_CATEGORIES.flatMap(c => c.emojis);
  // Deduplicate
  const unique = [...new Set(allEmojis)];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="px-2 py-0.5 text-xs rounded hover:bg-accent transition-colors"
          title="Inserisci emoji"
        >
          <Smile className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start" side="bottom">
        <Input
          placeholder="Cerca emoji..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-7 text-xs mb-2"
        />
        <div className="max-h-48 overflow-y-auto space-y-2">
          {EMOJI_CATEGORIES.map(cat => {
            const filtered = search
              ? cat.emojis.filter(() => cat.label.toLowerCase().includes(search.toLowerCase()))
              : cat.emojis;
            if (filtered.length === 0) return null;
            return (
              <div key={cat.label}>
                <p className="text-[10px] text-muted-foreground font-medium mb-1">{cat.label}</p>
                <div className="grid grid-cols-10 gap-0.5">
                  {filtered.map((emoji, i) => (
                    <button
                      key={`${emoji}-${i}`}
                      type="button"
                      className="w-6 h-6 flex items-center justify-center text-base rounded hover:bg-accent transition-colors"
                      onClick={() => {
                        onSelect(emoji);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
