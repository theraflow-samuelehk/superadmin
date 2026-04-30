import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    first_name: string;
    last_name: string;
    email: string;
    commission_pct: number;
    is_manager: boolean;
  }) => Promise<any>;
}

export function AffiliateFormDialog({ open, onOpenChange, onSubmit }: Props) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [commissionPct, setCommissionPct] = useState("10");
  const [isManager, setIsManager] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error(t("affiliate.fillRequired"));
      return;
    }
    setSaving(true);
    const result = await onSubmit({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      commission_pct: parseFloat(commissionPct) || 10,
      is_manager: isManager,
    });
    setSaving(false);
    if (result) {
      toast.success(t("affiliate.created"));
      setFirstName("");
      setLastName("");
      setEmail("");
      setCommissionPct("10");
      setIsManager(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">{t("affiliate.createTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("affiliate.firstName")}</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>{t("affiliate.lastName")}</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>{t("affiliate.commissionPct")}</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={commissionPct}
              onChange={e => setCommissionPct(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>{t("affiliate.isManager")}</Label>
            <Switch checked={isManager} onCheckedChange={setIsManager} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("common.loading") : t("common.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
