import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  conversationId: string;
  senderType: "salon" | "client";
  onSend: (msg: {
    conversation_id: string;
    content?: string;
    message_type: "text" | "image" | "audio" | "file";
    file_url?: string;
    file_name?: string;
    sender_type: "salon" | "client";
  }) => void;
  sending?: boolean;
}

export function ChatInput({ conversationId, senderType, onSend, sending }: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState("");

  const handleSendText = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend({ conversation_id: conversationId, content: trimmed, message_type: "text", sender_type: senderType });
    setText("");
  };

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-card border-t mb-0 shrink-0">
      <div className="flex-1 relative">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("chat.placeholder")}
          className="w-full rounded-full bg-muted px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendText(); } }}
        />
      </div>
      <Button
        size="icon"
        className="h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 disabled:opacity-100"
        onClick={handleSendText}
        disabled={sending}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
