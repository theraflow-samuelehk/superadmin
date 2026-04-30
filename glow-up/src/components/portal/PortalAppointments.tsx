import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, X, CalendarClock } from "lucide-react";
import { format, isPast } from "date-fns";
import { it } from "date-fns/locale";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import type { PortalData } from "@/hooks/useClientPortal";

interface Props {
  data: PortalData;
  onCancel: (appointmentId: string) => Promise<void>;
  onReschedule: (appointment: { id: string; service_id: string; operator_id: string; package_id?: string | null }) => void;
}

export default function PortalAppointments({ data, onCancel, onReschedule }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle push action from service worker — just navigate to appointments tab (no popup)
  useEffect(() => {
    const pushAction = searchParams.get("push_action");
    const appointmentId = searchParams.get("appointment_id");
    if (pushAction && appointmentId) {
      searchParams.delete("push_action");
      searchParams.delete("appointment_id");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  // Listen for messages from service worker
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_ACTION") {
        // No-op: user is already on the appointments tab
      }
    };
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, []);

  const upcoming = data.appointments.filter(a => !isPast(new Date(a.start_time)) && a.status !== "cancelled" && a.status !== "no_show");
  const past = data.appointments.filter(a => isPast(new Date(a.start_time)) || a.status === "cancelled" || a.status === "no_show");

  const statusColor: Record<string, string> = {
    confirmed: "bg-primary/10 text-primary",
    in_progress: "bg-accent/10 text-accent-foreground",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-destructive/10 text-destructive",
    no_show: "bg-muted text-muted-foreground",
  };

  const handleConfirmCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      await onCancel(cancelId);
      toast({ title: t("portal.appointmentCancelled") });
    } catch {
      toast({ title: t("portal.cancelError"), variant: "destructive" });
    } finally {
      setCancelling(false);
      setCancelId(null);
    }
  };

  const renderAppointment = (apt: typeof data.appointments[0], isUpcoming: boolean) => {
    const service = data.services.find(s => s.id === apt.service_id);
    const operator = data.operators.find(o => o.id === apt.operator_id);
    const canAct = isUpcoming && apt.status === "confirmed";

    return (
      <Card key={apt.id} className="shadow-card">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="font-medium text-foreground">{service?.name || "—"}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(apt.start_time), "EEEE d MMMM yyyy", { locale: it })}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(apt.start_time), "HH:mm")} - {format(new Date(apt.end_time), "HH:mm")}
              </div>
              {operator && <p className="text-xs text-muted-foreground">👩‍💼 {operator.name}</p>}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={statusColor[apt.status] || ""} variant="outline">
                {t(`agenda.status.${apt.status}`)}
              </Badge>
              {canAct && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary hover:bg-primary/10 h-7 text-xs"
                    onClick={() => onReschedule({ id: apt.id, service_id: apt.service_id, operator_id: apt.operator_id, package_id: apt.package_id ?? null })}
                  >
                    <CalendarClock className="h-3 w-3 mr-1" />
                    {t("portal.rescheduleAppointment")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs"
                    onClick={() => setCancelId(apt.id)}
                  >
                    <X className="h-3 w-3 mr-1" />
                    {t("portal.cancelAppointment")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="font-serif font-semibold text-lg">{t("portal.upcomingAppointments")}</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{t("portal.noUpcoming")}</p>
        ) : (
          <div className="space-y-3">{upcoming.map(a => renderAppointment(a, true))}</div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-serif font-semibold text-lg">{t("portal.pastAppointments")}</h3>
        {past.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{t("portal.noPast")}</p>
        ) : (
          <div className="space-y-3">{past.map(a => renderAppointment(a, false))}</div>
        )}
      </div>

      <ConfirmDialog
        open={!!cancelId}
        onOpenChange={(open) => !open && setCancelId(null)}
        title={t("portal.cancelConfirmTitle")}
        description={t("portal.cancelConfirmMessage")}
        onConfirm={handleConfirmCancel}
        variant="destructive"
      />
    </div>
  );
}
