import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Euro, Calendar, UserX, TrendingUp, Download, ArrowLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import { useLocalization } from "@/hooks/useLocalization";
import { useOperators } from "@/hooks/useOperators";
import { useAppointments } from "@/hooks/useAppointments";

import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { exportToCsv } from "@/lib/exportCsv";

export default function ReportOperatori() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { formatCurrency } = useLocalization();
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = current month

  const { operators } = useOperators();
  const activeOperators = operators.filter((o) => !o.deleted_at);

  const monthRange = useMemo(() => {
    const target = subMonths(new Date(), selectedMonth);
    return {
      from: startOfMonth(target).toISOString(),
      to: endOfMonth(target).toISOString(),
    };
  }, [selectedMonth]);

  const { appointments, isLoading: aptsLoading } = useAppointments(monthRange);
  

  const monthLabel = format(subMonths(new Date(), selectedMonth), "MMMM yyyy", { locale: it });

  const operatorStats = useMemo(() => {
    return activeOperators.map((op) => {
      const opApts = appointments.filter((a) => a.operator_id === op.id);
      const completed = opApts.filter((a) => a.status === "completed");
      const noShows = opApts.filter((a) => a.status === "no_show");
      const cancelled = opApts.filter((a) => a.status === "cancelled");

      // Revenue based on completed appointments: final_price or service price
      const totalRevenue = completed.reduce(
        (sum, a) => sum + (a.final_price ?? a.services?.price ?? 0),
        0
      );

      const noShowRate = opApts.length > 0 ? Math.round((noShows.length / opApts.length) * 100) : 0;
      const commissionService = (totalRevenue * op.commission_service_pct) / 100;

      return {
        id: op.id,
        name: op.name,
        color: op.calendar_color,
        totalAppointments: opApts.length,
        completed: completed.length,
        noShows: noShows.length,
        cancelled: cancelled.length,
        noShowRate,
        revenue: totalRevenue,
        commission: commissionService,
        commissionPct: op.commission_service_pct,
        target: op.monthly_target,
        targetProgress: op.monthly_target > 0 ? Math.round((totalRevenue / op.monthly_target) * 100) : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [activeOperators, appointments]);

  const totalRevenue = operatorStats.reduce((s, o) => s + o.revenue, 0);
  const totalAppointments = operatorStats.reduce((s, o) => s + o.totalAppointments, 0);
  const avgNoShow = operatorStats.length > 0
    ? Math.round(operatorStats.reduce((s, o) => s + o.noShowRate, 0) / operatorStats.length)
    : 0;

  const isLoading = aptsLoading;

  const chartData = operatorStats.map((o) => ({
    name: o.name.split(" ")[0],
    incasso: Math.round(o.revenue),
    appuntamenti: o.totalAppointments,
  }));

  const handleExport = () => {
    exportToCsv(`report-operatori-${monthLabel}`, operatorStats, [
      { header: "Operatrice", accessor: (o) => o.name },
      { header: "Appuntamenti", accessor: (o) => o.totalAppointments },
      { header: "Completati", accessor: (o) => o.completed },
      { header: "No-show", accessor: (o) => o.noShows },
      { header: "Cancellati", accessor: (o) => o.cancelled },
      { header: "Tasso no-show %", accessor: (o) => o.noShowRate },
      { header: "Incasso €", accessor: (o) => o.revenue.toFixed(2) },
      { header: "Commissione %", accessor: (o) => o.commissionPct },
      { header: "Commissione €", accessor: (o) => o.commission.toFixed(2) },
    ]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 animate-fade-in">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-xl lg:text-3xl font-serif font-bold text-foreground">{t("operatorReport.title")}</h1>
              <p className="text-xs lg:text-sm text-muted-foreground mt-0.5 hidden lg:block">{t("operatorReport.subtitle")}</p>
            </div>
            {/* Mobile buttons */}
            <div className="flex items-center gap-1.5 shrink-0 lg:hidden">
              <Button variant="outline" size="sm" className="h-8 gap-1 px-2.5" onClick={() => navigate("/report")}>
                <ArrowLeft className="h-4 w-4" />
                <span className="text-xs">{t("balance.title")}</span>
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Mobile month selector */}
          <div className="lg:hidden">
            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <SelectItem key={i} value={String(i)}>
                    {format(subMonths(new Date(), i), "MMMM yyyy", { locale: it })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Desktop buttons */}
          <div className="hidden lg:flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/report")}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t("balance.title")}
            </Button>
            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <SelectItem key={i} value={String(i)}>
                    {format(subMonths(new Date(), i), "MMMM yyyy", { locale: it })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t("operatorReport.totalRevenue"), value: formatCurrency(totalRevenue), icon: Euro },
            { label: t("operatorReport.totalAppointments"), value: String(totalAppointments), icon: Calendar },
            { label: t("operatorReport.avgNoShow"), value: `${avgNoShow}%`, icon: UserX },
            { label: t("operatorReport.operators"), value: String(activeOperators.length), icon: TrendingUp },
          ].map((k) => (
            <Card key={k.label} className="shadow-card border-border/50">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                    {isLoading ? <Skeleton className="h-8 w-20 mt-1" /> : (
                      <p className="text-2xl font-bold text-foreground mt-1">{k.value}</p>
                    )}
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <k.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="font-serif capitalize">{t("operatorReport.comparison")} — {monthLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {isLoading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="incasso" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name={t("operatorReport.revenue")} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Operator cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)
          ) : (
            operatorStats.map((op) => (
              <Card key={op.id} className="shadow-card border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: op.color + "20", color: op.color }}
                    >
                      {op.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{op.name}</p>
                      {op.target > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {t("operatorReport.targetProgress")}: {op.targetProgress}%
                        </p>
                      )}
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-lg font-bold text-foreground">{formatCurrency(op.revenue)}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("operatorReport.commission")}: {formatCurrency(op.commission)} ({op.commissionPct}%)
                      </p>
                    </div>
                  </div>

                  {op.target > 0 && (
                    <div className="mb-3">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(op.targetProgress, 100)}%`,
                            backgroundColor: op.color,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{op.totalAppointments}</p>
                      <p className="text-[10px] text-muted-foreground">{t("operatorReport.appointments")}</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{op.completed}</p>
                      <p className="text-[10px] text-muted-foreground">{t("operatorReport.completed")}</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-destructive">{op.noShows}</p>
                      <p className="text-[10px] text-muted-foreground">No-show</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-muted-foreground">{op.cancelled}</p>
                      <p className="text-[10px] text-muted-foreground">{t("operatorReport.cancelledLabel")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
