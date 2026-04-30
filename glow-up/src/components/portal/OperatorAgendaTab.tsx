import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle2, Sparkles, RefreshCw } from "lucide-react";
import { format, addDays, subDays, isSameDay, startOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import type { PortalAppointment, PortalColleague } from "@/hooks/useOperatorPortal";

interface OperatorAgendaTabProps {
  appointments: PortalAppointment[];
  services: Array<{ id: string; name: string; duration_minutes: number; price: number }>;
  clients: Array<{ id: string; first_name: string; last_name: string }>;
  colleagues: PortalColleague[];
  currentOperatorId: string;
}

const statusColor: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  no_show: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export default function OperatorAgendaTab({
  appointments,
  services,
  clients,
  colleagues,
  currentOperatorId,
}: OperatorAgendaTabProps) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));

  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || "-";
  const getClientName = (id: string) => {
    const c = clients.find(cl => cl.id === id);
    return c ? `${c.first_name} ${c.last_name}` : t("agenda.clientLabel");
  };
  const getOperatorName = (id: string) => {
    if (id === currentOperatorId) return t("staffPortal.you");
    return colleagues.find(o => o.id === id)?.name || "-";
  };
  const getOperatorColor = (id: string) => {
    if (id === currentOperatorId) return "hsl(var(--primary))";
    return colleagues.find(o => o.id === id)?.calendar_color || "#8B5CF6";
  };

  const dayAppointments = useMemo(() => {
    return appointments
      .filter(a => isSameDay(new Date(a.start_time), selectedDate) && a.status !== "cancelled")
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [appointments, selectedDate]);

  // Visit count query for new client indicator
  const dayClientIds = useMemo(() => {
    const ids = new Set<string>();
    dayAppointments.forEach(a => { if (a.client_id) ids.add(a.client_id); });
    return [...ids];
  }, [dayAppointments]);

  const { data: visitCounts } = useQuery({
    queryKey: ["client-visit-counts-operator", dayClientIds.sort().join(",")],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("client_id")
        .in("client_id", dayClientIds)
        .in("status", ["completed", "confirmed", "in_progress"])
        .is("deleted_at", null);
      const counts: Record<string, number> = {};
      data?.forEach(a => { if (a.client_id) counts[a.client_id] = (counts[a.client_id] || 0) + 1; });
      return counts;
    },
    staleTime: 5 * 60 * 1000,
    enabled: dayClientIds.length > 0,
  });

  const isNewClient = (clientId: string | null) => {
    if (!clientId || !visitCounts) return false;
    return (visitCounts[clientId] || 0) <= 1;
  };

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div className="space-y-4">
      {/* Date navigator */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(d => subDays(d, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="font-semibold text-foreground">
            {format(selectedDate, "EEEE d MMMM", { locale: it })}
          </p>
          {!isToday && (
            <button
              className="text-xs text-primary hover:underline"
              onClick={() => setSelectedDate(startOfDay(new Date()))}
            >
              {t("staffPortal.goToToday")}
            </button>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(d => addDays(d, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Appointments list */}
      {dayAppointments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {t("staffPortal.noAppointmentsDay")}
        </p>
      ) : (
        <div className="space-y-2">
          {dayAppointments.map(apt => (
            <Card key={apt.id} className="shadow-card border-border/50 overflow-hidden">
              <div className="flex">
                <div
                  className="w-1 shrink-0"
                  style={{ backgroundColor: getOperatorColor(apt.operator_id) }}
                />
                <CardContent className="p-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        {format(new Date(apt.start_time), "HH:mm")} - {format(new Date(apt.end_time), "HH:mm")}
                      </p>
                      <p className="font-semibold text-foreground text-sm truncate">{getServiceName(apt.service_id)}</p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        {getClientName(apt.client_id)}
                        {isNewClient(apt.client_id) && (
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Sparkles className="h-3 w-3 shrink-0" style={{ color: getOperatorColor(apt.operator_id) }} />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">{t("agenda.newClient")}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {(apt as any).client_confirmed && (
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span title={t("agenda.clientConfirmed")}><CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" /></span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                {t("agenda.clientConfirmed")}{(apt as any).client_confirmed_at ? ` ${t("agenda.atTime")} ${format(new Date((apt as any).client_confirmed_at), "HH:mm")}` : ""}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {(apt as any).client_rescheduled_at && (
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <RefreshCw className="h-3 w-3 text-amber-500 shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                {t("agenda.clientRescheduled")} {format(new Date((apt as any).client_rescheduled_at), "HH:mm")}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        👤 {getOperatorName(apt.operator_id)}
                      </p>
                    </div>
                    <Badge className={`${statusColor[apt.status] || ""} text-xs shrink-0`}>
                      {t(`agenda.status.${apt.status}`)}
                    </Badge>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {dayAppointments.length} {t("staffPortal.appointmentsCount")}
      </p>
    </div>
  );
}
