import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Share } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { PushPermissionGuide } from "@/components/PushPermissionGuide";

const DISMISSED_KEY = "push_prompt_dismissed";

export function PushAutoPrompt({ onClosed }: { onClosed?: () => void } = {}) {
  const { t } = useTranslation();
  const { isSupported, isSubscribed, needsPWAInstall, subscribe } = usePushSubscription();
  const [open, setOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupported || isSubscribed) {
      onClosed?.();
      return;
    }
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    if (!isStandalone && localStorage.getItem(DISMISSED_KEY)) {
      onClosed?.();
    }
  }, [isSupported, isSubscribed, onClosed]);

  useEffect(() => {
    if (!isSupported || isSubscribed) return;

    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;

    if (isStandalone) {
      // PWA mode: always show prompt if not subscribed (ignore previous dismissals)
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }

    if (localStorage.getItem(DISMISSED_KEY)) return;
    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [isSupported, isSubscribed]);

  const handleAccept = async () => {
    
    // Detect iframe BEFORE any async work — show message immediately on mobile
    const inIframe = typeof window !== "undefined" && window.self !== window.top;
    
    if (inIframe) {
      setIframeBlocked(true);
      return;
    }

    if (needsPWAInstall) {
      
      setShowIosSteps(true);
      return;
    }
    try {
      const result = await subscribe();
      setLoading(false);
      if (result === "granted") {
        setOpen(false);
        onClosed?.();
        toast.success(t("notifications.autoPromptSuccess"));
      } else if (result === "denied") {
        setOpen(false);
        onClosed?.();
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (!isMobile) {
          setShowGuide(true);
        }
      } else if (result === "default") {
        toast(t("notifications.pushDismissedToast", "Permesso notifiche non concesso. Riprova dall'app installata."));
        setOpen(false);
        onClosed?.();
      } else {
        toast.error(t("notifications.pushErrorToast"), { duration: 5000 });
        setOpen(false);
        onClosed?.();
      }
    } catch (e) {
      setLoading(false);
      toast.error(t("notifications.pushErrorToast"), { duration: 5000 });
      setOpen(false);
      onClosed?.();
    }
  };

  const handleDismiss = () => {
    if (showIosSteps) {
      localStorage.setItem("push_prompt_dismissed_ios", "1");
    } else {
      localStorage.setItem(DISMISSED_KEY, "1");
    }
    setOpen(false);
    setShowIosSteps(false);
    onClosed?.();
  };

  if (!isSupported || isSubscribed) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="items-center text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle>{t("notifications.autoPromptTitle")}</DialogTitle>
            <DialogDescription>{t("notifications.autoPromptBody")}</DialogDescription>
          </DialogHeader>

          {iframeBlocked && (
            <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
              <p className="font-medium text-foreground">{t("notifications.iframeBlockedTitle", "Notifiche bloccate dall'anteprima")}</p>
              <p className="text-muted-foreground">{t("notifications.iframeBlockedBody", "Il browser blocca le notifiche nelle anteprime. Per attivare le notifiche:")}</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>{t("notifications.iframeBlockedStep1", "Apri l'app dall'URL pubblicato")}</li>
                <li>{t("notifications.iframeBlockedStep2", "Vai nelle impostazioni e attiva le notifiche")}</li>
              </ol>
            </div>
          )}

          {showIosSteps && !iframeBlocked && (
            <div className="space-y-3 rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{t("notifications.iosPwaBody")}</p>
              <ol className="list-decimal list-inside space-y-2">
                <li className="flex items-center gap-2">
                  <Share className="h-4 w-4 shrink-0 text-primary" />
                  {t("notifications.iosPwaStep1")}
                </li>
                <li>{t("notifications.iosPwaStep2")}</li>
                <li>{t("notifications.iosPwaStep3")}</li>
              </ol>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {iframeBlocked ? (
              <Button onClick={handleDismiss} className="w-full">
                {t("notifications.iframeBlockedButton", "Ho capito")}
              </Button>
            ) : !showIosSteps ? (
              <>
                <Button onClick={handleAccept} disabled={loading} className="w-full">
                  {t("notifications.autoPromptAccept")}
                </Button>
                <Button variant="ghost" onClick={handleDismiss} disabled={loading} className="w-full">
                  {t("notifications.autoPromptDismiss")}
                </Button>
              </>
            ) : (
              <Button onClick={handleDismiss} className="w-full">
                {t("notifications.iosPwaButton")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PushPermissionGuide open={showGuide} onOpenChange={setShowGuide} onRetry={subscribe} />
    </>
  );
}
