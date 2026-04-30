import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { toast } from "sonner";

export function PushToggleCard() {
  const { t } = useTranslation();
  const { isSubscribed, isSupported, needsPWAInstall, permission, loading, subscribe, unsubscribe } = usePushSubscription();

  if (!isSupported) return null;

  // iOS non-standalone: mostra messaggio per installare PWA
  if (needsPWAInstall) {
    return (
      <Card className="shadow-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{t("notifications.iosPwaTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("notifications.iosPwaBody")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  // Permission already denied: show inline message, no toggle
  if (permission === "denied") {
    return (
      <Card className="shadow-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{t("notifications.pushDeniedTitle", "Notifiche bloccate")}</p>
              <p className="text-xs text-muted-foreground">{t("notifications.pushDeniedBody", "Le notifiche sono state bloccate. Per riattivarle, vai nelle impostazioni del sito nel browser.")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleToggle = async (checked: boolean) => {
    
    if (checked) {
      // Detect iframe — but never block in standalone PWA mode
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
      let inIframe = false;
      if (!isStandalone) {
        try { inIframe = window.self !== window.top; } catch { inIframe = true; }
      }
      
      if (inIframe) {
        toast.error(
          t("notifications.pushIframeError", "Apri l'app dal link pubblicato per attivare le notifiche."),
          { duration: 5000 }
        );
        return;
      }

      const result = await subscribe();
      if (result === "denied") {
        toast.error(t("notifications.pushDeniedToast", "Notifiche bloccate dal browser. Riprova dalle impostazioni del browser."), { duration: 5000 });
      } else if (result === "default") {
        toast(t("notifications.pushDismissedToast", "Permesso notifiche non concesso. Riprova quando vuoi."));
      } else if (result === "error") {
        toast.error(t("notifications.pushErrorToast"), { duration: 5000 });
      }
    } else {
      unsubscribe();
    }
  };

  return (
    <>
      <Card className="shadow-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{t("notifications.pushEnabled")}</p>
                <p className="text-xs text-muted-foreground">{t("notifications.pushEnabledDesc")}</p>
              </div>
            </div>
            <Switch
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
