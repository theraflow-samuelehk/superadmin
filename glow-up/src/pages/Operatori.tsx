import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Plus, MoreVertical, Edit, Archive, ArchiveRestore, UserCog, Link2, Shield, GripVertical, Eye, EyeOff, Search } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useOperators, type Operator } from "@/hooks/useOperators";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOperatorShifts } from "@/hooks/useStaffManagement";
import OperatorFormDialog from "@/components/OperatorFormDialog";
import OperatorInviteDialog from "@/components/OperatorInviteDialog";
import OperatorPermissionsDialog from "@/components/OperatorPermissionsDialog";

export default function Operatori() {
  const { t } = useTranslation();
  const { operators, isLoading, createOperator, updateOperator, archiveOperator, restoreOperator } = useOperators();
  const { saveShifts } = useOperatorShifts();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<Operator | null>(null);
  const [inviteOp, setInviteOp] = useState<Operator | null>(null);
  const [permissionsOp, setPermissionsOp] = useState<Operator | null>(null);

  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);

  // Touch drag state
  const touchDragIdx = useRef<number | null>(null);
  const touchCloneRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef<number>(0);
  const touchCurrentOverIdx = useRef<number | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  const filtered = operators.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));
  const active = filtered
    .filter(o => !o.deleted_at)
    .sort((a, b) => (a.agenda_position || 999) - (b.agenda_position || 999));
  const archived = filtered.filter(o => o.deleted_at);

  const handleOpenCreate = () => { setEditingOp(null); setDialogOpen(true); };
  const handleOpenEdit = (o: Operator) => { setEditingOp(o); setDialogOpen(true); };

  const handleSubmit = (data: any) => {
    const { _pendingShifts, ...operatorData } = data;
    if (editingOp) {
      updateOperator.mutate({ id: editingOp.id, ...operatorData }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createOperator.mutate(operatorData, {
        onSuccess: (newOp: any) => {
          setDialogOpen(false);
          if (_pendingShifts && newOp?.id) {
            saveShifts.mutate({ operatorId: newOp.id, shifts: _pendingShifts });
          }
        },
      });
    }
  };

  const handleToggleVisibility = (op: Operator) => {
    updateOperator.mutate({ id: op.id, calendar_visible: !op.calendar_visible });
  };

  // Persist reorder
  const persistReorder = useCallback((sourceIdx: number, targetIdx: number) => {
    if (sourceIdx === targetIdx) return;
    const reordered = [...active];
    const [moved] = reordered.splice(sourceIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    reordered.forEach((op, i) => {
      const newPos = i + 1;
      if (op.agenda_position !== newPos) {
        updateOperator.mutate({ id: op.id, agenda_position: newPos });
      }
    });
  }, [active, updateOperator]);

  // ─── HTML5 Drag (desktop) ─────────────────────
  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
    dragItemRef.current = idx;
  };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIdx(idx);
  };
  const handleDrop = (targetIdx: number) => {
    const sourceIdx = dragItemRef.current;
    if (sourceIdx !== null) persistReorder(sourceIdx, targetIdx);
    setDragIdx(null);
    setOverIdx(null);
  };
  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  // ─── Touch Drag (mobile) ─────────────────────
  const cleanupTouchDrag = useCallback(() => {
    if (touchCloneRef.current) {
      touchCloneRef.current.remove();
      touchCloneRef.current = null;
    }
    touchDragIdx.current = null;
    touchCurrentOverIdx.current = null;
    setDragIdx(null);
    setOverIdx(null);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, idx: number) => {
    // Only activate from the grip handle area
    const target = e.target as HTMLElement;
    if (!target.closest('[data-grip]')) return;

    e.preventDefault();
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    touchDragIdx.current = idx;

    // Create floating clone
    const sourceEl = itemRefs.current[idx];
    if (!sourceEl) return;
    const rect = sourceEl.getBoundingClientRect();
    const clone = sourceEl.cloneNode(true) as HTMLDivElement;
    clone.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      z-index: 9999;
      pointer-events: none;
      opacity: 0.9;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      border-radius: 12px;
      transition: none;
      transform: scale(1.03);
    `;
    document.body.appendChild(clone);
    touchCloneRef.current = clone;

    if (navigator.vibrate) navigator.vibrate(15);
    setDragIdx(idx);
  }, []);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (touchDragIdx.current === null || !touchCloneRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const dy = touch.clientY - touchStartY.current;
      const sourceEl = itemRefs.current[touchDragIdx.current];
      if (!sourceEl) return;
      const origRect = sourceEl.getBoundingClientRect();
      touchCloneRef.current.style.top = `${origRect.top + dy}px`;

      // Find which item we're over
      let foundIdx: number | null = null;
      for (let i = 0; i < itemRefs.current.length; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (touch.clientY >= r.top && touch.clientY <= r.bottom) {
          foundIdx = i;
          break;
        }
      }
      if (foundIdx !== null && foundIdx !== touchCurrentOverIdx.current) {
        touchCurrentOverIdx.current = foundIdx;
        if (navigator.vibrate) navigator.vibrate(8);
        setOverIdx(foundIdx);
      }
    };

    const handleTouchEnd = () => {
      if (touchDragIdx.current === null) return;
      const sourceIdx = touchDragIdx.current;
      const targetIdx = touchCurrentOverIdx.current;
      if (targetIdx !== null) {
        persistReorder(sourceIdx, targetIdx);
      }
      cleanupTouchDrag();
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchcancel", cleanupTouchDrag);
    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", cleanupTouchDrag);
    };
  }, [persistReorder, cleanupTouchDrag]);

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground">{t("operators.title")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t("operators.subtitle", { count: active.length })}</p>
          </div>
          <Button variant="hero" size="default" className="w-full sm:w-auto sm:size-lg" onClick={handleOpenCreate} data-glowup-id="operators-new-btn">
            <Plus className="h-4 w-4" />
            {t("operators.newOperator")}
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("operators.searchOperator")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : (
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="active">{t("archive.active")} ({active.length})</TabsTrigger>
              <TabsTrigger value="archived">{t("archive.tab")} ({archived.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              {active.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t("operators.noOperators")}</p>
              ) : (
                <div className="space-y-1.5" ref={listContainerRef}>
                  <p className="text-xs text-muted-foreground px-1">{t("operators.dragToReorder")}</p>
                  {active.map((op, idx) => (
                    <div
                      key={op.id}
                      ref={(el) => { itemRefs.current[idx] = el; }}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={() => handleDrop(idx)}
                      onDragEnd={handleDragEnd}
                      className={`
                        group rounded-xl border transition-all duration-150
                        ${dragIdx === idx ? "opacity-40 scale-[0.98]" : ""}
                        ${overIdx === idx && dragIdx !== idx ? "border-primary bg-primary/5 scale-[1.02]" : "border-border/50 bg-card"}
                        ${!op.calendar_visible ? "opacity-60" : ""}
                      `}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
                        {/* Drag handle - touch enabled */}
                        <div
                          data-grip
                          className="cursor-grab active:cursor-grabbing touch-none shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors p-1 -m-1"
                          onTouchStart={(e) => handleTouchStart(e, idx)}
                        >
                          <GripVertical className="h-5 w-5" />
                        </div>

                        {/* Position number */}
                        <span className="text-xs font-mono text-muted-foreground w-5 text-center shrink-0">
                          {idx + 1}
                        </span>

                        {/* Avatar */}
                        <Avatar className="h-11 w-11 shrink-0">
                          {op.photo_url ? (
                            <AvatarImage src={op.photo_url} alt={op.name} className="object-cover" />
                          ) : (
                            <AvatarFallback className="text-sm font-semibold text-primary-foreground" style={{ backgroundColor: op.calendar_color }}>
                              {op.name[0]?.toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{op.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {op.role && <span className="text-xs text-muted-foreground truncate">{op.role}</span>}
                            {op.specializations && op.specializations.length > 0 && (
                              <div className="hidden sm:flex gap-1">
                                {op.specializations.slice(0, 2).map((s, i) => (
                                  <Badge key={i} variant="secondary" className="text-[10px] h-4">{s}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Visibility toggle */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Switch
                            checked={op.calendar_visible}
                            onCheckedChange={() => handleToggleVisibility(op)}
                            aria-label={op.calendar_visible ? t("operators.calendarVisible") : t("operators.hiddenBadge")}
                          />
                          {op.calendar_visible ? (
                            <Eye className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                          )}
                        </div>

                        {/* Color indicator */}
                        <div className="h-3 w-3 rounded-full shrink-0 hidden sm:block" style={{ backgroundColor: op.calendar_color }} />

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-lg hover:bg-secondary shrink-0">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(op)}><Edit className="h-3.5 w-3.5 mr-2" />{t("common.edit")}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setPermissionsOp(op)}><Shield className="h-3.5 w-3.5 mr-2" />{t("staffPortal.permissions")}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setInviteOp(op)}><Link2 className="h-3.5 w-3.5 mr-2" />{t("staffPortal.inviteOperator")}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={async () => {
                              const { count } = await supabase.from("appointments").select("id", { count: "exact", head: true }).eq("operator_id", op.id);
                              if (count && count > 0) {
                                toast.error(t("operators.cannotArchiveWithAppointments"));
                                return;
                              }
                              archiveOperator.mutate(op.id);
                            }} className="text-destructive"><Archive className="h-3.5 w-3.5 mr-2" />{t("common.delete")}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="archived">
              {archived.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t("archive.noArchived")}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {archived.map(op => (
                    <Card key={op.id} className="shadow-card border-border/50 opacity-70">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-full flex items-center justify-center bg-muted">
                              <UserCog className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="font-medium text-foreground">{op.name}</p>
                          </div>
                          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => restoreOperator.mutate(op.id)}>
                            <ArchiveRestore className="h-3 w-3" />{t("archive.restore")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <OperatorFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        operator={editingOp}
        onSubmit={handleSubmit}
        isPending={createOperator.isPending || updateOperator.isPending}
      />

      <OperatorInviteDialog
        open={!!inviteOp}
        onOpenChange={(o) => !o && setInviteOp(null)}
        operatorId={inviteOp?.id || ""}
        operatorName={inviteOp?.name || ""}
      />

      <OperatorPermissionsDialog
        open={!!permissionsOp}
        onOpenChange={(o) => !o && setPermissionsOp(null)}
        operator={permissionsOp}
      />
    </DashboardLayout>
  );
}
