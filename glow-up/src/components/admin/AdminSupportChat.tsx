import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocalization } from "@/hooks/useLocalization";
import { useAuth } from "@/hooks/useAuth";
import { useAdminSupportChats, useAdminSupportMessages } from "@/hooks/useSupportChat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Headset, Send, ArrowLeft, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminSupportChat() {
  const { t } = useTranslation();
  const { formatTime, formatDate } = useLocalization();
  const { user } = useAuth();
  const { conversations, loading } = useAdminSupportChats();
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const { messages, sending, sendMessage } = useAdminSupportMessages(selectedConvoId);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
  };

  const selectedConvo = conversations.find(c => c.id === selectedConvoId);

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

  if (selectedConvoId) {
    return (
      <Card className="shadow-card border-border/50 overflow-hidden flex flex-col h-[500px]">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedConvoId(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Headset className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{selectedConvo?.salon_name || selectedConvo?.display_name || "Centro"}</p>
            <p className="text-xs text-muted-foreground">{t("support.title")}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4 wa-chat-bg">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 text-sm">{t("support.noMessages")}</div>
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
        <div className="flex items-center gap-2 p-2 border-t bg-card shrink-0">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={t("support.placeholder")}
            className="flex-1 rounded-full bg-muted px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button
            size="icon"
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            onClick={handleSend}
            disabled={sending || !text.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <Headset className="h-5 w-5 text-primary" /> {t("support.adminTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-muted-foreground py-8 animate-pulse">{t("common.loading")}</div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Headset className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t("support.noConversations")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {conversations.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedConvoId(c.id)}
                className="w-full flex items-center gap-3 py-3 px-2 hover:bg-muted/50 rounded-lg transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                   <Headset className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{c.salon_name || c.display_name || "Centro"}</p>
                    {c.last_message_at && (
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        {formatTime(c.last_message_at)}
                      </span>
                    )}
                  </div>
                </div>
                {(c.unread_count || 0) > 0 && (
                  <Badge className="h-5 min-w-[20px] flex items-center justify-center rounded-full text-[10px] shrink-0">
                    {c.unread_count}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
