import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface OperatorAppointmentCardProps {
  apt: {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    service_id: string;
    client_id: string;
  };
  serviceName: string;
  clientName: string;
  isNew?: boolean;
  isPast?: boolean;
  operatorColor?: string;
}

const statusColor: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  no_show: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export default function OperatorAppointmentCard({
  apt,
  serviceName,
  clientName,
  isNew,
  isPast,
  operatorColor = "hsl(var(--primary))",
}: OperatorAppointmentCardProps) {
  const { t } = useTranslation();
  const start = new Date(apt.start_time);
  const end = new Date(apt.end_time);
  const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);

  const durationLabel = durationMin >= 60
    ? `${Math.floor(durationMin / 60)}h${durationMin % 60 > 0 ? durationMin % 60 : ""}`
    : `${durationMin} min`;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card border border-border/50 shadow-sm transition-all ${
        isPast ? "opacity-60" : ""
      }`}
    >
      {/* Time */}
      <div className="w-12 shrink-0 text-center">
        <p className="font-bold tabular-nums text-sm text-primary">
          {format(start, "HH:mm")}
        </p>
        {!isPast && (
          <p className="text-[10px] text-muted-foreground">
            {format(end, "HH:mm")}
          </p>
        )}
        {isPast && (
          <p className="text-[10px] text-muted-foreground">
            {format(start, "d MMM", { locale: it })}
          </p>
        )}
      </div>

      {/* Color bar */}
      <div
        className="w-1 self-stretch rounded-full shrink-0"
        style={{ backgroundColor: operatorColor }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="font-semibold text-foreground text-sm truncate">
            {clientName}
          </p>
          {isNew && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Sparkles className="h-3 w-3 shrink-0" style={{ color: operatorColor }} />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {t("agenda.newClient")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {serviceName} · {durationLabel}
        </p>
      </div>

      {/* Status */}
      <Badge className={`shrink-0 text-[10px] px-2 py-0.5 ${statusColor[apt.status] || ""}`}>
        {t(`agenda.status.${apt.status}`)}
      </Badge>
    </div>
  );
}
