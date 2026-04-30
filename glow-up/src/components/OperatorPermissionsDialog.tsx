import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Operator } from "@/hooks/useOperators";

interface OperatorPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operator: Operator | null;
  onSaved?: () => void;
}

const PERMISSION_KEYS = ["agenda", "clients", "inventory", "pos", "balance", "operators", "shifts"] as const;

export default function OperatorPermissionsDialog({ open, onOpenChange, operator, onSaved }: OperatorPermissionsDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!operator || !open) return;
    // Fetch fresh permissions from DB every time dialog opens
    const fetchFresh = async () => {
      const { data } = await supabase
        .from("operators")
        .select("portal_permissions")
        .eq("id", operator.id)
        .single();
      const existing = (data?.portal_permissions as Record<string, boolean>) || {};
      setPermissions(
        PERMISSION_KEYS.reduce((acc, key) => ({ ...acc, [key]: !!existing[key] }), {} as Record<string, boolean>)
      );
    };
    fetchFresh();
  }, [operator?.id, open]);

  const handleToggle = (key: string) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!operator) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("operators")
        .update({ portal_permissions: permissions } as any)
        .eq("id", operator.id);

      if (error) throw error;
      toast.success(t("staffPortal.permissionsSaved"));
      // Invalidate operators cache so fresh data is used next time
      await queryClient.invalidateQueries({ queryKey: ["operators"] });
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error(t("common.error", { defaultValue: "Errore" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">{t("staffPortal.permissions")}</DialogTitle>
          <DialogDescription>
            {t("staffPortal.permissionsDesc", { name: operator?.name || "" })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {PERMISSION_KEYS.map(key => (
            <div key={key} className="flex items-start gap-3">
              <Checkbox
                id={`perm-${key}`}
                checked={!!permissions[key]}
                onCheckedChange={() => handleToggle(key)}
              />
              <div className="grid gap-0.5 leading-none">
                <Label htmlFor={`perm-${key}`} className="font-medium cursor-pointer">
                  {t(`staffPortal.permissionLabels.${key}`)}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t(`staffPortal.permissionDescriptions.${key}`)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button variant="hero" onClick={handleSave} disabled={saving}>
            {saving ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
