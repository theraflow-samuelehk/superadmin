import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { CircleHelp, X, PlayCircle, ChevronLeft } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useEffectiveUserId } from "@/hooks/useEffectiveUserId";
import { useIsMobile } from "@/hooks/use-mobile";

const FAB_STORAGE_KEY = "glowup-fab-y";
const DRAG_THRESHOLD = 5;
const getDefaultBottom = () => 100;

const ROUTE_TO_SECTION: Record<string, string> = {
  "/chat": "chat",
  "/report": "report",
  "/agenda": "agenda",
  "/clienti": "clienti",
  "/servizi": "servizi",
  "/shop": "shop",
  "/fidelizzazione": "fidelizzazione",
  "/operatori": "operatori",
  "/magazzino": "magazzino",
  "/flussi": "flussi",
  "/dashboard": "dashboard",
  "/impostazioni": "impostazioni",
  "/tutorial": "tutorial",
  "/supporto": "supporto",
};

const SECTION_LABELS: Record<string, string> = {
  chat: "Chat",
  report: "Finanze",
  agenda: "Agenda",
  clienti: "Clienti",
  servizi: "Servizi",
  shop: "Shop",
  fidelizzazione: "Fidelizzazione",
  operatori: "Operatori",
  magazzino: "Magazzino",
  flussi: "Flussi",
  dashboard: "Dashboard",
  impostazioni: "Impostazioni",
  tutorial: "Tutorial",
  supporto: "Supporto",
};

interface TutorialVideo {
  id: string;
  title: string;
  vimeo_embed_url: string;
}

// Track which sections had their hint dismissed this session
const dismissedThisSession = new Set<string>();

