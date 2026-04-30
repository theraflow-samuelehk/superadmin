import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useChatMessages } from "@/hooks/useChat";
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { useRef } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { it } from "date-fns/locale";

interface Props {
  salonUserId: string;
  clientId: string;
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

export default function PortalChat({ salonUserId, clientId }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversation = useQuery({
    queryKey: ["portal-chat-conversation", clientId, salonUserId],
    enabled: !!clientId && !!salonUserId,
    queryFn: async () => {
      const { data: existing } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("user_id", salonUserId)
        .eq("client_id", clientId)
        .maybeSingle();
      if (existing) return existing;
      return null;
    },
  });

  const conversationId = conversation.data?.id || null;
  const { messages, sendMessage } = useChatMessages(conversationId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data]);

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

  if (!conversationId) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">{t("chat.contactCenter")}</h2>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <MessageCircle className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm mb-4">{t("chat.noMessages")}</p>
          <StartChatButton
            salonUserId={salonUserId}
            clientId={clientId}
            onCreated={() => {
              qc.invalidateQueries({ queryKey: ["portal-chat-conversation"] });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <h2 className="text-xl font-bold text-foreground py-3 shrink-0">{t("chat.contactCenter")}</h2>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-lg border border-border">
        <div className="flex-1 min-h-0 overflow-y-auto wa-chat-bg px-3 py-2">
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
        <ChatInput
          conversationId={conversationId}
          senderType="client"
          onSend={(msg) => sendMessage.mutate(msg)}
          sending={sendMessage.isPending}
        />
      </div>
    </div>
  );
}

function StartChatButton({ salonUserId, clientId, onCreated }: { salonUserId: string; clientId: string; onCreated: () => void }) {
  const { t } = useTranslation();
  const [creating, setCreating] = useState(false);

  const handleStart = async () => {
    setCreating(true);
    try {
      const { error } = await supabase
        .from("chat_conversations")
        .insert({ user_id: salonUserId, client_id: clientId });
      if (error) throw error;
      onCreated();
    } catch (err) {
      console.error("Failed to start chat", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <button
      onClick={handleStart}
      disabled={creating}
      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
    >
      {creating ? t("common.loading") : t("chat.contactCenter")}
    </button>
  );
}
