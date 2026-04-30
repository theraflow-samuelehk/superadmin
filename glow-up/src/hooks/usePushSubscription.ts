import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [needsPWAInstall, setNeedsPWAInstall] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pushSupported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    const iosNeedsPWA = isIOS && !isStandalone;

    setNeedsPWAInstall(iosNeedsPWA);
    setIsSupported(pushSupported || iosNeedsPWA);

    if (pushSupported) {
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch {
      setIsSubscribed(false);
    }
  };

  const isStandalone = typeof window !== "undefined" && (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );

  const isInIframe = (() => {
    if (typeof window === "undefined") return false;
    if (isStandalone) return false; // PWA standalone is never an iframe
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const subscribe = useCallback(async (): Promise<"granted" | "denied" | "default" | "error"> => {
    
    
    if (!isSupported) {
      console.error("[Push] Not supported in this browser", {
        serviceWorker: "serviceWorker" in navigator,
        PushManager: "PushManager" in window,
        Notification: "Notification" in window,
      });
      return "error";
    }

    if (isInIframe) {
      console.warn("[Push] Blocked in iframe. window.self === window.top:", window.self === window.top);
      return "error";
    }

    // 1. Check if already denied — browser won't show popup again
    if ("Notification" in window && Notification.permission === "denied") {
      
      setPermission("denied");
      return "denied";
    }

    // 2. requestPermission() immediately to preserve user gesture chain
    setLoading(true);
    let perm: NotificationPermission;
    try {
      
      perm = await Notification.requestPermission();
    } catch (permErr) {
      console.error("[Push] Permission request threw:", permErr);
      setLoading(false);
      return "error";
    }
    
    setPermission(perm);
    if (perm !== "granted") {
      setLoading(false);
      return perm;
    }

    // 2. AFTER permission granted: get session, VAPID key, service worker
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.error("[Push] No authenticated user found");
      setLoading(false);
      return "error";
    }

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/push-subscribe`,
        { headers: { "Content-Type": "application/json" } }
      );
      
      if (!res.ok) {
        console.error("[Push] Failed to fetch VAPID key:", res.status);
        throw new Error("Failed to fetch VAPID key");
      }
      
      const { publicKey } = await res.json();
      if (!publicKey) {
        console.error("[Push] No VAPID key returned");
        throw new Error("No VAPID key available");
      }
      

      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Await service worker ready with a 10s timeout to avoid infinite hangs
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Service worker ready timeout")), 10000)
        ),
      ]);
      
      
      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const subJson = subscription.toJSON();
      

      const saveRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/push-subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth,
          }),
        }
      );

      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        console.error("[Push] Failed to save subscription:", saveRes.status, errData);
        throw new Error("Failed to save subscription");
      }

      
      setIsSubscribed(true);
      return "granted";
    } catch (e) {
      console.error("[Push] Subscription failed:", e);
      return "error";
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/push-subscribe`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ endpoint }),
          }
        );
      }
      setIsSubscribed(false);
    } catch (e) {
      console.error("[Push] Unsubscribe failed:", e);
    }
    setLoading(false);
  }, []);

  return { isSubscribed, isSupported, needsPWAInstall, permission, loading, subscribe, unsubscribe };
}