export function VideoTutorialFab() {
  const location = useLocation();
  const userId = useEffectiveUserId();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [videos, setVideos] = useState<TutorialVideo[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [view, setView] = useState<"list" | "player">("list");

  // Draggable Y position (distance from bottom)
  const [bottomY, setBottomY] = useState(() => {
    const saved = localStorage.getItem(FAB_STORAGE_KEY);
    return saved ? Number(saved) : getDefaultBottom();
  });
  const dragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartBottom = useRef(0);
  const totalDrag = useRef(0);

  const clampBottom = useCallback((val: number) => {
    return Math.max(16, Math.min(window.innerHeight - 80, val));
  }, []);

  const onDragStart = useCallback((clientY: number) => {
    dragging.current = true;
    dragStartY.current = clientY;
    dragStartBottom.current = bottomY;
    totalDrag.current = 0;
  }, [bottomY]);

  const onDragMove = useCallback((clientY: number) => {
    if (!dragging.current) return;
    const delta = dragStartY.current - clientY; // moving up = positive delta = increase bottom
    totalDrag.current = Math.abs(delta);
    setBottomY(clampBottom(dragStartBottom.current + delta));
  }, [clampBottom]);

  const onDragEnd = useCallback(() => {
    if (!dragging.current) return;
    const wasDrag = totalDrag.current >= DRAG_THRESHOLD;
    dragging.current = false;
    setBottomY(prev => {
      localStorage.setItem(FAB_STORAGE_KEY, String(prev));
      return prev;
    });
    return wasDrag;
  }, []);

  const section = ROUTE_TO_SECTION[location.pathname];

  useEffect(() => {
    if (!section) { setVideos([]); return; }
    let cancelled = false;
    supabase
      .from("tutorial_videos")
      .select("id, title, vimeo_embed_url")
      .eq("menu_section", section)
      .eq("status", "published")
      .order("sort_order")
      .then(({ data }) => {
        if (!cancelled) {
          setVideos((data as TutorialVideo[]) || []);
          setActiveIdx(0);
        }
      });
    return () => { cancelled = true; };
  }, [section]);

  useEffect(() => {
    if (!videos.length || !section || dismissedThisSession.has(section)) {
      setShowHint(false);
      return;
    }
    const timer = setTimeout(() => setShowHint(true), 800);
    return () => clearTimeout(timer);
  }, [videos, section]);

  if (!videos.length) return null;

  const currentVideo = videos[activeIdx] || videos[0];

  const markHintSeen = () => {
    setShowHint(false);
    if (section) {
      dismissedThisSession.add(section);
    }
  };

  const handleOpen = () => {
    markHintSeen();
    if (videos.length === 1) {
      setActiveIdx(0);
      setView("player");
    } else {
      setView("list");
    }
    setOpen(true);
  };

  const handleClose = (val: boolean) => {
    setOpen(val);
    if (!val) setView("list");
  };

  const pickVideo = (idx: number) => {
    setActiveIdx(idx);
    setView("player");
  };

  const dismissHint = (e: React.MouseEvent) => {
    e.stopPropagation();
    markHintSeen();
  };

  const sectionLabel = section ? (SECTION_LABELS[section] || section) : "";

  const embedUrl = currentVideo.vimeo_embed_url.includes("autoplay")
    ? currentVideo.vimeo_embed_url
    : currentVideo.vimeo_embed_url + (currentVideo.vimeo_embed_url.includes("?") ? "&autoplay=1" : "?autoplay=1");

  return (
    <>
      {/* FAB + Tooltip */}
      <div
        className="fixed right-4 z-50 flex flex-col items-end gap-2"
        style={{ bottom: bottomY }}
      >
        <AnimatePresence>
          {showHint && !open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              className="relative mr-1 max-w-[184px] rounded-lg border border-primary/20 bg-card pl-2 pr-5 py-1 shadow-md ring-1 ring-primary/10"
            >
              <button
                onClick={dismissHint}
                className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground"
              >
                <X className="h-2.5 w-2.5" />
              </button>
              <p className="text-[11px] leading-snug text-foreground/80">
                Video guida della schermata attuale <span className="font-semibold text-foreground">{sectionLabel}</span>
              </p>
              <div className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 border-b border-r border-primary/20 bg-card" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 18, stiffness: 260, delay: 0.4 }}
          onClick={(e) => {
            // Only open if it wasn't a drag gesture
            if (totalDrag.current < DRAG_THRESHOLD) handleOpen();
          }}
          onTouchStart={(e) => {
            onDragStart(e.touches[0].clientY);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            onDragMove(e.touches[0].clientY);
          }}
          onTouchEnd={() => {
            onDragEnd();
          }}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            onDragStart(e.clientY);
            const moveHandler = (ev: MouseEvent) => onDragMove(ev.clientY);
            const upHandler = () => {
              onDragEnd();
              window.removeEventListener("mousemove", moveHandler);
              window.removeEventListener("mouseup", upHandler);
            };
            window.addEventListener("mousemove", moveHandler);
            window.addEventListener("mouseup", upHandler);
          }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20 touch-none select-none cursor-grab active:cursor-grabbing"
          aria-label="Video tutorial"
        >
          <CircleHelp className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="flex h-[90dvh] max-w-md flex-col p-0 overflow-hidden rounded-2xl border-0 bg-black [&>button]:hidden">

          {view === "list" ? (
            /* ── Selection screen ── */
            <div className="flex flex-1 flex-col min-h-0">
              {/* Header */}
              <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="text-lg font-bold text-white">
                  Tutorial — {sectionLabel}
                </h2>
                <button
                  onClick={() => handleClose(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="px-5 pb-4 text-sm text-white/60">
                Scegli il video che vuoi guardare
              </p>

              {/* Video list */}
              <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2">
                {videos.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => pickVideo(i)}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-left transition-colors hover:bg-white/10 active:bg-white/15"
                  >
                    <PlayCircle className="h-6 w-6 shrink-0 text-primary" />
                    <span className="text-sm font-medium text-white leading-snug">{v.title}</span>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div className="shrink-0 border-t border-white/10 bg-white/5 px-5 py-4 text-center">
                <p className="text-sm font-medium leading-relaxed text-white/90">
                  Ritroverai questi video nella sezione
                </p>
                <p className="mt-0.5 text-base font-bold tracking-wide text-primary">
                  📚 Tutorial
                </p>
              </div>
            </div>
          ) : (
            /* ── Player screen ── */
            <>
              <div className="relative flex-1 min-h-0">
                {/* Back / Close buttons */}
                {videos.length > 1 && (
                  <button
                    onClick={() => setView("list")}
                    className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => handleClose(false)}
                  className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Title overlay */}
                {videos.length > 1 && (
                  <div className="absolute left-0 right-0 top-0 z-[5] bg-gradient-to-b from-black/70 to-transparent px-12 pt-3 pb-6">
                    <p className="text-sm font-semibold text-white truncate text-center">{currentVideo.title}</p>
                  </div>
                )}

                <iframe
                  src={open && view === "player" ? embedUrl : ""}
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  frameBorder="0"
                  key={currentVideo.id}
                />
              </div>

              <div className="shrink-0 border-t border-white/10 bg-white/5 px-5 py-4 text-center">
                <p className="text-sm font-medium leading-relaxed text-white/90">
                  Ritroverai questo video nella sezione
                </p>
                <p className="mt-0.5 text-base font-bold tracking-wide text-primary">
                  📚 Tutorial
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
