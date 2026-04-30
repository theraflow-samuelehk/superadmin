import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Phone, Mail, AlertTriangle, Calendar, Receipt, Star, Camera } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocalization } from "@/hooks/useLocalization";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import TreatmentPhotosDialog from "@/components/TreatmentPhotosDialog";
import { useState } from "react";

export default function ClienteDettaglio() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { formatCurrency, formatDate } = useLocalization();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [photosOpen, setPhotosOpen] = useState(false);

  const { data: client, isLoading } = useQuery({
    queryKey: ["client-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: appointments } = useQuery({
    queryKey: ["client-appointments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, services(name, price), operators(name, calendar_color)")
        .eq("client_id", id!)
        .is("deleted_at", null)
        .order("start_time", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: transactions } = useQuery({
    queryKey: ["client-transactions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("client_id", id!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: loyaltyPoints } = useQuery({
    queryKey: ["client-loyalty", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_points")
        .select("*")
        .eq("client_id", id!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: packages } = useQuery({
    queryKey: ["client-packages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_packages")
        .select("*, services(name)")
        .eq("client_id", id!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">{t("common.noData")}</p>
      </DashboardLayout>
    );
  }

  const fullName = [client.first_name, client.last_name].filter(Boolean).join(" ");
  const totalSpent = transactions?.reduce((s, tx) => s + Number((tx as any).total || 0), 0) ?? 0;
  const totalAppts = appointments?.length ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => navigate("/clienti")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-3xl font-serif font-bold text-foreground truncate">{fullName}</h1>
              <Badge variant="secondary" className="shrink-0">{client.loyalty_level}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
              {client.phone && (
                <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3 shrink-0" /> {client.phone}
                </span>
              )}
              {client.email && (
                <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 min-w-0">
                  <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{client.email}</span>
                </span>
              )}
            </div>
          </div>
          <Button variant="outline" size="icon" className="shrink-0 sm:hidden" onClick={() => setPhotosOpen(true)}>
            <Camera className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="shrink-0 hidden sm:flex" onClick={() => setPhotosOpen(true)}>
            <Camera className="h-4 w-4 mr-2" /> {t("photos.title")}
          </Button>
        </div>

        {/* Alert for allergies */}
        {client.allergies && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="font-medium text-destructive text-sm">{t("clients.allergies")}</p>
                <p className="text-sm text-foreground">{client.allergies}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <Card className="shadow-card border-border/50">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs text-muted-foreground">{t("clientDetail.totalSpent")}</p>
              <p className="text-lg sm:text-2xl font-bold text-primary">{formatCurrency(totalSpent)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs text-muted-foreground">{t("clientDetail.totalAppointments")}</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{totalAppts}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs text-muted-foreground">{t("clientDetail.loyaltyPoints")}</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{client.total_points}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs text-muted-foreground">{t("clientDetail.activePackages")}</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{packages?.filter(p => (p as any).used_sessions < (p as any).total_sessions).length ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {client.notes && (
          <Card className="shadow-card border-border/50">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-foreground mb-1">{t("clients.notes")}</p>
              <p className="text-sm text-muted-foreground">{client.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="appointments" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="appointments" className="flex-1 flex items-center gap-1 text-xs sm:text-sm">
              <Calendar className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t("clientDetail.historyAppointments")}</span><span className="sm:hidden">{t("portal.appointments")}</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1 flex items-center gap-1 text-xs sm:text-sm">
              <Receipt className="h-3.5 w-3.5" /> {t("clientDetail.historyTransactions")}
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="flex-1 flex items-center gap-1 text-xs sm:text-sm">
              <Star className="h-3.5 w-3.5" /> {t("clientDetail.loyaltyTab")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            <Card className="shadow-card border-border/50">
              <CardContent className="p-3 sm:p-4">
                {!appointments?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{t("agenda.noAppointments")}</p>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {appointments.map((apt: any) => (
                      <div key={apt.id} className="flex items-start sm:items-center justify-between py-2 border-b border-border/30 last:border-0 gap-2">
                        <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: apt.operators?.calendar_color || "hsl(var(--primary))" }} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{apt.services?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(apt.start_time), "d MMM yyyy HH:mm", { locale: it })}
                              {apt.operators?.name && ` · ${apt.operators.name}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 shrink-0">
                          <Badge variant="outline" className="text-[10px] sm:text-xs">{t(`agenda.status.${apt.status}`)}</Badge>
                          {apt.final_price && <span className="text-xs sm:text-sm font-medium">{formatCurrency(apt.final_price)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="shadow-card border-border/50">
              <CardContent className="p-4">
                {!transactions?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{t("pos.noTransactions")}</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx: any) => (
                      <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {(tx.items as any[])?.map((i: any) => i.name).join(", ") || "-"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.created_at), "d MMM yyyy HH:mm", { locale: it })} · {t(`pos.method.${tx.payment_method}`)}
                          </p>
                        </div>
                        <span className="font-bold text-foreground">{formatCurrency(tx.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loyalty">
            <div className="space-y-4">
              {/* Packages */}
              {packages && packages.length > 0 && (
                <Card className="shadow-card border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg font-serif">{t("loyalty.packagesTab")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {packages.map((pkg: any) => (
                        <div key={pkg.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-foreground">{pkg.name}</p>
                            <p className="text-xs text-muted-foreground">{pkg.services?.name || "-"}</p>
                          </div>
                          <Badge variant={pkg.used_sessions >= pkg.total_sessions ? "secondary" : "default"}>
                            {pkg.used_sessions}/{pkg.total_sessions}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Points history */}
              <Card className="shadow-card border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-serif">{t("clientDetail.pointsHistory")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {!loyaltyPoints?.length ? (
                    <p className="text-sm text-muted-foreground text-center py-8">{t("loyalty.noPoints")}</p>
                  ) : (
                    <div className="space-y-2">
                      {loyaltyPoints.map((lp: any) => (
                        <div key={lp.id} className="flex items-center justify-between py-1.5">
                          <div>
                            <p className="text-sm text-foreground">{lp.description || t(`loyalty.reason${lp.reason.charAt(0).toUpperCase() + lp.reason.slice(1)}`)}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(lp.created_at), "d MMM yyyy", { locale: it })}</p>
                          </div>
                          <span className={`font-bold text-sm ${lp.points >= 0 ? "text-primary" : "text-destructive"}`}>
                            {lp.points >= 0 ? "+" : ""}{lp.points}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {photosOpen && (
        <TreatmentPhotosDialog
          open={photosOpen}
          onOpenChange={setPhotosOpen}
          clientId={id!}
          clientName={fullName}
        />
      )}
    </DashboardLayout>
  );
}
