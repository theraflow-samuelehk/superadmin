import { useState, useEffect, useCallback, useRef } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const REAPPEAR_MS = 60_000;

// Module-level: cattura l'evento appena lo script viene caricato
let savedPromptEvent: BeforeInstallPromptEvent | null = null;
let appWasInstalled = false;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  savedPromptEvent = e as BeforeInstallPromptEvent;
});
window.addEventListener("appinstalled", () => {
  appWasInstalled = true;
  savedPromptEvent = null;
});

const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(savedPromptEvent);
  const [isInstalled, setIsInstalled] = useState(appWasInstalled || isStandalone);
  const [wasDismissed, setWasDismissed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  const iosBrowser: "chrome" | "firefox" | "safari" = isIOS
    ? /CriOS/i.test(navigator.userAgent)
      ? "chrome"
      : /FxiOS/i.test(navigator.userAgent)
        ? "firefox"
        : "safari"
    : "safari";

  useEffect(() => {
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Se l'evento è già stato catturato a livello di modulo, sincronizza lo state
    if (savedPromptEvent && !deferredPrompt) {
      setDeferredPrompt(savedPromptEvent);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      savedPromptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(savedPromptEvent);
    };

    const installedHandler = () => {
      appWasInstalled = true;
      savedPromptEvent = null;
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const canInstall = !isInstalled && !wasDismissed;

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === "accepted") {
        setIsInstalled(true);
        return true;
      }
      return false;
    } catch {
      setDeferredPrompt(null);
      return false;
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setWasDismissed(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setWasDismissed(false);
    }, REAPPEAR_MS);
  }, []);

  return { canInstall, installApp, dismiss, isInstalled, hasNativePrompt: !!deferredPrompt, isIOS, iosBrowser };
}
