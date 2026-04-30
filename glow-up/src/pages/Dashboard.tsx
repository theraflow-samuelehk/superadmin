import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Euro, TrendingUp, Clock, Sparkles, Settings2, ShoppingBag, Banknote } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalization } from "@/hooks/useLocalization";

import { useAppointments } from "@/hooks/useAppointments";
import { useClients } from "@/hooks/useClients";
import { useTransactions } from "@/hooks/useTransactions";

import { useMemo, useState, useCallback } from "react";
import { format, startOfDay, endOfDay, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const statusColors: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-primary/10 text-primary",
  confirmed: "bg-secondary text-secondary-foreground",
  cancelled: "bg-muted text-muted-foreground",
  no_show: "bg-destructive/10 text-destructive",
};

type WidgetKey = "stats" | "schedule";

const DEFAULT_WIDGETS: Record<WidgetKey, boolean> = { stats: true, schedule: true };

export default function Dashboard() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocalization();
  

  const [widgets, setWidgets] = useState<Record<WidgetKey, boolean>>(() => {
    try {
      const saved = localStorage.getItem("dashboard_widgets");
      return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
    } catch { return DEFAULT_WIDGETS; }
  });

  const toggleWidget = useCallback((key: WidgetKey) => {
    setWidgets((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("dashboard_widgets", JSON.stringify(next));
      return next;
    });
  }, []);

  const today = new Date();
  const todayRange = useMemo(() => ({
    from: startOfDay(today).toISOString(),
    to: endOfDay(today).toISOString(),
  }), []);

  const { appointments, isLoading: aptsLoading } = useAppointments(todayRange);
  const { clients } = useClients();
  const { todaySummary, isLoading: txLoading, transactions } = useTransactions(todayRange);

  const activeClients = clients.filter((c) => !c.deleted_at);
  const now = new Date();
  const completedToday = appointments.filter(
    (a) => a.status === "completed" || 
    (["confirmed", "in_progress"].includes(a.status) && new Date(a.start_time) < now)
  ).length;
  const remainingToday = appointments.filter(
    (a) => ["confirmed", "in_progress"].includes(a.status) && new Date(a.start_time) >= now
  ).length;

  // Incasso Cassa: solo transazioni POS
  const posRevenue = todaySummary.grandTotal;
  const posCount = todaySummary.count;

  // Incasso Appuntamenti: appuntamenti attivi senza transazione collegata (allineato a useBalance)
  const activeStatuses = ["confirmed", "in_progress", "completed"];
  const appointmentRevenue = useMemo(() => {
    const appointmentIdsWithTx = new Set(
      transactions
        .filter((tx) => tx.appointment_id && tx.status === "completed")
        .map((tx) => tx.appointment_id)
    );
    return appointments
      .filter((a) => activeStatuses.includes(a.status) && !appointmentIdsWithTx.has(a.id))
      .reduce((sum, a) => sum + (a.final_price ?? a.services?.price ?? 0), 0);
  }, [appointments, transactions]);

  const completedAppts = appointments.filter((a) => activeStatuses.includes(a.status));

  const stats = [
    { label: t("dashboard.todayAppointments"), value: String(appointments.length), icon: Calendar, trend: `${remainingToday} ${t("dashboard.remaining")}` },
    { label: t("dashboard.posRevenue"), value: formatCurrency(posRevenue), icon: ShoppingBag, trend: `${posCount} ${t("pos.transactions")}` },
    { label: t("dashboard.appointmentRevenue"), value: formatCurrency(appointmentRevenue), icon: Banknote, trend: `${completedAppts.length} ${t("dashboard.appointments")}` },
    { label: t("dashboard.totalClients"), value: String(activeClients.length), icon: Users, trend: t("dashboard.thisMonth") },
    { label: t("dashboard.completedServices"), value: String(completedToday), icon: Sparkles, trend: `${remainingToday} ${t("dashboard.remaining")}` },
  ];

  const isLoading = aptsLoading || txLoading;

  const widgetLabels: Record<WidgetKey, string> = {
    stats: t("dashboard.widgetStats"),
    schedule: t("dashboard.widgetSchedule"),
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-sans font-semibold text-foreground">{t("dashboard.greeting")}</h1>
            <p className="text-muted-foreground mt-0.5 sm:mt-1 text-xs sm:text-base">{t("dashboard.subtitle")}</p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56">
              <p className="text-sm font-medium mb-3">{t("dashboard.customizeWidgets")}</p>
              {(Object.keys(widgetLabels) as WidgetKey[]).map((key) => (
                <div key={key} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-foreground">{widgetLabels[key]}</span>
                  <Switch checked={widgets[key]} onCheckedChange={() => toggleWidget(key)} />
                </div>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        {widgets.stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="shadow-card hover:shadow-soft transition-shadow duration-300 border-border/50">
                <CardContent className="p-3 sm:p-5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                      {isLoading ? (
                        <Skeleton className="h-6 sm:h-8 w-14 sm:w-16 mt-1" />
                      ) : (
                        <p className="text-xl sm:text-2xl font-semibold text-foreground mt-0.5 sm:mt-1 truncate">{stat.value}</p>
                      )}
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 shrink-0 text-emerald-500 dark:text-emerald-400" />
                        <span className="truncate">{stat.trend}</span>
                      </p>
                    </div>
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}


        {widgets.schedule && (
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-serif flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {t("dashboard.todaySchedule")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t("agenda.noAppointments")}</p>
            ) : (
              <div className="space-y-2">
                {appointments.map((apt) => {
                  const dur = apt.services?.duration_minutes ?? 0;
                  const durLabel = dur >= 60
                    ? `${Math.floor(dur / 60)}h${dur % 60 > 0 ? dur % 60 : ""}`
                    : `${dur} min`;
                  return (
                    <div key={apt.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
                      <div className="w-12 shrink-0 text-center">
                        <p className="font-bold tabular-nums text-sm text-primary">
                          {format(parseISO(apt.start_time), "HH:mm")}
                        </p>
                      </div>
                      <div
                        className="w-1 self-stretch rounded-full shrink-0"
                        style={{ backgroundColor: apt.operators?.calendar_color || "hsl(var(--primary))" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {apt.clients?.first_name} {apt.clients?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {apt.services?.name} · {durLabel}
                        </p>
                      </div>
                      <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors[apt.status] || ""}`}>
                        {t(`agenda.status.${apt.status}`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
