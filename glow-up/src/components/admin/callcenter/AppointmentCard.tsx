import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, UserCheck, PhoneCall, Calendar, Clock } from "lucide-react";
import { Agent, AgentAvailability, DAY_NAMES } from "./types";

// Generate 15-min slots from 07:00 to 23:00
const ALL_TIME_SLOTS: string[] = [];
for (let h = 7; h <= 23; h++) {
  for (let m = 0; m < 60; m += 15) {
    if (h === 23 && m > 0) break;
    ALL_TIME_SLOTS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

export interface ExistingBooking {
  agent_id: string;
  date_time: string; // ISO string
}

interface AppointmentCardProps {
  type: "callback" | "onboarding";
  date: string;
  time: string;
  onDateChange: (val: string) => void;
  onTimeChange: (val: string) => void;
  agents: Agent[];
  availabilities: AgentAvailability[];
  assignedAgentId: string | null;
  currentStatus: string;
  onBook: (agentId: string) => void;
  onClear?: () => void;
  existingBookings?: ExistingBooking[];
  currentLeadId?: string;
}

function isAgentAvailableAtSlot(
  agent: Agent,
  availabilities: AgentAvailability[],
  dayOfWeek: number,
  timeSlot: string
): boolean {
  if (!agent.is_active) return false;
  const agentSlots = availabilities.filter(
    (a) => a.agent_id === agent.id && a.day_of_week === dayOfWeek && a.is_active
  );
  return agentSlots.some((slot) => {
    const inFirst = timeSlot >= slot.start_time && timeSlot < slot.end_time;
    const inSecond =
      slot.dual_slot && slot.start_time_2 && slot.end_time_2
        ? timeSlot >= slot.start_time_2 && timeSlot < slot.end_time_2
        : false;
    return inFirst || inSecond;
  });
}

function isAgentBusy(
  agentId: string,
  date: string,
  timeSlot: string,
  bookings: ExistingBooking[],
  currentLeadId?: string
): boolean {
  return bookings.some((b) => {
    if (b.agent_id !== agentId) return false;
    const d = new Date(b.date_time);
    const bookingDate = d.toISOString().slice(0, 10);
    const bookingTime = d.toTimeString().slice(0, 5);
    return bookingDate === date && bookingTime === timeSlot;
  });
}

export default function AppointmentCard({
  type,
  date,
  time,
  onDateChange,
  onTimeChange,
  agents,
  availabilities,
  assignedAgentId,
  currentStatus,
  onBook,
  onClear,
  existingBookings = [],
  currentLeadId,
}: AppointmentCardProps) {
  const isCallback = type === "callback";
  const Icon = isCallback ? PhoneCall : Calendar;
  const title = isCallback ? "Richiamata" : "Onboarding";
  const borderColor = isCallback ? "border-orange-300 dark:border-orange-700" : "border-emerald-300 dark:border-emerald-700";
  const bgColor = isCallback ? "bg-orange-500/5" : "bg-emerald-500/5";
  const iconColor = isCallback ? "text-orange-500" : "text-emerald-600";
  const assignLabel = isCallback ? "Assegna" : "Assegna";
  const matchStatus = isCallback ? "richiamato" : "appuntamento_fissato";
  const requiredRole = isCallback ? "call_center" : "onboarding";

  // Filter agents by role
  const roleAgents = useMemo(
    () => agents.filter((a) => a.is_active && a.role === requiredRole),
    [agents, requiredRole]
  );

  // Compute available time slots: only show slots where at least 1 agent is available AND not busy
  const availableTimeSlots = useMemo(() => {
    if (!date) return [];
    const dayOfWeek = new Date(date).getDay();

    return ALL_TIME_SLOTS.filter((slot) => {
      return roleAgents.some((agent) => {
        const hasAvailability = isAgentAvailableAtSlot(agent, availabilities, dayOfWeek, slot);
        if (!hasAvailability) return false;
        const busy = isAgentBusy(agent.id, date, slot, existingBookings, currentLeadId);
        return !busy;
      });
    });
  }, [date, roleAgents, availabilities, existingBookings, currentLeadId]);

  // Available agents for the selected time slot
  const availableAgents = useMemo(() => {
    if (!date || !time) return [];
    const dayOfWeek = new Date(date).getDay();
    return roleAgents.filter((agent) => {
      const hasAvailability = isAgentAvailableAtSlot(agent, availabilities, dayOfWeek, time);
      if (!hasAvailability) return false;
      const busy = isAgentBusy(agent.id, date, time, existingBookings, currentLeadId);
      return !busy;
    });
  }, [date, time, roleAgents, availabilities, existingBookings, currentLeadId]);

  const selectedDayName = date ? DAY_NAMES[new Date(date).getDay()] : null;

  // Reset time if date changes and current time is not in available slots
  const handleDateChange = (newDate: string) => {
    onDateChange(newDate);
    // Reset time when date changes so user picks from valid slots
    if (time) {
      onTimeChange("");
    }
  };

  return (
    <div className={`rounded-lg border ${borderColor} p-2.5 sm:p-4 space-y-2 sm:space-y-3 ${bgColor} min-w-0 overflow-hidden`}>
      <div className="flex items-center justify-between gap-1">
        <label className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${iconColor} min-w-0`}>
          <Icon className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{title}</span>
        </label>
        {assignedAgentId && onClear && (
          <Button variant="ghost" size="sm" className="text-[10px] sm:text-xs h-6 px-1.5 text-destructive hover:text-destructive shrink-0" onClick={onClear}>
            <XCircle className="h-3 w-3 mr-0.5" /> Cancella
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 min-w-0">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Data</span>
          <Input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Orario</span>
          <Select value={time} onValueChange={onTimeChange} disabled={!date}>
            <SelectTrigger>
              <SelectValue placeholder={!date ? "Seleziona prima la data" : availableTimeSlots.length === 0 ? "Nessuno disponibile" : "Seleziona orario"} />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {availableTimeSlots.length > 0 ? (
                availableTimeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-muted-foreground italic">
                  Nessun orario disponibile per questa data
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {date && !time && availableTimeSlots.length > 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {availableTimeSlots.length} orari disponibili — {selectedDayName}
        </p>
      )}

      {date && availableTimeSlots.length === 0 && (
        <p className="text-xs text-destructive italic">
          Nessuna operatrice disponibile in questa data. Prova un altro giorno.
        </p>
      )}

      {date && time ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Operatrici disponibili — {selectedDayName} {time}
            </span>
            {availableAgents.length > 0 ? (
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-200">
                <CheckCircle2 className="h-3 w-3 mr-1" /> {availableAgents.length} disponibil{availableAgents.length === 1 ? "e" : "i"}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                <XCircle className="h-3 w-3 mr-1" /> Nessuna disponibile
              </Badge>
            )}
          </div>

          {availableAgents.length > 0 ? (
            <div className="grid gap-1.5 sm:gap-2 min-w-0">
              {availableAgents.map((agent) => {
                const isAssigned = assignedAgentId === agent.id && currentStatus === matchStatus;
                const agentSlot = availabilities.find(
                  (a) => a.agent_id === agent.id && a.day_of_week === new Date(date).getDay() && a.is_active
                );
                const slotLabel = agentSlot
                  ? agentSlot.dual_slot
                    ? `${agentSlot.start_time}–${agentSlot.end_time} / ${agentSlot.start_time_2}–${agentSlot.end_time_2}`
                    : `${agentSlot.start_time}–${agentSlot.end_time}`
                  : "";

                return (
                  <div
                    key={agent.id}
                    className={`flex items-center justify-between p-2 sm:p-2.5 rounded-md border transition-colors min-w-0 gap-2 ${
                      isAssigned ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{agent.name}</p>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">{slotLabel}</p>
                      </div>
                    </div>
                    {isAssigned ? (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        <UserCheck className="h-3 w-3 mr-1" /> Assegnata
                      </Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onBook(agent.id)}>
                        {assignLabel}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Nessuna operatrice disponibile in questo slot.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
