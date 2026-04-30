import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, Users } from "lucide-react";
import { useAffiliates, type Affiliate } from "@/hooks/useAffiliates";
import { AffiliateFormDialog } from "./AffiliateFormDialog";
import { AffiliateDetailDialog } from "./AffiliateDetailDialog";

export function AffiliateTab() {
  const { t } = useTranslation();
  const {
    affiliates, loading, createAffiliate, createInvite,
    fetchAffiliateClients, assignClient, removeClient,
    fetchCommissions, fetchTeamMembers,
  } = useAffiliates();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);

  // Count team members for each manager
  const teamCounts: Record<string, number> = {};
  affiliates.forEach(a => {
    if (a.manager_id) {
      teamCounts[a.manager_id] = (teamCounts[a.manager_id] || 0) + 1;
    }
  });

  return (
    <>
      <Card className="shadow-card border-border/50">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="font-serif">{t("affiliate.title")}</CardTitle>
          <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> {t("affiliate.create")}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">{t("common.loading")}</div>
          ) : affiliates.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">{t("affiliate.noAffiliates")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("affiliate.name")}</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">%</TableHead>
                  <TableHead>{t("affiliate.type")}</TableHead>
                  <TableHead>{t("admin.status")}</TableHead>
                  <TableHead>{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliates.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      {a.first_name} {a.last_name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.email}</TableCell>
                    <TableCell className="text-center">{a.commission_pct}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {a.is_manager ? (
                          <Badge variant="default" className="text-xs gap-1">
                            <Users className="h-3 w-3" /> Manager
                          </Badge>
                        ) : a.manager_id ? (
                          <Badge variant="outline" className="text-xs">{t("affiliate.teamMember")}</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">{t("affiliate.affiliateLabel")}</Badge>
                        )}
                        {a.is_manager && teamCounts[a.id] && (
                          <span className="text-xs text-muted-foreground">({teamCounts[a.id]})</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.auth_user_id ? "default" : "outline"} className="text-xs">
                        {a.auth_user_id ? t("affiliate.active") : t("affiliate.pending")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => setSelectedAffiliate(a)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AffiliateFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSubmit={createAffiliate}
      />

      {selectedAffiliate && (
        <AffiliateDetailDialog
          open={!!selectedAffiliate}
          onOpenChange={(open) => !open && setSelectedAffiliate(null)}
          affiliate={selectedAffiliate}
          fetchClients={fetchAffiliateClients}
          fetchCommissions={fetchCommissions}
          fetchTeamMembers={fetchTeamMembers}
          assignClient={assignClient}
          removeClient={removeClient}
          createInvite={createInvite}
        />
      )}
    </>
  );
}
