import DashboardLayout from "@/components/DashboardLayout";
import { useTranslation } from "react-i18next";
import { useSupportChat } from "@/hooks/useSupportChat";
import { useAuth } from "@/hooks/useAuth";
import { useLocalization } from "@/hooks/useLocalization";
import { Headset, Send, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Supporto() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { formatTime } = useLocalization();
  const { conversation, messages, loading, sending, sendMessage, markAsRead } = useSupportChat();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (conversation) markAsRead("retailer");
  }, [conversation, messages, markAsRead]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text, "retailer");
    setText("");
  };

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; msgs: typeof messages }[]>((acc, msg) => {
    const date = new Date(msg.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    const last = acc[acc.length - 1];
    if (last?.date === date) {
      last.msgs.push(msg);
    } else {
      acc.push({ date, msgs: [msg] });
    }
    return acc;
  }, []);

  return (
    <DashboardLayout>
      <div className={cn("flex flex-col -m-4 sm:-m-6 -mb-20 sm:-mb-6 overflow-hidden", isMobile ? "h-[calc(100dvh-3.5rem-3.5rem)]" : "h-[calc(100vh-3.5rem)]")}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Headset className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">{t("support.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("support.subtitle")}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4 wa-chat-bg">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">{t("common.loading")}</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Headset className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("support.noMessages")}</p>
            </div>
          ) : (
            groupedMessages.map(group => (
              <div key={group.date}>
                <div className="flex justify-center my-3">
                  <span className="text-[11px] bg-muted/80 text-muted-foreground px-3 py-1 rounded-full">{group.date}</span>
                </div>
                {group.msgs.map(msg => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={cn("flex mb-1", isMine ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "relative max-w-[75%] rounded-lg px-2.5 py-1.5 shadow-sm",
                        isMine ? "wa-bubble-mine rounded-tr-none" : "wa-bubble-other rounded-tl-none"
                      )}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 -mb-0.5 mt-0.5">
                          <span className={cn("text-[10px]", isMine ? "text-[hsl(var(--wa-mine-time))]" : "text-muted-foreground")}>
                            {formatTime(msg.created_at)}
                          </span>
                          {isMine && (
                            msg.is_read
                              ? <CheckCheck className="h-3.5 w-3.5 text-primary" />
                              : <Check className="h-3.5 w-3.5 opacity-50" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-2 py-1 bg-card border-t shrink-0">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={t("support.placeholder")}
            className="flex-1 rounded-full bg-muted px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button
            size="icon"
            className="h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 disabled:opacity-100"
            onClick={handleSend}
            disabled={sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
