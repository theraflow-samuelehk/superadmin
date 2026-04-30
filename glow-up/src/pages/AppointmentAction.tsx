import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, CalendarClock, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface AppointmentData {
  appointment_id: string;
  user_id: string;
  status: string;
  client_confirmed?: boolean;
  client_action?: string | null;
  appointment: {
    start_time: string;
    end_time: string;
    status: string;
    service_id: string;
    operator_id: string;
    service: { name: string } | null;
    operator: { name: string } | null;
  } | null;
  salon_name: string | null;
  // For token-based (automatic flow)
  id?: string;
}

export default function AppointmentAction() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [data, setData] = useState<AppointmentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Detect if token looks like a UUID, a short_code (10 alphanumeric chars), or a hex token (flow token)
  const isUuid = token && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
  const isShortCode = token && /^[A-Za-z0-9]{8,12}$/.test(token) && !isUuid;
  const isAppointmentId = isUuid || isShortCode;

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const action = isAppointmentId ? "get-appointment-by-id" : "get-appointment-by-token";
      const body = isAppointmentId ? { appointment_id: token } : { token };

      const res = await fetch(
        `${supabaseUrl}/functions/v1/client-portal?action=${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": anonKey },
          body: JSON.stringify(body),
        }
      );
      const result = await res.json();
      if (!res.ok || result.error) {
        setError(result.error || "invalid_token");
      } else {
        setData(result);
        // Check if already acted
        if (result.client_action === "cancelled" || result.client_action === "rescheduled") {
          setDone(result.client_action);
        }
        if (result.status === "cancelled") {
          setDone("cancelled");
        }
      }
    } catch {
      setError("network_error");
    }
    setLoading(false);
  };

  const handleConfirm = async () => {
    if (!token) return;
    setActing(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const action = isAppointmentId ? "appointment-action-by-id" : "appointment-action";
      const body = isAppointmentId
        ? { appointment_id: token, client_action: "confirmed" }
        : { token, client_action: "confirmed" };

      const res = await fetch(
        `${supabaseUrl}/functions/v1/client-portal?action=${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": anonKey },
          body: JSON.stringify(body),
        }
      );
      const result = await res.json();
      if (!res.ok || result.error) {
        if (result.error === "already_acted") {
          setDone(result.action);
        } else {
          toast.error(result.error || "Errore");
        }
      } else {
        setDone("confirmed");
        toast.success(t("appointmentAction.confirmed", "Appuntamento confermato!"));
      }
    } catch {
      toast.error("Errore di rete");
    }
    setActing(false);
  };

  const handleCancel = async () => {
    if (!token) return;
    setActing(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const action = isAppointmentId ? "appointment-action-by-id" : "appointment-action";
      const body = isAppointmentId
        ? { appointment_id: token, client_action: "cancelled" }
        : { token, client_action: "cancelled" };

      const res = await fetch(
        `${supabaseUrl}/functions/v1/client-portal?action=${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": anonKey },
          body: JSON.stringify(body),
        }
      );
      const result = await res.json();
      if (!res.ok || result.error) {
        if (result.error === "already_acted") {
          setDone(result.action);
        } else {
          toast.error(result.error || "Errore");
        }
      } else {
        setDone("cancelled");
        toast.success(t("appointmentAction.cancelled", "Appuntamento annullato"));
      }
    } catch {
      toast.error("Errore di rete");
    }
    setActing(false);
    setShowCancelConfirm(false);
  };

  const handleReschedule = () => {
    if (!data?.appointment) return;
    const apt = data.appointment;
    const params = new URLSearchParams({
      tab: "booking",
      reschedule_id: data.appointment_id,
      service_id: apt.service_id,
      operator_id: apt.operator_id,
    });
    navigate(`/portal?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full shadow-card">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="text-center text-muted-foreground">
              {error === "invalid_token" || error === "not_found"
                ? t("appointmentAction.invalidLink", "Link non valido o scaduto.")
                : t("appointmentAction.error", "Si è verificato un errore.")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data?.appointment) return null;

  const apt = data.appointment;
  const aptDate = new Date(apt.start_time);
  const formattedDate = format(aptDate, "EEEE d MMMM yyyy", { locale: it });
  const formattedTime = format(aptDate, "HH:mm");
  const formattedEndTime = format(new Date(apt.end_time), "HH:mm");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full shadow-card">
        <CardHeader className="text-center pb-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {data.salon_name || "GlowUp"}
          </p>
          <CardTitle className="font-serif text-xl">
            {done
              ? done === "cancelled"
                ? t("appointmentAction.cancelledTitle", "Appuntamento annullato")
                : done === "confirmed"
                  ? t("appointmentAction.confirmedTitle", "Appuntamento confermato")
                  : t("appointmentAction.rescheduledTitle", "Appuntamento spostato")
              : t("appointmentAction.title", "Il tuo appuntamento")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Appointment details */}
          <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 space-y-2">
            <p className="font-medium text-foreground">
              {apt.service?.name || t("appointmentAction.appointment", "Appuntamento")}
            </p>
            {apt.operator?.name && (
              <p className="text-sm text-muted-foreground">
                {t("appointmentAction.with", "con")} {apt.operator.name}
              </p>
            )}
            <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
            <p className="text-lg font-bold text-foreground">{formattedTime} - {formattedEndTime}</p>
          </div>

          {done ? (
            <div className="flex flex-col items-center gap-3 py-4">
              {done === "confirmed" ? (
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              ) : (
                <XCircle className="h-12 w-12 text-destructive" />
              )}
              <p className="text-center text-muted-foreground">
                {done === "cancelled"
                  ? t("appointmentAction.cancelledMsg", "L'appuntamento è stato annullato.")
                  : done === "confirmed"
                    ? t("appointmentAction.confirmedMsg", "Grazie! L'appuntamento è confermato. Ti aspettiamo! 😊")
                    : t("appointmentAction.rescheduledMsg", "L'appuntamento è stato spostato.")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-center text-muted-foreground">
                {t("appointmentAction.actionHint", "Puoi confermare, annullare o spostare il tuo appuntamento:")}
              </p>

              <Button
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={handleConfirm}
                disabled={acting}
              >
                {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                {t("appointmentAction.confirmBtn", "Confermo, ci sarò! ✓")}
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => setShowCancelConfirm(true)}
                disabled={acting}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {t("appointmentAction.cancelBtn", "Annulla appuntamento")}
              </Button>

              <Button
                variant="ghost"
                size="lg"
                className="w-full text-muted-foreground"
                disabled={acting}
                onClick={handleReschedule}
              >
                <CalendarClock className="h-4 w-4 mr-2" />
                {t("appointmentAction.rescheduleBtn", "Sposta appuntamento")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        title={t("portal.cancelConfirmTitle", "Annullare l'appuntamento?")}
        description={t("portal.cancelConfirmMessage", "Questa azione non può essere annullata.")}
        onConfirm={handleCancel}
        variant="destructive"
      />
    </div>
  );
}
