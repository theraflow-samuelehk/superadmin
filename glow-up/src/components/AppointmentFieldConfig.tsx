import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Columns2, AlignJustify, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export interface FieldSetting {
  id: string;
  label: string;
  visible: boolean;
  halfWidth: boolean;
  inlineLabel: boolean;
}

const STORAGE_KEY = "appointment-field-config";

export const DEFAULT_FIELDS: FieldSetting[] = [
  { id: "client_history", label: "fieldConfig.clientHistory", visible: true, halfWidth: false, inlineLabel: true },
  { id: "client", label: "fieldConfig.client", visible: true, halfWidth: false, inlineLabel: true },
  { id: "service", label: "fieldConfig.service", visible: true, halfWidth: false, inlineLabel: true },
  { id: "payment", label: "fieldConfig.payment", visible: false, halfWidth: false, inlineLabel: false },
  { id: "phone", label: "fieldConfig.phone", visible: true, halfWidth: false, inlineLabel: true },
  { id: "notes", label: "fieldConfig.notes", visible: true, halfWidth: false, inlineLabel: false },
];

export function loadFieldConfig(): FieldSetting[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved: FieldSetting[] = JSON.parse(raw);
      const validIds = new Set(DEFAULT_FIELDS.map((d) => d.id));
      const filteredSaved = saved.filter((s) => validIds.has(s.id));
      const merged = DEFAULT_FIELDS.map((def) => {
        const found = filteredSaved.find((s) => s.id === def.id);
        return found ? { ...def, ...found } : def;
      });
      const savedOrder = filteredSaved.map((s) => s.id);
      merged.sort((a, b) => {
        const ai = savedOrder.indexOf(a.id);
        const bi = savedOrder.indexOf(b.id);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
      return merged;
    }
  } catch {}
  return DEFAULT_FIELDS;
}

function saveFieldConfig(fields: FieldSetting[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (fields: FieldSetting[]) => void;
  currentFields: FieldSetting[];
}

export function AppointmentFieldConfig({ open, onOpenChange, onSave, currentFields }: Props) {
  const { t } = useTranslation();
  const [fields, setFields] = useState<FieldSetting[]>(currentFields);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  useEffect(() => {
    if (open) setFields(currentFields);
  }, [open, currentFields]);

  const toggleVisible = (id: string) => {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, visible: !f.visible } : f));
  };

  const toggleHalfWidth = (id: string) => {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, halfWidth: !f.halfWidth } : f));
  };

  const toggleInlineLabel = (id: string) => {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, inlineLabel: !f.inlineLabel } : f));
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setFields((prev) => {
      const next = [...prev];
      const [dragged] = next.splice(dragIndex, 1);
      next.splice(index, 0, dragged);
      return next;
    });
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const handleSave = () => {
    saveFieldConfig(fields);
    onSave(fields);
    onOpenChange(false);
  };

  const handleReset = () => {
    setConfirmResetOpen(true);
  };

  const confirmReset = () => {
    setFields(DEFAULT_FIELDS);
    setConfirmResetOpen(false);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="sm:max-w-sm max-w-[calc(100%-1rem)] p-0 gap-0 rounded-2xl border-0 [&>button:last-child]:hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-serif text-base">{t("fieldConfig.title")}</DialogTitle>
            <button
              type="button"
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-3 py-3 space-y-1.5 max-h-[60vh] overflow-y-auto">
          {fields.map((field, index) => (
            <div
              key={field.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex items-center gap-2 px-2.5 py-2.5 rounded-xl border border-border/60 bg-background transition-all",
                dragIndex === index && "opacity-50 scale-[0.98]",
                !field.visible && "opacity-60"
              )}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab shrink-0" />
              <Switch
                checked={field.visible}
                onCheckedChange={() => toggleVisible(field.id)}
                className="shrink-0 scale-90"
              />
              <span className="flex-1 text-sm font-medium truncate">{t(field.label)}</span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  className={cn(
                    "p-1.5 rounded-lg border transition-colors",
                    field.inlineLabel
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  onClick={() => toggleInlineLabel(field.id)}
                  title={t("fieldConfig.inlineLabel")}
                >
                  <AlignJustify className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className={cn(
                    "p-1.5 rounded-lg border transition-colors",
                    field.halfWidth
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  onClick={() => toggleHalfWidth(field.id)}
                  title={t("fieldConfig.halfWidth")}
                >
                  <Columns2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 rounded-xl gap-1.5"
            onClick={handleReset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("fieldConfig.resetDefault")}
          </Button>
          <Button
            type="button"
            size="sm"
            className="flex-1 rounded-xl"
            onClick={handleSave}
          >
            {t("common.saveShort")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={confirmResetOpen}
      onOpenChange={setConfirmResetOpen}
      title={t("fieldConfig.resetDefault")}
      description={t("fieldConfig.resetConfirm")}
      onConfirm={confirmReset}
    />
    </>
  );
}
