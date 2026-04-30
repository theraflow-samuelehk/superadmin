import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share, MoreVertical, ArrowUpFromLine } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { setPortalPreference } from "@/lib/portalPreference";

export default function PWAInstallDialog({ enabled = true, portalType = "client" }: { enabled?: boolean; portalType?: "client" | "operator" }) {
  const { t } = useTranslation();
  const { canInstall, installApp, dismiss, hasNativePrompt, isIOS, iosBrowser } = usePWAInstall();

  const shouldShow = enabled && canInstall;

  const handleInstall = async () => {
    setPortalPreference(portalType);
    if (hasNativePrompt) {
      const accepted = await installApp();
      if (accepted) return;
    }
    dismiss();
  };

  return (
    <Dialog open={shouldShow} onOpenChange={(open) => { if (!open) dismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Download className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle>{t("portal.installApp")}</DialogTitle>
          <DialogDescription>{t("portal.installAppDescription")}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {hasNativePrompt ? (
            <Button onClick={handleInstall} className="w-full gap-2">
              <Download className="h-4 w-4" />
              {t("portal.installButton")}
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
              {isIOS ? (
                <ol className="list-decimal list-inside space-y-1.5">
                  {iosBrowser === "safari" ? (
                    <>
                      <li className="flex items-center gap-2">
                        <MoreVertical className="h-4 w-4 shrink-0 text-primary" />
                        {t("portal.installIosSafariShare")}
                      </li>
                      <li className="flex items-center gap-2">
                        <Share className="h-4 w-4 shrink-0 text-primary" />
                        {t("portal.installIosSafariShare2")}
                      </li>
                    </>
                  ) : (
                    <li className="flex items-center gap-2">
                      {iosBrowser === "firefox" ? (
                        <MoreVertical className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <Share className="h-4 w-4 shrink-0 text-primary" />
                      )}
                      {iosBrowser === "chrome"
                        ? t("portal.installIosChromeShare")
                        : t("portal.installIosFirefoxShare")}
                    </li>
                  )}
                  <li>{t("portal.installIosAddHome")}</li>
                </ol>
              ) : (
                <p className="flex items-start gap-2">
                  <MoreVertical className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                  {t("portal.installBrowserGeneric")}
                </p>
              )}
            </div>
          )}
          <Button variant="ghost" onClick={dismiss} className="w-full">
            {t("portal.installLater")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
