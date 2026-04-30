import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const initialHtml = useRef<string | null>(null);
  const lastResumeTime = useRef<number>(0);

  // Track when app returns from background — delay update checks to let token refresh complete
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        lastResumeTime.current = Date.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const checkForUpdate = useCallback(async () => {
    // Skip check if app just resumed from background (< 5s ago) to avoid reload during token refresh
    if (lastResumeTime.current && Date.now() - lastResumeTime.current < 5000) {
      return;
    }

    try {
      const res = await fetch(`/index.html?_t=${Date.now()}`, { cache: "no-store" });
      const text = await res.text();
      const scripts = text.match(/src="[^"]+"|href="[^"]+\.js[^"]*"|href="[^"]+\.css[^"]*"/g)?.join(",") ?? text;

      if (initialHtml.current === null) {
        initialHtml.current = scripts;
        return;
      }

      if (scripts !== initialHtml.current) {
        setUpdateAvailable(true);
      }
    } catch {
      // ignore network errors
    }
  }, []);

  useEffect(() => {
    checkForUpdate();
    const id = setInterval(checkForUpdate, 30_000);
    return () => clearInterval(id);
  }, [checkForUpdate]);

  const handleUpdate = () => {
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 bg-primary px-4 py-2.5 text-primary-foreground text-sm shadow-lg"
        >
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="font-medium">Nuova versione disponibile</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleUpdate}
            className="h-7 px-3 text-xs font-semibold"
          >
            Aggiorna
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
