import { format, parseISO, differenceInMinutes } from "date-fns";
import { CheckCircle2, Banknote, Pencil, Sparkles, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Appointment } from "@/hooks/useAppointments";
import CountdownCircle from "./CountdownCircle";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface Props {
  appointment: Appointment;
  now: Date;
  onEdit: (apt: Appointment) => void;
  onCheckout: (apt: Appointment, e: React.MouseEvent) => void;
  isNewClient?: boolean;
}

export default function AppointmentListItem({ appointment: apt, now, onEdit, onCheckout, isNewClient }: Props) {
  const { t } = useTranslation();
  const start = parseISO(apt.start_time);
  const end = parseISO(apt.end_time);
  const durationMin = differenceInMinutes(end, start);
  const operatorColor = apt.operators?.calendar_color || "hsl(var(--primary))";

  const isFuture = start > now;
  const isInProgress = start <= now && end > now;
  const minutesLeft = isFuture ? differenceInMinutes(start, now) : 0;
  const showCountdown = isFuture && minutesLeft <= 60;
  const isImminent = isFuture && minutesLeft <= 10;

  const durationLabel = durationMin >= 60
    ? `${Math.floor(durationMin / 60)}h${durationMin % 60 > 0 ? durationMin % 60 : ""}`
    : `${durationMin} ${t("agenda.minutesShort")}`;

  return (
    <div
      data-glowup-role="appointment-list-item"
      data-glowup-client={apt.clients ? `${apt.clients.first_name} ${apt.clients.last_name || ""}`.trim() : ""}
      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all group bg-primary/5 backdrop-blur-sm shadow-sm border border-primary/10 ${
        isInProgress ? "bg-primary/10 border-primary/20 shadow-md" : ""
      }`}
    >
      {/* Time + Duration */}
      <div className="w-14 shrink-0 text-center">
        <p className={`font-sans font-semibold tabular-nums leading-tight text-foreground ${
          isImminent ? "text-lg animate-pulse" : "text-base"
        }`}>
          {format(start, "HH:mm")}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{durationLabel}</p>
      </div>

      {/* Operator color bar */}
      <div
        className="w-1 self-stretch rounded-full shrink-0 transition-all"
        style={{ backgroundColor: operatorColor }}
      />

      {/* Client & service info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-foreground text-[15px] truncate">
            {apt.clients ? `${apt.clients.first_name} ${apt.clients.last_name || ""}`.trim() : t("agenda.clientLabel")}
          </p>
          {isNewClient && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Sparkles className="h-3 w-3 shrink-0" style={{ color: operatorColor }} />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">{t("agenda.newClient")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {apt.client_confirmed && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: operatorColor }} />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {t("agenda.clientConfirmed")}{apt.client_confirmed_at ? ` ${t("agenda.atTime")} ${format(parseISO(apt.client_confirmed_at), "HH:mm")}` : ""}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {apt.client_rescheduled_at && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <RefreshCw className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {t("agenda.clientRescheduled")} {format(parseISO(apt.client_rescheduled_at), "HH:mm")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{apt.services?.name}</p>
      </div>

      {/* Countdown, checkout, or edit */}
      <div className="shrink-0 flex items-center gap-2">
        {showCountdown && (
          <CountdownCircle minutesLeft={minutesLeft} size={isImminent ? 48 : 40} color={operatorColor} />
        )}
        {isInProgress && (
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full animate-pulse">
            {t("agenda.status.in_progress")}
          </span>
        )}
        {apt.status === "completed" && (
          <button
            onClick={(e) => { e.stopPropagation(); onCheckout(apt, e); }}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Banknote className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          data-glowup-role="appointment-edit"
          onClick={() => onEdit(apt)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/60 transition-colors"
          aria-label="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
