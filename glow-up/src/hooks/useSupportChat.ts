import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: "retailer" | "admin";
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface SupportConversation {
  id: string;
  retailer_user_id: string;
  last_message_at: string | null;
  created_at: string;
}

export function useSupportChat() {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch or create conversation for the current retailer
  const fetchOrCreateConversation = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: existing } = await supabase
      .from("support_conversations")
      .select("*")
      .eq("retailer_user_id", user.id)
      .maybeSingle();

    if (existing) {
      setConversation(existing as SupportConversation);
    } else {
      const { data: created } = await supabase
        .from("support_conversations")
        .insert({ retailer_user_id: user.id })
        .select()
        .single();

      if (created) setConversation(created as SupportConversation);
    }
    setLoading(false);
  }, [user]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!conversation) return;

    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    setMessages((data || []) as SupportMessage[]);
  }, [conversation]);

  // Mark messages as read
  const markAsRead = useCallback(async (senderType: "retailer" | "admin") => {
    if (!conversation) return;
    // Mark messages from the OTHER party as read
    const otherType = senderType === "retailer" ? "admin" : "retailer";
    await supabase
      .from("support_messages")
      .update({ is_read: true })
      .eq("conversation_id", conversation.id)
      .eq("sender_type", otherType)
      .eq("is_read", false);
  }, [conversation]);

  // Send message
  const sendMessage = useCallback(async (content: string, senderType: "retailer" | "admin") => {
    if (!conversation || !user || !content.trim()) return;
    setSending(true);

    const { error } = await supabase
      .from("support_messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        sender_type: senderType,
        content: content.trim(),
      });

    if (!error) {
      await supabase
        .from("support_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversation.id);

      // Trigger notification
      try {
        await supabase.functions.invoke("support-chat-notification", {
          body: {
            conversation_id: conversation.id,
            content: content.trim(),
            sender_type: senderType,
          },
        });
      } catch (e) {
        console.error("Support notification error:", e);
      }
    }

    setSending(false);
  }, [conversation, user]);

  // Init
  useEffect(() => {
    fetchOrCreateConversation();
  }, [fetchOrCreateConversation]);

  // Fetch messages when conversation ready
  useEffect(() => {
    if (conversation) fetchMessages();
  }, [conversation, fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!conversation) return;

    const channel = supabase
      .channel(`support-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [conversation, fetchMessages]);

  return {
    conversation,
    messages,
    loading,
    sending,
    sendMessage,
    markAsRead,
    fetchMessages,
  };
}

// Hook for admin: fetch ALL support conversations
export function useAdminSupportChats() {
  const [conversations, setConversations] = useState<(SupportConversation & { salon_name?: string; display_name?: string; unread_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    setLoading(true);

    const { data: convos } = await supabase
      .from("support_conversations")
      .select("*")
      .order("last_message_at", { ascending: false });

    if (!convos || convos.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Fetch profiles for names
    const userIds = convos.map(c => c.retailer_user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, salon_name, display_name")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    // Fetch unread counts
    const { data: unreadMessages } = await supabase
      .from("support_messages")
      .select("conversation_id")
      .eq("sender_type", "retailer")
      .eq("is_read", false);

    const unreadMap = new Map<string, number>();
    (unreadMessages || []).forEach(m => {
      unreadMap.set(m.conversation_id, (unreadMap.get(m.conversation_id) || 0) + 1);
    });

    const mapped = (convos as SupportConversation[]).map(c => ({
      ...c,
      salon_name: profileMap.get(c.retailer_user_id)?.salon_name || undefined,
      display_name: profileMap.get(c.retailer_user_id)?.display_name || undefined,
      unread_count: unreadMap.get(c.id) || 0,
    }));

    setConversations(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime on support_messages to refresh
  useEffect(() => {
    const channel = supabase
      .channel("admin-support-all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_messages" },
        () => fetchConversations()
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [fetchConversations]);

  return { conversations, loading, refetch: fetchConversations };
}

// Hook for admin: fetch messages of a specific conversation
export function useAdminSupportMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setMessages((data || []) as SupportMessage[]);
  }, [conversationId]);

  const markAsRead = useCallback(async () => {
    if (!conversationId) return;
    await supabase
      .from("support_messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .eq("sender_type", "retailer")
      .eq("is_read", false);
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId || !user || !content.trim()) return;
    setSending(true);

    await supabase
      .from("support_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_type: "admin",
        content: content.trim(),
      });

    await supabase
      .from("support_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    try {
      await supabase.functions.invoke("support-chat-notification", {
        body: {
          conversation_id: conversationId,
          content: content.trim(),
          sender_type: "admin",
        },
      });
    } catch (e) {
      console.error("Support notification error:", e);
    }

    setSending(false);
  }, [conversationId, user]);

  useEffect(() => {
    fetchMessages();
    if (conversationId) markAsRead();
  }, [fetchMessages, conversationId, markAsRead]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`admin-support-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          fetchMessages();
          markAsRead();
        }
      )
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [conversationId, fetchMessages, markAsRead]);

  return { messages, sending, sendMessage, markAsRead };
}
