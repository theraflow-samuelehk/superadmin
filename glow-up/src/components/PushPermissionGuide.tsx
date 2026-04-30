import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor, Apple, Loader2, CheckCircle2 } from "lucide-react";

type Platform = "android" | "ios" | "desktop";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

interface PushPermissionGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: () => Promise<"granted" | "denied" | "default" | "error">;
}

export function PushPermissionGuide({ open, onOpenChange, onRetry }: PushPermissionGuideProps) {
  const { t } = useTranslation();
  const [platform] = useState<Platform>(detectPlatform);
  const [retrying, setRetrying] = useState(false);

  // Auto-detect permission change when user returns to the app
  useEffect(() => {
    if (!open) return;

    const handleVisibility = async () => {
      if (document.visibilityState === "visible" && "Notification" in window) {
        const perm = Notification.permission;
        if (perm === "granted") {
          setRetrying(true);
          const result = await onRetry();
          setRetrying(false);
          if (result === "granted") {
            onOpenChange(false);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [open, onRetry, onOpenChange]);

  const handleRetry = async () => {
    setRetrying(true);
    const result = await onRetry();
    setRetrying(false);
    if (result === "granted") {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {t("notifications.pushGuideTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("notifications.pushGuideSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {platform === "android" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="text-sm text-foreground">
                  <p className="font-medium mb-1">{t("notifications.pushGuideAndroidTitle")}</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>{t("notifications.pushGuideAndroid1")}</li>
                    <li>{t("notifications.pushGuideAndroid2")}</li>
                    <li>{t("notifications.pushGuideAndroid3")}</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {platform === "ios" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Apple className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="text-sm text-foreground">
                  <p className="font-medium mb-1">{t("notifications.pushGuideIOSTitle")}</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>{t("notifications.pushGuideIOS1")}</li>
                    <li>{t("notifications.pushGuideIOS2")}</li>
                    <li>{t("notifications.pushGuideIOS3")}</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {platform === "desktop" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Monitor className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="text-sm text-foreground">
                  <p className="font-medium mb-1">{t("notifications.pushGuideDesktopTitle")}</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>{t("notifications.pushGuideDesktop1")}</li>
                    <li>{t("notifications.pushGuideDesktop2")}</li>
                    <li>{t("notifications.pushGuideDesktop3")}</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border/50">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">{t("notifications.pushGuideAutoDetect")}</p>
          </div>
        </div>

        <Button onClick={handleRetry} disabled={retrying} className="w-full">
          {retrying ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          {t("notifications.pushGuideRetry")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
