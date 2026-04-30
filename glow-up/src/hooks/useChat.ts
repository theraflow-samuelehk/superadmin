import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenantUserId } from "@/hooks/useTenantUserId";

export interface ChatConversation {
  id: string;
  user_id: string;
  client_id: string;
  last_message_at: string | null;
  created_at: string;
  client?: { first_name: string; last_name: string };
  unread_count?: number;
  last_message?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: "salon" | "client";
  sender_id: string;
  content: string | null;
  message_type: "text" | "image" | "audio" | "file";
  file_url: string | null;
  file_name: string | null;
  is_read: boolean;
  created_at: string;
}

export function useChat() {
  const { user } = useAuth();
  const { tenantUserId } = useTenantUserId();
  const qc = useQueryClient();

  // Fetch conversations for salon owner
  const conversations = useQuery({
    queryKey: ["chat-conversations", tenantUserId],
    enabled: !!user && !!tenantUserId,
    queryFn: async () => {
      const { data: convos, error } = await supabase
        .from("chat_conversations")
        .select("*, clients(first_name, last_name)")
        .eq("user_id", tenantUserId!)
        .order("last_message_at", { ascending: false });
      if (error) throw error;

      // Get unread counts and last messages
      const enriched = await Promise.all(
        (convos || []).map(async (c: any) => {
          const { count } = await supabase
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", c.id)
            .eq("is_read", false)
            .neq("sender_id", user!.id);

          const { data: lastMsg } = await supabase
            .from("chat_messages")
            .select("content, message_type")
            .eq("conversation_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...c,
            client: c.clients,
            unread_count: count || 0,
            last_message: lastMsg?.message_type === "text"
              ? lastMsg.content
              : lastMsg?.message_type || null,
          };
        })
      );
      return enriched as ChatConversation[];
    },
  });

  const deleteConversation = useMutation({
    mutationFn: async (conversationId: string) => {
      // Delete messages first, then conversation
      const { error: msgErr } = await supabase
        .from("chat_messages")
        .delete()
        .eq("conversation_id", conversationId);
      if (msgErr) throw msgErr;
      const { error } = await supabase
        .from("chat_conversations")
        .delete()
        .eq("id", conversationId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });

  return { conversations, qc, deleteConversation };
}

export function useChatMessages(conversationId: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const messages = useQuery({
    queryKey: ["chat-messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ChatMessage[];
    },
  });

  // Mark as read
  useEffect(() => {
    if (!conversationId || !user) return;
    supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .eq("is_read", false)
      .then(() => {
        qc.invalidateQueries({ queryKey: ["chat-conversations"] });
      });
  }, [conversationId, user, messages.data]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["chat-messages", conversationId] });
          qc.invalidateQueries({ queryKey: ["chat-conversations"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, qc]);

  const sendMessage = useMutation({
    mutationFn: async (msg: {
      conversation_id: string;
      content?: string;
      message_type: "text" | "image" | "audio" | "file";
      file_url?: string;
      file_name?: string;
      sender_type: "salon" | "client";
    }) => {
      const { error } = await supabase.from("chat_messages").insert({
        conversation_id: msg.conversation_id,
        sender_id: user!.id,
        sender_type: msg.sender_type,
        content: msg.content || null,
        message_type: msg.message_type,
        file_url: msg.file_url || null,
        file_name: msg.file_name || null,
      });
      if (error) throw error;
      // Update last_message_at
      await supabase
        .from("chat_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", msg.conversation_id);
      // Send push + bell notification (fire-and-forget)
      supabase.functions.invoke("chat-notification", {
        body: {
          conversation_id: msg.conversation_id,
          content: msg.content || "",
          sender_type: msg.sender_type,
        },
      }).catch((e) => console.error("chat-notification error:", e));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });

  return { messages, sendMessage };
}

export function useCreateConversation() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("user_id", user!.id)
        .eq("client_id", clientId)
        .maybeSingle();
      if (existing) return existing.id;

      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({ user_id: user!.id, client_id: clientId })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });
}
