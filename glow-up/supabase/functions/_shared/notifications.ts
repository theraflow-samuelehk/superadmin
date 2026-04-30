import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWebPush, PushSubscription } from "./web-push.ts";

export interface NotificationParams {
  user_id: string;
  salon_user_id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function createNotification(
  supabase: SupabaseClient,
  params: NotificationParams
): Promise<{ success: boolean; pushDelivered: boolean }> {
  // Save notification to database
  const { error } = await supabase.from("notifications").insert({
    user_id: params.user_id,
    salon_user_id: params.salon_user_id,
    type: params.type,
    title: params.title,
    body: params.body,
    data: params.data || {},
  });

  if (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }

  let pushDelivered = false;

  // Send web push notifications
  try {
    // Load VAPID keys
    const { data: vapidPub } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "vapid_public_key")
      .maybeSingle();

    const { data: vapidPriv } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "vapid_private_key")
      .maybeSingle();

    if (!vapidPub?.value || !vapidPriv?.value) {
      console.log("No VAPID keys configured, skipping push");
      return { success: true, pushDelivered: false };
    }

    // Get user's push subscriptions
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", params.user_id);

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, pushDelivered: false };
    }

    const payload: Record<string, unknown> = {
      title: params.title,
      body: params.body,
      data: { ...(params.data || {}), type: params.type },
    };

    for (const sub of subscriptions) {
      const success = await sendWebPush(
        sub as PushSubscription,
        payload as { title: string; body: string; data?: Record<string, unknown> },
        vapidPub.value,
        vapidPriv.value
      );

      if (success) {
        pushDelivered = true;
      } else {
        // Remove expired subscriptions
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
      }
    }
  } catch (e) {
    // Don't fail the notification creation if push fails
    console.error("Push notification error (non-fatal):", e);
  }

  return { success: true, pushDelivered };
}
