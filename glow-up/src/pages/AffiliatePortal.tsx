import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useAffiliatePortal } from "@/hooks/useAffiliatePortal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Handshake, LogOut, Users, DollarSign, BarChart3, TrendingUp, Plus, Link2, UserPlus, Copy, Check } from "lucide-react";
import { useLocalization } from "@/hooks/useLocalization";
import { toast } from "sonner";

export default function AffiliatePortal() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { data, isLoading, error, refetch, createTeamMember, createTeamInvite, assignClientToMember } = useAffiliatePortal();
  const { formatCurrency, formatDate } = useLocalization();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAssignClient, setShowAssignClient] = useState<string | null>(null); // affiliate_id

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/affiliate-portal/login";
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-auto bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-4xl p-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-full overflow-auto bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-muted-foreground">{t("affiliatePortal.errorLoading")}</p>
            <Button variant="outline" onClick={refetch}>{t("portal.retry")}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { affiliate, clients, commissions, team_members, team_commissions } = data;
  const isTeamMember = !affiliate.is_manager && !!affiliate.manager_id;

  const totalCommissions = commissions.reduce((sum, c) => sum + (c.status !== "cancelled" ? c.commission_amount : 0), 0);
  const pendingCommissions = commissions.filter((c) => c.status === "pending").reduce((sum, c) => sum + c.commission_amount, 0);
  const totalRevenue = commissions.reduce((sum, c) => sum + (c.status !== "cancelled" ? c.payment_amount : 0), 0);

  const roleLabel = affiliate.is_manager
    ? t("affiliatePortal.manager")
    : isTeamMember
      ? t("affiliate.teamMember")
      : t("affiliatePortal.affiliate");

  const handleRegenInvite = async (affiliateId: string) => {
    try {
      const result = await createTeamInvite(affiliateId);
      const link = `${window.location.origin}/affiliate-portal/invite/${result.token}`;
      await navigator.clipboard.writeText(link);
      toast.success(t("affiliatePortal.inviteRegenerated"));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAssignClient = async (retailerUserId: string) => {
    if (!showAssignClient) return;
    try {
      await assignClientToMember(showAssignClient, retailerUserId);
      toast.success(t("affiliatePortal.clientAssigned"));
      setShowAssignClient(null);
    } catch (err: any) {
      if (err.message === "already_assigned") {
        toast.error(t("affiliatePortal.alreadyAssigned"));
      } else {
        toast.error(err.message);
      }
    }
  };

  // Clients available for assignment (manager's clients not yet assigned to the target member)
  const getAvailableClients = (memberId: string) => {
    const member = team_members.find((m) => m.id === memberId);
    const memberClientIds = new Set((member?.clients || []).map((c) => c.retailer_user_id));
    return clients.filter((c) => !memberClientIds.has(c.retailer_user_id));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Handshake className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">
                {affiliate.first_name} {affiliate.last_name}
              </h1>
              <p className="text-xs text-muted-foreground">
                {roleLabel}
                {" · "}{affiliate.commission_pct}%
                {isTeamMember && affiliate.team_commission_pct != null && (
                  <span className="ml-1">({t("affiliate.teamPct")}: {affiliate.team_commission_pct}%)</span>
                )}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" />
            {t("common.logout")}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">{t("affiliatePortal.dashboard")}</TabsTrigger>
            <TabsTrigger value="clients">{t("affiliate.clients")}</TabsTrigger>
            <TabsTrigger value="commissions">{t("affiliate.commissions")}</TabsTrigger>
            {affiliate.is_manager && (
              <TabsTrigger value="team">{t("affiliate.team")}</TabsTrigger>
            )}
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <DashboardStats
              clients={clients}
              totalRevenue={totalRevenue}
              totalCommissions={totalCommissions}
              pendingCommissions={pendingCommissions}
              formatCurrency={formatCurrency}
              t={t}
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("affiliatePortal.recentCommissions")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CommissionTable commissions={commissions.slice(0, 10)} showType={false} formatCurrency={formatCurrency} formatDate={formatDate} t={t} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients */}
          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("affiliate.assignedClients")} ({clients.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {clients.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{t("affiliate.noClients")}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("affiliate.retailer")}</TableHead>
                        <TableHead>{t("affiliate.assignedAt")}</TableHead>
                        <TableHead>{t("affiliatePortal.subscriptionStatus")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((c) => {
                        const activeSub = c.subscriptions.find((s) => s.status === "active");
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium text-sm">{c.salon_name}</TableCell>
                            <TableCell className="text-sm">{formatDate(new Date(c.assigned_at))}</TableCell>
                            <TableCell>
                              {activeSub ? (
                                <Badge variant="default">{activeSub.plan?.name || "Attivo"}</Badge>
                              ) : (
                                <Badge variant="secondary">{t("affiliatePortal.noSubscription")}</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions */}
          <TabsContent value="commissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("affiliate.commissions")}</CardTitle>
              </CardHeader>
              <CardContent>
                <CommissionTable commissions={commissions} showType formatCurrency={formatCurrency} formatDate={formatDate} t={t} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team (manager only) */}
          {affiliate.is_manager && (
            <TabsContent value="team" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{t("affiliate.team")} ({team_members.length})</CardTitle>
                  <Button size="sm" onClick={() => setShowAddMember(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    {t("affiliatePortal.addMember")}
                  </Button>
                </CardHeader>
                <CardContent>
                  {team_members.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{t("affiliate.noTeamMembers")}</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("affiliate.name")}</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>{t("affiliate.commissionPct")}</TableHead>
                          <TableHead>{t("affiliate.teamPct")}</TableHead>
                          <TableHead>{t("affiliate.assignedClients")}</TableHead>
                          <TableHead>{t("affiliatePortal.actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {team_members.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium text-sm">{m.first_name} {m.last_name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{m.email}</TableCell>
                            <TableCell className="text-sm">{m.commission_pct}%</TableCell>
                            <TableCell className="text-sm">{m.team_commission_pct ?? "-"}%</TableCell>
                            <TableCell className="text-sm">{m.clients?.length || 0}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" title={t("affiliatePortal.regenerateInvite")} onClick={() => handleRegenInvite(m.id)}>
                                  <Link2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" title={t("affiliatePortal.assignClient")} onClick={() => setShowAssignClient(m.id)}>
                                  <UserPlus className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {team_commissions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t("affiliatePortal.teamCommissions")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("affiliate.date")}</TableHead>
                          <TableHead>{t("affiliatePortal.member")}</TableHead>
                          <TableHead>{t("affiliate.commissionAmount")}</TableHead>
                          <TableHead>{t("affiliate.status")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {team_commissions.slice(0, 20).map((c) => {
                          const member = team_members.find((m) => m.id === c.affiliate_id);
                          return (
                            <TableRow key={c.id}>
                              <TableCell className="text-sm">{formatDate(new Date(c.created_at))}</TableCell>
                              <TableCell className="text-sm">{member ? `${member.first_name} ${member.last_name}` : "-"}</TableCell>
                              <TableCell className="text-sm font-medium">{formatCurrency(c.commission_amount)}</TableCell>
                              <TableCell><CommissionStatusBadge status={c.status} t={t} /></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Add Member Dialog */}
      <TeamMemberFormDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        onSubmit={createTeamMember}
        t={t}
      />

      {/* Assign Client Dialog */}
      {showAssignClient && (
        <Dialog open={!!showAssignClient} onOpenChange={() => setShowAssignClient(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("affiliatePortal.assignClientTitle")}</DialogTitle>
            </DialogHeader>
            {(() => {
              const available = getAvailableClients(showAssignClient);
              if (available.length === 0) {
                return <p className="text-sm text-muted-foreground py-4 text-center">{t("affiliatePortal.noClientsToAssign")}</p>;
              }
              return (
                <div className="space-y-3">
                  <Label>{t("affiliatePortal.selectClient")}</Label>
                  <Select onValueChange={(val) => handleAssignClient(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("affiliatePortal.selectClient")} />
                    </SelectTrigger>
                    <SelectContent>
                      {available.map((c) => (
                        <SelectItem key={c.retailer_user_id} value={c.retailer_user_id}>
                          {c.salon_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ── TeamMemberFormDialog ── */

function TeamMemberFormDialog({
  open, onOpenChange, onSubmit, t
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (payload: any) => Promise<{ affiliate: any; invite_token: string }>;
  t: (k: string) => string;
}) {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", commission_pct: 10, team_commission_pct: 0 });
  const [saving, setSaving] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setForm({ first_name: "", last_name: "", email: "", commission_pct: 10, team_commission_pct: 0 });
    setInviteLink(null);
    setCopied(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const result = await onSubmit({
        ...form,
        email: form.email.trim().toLowerCase(),
        team_commission_pct: form.team_commission_pct || null,
      });
      const link = `${window.location.origin}/affiliate-portal/invite/${result.invite_token}`;
      setInviteLink(link);
      toast.success(t("affiliatePortal.memberCreated"));
    } catch (err: any) {
      toast.error(t("affiliatePortal.createError") + ": " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success(t("affiliatePortal.linkCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("affiliatePortal.createMember")}</DialogTitle>
          <DialogDescription>{t("affiliatePortal.createMemberDesc")}</DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("affiliatePortal.memberCreated")}</p>
            <div>
              <Label>{t("affiliatePortal.inviteLink")}</Label>
              <div className="flex gap-2 mt-1">
                <Input value={inviteLink} readOnly className="text-xs" />
                <Button size="icon" variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button className="w-full" onClick={() => handleClose(false)}>{t("common.close")}</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("affiliatePortal.firstName")}</Label>
                <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <Label>{t("affiliatePortal.lastName")}</Label>
                <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>{t("affiliatePortal.email")}</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("affiliatePortal.commissionPct")}</Label>
                <Input type="number" min={0} max={100} value={form.commission_pct} onChange={(e) => setForm({ ...form, commission_pct: Number(e.target.value) })} />
              </div>
              <div>
                <Label>{t("affiliatePortal.teamCommissionPct")}</Label>
                <Input type="number" min={0} max={100} value={form.team_commission_pct} onChange={(e) => setForm({ ...form, team_commission_pct: Number(e.target.value) })} />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={saving || !form.first_name || !form.last_name || !form.email}
            >
              {saving ? t("affiliatePortal.creating") : t("affiliatePortal.addMember")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Sub-components ── */

function StatsCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function DashboardStats({
  clients, totalRevenue, totalCommissions, pendingCommissions, formatCurrency, t
}: {
  clients: any[];
  totalRevenue: number;
  totalCommissions: number;
  pendingCommissions: number;
  formatCurrency: (v: number) => string;
  t: (k: string) => string;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatsCard icon={<Users className="h-4 w-4" />} label={t("affiliate.assignedClients")} value={String(clients.length)} />
      <StatsCard icon={<BarChart3 className="h-4 w-4" />} label={t("affiliatePortal.totalRevenue")} value={formatCurrency(totalRevenue)} />
      <StatsCard icon={<DollarSign className="h-4 w-4" />} label={t("affiliate.totalCommissions")} value={formatCurrency(totalCommissions)} />
      <StatsCard icon={<TrendingUp className="h-4 w-4" />} label={t("affiliate.statusPending")} value={formatCurrency(pendingCommissions)} />
    </div>
  );
}

function CommissionStatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  return (
    <Badge variant={status === "paid" ? "default" : status === "pending" ? "secondary" : "destructive"}>
      {t(`affiliate.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
    </Badge>
  );
}

function CommissionTable({
  commissions, showType, formatCurrency, formatDate, t
}: {
  commissions: Array<any>;
  showType: boolean;
  formatCurrency: (v: number) => string;
  formatDate: (d: Date) => string;
  t: (k: string) => string;
}) {
  if (commissions.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">{t("affiliate.noCommissions")}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("affiliate.date")}</TableHead>
          <TableHead>{t("affiliate.retailer")}</TableHead>
          <TableHead>{t("affiliate.paymentAmount")}</TableHead>
          {showType && <TableHead>%</TableHead>}
          <TableHead>{t("affiliate.commissionAmount")}</TableHead>
          {showType && <TableHead>{t("affiliatePortal.type")}</TableHead>}
          <TableHead>{t("affiliate.status")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {commissions.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="text-sm">{formatDate(new Date(c.created_at))}</TableCell>
            <TableCell className="text-sm">{c.retailer_name || "-"}</TableCell>
            <TableCell className="text-sm">{formatCurrency(c.payment_amount)}</TableCell>
            {showType && <TableCell className="text-sm">{c.commission_pct}%</TableCell>}
            <TableCell className="text-sm font-medium">{formatCurrency(c.commission_amount)}</TableCell>
            {showType && (
              <TableCell className="text-sm">
                {c.is_manager_share ? t("affiliate.managerShare") : t("affiliate.directCommission")}
              </TableCell>
            )}
            <TableCell>
              <CommissionStatusBadge status={c.status} t={t} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
