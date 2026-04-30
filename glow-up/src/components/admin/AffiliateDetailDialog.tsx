import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocalization } from "@/hooks/useLocalization";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Link, Plus, Trash2, Users } from "lucide-react";
import type { Affiliate, AffiliateClient, AffiliateCommission } from "@/hooks/useAffiliates";

interface Retailer {
  user_id: string;
  salon_name: string | null;
  display_name: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliate: Affiliate;
  fetchClients: (id: string) => Promise<AffiliateClient[]>;
  fetchCommissions: (id: string) => Promise<AffiliateCommission[]>;
  fetchTeamMembers: (id: string) => Promise<Affiliate[]>;
  assignClient: (affiliateId: string, retailerUserId: string) => Promise<boolean>;
  removeClient: (assignmentId: string) => Promise<boolean>;
  createInvite: (affiliateId: string) => Promise<any>;
}

export function AffiliateDetailDialog({
  open, onOpenChange, affiliate,
  fetchClients, fetchCommissions, fetchTeamMembers,
  assignClient, removeClient, createInvite,
}: Props) {
  const { t } = useTranslation();
  const { formatCurrency } = useLocalization();
  const [clients, setClients] = useState<AffiliateClient[]>([]);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [teamMembers, setTeamMembers] = useState<Affiliate[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [selectedRetailer, setSelectedRetailer] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  useEffect(() => {
    if (open && affiliate) {
      loadData();
    }
  }, [open, affiliate?.id]);

  const loadData = async () => {
    const [c, com, r] = await Promise.all([
      fetchClients(affiliate.id),
      fetchCommissions(affiliate.id),
      fetchAllRetailers(),
    ]);
    setClients(c);
    setCommissions(com);
    setRetailers(r);
    if (affiliate.is_manager) {
      const tm = await fetchTeamMembers(affiliate.id);
      setTeamMembers(tm);
    }
  };

  const fetchAllRetailers = async (): Promise<Retailer[]> => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, salon_name, display_name")
      .is("deleted_at", null);
    return (data as any[]) || [];
  };

  const handleAssign = async () => {
    if (!selectedRetailer) return;
    const ok = await assignClient(affiliate.id, selectedRetailer);
    if (ok) {
      toast.success(t("affiliate.clientAssigned"));
      setSelectedRetailer("");
      const c = await fetchClients(affiliate.id);
      setClients(c);
    }
  };

  const handleRemove = async (assignmentId: string) => {
    const ok = await removeClient(assignmentId);
    if (ok) {
      toast.success(t("affiliate.clientRemoved"));
      const c = await fetchClients(affiliate.id);
      setClients(c);
    }
  };

  const handleInvite = async () => {
    const invite = await createInvite(affiliate.id);
    if (invite) {
      const link = `${window.location.origin}/affiliate-portal/invite/${(invite as any).token}`;
      setInviteLink(link);
    }
  };

  const copyInvite = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success(t("affiliate.linkCopied"));
    }
  };

  const assignedUserIds = new Set(clients.map(c => c.retailer_user_id));
  const availableRetailers = retailers.filter(r => !assignedUserIds.has(r.user_id));

  const totalCommissions = commissions
    .filter(c => c.status !== "cancelled")
    .reduce((sum, c) => sum + c.commission_amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {affiliate.first_name} {affiliate.last_name}
            {affiliate.is_manager && (
              <Badge variant="secondary" className="ml-2 text-xs">Manager</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{clients.length}</p>
            <p className="text-xs text-muted-foreground">{t("affiliate.assignedClients")}</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{affiliate.commission_pct}%</p>
            <p className="text-xs text-muted-foreground">{t("affiliate.commissionPct")}</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalCommissions)}</p>
            <p className="text-xs text-muted-foreground">{t("affiliate.totalCommissions")}</p>
          </div>
        </div>

        {/* Invite Link */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleInvite} className="gap-1.5">
            <Link className="h-3.5 w-3.5" /> {t("affiliate.generateInvite")}
          </Button>
          {inviteLink && (
            <Button variant="ghost" size="sm" onClick={copyInvite} className="gap-1.5 text-xs">
              <Copy className="h-3.5 w-3.5" /> {t("affiliate.copyLink")}
            </Button>
          )}
        </div>

        <Tabs defaultValue="clients" className="mt-2">
          <TabsList>
            <TabsTrigger value="clients">{t("affiliate.clients")}</TabsTrigger>
            <TabsTrigger value="commissions">{t("affiliate.commissions")}</TabsTrigger>
            {affiliate.is_manager && (
              <TabsTrigger value="team">{t("affiliate.team")}</TabsTrigger>
            )}
          </TabsList>

          {/* CLIENTS */}
          <TabsContent value="clients" className="space-y-3">
            <div className="flex items-center gap-2">
              <Select value={selectedRetailer} onValueChange={setSelectedRetailer}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t("affiliate.selectRetailer")} />
                </SelectTrigger>
                <SelectContent>
                  {availableRetailers.map(r => (
                    <SelectItem key={r.user_id} value={r.user_id}>
                      {r.salon_name || r.display_name || r.user_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleAssign} disabled={!selectedRetailer} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> {t("affiliate.assign")}
              </Button>
            </div>
            {clients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("affiliate.noClients")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("affiliate.retailer")}</TableHead>
                    <TableHead>{t("affiliate.assignedAt")}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        {c.salon_name || c.display_name || c.retailer_user_id}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(c.assigned_at).toLocaleDateString("it-IT")}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemove(c.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          {/* COMMISSIONS */}
          <TabsContent value="commissions">
            {commissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("affiliate.noCommissions")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("affiliate.retailer")}</TableHead>
                    <TableHead>{t("affiliate.paymentAmount")}</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>{t("affiliate.commissionAmount")}</TableHead>
                    <TableHead>{t("admin.status")}</TableHead>
                    <TableHead>{t("affiliate.date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.salon_name || "—"}</TableCell>
                      <TableCell>{formatCurrency(c.payment_amount)}</TableCell>
                      <TableCell>{c.commission_pct}%</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(c.commission_amount)}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "paid" ? "default" : "secondary"} className="text-xs">
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("it-IT")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          {/* TEAM (only managers) */}
          {affiliate.is_manager && (
            <TabsContent value="team">
              {teamMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t("affiliate.noTeamMembers")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("affiliate.name")}</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>{t("affiliate.teamPct")}</TableHead>
                      <TableHead>{t("admin.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.first_name} {m.last_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.email}</TableCell>
                        <TableCell>{m.team_commission_pct ?? 0}%</TableCell>
                        <TableCell>
                          <Badge variant={m.auth_user_id ? "default" : "outline"} className="text-xs">
                            {m.auth_user_id ? t("affiliate.active") : t("affiliate.pending")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
