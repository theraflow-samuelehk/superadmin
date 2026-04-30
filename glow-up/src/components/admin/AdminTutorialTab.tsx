import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Plus, GripVertical, Pencil, Trash2, ChevronDown, ChevronRight, Video, FolderOpen, BookOpen, MoveRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { TutorialCategoryDialog } from "./tutorial/TutorialCategoryDialog";
import { TutorialVideoDialog } from "./tutorial/TutorialVideoDialog";
import { TutorialVideoRow } from "./tutorial/TutorialVideoRow";

interface TutorialCategory {
  id: string;
  name: string;
  description: string | null;
  topics: string | null;
  sort_order: number;
  status: string;
  created_by: string;
}

interface TutorialVideo {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  vimeo_embed_url: string;
  sort_order: number;
  status: string;
  created_by: string;
  menu_section: string | null;
}

export function AdminTutorialTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [categories, setCategories] = useState<TutorialCategory[]>([]);
  const [videos, setVideos] = useState<TutorialVideo[]>([]);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalEnabled, setPortalEnabled] = useState(false);
  const [portalToggleLoading, setPortalToggleLoading] = useState(false);

  // Category dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<TutorialCategory | null>(null);

  // Video dialog
  const [vidDialogOpen, setVidDialogOpen] = useState(false);
  const [editingVid, setEditingVid] = useState<TutorialVideo | null>(null);
  const [vidCatId, setVidCatId] = useState("");

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ type: "category" | "video"; id: string; name: string } | null>(null);

  // Drag state — categories
  const dragCatIdx = useRef<number | null>(null);
  const [dragOverCatIdx, setDragOverCatIdx] = useState<number | null>(null);

  // Drag state — videos (cross-category support)
  const dragVidIdx = useRef<number | null>(null);
  const dragVidCatId = useRef<string | null>(null);
  const dragVidId = useRef<string | null>(null);
  const [dragOverVidIdx, setDragOverVidIdx] = useState<number | null>(null);
  const [dragOverTargetCatId, setDragOverTargetCatId] = useState<string | null>(null);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: cats }, { data: vids }, { data: flagData }] = await Promise.all([
      supabase.from("tutorial_categories").select("*").order("sort_order"),
      supabase.from("tutorial_videos").select("*").order("sort_order"),
      supabase.from("feature_flags").select("is_enabled").eq("key", "tutorials_portal_enabled").maybeSingle(),
    ]);
    setCategories((cats as any) || []);
    setVideos((vids as any) || []);
    setPortalEnabled(flagData?.is_enabled ?? false);
    setLoading(false);
  };

  const togglePortalVisibility = async (enabled: boolean) => {
    setPortalToggleLoading(true);
    try {
      const { data, error } = await supabase
        .from("feature_flags")
        .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
        .eq("key", "tutorials_portal_enabled")
        .is("deleted_at", null)
        .select("*");

      if (error) { toast.error(error.message); setPortalToggleLoading(false); return; }

      if (!data || data.length === 0) {
        const { error: upsertError } = await supabase
          .from("feature_flags")
          .upsert({
            key: "tutorials_portal_enabled",
            name: "Tutorial nei Portali",
            description: "Mostra/nascondi la sezione Tutorial nei portali",
            is_enabled: enabled,
            deleted_at: null,
          }, { onConflict: "key" })
          .select("*");
        if (upsertError) { toast.error(upsertError.message); setPortalToggleLoading(false); return; }
      }

      setPortalEnabled(enabled);
      toast.success(enabled ? t("tutorials.portalEnabled", "Tutorial visibili nei portali") : t("tutorials.portalDisabled", "Tutorial nascosti nei portali"));
    } catch (err: any) {
      toast.error(err.message || "Errore aggiornamento");
    }
    setPortalToggleLoading(false);
  };

  // ── Category CRUD ──
  const openNewCat = () => { setEditingCat(null); setCatDialogOpen(true); };
  const openEditCat = (cat: TutorialCategory) => { setEditingCat(cat); setCatDialogOpen(true); };

  const saveCat = async (data: { name: string; description: string; topics: string }) => {
    if (!data.name.trim()) return;
    const payload: any = {
      name: data.name.trim(),
      description: data.description.trim() || null,
      topics: data.topics.trim() || null,
      created_by: user!.id,
    };

    if (editingCat) {
      const { error } = await supabase.from("tutorial_categories").update(payload).eq("id", editingCat.id);
      if (error) { toast.error(error.message); return; }
      toast.success(t("tutorials.categorySaved", "Capitolo salvato"));
    } else {
      payload.sort_order = categories.length;
      const { error } = await supabase.from("tutorial_categories").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success(t("tutorials.categoryCreated", "Capitolo creato"));
    }
    setCatDialogOpen(false);
    fetchAll();
  };

  const toggleCatStatus = async (cat: TutorialCategory) => {
    const newStatus = cat.status === "published" ? "draft" : "published";
    await supabase.from("tutorial_categories").update({ status: newStatus }).eq("id", cat.id);
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, status: newStatus } : c));
    toast.success(newStatus === "published" ? t("tutorials.published", "Pubblicato") : t("tutorials.draft", "Bozza"));
  };

  // ── Video CRUD ──
  const openNewVid = (catId: string) => { setEditingVid(null); setVidCatId(catId); setVidDialogOpen(true); };
  const openEditVid = (vid: TutorialVideo) => { setEditingVid(vid); setVidCatId(vid.category_id); setVidDialogOpen(true); };

  const saveVid = async (data: { title: string; description: string; url: string; menu_section: string | null }) => {
    if (!data.title.trim() || !data.url.trim()) return;
    const match = data.url.match(/src="([^"]+)"/);
    const parsedUrl = match ? match[1] : data.url.trim();
    const payload: any = {
      category_id: vidCatId,
      title: data.title.trim(),
      description: data.description.trim() || null,
      vimeo_embed_url: parsedUrl,
      menu_section: data.menu_section || null,
      created_by: user!.id,
    };

    if (editingVid) {
      const { error } = await supabase.from("tutorial_videos").update(payload).eq("id", editingVid.id);
      if (error) { toast.error(error.message); return; }
      toast.success(t("tutorials.videoSaved", "Video salvato"));
    } else {
      payload.sort_order = videos.filter(v => v.category_id === vidCatId).length;
      const { error } = await supabase.from("tutorial_videos").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success(t("tutorials.videoCreated", "Video aggiunto"));
    }
    setVidDialogOpen(false);
    fetchAll();
  };

  const toggleVidStatus = async (vid: TutorialVideo) => {
    const newStatus = vid.status === "published" ? "draft" : "published";
    await supabase.from("tutorial_videos").update({ status: newStatus }).eq("id", vid.id);
    setVideos(prev => prev.map(v => v.id === vid.id ? { ...v, status: newStatus } : v));
    toast.success(newStatus === "published" ? t("tutorials.published", "Pubblicato") : t("tutorials.draft", "Bozza"));
  };

  // ── Delete ──
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "category") {
      await supabase.from("tutorial_categories").delete().eq("id", deleteTarget.id);
    } else {
      await supabase.from("tutorial_videos").delete().eq("id", deleteTarget.id);
    }
    setDeleteTarget(null);
    fetchAll();
    toast.success(t("common.delete") + " ✓");
  };

  // ── Drag & Drop — Categories ──
  const onCatDragStart = (e: React.DragEvent, idx: number) => {
    dragCatIdx.current = idx;
    e.dataTransfer.setData("type", "category");
  };
  const onCatDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (!isDraggingVideo) {
      setDragOverCatIdx(idx);
    }
  };
  const onCatDrop = async (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    setDragOverCatIdx(null);
    setDragOverTargetCatId(null);

    // If we're dropping a video onto a category row
    if (isDraggingVideo && dragVidId.current) {
      const targetCatId = categories[dropIdx]?.id;
      if (!targetCatId || targetCatId === dragVidCatId.current) {
        resetVideoDrag();
        return;
      }
      await moveVideoToCategory(dragVidId.current, targetCatId);
      resetVideoDrag();
      return;
    }

    // Otherwise it's a category reorder
    const fromIdx = dragCatIdx.current;
    if (fromIdx === null || fromIdx === dropIdx) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    setCategories(reordered);
    dragCatIdx.current = null;
    const updates = reordered.map((cat, i) =>
      supabase.from("tutorial_categories").update({ sort_order: i }).eq("id", cat.id)
    );
    await Promise.all(updates);
  };
  const onCatDragEnd = () => {
    dragCatIdx.current = null;
    setDragOverCatIdx(null);
  };

  // ── Cross-category video move ──
  const moveVideoToCategory = async (videoId: string, targetCatId: string) => {
    const targetVids = videos.filter(v => v.category_id === targetCatId);
    const newSortOrder = targetVids.length;

    const { error } = await supabase
      .from("tutorial_videos")
      .update({ category_id: targetCatId, sort_order: newSortOrder })
      .eq("id", videoId);

    if (error) {
      toast.error(error.message);
      return;
    }

    const movedVid = videos.find(v => v.id === videoId);
    const targetCat = categories.find(c => c.id === targetCatId);
    toast.success(
      t("tutorials.videoMoved", "Video spostato in \"{{category}}\"", { category: targetCat?.name || "" })
    );
    fetchAll();
  };

  const resetVideoDrag = () => {
    dragVidIdx.current = null;
    dragVidCatId.current = null;
    dragVidId.current = null;
    setDragOverVidIdx(null);
    setDragOverTargetCatId(null);
    setIsDraggingVideo(false);
  };

  // ── Drag & Drop — Videos ──
  const onVidDragStart = (catId: string, idx: number, videoId: string) => {
    dragVidCatId.current = catId;
    dragVidIdx.current = idx;
    dragVidId.current = videoId;
    setIsDraggingVideo(true);
  };
  const onVidDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverVidIdx(idx);
  };
  const onVidDrop = async (e: React.DragEvent, catId: string, dropIdx: number) => {
    e.preventDefault();
    setDragOverVidIdx(null);
    const fromIdx = dragVidIdx.current;

    // Same category reorder
    if (dragVidCatId.current === catId && fromIdx !== null && fromIdx !== dropIdx) {
      const catVids = videos.filter(v => v.category_id === catId);
      const otherVids = videos.filter(v => v.category_id !== catId);
      const [moved] = catVids.splice(fromIdx, 1);
      catVids.splice(dropIdx, 0, moved);
      setVideos([...otherVids, ...catVids]);
      const updates = catVids.map((vid, i) =>
        supabase.from("tutorial_videos").update({ sort_order: i }).eq("id", vid.id)
      );
      await Promise.all(updates);
    }
    // Cross-category: move video to this category at the drop position
    else if (dragVidCatId.current !== catId && dragVidId.current) {
      const catVids = videos.filter(v => v.category_id === catId);
      const newSortOrder = Math.min(dropIdx, catVids.length);
      
      const { error } = await supabase
        .from("tutorial_videos")
        .update({ category_id: catId, sort_order: newSortOrder })
        .eq("id", dragVidId.current);

      if (error) {
        toast.error(error.message);
      } else {
        const targetCat = categories.find(c => c.id === catId);
        toast.success(
          t("tutorials.videoMoved", "Video spostato in \"{{category}}\"", { category: targetCat?.name || "" })
        );
        fetchAll();
      }
    }

    resetVideoDrag();
  };
  const onVidDragEnd = () => {
    resetVideoDrag();
  };

  // Handle category row highlighting when dragging a video over it
  const onCatDragEnterForVideo = (e: React.DragEvent, catId: string) => {
    if (isDraggingVideo && dragVidCatId.current !== catId) {
      e.preventDefault();
      setDragOverTargetCatId(catId);
    }
  };
  const onCatDragLeaveForVideo = (e: React.DragEvent) => {
    // Only clear if we're leaving the row entirely
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverTargetCatId(null);
    }
  };

  const catVideos = (catId: string) => videos.filter(v => v.category_id === catId);

  if (loading) return <p className="text-muted-foreground animate-pulse p-4">{t("common.loading")}</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">{t("tutorials.title", "Tutorial")}</h2>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
            <Switch
              checked={portalEnabled}
              onCheckedChange={togglePortalVisibility}
              disabled={portalToggleLoading}
            />
            <Label className="text-sm text-muted-foreground cursor-pointer" onClick={() => togglePortalVisibility(!portalEnabled)}>
              {t("tutorials.visibleInPortals", "Visibile nei portali")}
            </Label>
          </div>
        </div>
        <Button onClick={openNewCat} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          {t("tutorials.addCategory", "Nuovo capitolo")}
        </Button>
      </div>

      {/* Drag hint when dragging a video */}
      {isDraggingVideo && (
        <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 animate-in fade-in">
          <MoveRight className="h-4 w-4" />
          {t("tutorials.dragVideoHint", "Rilascia il video su un altro capitolo per spostarlo")}
        </div>
      )}

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-40" />
            {t("tutorials.noCategories", "Nessun capitolo tutorial")}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-12 text-center font-semibold">#</TableHead>
                <TableHead className="font-semibold min-w-[180px]">{t("tutorials.chapterName", "Capitolo")}</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">{t("tutorials.categoryDescription", "Descrizione")}</TableHead>
                <TableHead className="font-semibold hidden lg:table-cell min-w-[200px]">{t("tutorials.topicsLabel", "Anteprima capitolo")}</TableHead>
                <TableHead className="w-20 text-center font-semibold">{t("tutorials.videoCount", "Video")}</TableHead>
                <TableHead className="w-20 text-center font-semibold">{t("tutorials.statusLabel", "Stato")}</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat, catIdx) => {
                const expanded = expandedCat === cat.id;
                const vids = catVideos(cat.id);
                const chapterNum = catIdx + 1;
                const isDropTarget = isDraggingVideo && dragOverTargetCatId === cat.id && dragVidCatId.current !== cat.id;

                return (
                  <>
                    <TableRow
                      key={cat.id}
                      className={`group cursor-pointer transition-all hover:bg-muted/20 ${!isDraggingVideo && dragOverCatIdx === catIdx ? "bg-primary/5 ring-1 ring-primary/30" : ""} ${isDropTarget ? "bg-primary/10 ring-2 ring-primary/50" : ""} ${expanded ? "bg-muted/10" : ""}`}
                      draggable={!isDraggingVideo}
                      onDragStart={(e) => onCatDragStart(e, catIdx)}
                      onDragOver={(e) => { e.preventDefault(); onCatDragOver(e, catIdx); onCatDragEnterForVideo(e, cat.id); }}
                      onDragEnter={(e) => onCatDragEnterForVideo(e, cat.id)}
                      onDragLeave={(e) => onCatDragLeaveForVideo(e)}
                      onDrop={(e) => onCatDrop(e, catIdx)}
                      onDragEnd={onCatDragEnd}
                    >
                      <TableCell className="px-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 cursor-grab active:cursor-grabbing" />
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {chapterNum}
                        </span>
                      </TableCell>
                      <TableCell onClick={() => setExpandedCat(expanded ? null : cat.id)}>
                        <div className="flex items-center gap-2">
                          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                          <span className="font-semibold text-foreground">{cat.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[250px]">
                        <span className="line-clamp-2">{cat.description || "—"}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[250px]">
                        <span className="line-clamp-2 italic">{cat.topics || "—"}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="gap-1 font-mono">
                          <Video className="h-3 w-3" />
                          {vids.length}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={cat.status === "published"}
                          onCheckedChange={() => toggleCatStatus(cat)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEditCat(cat); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "category", id: cat.id, name: cat.name }); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded videos */}
                    {expanded && (
                      <TableRow key={`${cat.id}-videos`}>
                        <TableCell colSpan={8} className="p-0 bg-muted/5">
                          <div className="px-6 py-4 ml-10 border-l-2 border-primary/20">
                            {vids.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-2">{t("tutorials.noVideos", "Nessun video in questo capitolo")}</p>
                            ) : (
                              <div className="space-y-2">
                                {vids.map((vid, vidIdx) => (
                                  <TutorialVideoRow
                                    key={vid.id}
                                    vid={vid}
                                    vidIdx={vidIdx}
                                    catId={cat.id}
                                    dragOverVidIdx={dragOverVidIdx}
                                    dragVidCatId={dragVidCatId}
                                    onDragStart={(catId, idx) => onVidDragStart(catId, idx, vid.id)}
                                    onDragOver={onVidDragOver}
                                    onDrop={onVidDrop}
                                    onDragEnd={onVidDragEnd}
                                    onToggleStatus={toggleVidStatus}
                                    onEdit={openEditVid}
                                    onDelete={(vid) => setDeleteTarget({ type: "video", id: vid.id, name: vid.title })}
                                  />
                                ))}
                              </div>
                            )}
                            <Button variant="outline" size="sm" className="gap-1.5 mt-3" onClick={() => openNewVid(cat.id)}>
                              <Plus className="h-3.5 w-3.5" />
                              {t("tutorials.addVideo", "Aggiungi video")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Category Dialog */}
      <TutorialCategoryDialog
        open={catDialogOpen}
        onOpenChange={setCatDialogOpen}
        editing={editingCat}
        onSave={saveCat}
      />

      {/* Video Dialog */}
      <TutorialVideoDialog
        open={vidDialogOpen}
        onOpenChange={setVidDialogOpen}
        editing={editingVid}
        onSave={saveVid}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("common.delete")}
        description={`${t("common.delete")} "${deleteTarget?.name}"?`}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
