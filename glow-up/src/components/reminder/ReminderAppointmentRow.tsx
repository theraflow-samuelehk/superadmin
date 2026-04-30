import { format } from "date-fns";
import { Clock, CheckCircle2, Send, MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Client {
  id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
}

interface Service {
  id: string;
  name: string;
}

interface ReminderLog {
  appointment_id: string;
  channel: string;
  sent_at: string;
}

interface Props {
  appointment: any;
  client: Client | undefined;
  service: Service | undefined;
  reminderLogs: ReminderLog[];
  isSentInSlot: boolean;
  isPast?: boolean;
  onSendWhatsApp: (apt: any) => void;
  onSendSms: (apt: any) => void;
}

export default function ReminderAppointmentRow({
  appointment,
  client,
  service,
  reminderLogs,
  isSentInSlot,
  isPast = false,
  onSendWhatsApp,
  onSendSms,
}: Props) {
  const phone = appointment.contact_phone || client?.phone;
  const aptDate = new Date(appointment.start_time);
  const waLog = reminderLogs.find(l => l.appointment_id === appointment.id && l.channel === "whatsapp");
  const smsLog = reminderLogs.find(l => l.appointment_id === appointment.id && l.channel === "sms");

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 sm:p-3 rounded-lg border transition-colors ${
        isPast ? "bg-muted/30 border-muted opacity-50" : isSentInSlot ? "bg-muted/40 border-muted opacity-70" : "bg-card hover:bg-accent/30"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`font-semibold text-sm truncate ${isPast || isSentInSlot ? "line-through text-muted-foreground" : ""}`}>
            {client ? `${client.first_name} ${client.last_name || ""}`.trim() : "Cliente"}
          </span>
          {isPast && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
              Passato
            </Badge>
          )}
          {appointment.client_confirmed && (
            <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0">
              <CheckCircle2 className="h-3 w-3 mr-0.5" />
              Confermato
            </Badge>
          )}
          {waLog && (
            <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0">
              ✓ WA
            </Badge>
          )}
          {smsLog && (
            <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0">
              ✓ SMS
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(aptDate, "HH:mm")}
          </span>
          <span className="truncate">{service?.name || "-"}</span>
          {!phone && <span className="text-destructive text-[10px]">⚠ No tel</span>}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
        {isPast ? (
          <span className="text-[10px] text-muted-foreground italic">già passato</span>
        ) : (
          <>
            <Button
              size="sm"
              variant={isSentInSlot ? "outline" : "default"}
              className={isSentInSlot
                ? "h-8 sm:h-9 px-2.5 sm:px-3 border-green-200 text-green-700 hover:bg-green-50"
                : "h-8 sm:h-9 px-2.5 sm:px-3 bg-green-600 hover:bg-green-700 text-white"
              }
              disabled={!phone}
              onClick={() => onSendWhatsApp(appointment)}
            >
              {isSentInSlot ? <RefreshCw className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
              <span className="ml-1 text-xs">{isSentInSlot ? "Rinvia" : "WA"}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 sm:h-9 px-2.5 sm:px-3 text-muted-foreground hover:text-blue-600 hover:border-blue-200"
              disabled={!phone}
              onClick={() => onSendSms(appointment)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="ml-1 text-xs">SMS</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
