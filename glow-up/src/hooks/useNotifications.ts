import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type NotificationContext = "salon" | "client" | "operator";

const CONTEXT_TYPES: Record<NotificationContext, string[]> = {
  salon: ["booking", "cancellation", "confirmation", "admin_escalation", "chat"],
  client: ["reminder", "announcement", "chat", "appointment_reminder"],
  operator: ["chat"],
};

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  data: Record<string, unknown> | null;
}

export function useNotifications(context?: NotificationContext) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    let query = supabase
      .from("notifications")
      .select("id, type, title, body, is_read, created_at, data")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (context && CONTEXT_TYPES[context]) {
      query = query.in("type", CONTEXT_TYPES[context]);
    }

    const { data } = await query;

    const notifs = (data || []) as Notification[];
    setNotifications(notifs);
    setUnreadCount(notifs.filter((n) => !n.is_read).length);
    setLoading(false);
  }, [user, context]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const deleteOne = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      setUnreadCount(updated.filter((n) => !n.is_read).length);
      return updated;
    });
  };

  const deleteAll = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id);
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteOne,
    deleteAll,
    refetch: fetchNotifications,
  };
}
