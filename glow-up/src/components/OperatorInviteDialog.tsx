import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface OperatorInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operatorId: string;
  operatorName: string;
}

export default function OperatorInviteDialog({ open, onOpenChange, operatorId, operatorName }: OperatorInviteDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [link, setLink] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateInvite = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase
        .from("operator_invites" as any)
        .insert({ user_id: user.id, operator_id: operatorId } as any)
        .select("token")
        .single();

      if (error) throw error;
      const url = `${window.location.origin}/staff-portal/invite/${(data as any).token}`;
      setLink(url);
    } catch (err: any) {
      toast.error(t("staffPortal.inviteError"));
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success(t("portal.linkCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!link) return;
    const text = encodeURIComponent(t("staffPortal.whatsappMessage", { link }));
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setLink(null); setCopied(false); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">{t("staffPortal.inviteOperator")}</DialogTitle>
          <DialogDescription>
            {t("staffPortal.inviteOperatorDesc", { name: operatorName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!link ? (
            <Button variant="hero" className="w-full" onClick={generateInvite} disabled={generating}>
              {generating ? t("common.loading") : t("portal.generateLink")}
            </Button>
          ) : (
            <>
              <div className="flex gap-2">
                <Input value={link} readOnly className="text-xs" />
                <Button variant="outline" size="icon" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={shareWhatsApp}>
                  <Send className="h-4 w-4" />
                  WhatsApp
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                  {t("portal.copyLink")}
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">{t("portal.linkNoExpiry")}</p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
