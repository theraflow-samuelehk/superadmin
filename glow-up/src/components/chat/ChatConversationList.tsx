import { ChatConversation } from "@/hooks/useChat";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useLocalization } from "@/hooks/useLocalization";
import { Mic, Image as ImageIcon, FileText } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { it } from "date-fns/locale";

interface Props {
  conversations: ChatConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

function formatLastDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Ieri";
  return format(d, "dd/MM/yy", { locale: it });
}

function LastMessagePreview({ message, type }: { message: string | null | undefined; type?: string }) {
  if (!message && !type) return null;
  
  // If type is audio/image/file, show icon
  if (type === "audio" || message === "audio") {
    return <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mic className="h-3 w-3" /> Messaggio vocale</span>;
  }
  if (type === "image" || message === "image") {
    return <span className="flex items-center gap-1 text-xs text-muted-foreground"><ImageIcon className="h-3 w-3" /> Foto</span>;
  }
  if (type === "file" || message === "file") {
    return <span className="flex items-center gap-1 text-xs text-muted-foreground"><FileText className="h-3 w-3" /> File</span>;
  }

  return <span className="text-xs text-muted-foreground truncate">{message}</span>;
}

export function ChatConversationList({ conversations, selectedId, onSelect, loading }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    const name = `${c.client?.first_name || ""} ${c.client?.last_name || ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-3">
        <Input
          placeholder={t("chat.searchConversation")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-full bg-muted border-0 px-4"
        />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{t("chat.noConversations")}</p>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-3 border-b border-border/50",
                selectedId === c.id && "bg-muted"
              )}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {(c.client?.first_name?.[0] || "").toUpperCase()}
                {(c.client?.last_name?.[0] || "").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm truncate">
                    {c.client?.first_name} {c.client?.last_name}
                  </span>
                  <span className={cn("text-[11px] shrink-0 ml-2", c.unread_count! > 0 ? "text-primary font-semibold" : "text-muted-foreground")}>
                    {formatLastDate(c.last_message_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <div className="flex-1 min-w-0">
                    <LastMessagePreview message={c.last_message} />
                  </div>
                  {c.unread_count! > 0 && (
                    <Badge className="ml-2 h-5 min-w-5 text-[11px] px-1.5 rounded-full bg-primary text-primary-foreground border-0">
                      {c.unread_count}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
