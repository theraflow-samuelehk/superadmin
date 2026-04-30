import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FolderOpen,
  ChevronDown,
  Play,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  topics: string | null;
  sort_order: number;
}

interface Video {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  vimeo_embed_url: string;
  sort_order: number;
}

const WATCHED_KEY = "tutorial_watched_videos";

const getWatchedIds = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(WATCHED_KEY) || "[]");
  } catch {
    return [];
  }
};

const extractVimeoUrl = (input: string) => {
  const match = input.match(/src="([^"]+)"/);
  return match ? match[1] : input.trim();
};

export default function PortalTutorials() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);
  const [watched, setWatched] = useState<string[]>(getWatchedIds);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: cats }, { data: vids }] = await Promise.all([
      supabase
        .from("tutorial_categories")
        .select("id, name, description, topics, sort_order")
        .order("sort_order"),
      supabase
        .from("tutorial_videos")
        .select("id, category_id, title, description, vimeo_embed_url, sort_order")
        .order("sort_order"),
    ]);
    setCategories((cats as any) || []);
    setVideos((vids as any) || []);
    setLoading(false);
  };

  const markWatched = useCallback((videoId: string) => {
    setWatched((prev) => {
      if (prev.includes(videoId)) return prev;
      const next = [...prev, videoId];
      localStorage.setItem(WATCHED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleVideoToggle = useCallback(
    (videoId: string) => {
      const opening = expandedVideoId !== videoId;
      setExpandedVideoId(opening ? videoId : null);
      if (opening) markWatched(videoId);
    },
    [expandedVideoId, markWatched]
  );

  if (loading) {
    return (
      <p className="text-muted-foreground animate-pulse p-4">
        {t("common.loading")}
      </p>
    );
  }

  const totalVideos = videos.length;
  const watchedCount = videos.filter((v) => watched.includes(v.id)).length;
  const progressPct = totalVideos > 0 ? Math.round((watchedCount / totalVideos) * 100) : 0;
  const allDone = watchedCount === totalVideos && totalVideos > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t("tutorials.title", "Tutorial")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("tutorials.indexSubtitle", "{{count}} capitoli · {{videos}} video", {
              count: categories.length,
              videos: totalVideos,
            })}
          </p>
        </div>
      </div>

      {/* Motivational banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1 min-w-0">
            <p className="text-sm text-foreground/80 leading-relaxed">
              {t(
                "tutorials.motivationalBanner",
                "Questi video ti guidano passo dopo passo su ogni funzione dell'app. Nessun dubbio, nessuna domanda senza risposta: dopo averli visti saprai usare tutto alla perfezione."
              )}
            </p>
            {/* Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">
                  {allDone
                    ? t("tutorials.progressDone", "Tutti i video completati! 🎉")
                    : t("tutorials.progressLabel", "{{done}} di {{total}} video completati", {
                        done: watchedCount,
                        total: totalVideos,
                      })}
                </span>
                <span className="text-muted-foreground tabular-nums">{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-40" />
            {t("tutorials.noCategories", "Nessuna categoria tutorial")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {categories.map((cat, idx) => {
            const catVideos = videos.filter((v) => v.category_id === cat.id);
            const count = catVideos.length;
            const chapterNum = idx + 1;
            const isCatExpanded = expandedCatId === cat.id;
            const catWatched = catVideos.filter((v) => watched.includes(v.id)).length;
            const catAllDone = catWatched === count && count > 0;

            return (
              <Card
                key={cat.id}
                className={`overflow-hidden transition-all border-border/50 ${
                  isCatExpanded ? "ring-1 ring-primary/20" : ""
                }`}
              >
                <CardContent className="p-0">
                  {/* Chapter header */}
                  <div
                    className="flex items-start gap-3.5 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => {
                      setExpandedCatId(isCatExpanded ? null : cat.id);
                      setExpandedVideoId(null);
                    }}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shrink-0 mt-0.5 shadow-sm">
                      {chapterNum}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground text-base">
                          {cat.name}
                        </h3>
                        <Badge variant="outline" className="text-[10px] shrink-0 gap-1">
                          <Play className="h-2.5 w-2.5" />
                          {count}
                        </Badge>
                        {catAllDone && (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        )}
                      </div>
                      {cat.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {cat.description}
                        </p>
                      )}
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground/50 shrink-0 mt-1 transition-transform duration-200 ${
                        isCatExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {/* Expanded chapter content */}
                  {isCatExpanded && (
                    <div className="border-t border-border/30 animate-in slide-in-from-top-1 fade-in duration-200">
                      {cat.topics && (
                        <div className="px-4 pt-3 pb-2">
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {cat.topics}
                          </p>
                        </div>
                      )}

                      {catVideos.length === 0 ? (
                        <div className="px-4 pb-4">
                          <p className="text-xs text-muted-foreground italic">
                            {t("tutorials.comingSoon", "Video in arrivo prossimamente")}
                          </p>
                        </div>
                      ) : (
                        <div className="px-4 pb-3 space-y-1">
                          {catVideos.map((vid, vidIdx) => {
                            const isVideoExpanded = expandedVideoId === vid.id;
                            const videoNum = `${chapterNum}.${vidIdx + 1}`;
                            const isWatched = watched.includes(vid.id);

                            return (
                              <div key={vid.id} className="rounded-lg border border-border/40 overflow-hidden">
                                {/* Video row header */}
                                <div
                                  className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVideoToggle(vid.id);
                                  }}
                                >
                                  <Badge variant="outline" className="text-xs font-mono shrink-0 px-1.5">
                                    {videoNum}
                                  </Badge>
                                  <span className="font-medium text-sm text-foreground flex-1 min-w-0 truncate">
                                    {vid.title}
                                  </span>
                                  {isWatched && (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                  )}
                                  <ChevronDown
                                    className={`h-4 w-4 text-muted-foreground/50 shrink-0 transition-transform duration-200 ${
                                      isVideoExpanded ? "rotate-180" : ""
                                    }`}
                                  />
                                </div>

                                {/* Video expanded content */}
                                {isVideoExpanded && (
                                  <div className="px-3 pb-3 space-y-2 animate-in slide-in-from-top-1 fade-in duration-150">
                                    {vid.description && (
                                      <p className="text-xs text-muted-foreground">
                                        {vid.description}
                                      </p>
                                    )}
                                    <div className="flex justify-center">
                                      <div
                                        className="w-full max-w-[360px]"
                                        style={{ aspectRatio: "9/16" }}
                                      >
                                        <iframe
                                          src={extractVimeoUrl(vid.vimeo_embed_url)}
                                          className="w-full h-full rounded-lg"
                                          frameBorder="0"
                                          referrerPolicy="strict-origin-when-cross-origin"
                                          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
                                          allowFullScreen
                                          title={vid.title}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
