import { useEffect, useRef, useMemo, useState } from "react";
import { useChatMessages, ChatConversation } from "@/hooks/useChat";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatInput } from "./ChatInput";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isToday, isYesterday } from "date-fns";
import { it } from "date-fns/locale";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Props {
  conversation: ChatConversation;
  senderType: "salon" | "client";
  onBack?: () => void;
  onDelete?: (id: string) => void;
}

function DateSeparator({ date }: { date: string }) {
  const { t } = useTranslation();
  const d = new Date(date);
  let label: string;
  if (isToday(d)) label = t("chat.today");
  else if (isYesterday(d)) label = t("chat.yesterday");
  else label = format(d, "d MMMM yyyy", { locale: it });

  return (
    <div className="flex justify-center my-3">
      <span className="text-[11px] bg-muted/80 text-muted-foreground px-3 py-1 rounded-md shadow-sm uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

export function ChatWindow({ conversation, senderType, onBack, onDelete }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { messages, sendMessage } = useChatMessages(conversation.id);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    if (!messages.data) return [];
    const groups: { date: string; msgs: typeof messages.data }[] = [];
    let currentDate = "";
    for (const msg of messages.data) {
      const date = new Date(msg.created_at).toDateString();
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date: msg.created_at, msgs: [msg] });
      } else {
        groups[groups.length - 1].msgs.push(msg);
      }
    }
    return groups;
  }, [messages.data]);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-card border-b shadow-sm z-10 shrink-0">
        {onBack && (
          <Button size="icon" variant="ghost" onClick={onBack} className="shrink-0 h-8 w-8">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
          {(conversation.client?.first_name?.[0] || "").toUpperCase()}
          {(conversation.client?.last_name?.[0] || "").toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">
            {conversation.client?.first_name} {conversation.client?.last_name}
          </p>
        </div>
        {onDelete && senderType === "salon" && (
          <Button size="icon" variant="ghost" className="shrink-0 h-8 w-8 text-destructive hover:text-destructive" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages area with WhatsApp-style background */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain wa-chat-bg px-3 py-2">
        {messages.data?.length === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-8">{t("chat.noMessages")}</p>
        )}
        {groupedMessages.map((group, gi) => (
          <div key={gi}>
            <DateSeparator date={group.date} />
            {group.msgs.map((msg) => (
              <ChatMessageBubble key={msg.id} message={msg} isMine={msg.sender_id === user?.id} />
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        conversationId={conversation.id}
        senderType={senderType}
        onSend={(msg) => sendMessage.mutate(msg)}
        sending={sendMessage.isPending}
      />
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t("chat.deleteChat")}
        description={t("chat.deleteChatConfirm")}
        onConfirm={() => {
          onDelete?.(conversation.id);
          setShowDeleteConfirm(false);
        }}
      />
    </div>
  );
}
