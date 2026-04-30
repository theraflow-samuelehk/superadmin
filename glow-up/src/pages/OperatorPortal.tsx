import { useState, useMemo } from "react";
import { setPortalPreference } from "@/lib/portalPreference";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { useOperatorPortal } from "@/hooks/useOperatorPortal";
import { EmbeddedProvider } from "@/contexts/EmbeddedContext";
import { format, isSameDay, startOfDay } from "date-fns";
import { it } from "date-fns/locale";

import Magazzino from "@/pages/Magazzino";
import Cassa from "@/pages/Cassa";
import Clienti from "@/pages/Clienti";
import Agenda from "@/pages/Agenda";
import Operatori from "@/pages/Operatori";
import OperatorShiftsTab from "@/components/portal/OperatorShiftsTab";
import { PushToggleCard } from "@/components/portal/PushToggleCard";
import OperatorAppointmentCard from "@/components/portal/OperatorAppointmentCard";
import OperatorPortalLayout from "@/components/portal/OperatorPortalLayout";

export default function OperatorPortal() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useOperatorPortal();

  // Persist portal preference for PWA re-open (iOS standalone)
  useState(() => {
    setPortalPreference("operator");
  });
  const [activeTab, setActiveTab] = useState("appointments");
  const [appointmentFilter, setAppointmentFilter] = useState<"today" | "upcoming" | "past">("today");

  const now = new Date();
  const today = startOfDay(now);

  const filteredAppointments = useMemo(() => {
    if (!data?.appointments) return [];
    const apts = data.appointments.filter(a => a.status !== "cancelled" && a.status !== "no_show");
    if (appointmentFilter === "today") {
      return apts
        .filter(a => isSameDay(new Date(a.start_time), today))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    }
    if (appointmentFilter === "upcoming") {
      return apts
        .filter(a => new Date(a.start_time) >= today)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    }
    return apts
      .filter(a => new Date(a.start_time) < today)
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  }, [data?.appointments, appointmentFilter, today]);

  const groupedByDay = useMemo(() => {
    if (appointmentFilter !== "upcoming") return null;
    const groups: Record<string, typeof filteredAppointments> = {};
    filteredAppointments.forEach(apt => {
      const key = format(new Date(apt.start_time), "yyyy-MM-dd");
      if (!groups[key]) groups[key] = [];
      groups[key].push(apt);
    });
    return groups;
  }, [filteredAppointments, appointmentFilter]);

  // Visit count query for new client indicator
  const listClientIds = useMemo(() => {
    const ids = new Set<string>();
    filteredAppointments.forEach(a => { if (a.client_id) ids.add(a.client_id); });
    return [...ids];
  }, [filteredAppointments]);

  const { data: visitCounts } = useQuery({
    queryKey: ["client-visit-counts-op-list", listClientIds.sort().join(",")],
    queryFn: async () => {
      const { data: d } = await supabase
        .from("appointments")
        .select("client_id")
        .in("client_id", listClientIds)
        .in("status", ["completed", "confirmed", "in_progress"])
        .is("deleted_at", null);
      const counts: Record<string, number> = {};
      d?.forEach(a => { if (a.client_id) counts[a.client_id] = (counts[a.client_id] || 0) + 1; });
      return counts;
    },
    staleTime: 5 * 60 * 1000,
    enabled: listClientIds.length > 0,
  });

  const isNewClient = (clientId: string | null) => {
    if (!clientId || !visitCounts) return false;
    return (visitCounts[clientId] || 0) <= 1;
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-auto flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-full overflow-auto flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{t("portal.errorLoading")}</p>
      </div>
    );
  }

  const permissions = data.operator.portal_permissions || {};
  const isAgendaTab = activeTab === "appointments" && permissions.agenda;

  const getServiceName = (id: string) => data.services.find(s => s.id === id)?.name || "-";
  const getClientName = (id: string) => {
    const c = data.clients.find(cl => cl.id === id);
    return c ? `${c.first_name} ${c.last_name}` : t("agenda.clientLabel");
  };

  return (
    <OperatorPortalLayout
      salonName={data.salon.name}
      operatorName={data.operator.name}
      permissions={permissions}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      noPadding={isAgendaTab}
      ownScroll={isAgendaTab}
    >
      <div className={`mx-auto animate-fade-in ${isAgendaTab ? "h-full" : "space-y-6 max-w-5xl"}`}>
        {activeTab === "settings" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">{t("settings.title")}</h2>
            <PushToggleCard />
          </div>
        )}

        {activeTab === "appointments" && (
          permissions.agenda ? (
          <EmbeddedProvider embedded salonUserId={data.salon.user_id}>
              <Agenda />
            </EmbeddedProvider>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                {(["today", "upcoming", "past"] as const).map(f => (
                  <Button
                    key={f}
                    size="sm"
                    variant={appointmentFilter === f ? "default" : "outline"}
                    onClick={() => setAppointmentFilter(f)}
                  >
                    {t(`staffPortal.filter${f.charAt(0).toUpperCase() + f.slice(1)}`)}
                  </Button>
                ))}
              </div>

              {filteredAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("staffPortal.noAppointmentsFilter")}</p>
              ) : appointmentFilter === "upcoming" && groupedByDay ? (
                <div className="space-y-4">
                  {Object.entries(groupedByDay).map(([dayKey, dayApts]) => (
                    <div key={dayKey}>
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                        {format(new Date(dayApts[0].start_time), "EEEE d MMMM", { locale: it })}
                      </p>
                      <div className="space-y-1.5">
                        {dayApts.map(apt => (
                          <OperatorAppointmentCard
                            key={apt.id}
                            apt={apt}
                            serviceName={getServiceName(apt.service_id)}
                            clientName={getClientName(apt.client_id)}
                            isNew={isNewClient(apt.client_id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredAppointments.map(apt => (
                    <OperatorAppointmentCard
                      key={apt.id}
                      apt={apt}
                      serviceName={getServiceName(apt.service_id)}
                      clientName={getClientName(apt.client_id)}
                      isNew={isNewClient(apt.client_id)}
                      isPast={appointmentFilter === "past"}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {activeTab === "shifts" && permissions.shifts && (
          <OperatorShiftsTab operatorId={data.operator.id} />
        )}

        {activeTab === "inventory" && permissions.inventory && (
          <EmbeddedProvider embedded salonUserId={data.salon.user_id}>
            <Magazzino />
          </EmbeddedProvider>
        )}

        {activeTab === "pos" && permissions.pos && (
          <EmbeddedProvider embedded salonUserId={data.salon.user_id}>
            <Cassa />
          </EmbeddedProvider>
        )}

        {activeTab === "clients" && permissions.clients && (
          <EmbeddedProvider embedded salonUserId={data.salon.user_id}>
            <Clienti />
          </EmbeddedProvider>
        )}

        {activeTab === "operators" && permissions.operators && (
          <EmbeddedProvider embedded salonUserId={data.salon.user_id}>
            <Operatori />
          </EmbeddedProvider>
        )}
      </div>
    </OperatorPortalLayout>
  );
}
