import DashboardLayout from "@/components/DashboardLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// tabs removed - using buttons instead
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Clock, Calendar as CalendarIcon, Banknote, CheckCircle2, ListChecks, Sparkles, Plus, RefreshCw, Send, Check, User } from "lucide-react";
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEmbedded } from "@/contexts/EmbeddedContext";
import { format, addDays, startOfMonth, endOfMonth, isSameDay, isSameMonth, parseISO, eachDayOfInterval, addMonths, subMonths, startOfWeek, endOfWeek, setHours, setMinutes, startOfDay, isPast, isFuture as isFutureDate } from "date-fns";
import { it } from "date-fns/locale";
import { useAppointments, type Appointment, type AppointmentStatus } from "@/hooks/useAppointments";
import { useOperators } from "@/hooks/useOperators";
import { useReminderMode } from "@/hooks/useReminderMode";
import AppointmentFormDialog from "@/components/AppointmentFormDialog";
import SmartBookingDialog from "@/components/SmartBookingDialog";
import AppointmentListItem from "@/components/agenda/AppointmentListItem";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AutoFitText from "@/components/agenda/AutoFitText";
import AgendaTour, { type AgendaTourHandle } from "@/components/agenda/AgendaTour";

import { supabase } from "@/integrations/supabase/client";
import { useEffectiveUserId } from "@/hooks/useEffectiveUserId";
import { useTouchDrag } from "@/hooks/useTouchDrag";
import { useQuery } from "@tanstack/react-query";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import UnconfirmedBadge from "@/components/agenda/UnconfirmedBadge";

type ViewMode = "day" | "month";

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  confirmed: "bg-primary/15 border-primary/30 text-primary",
  in_progress: "bg-amber-100 border-amber-300 text-amber-800",
  completed: "bg-emerald-100 border-emerald-300 text-emerald-800",
  cancelled: "bg-muted border-border text-muted-foreground line-through",
  no_show: "bg-destructive/10 border-destructive/30 text-destructive",
};

const SLOT_HEIGHT = 34; // px per half-hour slot

// Compute side-by-side columns for overlapping appointments (Google Calendar style)
function computeOverlapColumns(apts: { id: string; start_time: string; end_time: string }[]) {
  const sorted = [...apts].sort((a, b) => a.start_time.localeCompare(b.start_time));
  const columns: { id: string; end: number }[][] = [];
  const result = new Map<string, { colIndex: number; totalCols: number }>();

  for (const apt of sorted) {
    const start = new Date(apt.start_time).getTime();
    const end = new Date(apt.end_time).getTime();
    let placed = false;
    for (let c = 0; c < columns.length; c++) {
      // Check if this column has no overlap with the appointment
      if (columns[c].every(item => item.end <= start)) {
        columns[c].push({ id: apt.id, end });
        result.set(apt.id, { colIndex: c, totalCols: 0 });
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([{ id: apt.id, end }]);
      result.set(apt.id, { colIndex: columns.length - 1, totalCols: 0 });
    }
  }

  // Now determine totalCols for each group of overlapping appointments
  // We need to find connected components of overlapping appointments
  for (const apt of sorted) {
    const start = new Date(apt.start_time).getTime();
    const end = new Date(apt.end_time).getTime();
    // Find all appointments that overlap with this one (directly or transitively)
    let maxCol = 0;
    for (const other of sorted) {
      const oStart = new Date(other.start_time).getTime();
      const oEnd = new Date(other.end_time).getTime();
      if (oStart < end && oEnd > start) {
        const info = result.get(other.id);
        if (info) maxCol = Math.max(maxCol, info.colIndex);
      }
    }
    const info = result.get(apt.id);
    if (info) info.totalCols = Math.max(info.totalCols, maxCol + 1);
  }

  // Propagate max totalCols across overlapping groups
  for (const apt of sorted) {
    const start = new Date(apt.start_time).getTime();
    const end = new Date(apt.end_time).getTime();
    const info = result.get(apt.id)!;
    for (const other of sorted) {
      const oStart = new Date(other.start_time).getTime();
      const oEnd = new Date(other.end_time).getTime();
      if (oStart < end && oEnd > start) {
        const oInfo = result.get(other.id)!;
        const maxCols = Math.max(info.totalCols, oInfo.totalCols);
        info.totalCols = maxCols;
        oInfo.totalCols = maxCols;
      }
    }
  }

  return result;
}

export default function Agenda() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const embedded = useEmbedded();
  const compactMode = embedded && isMobile;
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [operatorFilter, setOperatorFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>();
  const [defaultTime, setDefaultTime] = useState<string>();
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null);
  const [smartBookingOpen, setSmartBookingOpen] = useState(false);
  const [upcomingCollapsed, setUpcomingCollapsed] = useState(false);
  const tourRef = useRef<AgendaTourHandle>(null);

  // Reschedule confirmation dialog state
  const [pendingReschedule, setPendingReschedule] = useState<{
    apt: Appointment;
    newStart: string;
    newEnd: string;
    operatorId: string;
    hasPhone: boolean;
    fullPayload?: Record<string, any>;
  } | null>(null);
  const [resendConfirmation, setResendConfirmation] = useState(false);

  const { operators } = useOperators();
  const effectiveUserId = useEffectiveUserId();
  const { isAutomatic } = useReminderMode();

  const isPastDate = startOfDay(currentDate) < startOfDay(new Date());

  // Fetch opening hours from profile (uses effectiveUserId so operator portal gets salon owner's hours)
  const [openingHours, setOpeningHours] = useState<Record<string, { open: string; close: string; enabled: boolean }> | null>(null);
  useEffect(() => {
    if (!effectiveUserId) return;
    supabase
      .from("profiles")
      .select("opening_hours")
      .eq("user_id", effectiveUserId)
      .single()
      .then(({ data }) => {
        if (data?.opening_hours && typeof data.opening_hours === "object") {
          setOpeningHours(data.opening_hours as any);
        }
      });
  }, [effectiveUserId]);

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    if (viewMode === "day") {
      return {
        from: format(currentDate, "yyyy-MM-dd'T'00:00:00"),
        to: format(currentDate, "yyyy-MM-dd'T'23:59:59"),
      };
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return {
        from: format(start, "yyyy-MM-dd'T'00:00:00"),
        to: format(end, "yyyy-MM-dd'T'23:59:59"),
      };
    }
  }, [currentDate, viewMode]);

  const { appointments, isLoading, cancelAppointment, updateAppointment, checkConflict } = useAppointments(dateRange);

  const filteredAppointments = useMemo(() => {
    const nonCancelled = appointments.filter((a) => a.status !== "cancelled");
    if (operatorFilter === "all") return nonCancelled;
    return nonCancelled.filter((a) => a.operator_id === operatorFilter);
  }, [appointments, operatorFilter]);

  // Visit count query for new client indicator
  const dayClientIds = useMemo(() => {
    const ids = new Set<string>();
    filteredAppointments
      .filter(a => isSameDay(parseISO(a.start_time), currentDate) && a.client_id)
      .forEach(a => ids.add(a.client_id));
    return [...ids];
  }, [filteredAppointments, currentDate]);

  const { data: visitCounts } = useQuery({
    queryKey: ["client-visit-counts", dayClientIds.sort().join(",")],
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

  const isNewClient = useCallback((clientId: string | null) => {
    if (!clientId || !visitCounts) return false;
    return (visitCounts[clientId] || 0) <= 1;
  }, [visitCounts]);

  const activeOperators = useMemo(() => {
    const visible = operators
      .filter((o) => !o.deleted_at)
      .sort((a, b) => {
        const posA = a.agenda_position || 0;
        const posB = b.agenda_position || 0;
        if (posA === 0 && posB === 0) return a.name.localeCompare(b.name);
        if (posA === 0) return 1;
        if (posB === 0) return -1;
        return posA - posB;
      });

    if (isPastDate) {
      const opsWithAppts = new Set(
        filteredAppointments
          .filter((a) => isSameDay(parseISO(a.start_time), currentDate))
          .map((a) => a.operator_id)
      );
      return visible.filter((o) => opsWithAppts.has(o.id));
    }

    return visible.filter((o) => o.calendar_visible !== false);
  }, [operators, currentDate, filteredAppointments, isPastDate]);

  // Dynamic time range based on opening hours
  const { hours: HOURS, halfHourSlots: HALF_HOUR_SLOTS, gridStartMinutes: GRID_START_MINUTES } = useMemo(() => {
    const dow = currentDate.getDay();
    const dayConfig = openingHours?.[String(dow)];
    
    let startHour = 8;
    let endHour = 20;
    
    if (dayConfig && dayConfig.enabled) {
      const [oh] = dayConfig.open.split(":").map(Number);
      const [ch, cm] = dayConfig.close.split(":").map(Number);
      startHour = oh;
      // Add 30min buffer after closing → round up to next full hour
      endHour = cm > 0 ? ch + 1 : ch;
      if (endHour <= startHour) endHour = startHour + 1;
    }
    
    // Extend range if any appointments overflow the opening hours
    const dayAppts = filteredAppointments.filter((a) => isSameDay(parseISO(a.start_time), currentDate));
    for (const a of dayAppts) {
      const aStart = parseISO(a.start_time);
      const aEnd = parseISO(a.end_time);
      const aStartHour = aStart.getHours();
      const aEndHour = aEnd.getHours() + (aEnd.getMinutes() > 0 ? 1 : 0);
      if (aStartHour < startHour) startHour = aStartHour;
      if (aEndHour > endHour) endHour = aEndHour;
    }
    
    const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);
    const halfHourSlots = hours.flatMap((h) => [{ hour: h, minute: 0 }, { hour: h, minute: 30 }]);
    const gridStartMinutes = hours[0] * 60;
    
    return { hours, halfHourSlots, gridStartMinutes };
  }, [currentDate, openingHours, filteredAppointments]);

  const navigateDate = (dir: 1 | -1) => {
    if (viewMode === "day") setCurrentDate((d) => addDays(d, dir));
    else setCurrentDate((d) => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1)));
  };

  const goToday = () => setCurrentDate(new Date());

  const [defaultOperatorId, setDefaultOperatorId] = useState<string | undefined>();

  const openNewAppointment = (date?: string, time?: string, operatorId?: string) => {
    setEditingAppointment(null);
    setDefaultDate(date);
    setDefaultTime(time);
    setDefaultOperatorId(operatorId);
    setDialogOpen(true);
  };

  const openEditAppointment = (apt: Appointment) => {
    setEditingAppointment(apt);
    setDialogOpen(true);
  };

  // Drag & Drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, apt: Appointment) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", apt.id);
    setDraggedAppointment(apt);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    (e.currentTarget as HTMLElement).classList.add("bg-primary/10");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove("bg-primary/10");
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetDate: Date, targetHour: number, targetMinute: number, targetOperatorId?: string) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove("bg-primary/10");
    if (!draggedAppointment) return;

    const apt = draggedAppointment;
    setDraggedAppointment(null);

    const oldStart = parseISO(apt.start_time);
    const oldEnd = parseISO(apt.end_time);
    const durationMs = oldEnd.getTime() - oldStart.getTime();

    const newStart = setMinutes(setHours(targetDate, targetHour), targetMinute);
    const newEnd = new Date(newStart.getTime() + durationMs);
    const targetOp = targetOperatorId || apt.operator_id;
    const isSameSlot = newStart.getTime() === oldStart.getTime() && targetOp === apt.operator_id;

    if (isSameSlot) return;

    // Pre-check conflict — block if overlap
    const hasConflict = await checkConflict(targetOp, newStart.toISOString(), newEnd.toISOString(), apt.id);
    if (hasConflict) {
      toast.error(t("agenda.conflictError"));
      return;
    }

    // Show confirmation dialog instead of moving directly
    setResendConfirmation(false);
    setPendingReschedule({
      apt,
      newStart: newStart.toISOString(),
      newEnd: newEnd.toISOString(),
      operatorId: targetOp,
      hasPhone: !!apt.clients?.phone,
    });
  }, [draggedAppointment, updateAppointment, checkConflict, t]);

  const dayGridRef = useRef<HTMLDivElement>(null);
  const operatorHeaderRef = useRef<HTMLDivElement>(null);
  const [measuredHeaderHeight, setMeasuredHeaderHeight] = useState(0);

  // Measure the real header height dynamically
  useEffect(() => {
    const showMultiOp = operatorFilter === "all" && activeOperators.length > 1;
    if (!showMultiOp) {
      setMeasuredHeaderHeight(0);
      return;
    }
    // Use rAF to ensure the DOM has rendered
    const raf = requestAnimationFrame(() => {
      if (operatorHeaderRef.current) {
        setMeasuredHeaderHeight(operatorHeaderRef.current.getBoundingClientRect().height);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [operatorFilter, activeOperators]);

  // Touch drag for mobile
  const showMultiOpRef = useRef(false);
  const handleTouchDrop = useCallback(async (appointmentId: string, newStartMinute: number, operatorIndex: number) => {
    const apt = appointments.find(a => a.id === appointmentId);
    if (!apt) return;

    const oldStart = parseISO(apt.start_time);
    const oldEnd = parseISO(apt.end_time);
    const durationMs = oldEnd.getTime() - oldStart.getTime();

    const newStartDate = new Date(currentDate);
    newStartDate.setHours(Math.floor(newStartMinute / 60), newStartMinute % 60, 0, 0);
    const newEnd = new Date(newStartDate.getTime() + durationMs);

    const targetOpId = activeOperators[operatorIndex]?.id || apt.operator_id;
    const isSameSlot = newStartDate.getTime() === oldStart.getTime() && targetOpId === apt.operator_id;

    if (isSameSlot) return;

    // Pre-check conflict — block if overlap
    const hasConflict = await checkConflict(targetOpId, newStartDate.toISOString(), newEnd.toISOString(), apt.id);
    if (hasConflict) {
      toast.error(t("agenda.conflictError"));
      return;
    }

    // Show confirmation dialog instead of moving directly
    setResendConfirmation(false);
    setPendingReschedule({
      apt,
      newStart: newStartDate.toISOString(),
      newEnd: newEnd.toISOString(),
      operatorId: targetOpId,
      hasPhone: !!apt.clients?.phone,
    });
  }, [appointments, currentDate, activeOperators, checkConflict, t]);

  const confirmReschedule = useCallback(async () => {
    if (!pendingReschedule) return;
    const { apt, newStart, newEnd, operatorId, fullPayload } = pendingReschedule;
    setPendingReschedule(null);

    setAnimatingId(apt.id);
    setTimeout(() => setAnimatingId(null), 400);

    try {
      const payload = fullPayload
        ? { ...fullPayload, resendConfirmation }
        : { id: apt.id, start_time: newStart, end_time: newEnd, operator_id: operatorId, resendConfirmation };
      await updateAppointment.mutateAsync(payload as any);
      toast.success(fullPayload ? t("agenda.appointmentUpdated", "Appuntamento aggiornato") : t("agenda.appointmentMoved"));
    } catch {
      // error handled by mutation
    }
  }, [pendingReschedule, resendConfirmation, updateAppointment, t]);

  const touchDrag = useTouchDrag({
    slotHeight: SLOT_HEIGHT,
    gridStartMinutes: GRID_START_MINUTES,
    timeColWidth: isMobile ? 36 : 56,
    operatorCount: activeOperators.length || 1,
    gridRef: dayGridRef,
    headerHeight: measuredHeaderHeight,
    onDrop: handleTouchDrop,
  });


  const headerDayName = useMemo(() => {
    if (viewMode === "day") return format(currentDate, "EEEE", { locale: it });
    return "";
  }, [currentDate, viewMode]);

  const headerDateLabel = useMemo(() => {
    if (viewMode === "day") return format(currentDate, "d MMM yyyy", { locale: it });
    return format(currentDate, "MMM yyyy", { locale: it });
  }, [currentDate, viewMode]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const firstDay = startOfWeek(start, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: firstDay, end: endOfWeek(end, { weekStartsOn: 1 }) });
  }, [currentDate]);

  const getAppointmentsForDay = (day: Date) =>
    filteredAppointments.filter((a) => isSameDay(parseISO(a.start_time), day));

  const renderStatusBadge = (status: AppointmentStatus) => {
    return (
      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[status]}`}>
        {t(`agenda.status.${status}`)}
      </Badge>
    );
  };

  const handleCheckout = (apt: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    const params = new URLSearchParams({
      appointment_id: apt.id,
      client_id: apt.client_id,
      service_id: apt.service_id,
      service_name: apt.services?.name || "",
      service_price: String(apt.final_price || apt.services?.price || 0),
    });
    navigate(`/report?tab=cassa&${params.toString()}`);
  };

  const renderAppointmentCard = (apt: Appointment, compact = false, touchProps?: { startMinute: number; durationMinutes: number; opIndex: number }) => {
    const operatorColor = apt.operators?.calendar_color || "hsl(var(--primary))";
    const start = parseISO(apt.start_time);
    const end = parseISO(apt.end_time);
    const durationMin = (end.getTime() - start.getTime()) / 60000;
    const isVeryShort = durationMin < 20;
    const isShort = durationMin <= 30;
    const showService = durationMin > 40;
    const clientName = apt.clients ? `${apt.clients.first_name} ${apt.clients.last_name || ""}`.trim() : t("agenda.clientLabel");
    const isDraggable = apt.status !== "cancelled" && apt.status !== "completed";
    const isBeingDragged = touchDrag.isDragging && touchDrag.draggedId === apt.id;
    const wasDragged = touchDrag.wasDragged;
    return (
      <div
        key={apt.id}
        data-glowup-role="appointment-card"
        data-glowup-client={clientName}
        onClick={(e) => { if (!touchDrag.isDragging && !wasDragged) { e.stopPropagation(); openEditAppointment(apt); } }}
        {...(isDraggable && touchProps ? {
          onTouchStart: (e: React.TouchEvent) => touchDrag.handleTouchStart(e, apt.id, touchProps.startMinute, touchProps.durationMinutes, touchProps.opIndex),
          onTouchMove: touchDrag.handleTouchMove,
          onTouchEnd: touchDrag.handleTouchEnd,
          onMouseDown: (e: React.MouseEvent) => touchDrag.handleMouseDown(e, apt.id, touchProps.startMinute, touchProps.durationMinutes, touchProps.opIndex),
        } : {})}
        className={`w-full h-full text-center rounded-lg border-l-4 ${isVeryShort ? 'px-1' : 'px-2.5'} overflow-hidden flex flex-col justify-center items-center shadow-sm transition-all ${
          apt.status === "cancelled" ? "opacity-50" : ""
        } ${isBeingDragged ? "opacity-30 scale-95" : ""} ${pendingReschedule?.apt.id === apt.id ? "opacity-30 blur-[1px]" : ""} ${isDraggable ? "cursor-grab active:cursor-grabbing" : ""}`}
        style={{
          borderLeftColor: operatorColor,
          backgroundColor: `color-mix(in srgb, ${operatorColor} 10%, hsl(var(--card)))`,
          isolation: 'isolate',
          touchAction: (isDraggable && touchDrag.isDragging && touchDrag.draggedId === apt.id) ? 'none' : 'pan-y',
        }}
      >
        {isShort ? (
          <AutoFitText className="font-medium leading-none w-full truncate" style={{ color: `color-mix(in srgb, ${operatorColor} 12%, hsl(var(--foreground)))` }} minSize={7} maxSize={isVeryShort ? 9 : 11}>
            {clientName}
          </AutoFitText>
        ) : (
          <>
            <div className="flex items-center gap-1 w-full justify-center">
              <AutoFitText className="font-medium leading-tight" style={{ color: `color-mix(in srgb, ${operatorColor} 12%, hsl(var(--foreground)))` }} minSize={8} maxSize={13}>
                {clientName}
              </AutoFitText>
               {apt.client_confirmed && (
                 <TooltipProvider delayDuration={300}>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <span><CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: operatorColor }} /></span>
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
                       <span><RefreshCw className="h-3 w-3 shrink-0 text-amber-500" /></span>
                     </TooltipTrigger>
                     <TooltipContent side="top" className="text-xs">
                       {t("agenda.clientRescheduled")} {format(parseISO(apt.client_rescheduled_at), "HH:mm")}
                     </TooltipContent>
                   </Tooltip>
                 </TooltipProvider>
               )}
               {isNewClient(apt.client_id) && (
                 <span title={t("agenda.newClient")}><Sparkles className="h-3 w-3 shrink-0" style={{ color: operatorColor }} /></span>
               )}
            </div>
            {showService && (
              <AutoFitText className="leading-tight w-full opacity-60" style={{ color: `color-mix(in srgb, ${operatorColor} 10%, hsl(var(--muted-foreground)))` }} minSize={7} maxSize={10}>
                {apt.services?.name || ""}
              </AutoFitText>
            )}
          </>
        )}
      </div>
    );
  };

  // Preview card for pending reschedule (shown at new position)
  const renderReschedulePreview = (multiOp: boolean) => {
    if (!pendingReschedule) return null;
    const { apt, newStart, newEnd, operatorId } = pendingReschedule;
    const operatorColor = apt.operators?.calendar_color || "hsl(var(--primary))";
    const clientName = apt.clients ? `${apt.clients.first_name} ${apt.clients.last_name || ""}`.trim() : t("agenda.clientLabel");
    const start = parseISO(newStart);
    const end = parseISO(newEnd);
    const startMin = start.getHours() * 60 + start.getMinutes();
    const durationMin = (end.getTime() - start.getTime()) / 60000;
    const topPx = ((startMin - GRID_START_MINUTES) / 30) * SLOT_HEIGHT + 1;
    const heightPx = Math.max((durationMin / 30) * SLOT_HEIGHT - 4, 10);
    const isShort = durationMin <= 30;

    let style: React.CSSProperties;
    if (multiOp) {
      const opIndex = activeOperators.findIndex(op => op.id === operatorId);
      if (opIndex === -1) return null;
      const timeColWidth = isMobile ? 36 : 56;
      const opCount = activeOperators.length;
      style = {
        top: topPx,
        height: heightPx,
        left: `calc(${timeColWidth}px + (100% - ${timeColWidth}px) * ${opIndex} / ${opCount} + 2px)`,
        width: `calc((100% - ${timeColWidth}px) / ${opCount} - 4px)`,
      };
    } else {
      const timeColLeft = isMobile ? 40 : 56;
      style = {
        top: topPx,
        left: `${timeColLeft}px`,
        width: `calc(100% - ${timeColLeft}px - 4px)`,
        height: heightPx,
      };
    }

    return (
      <div
        className="absolute pointer-events-none z-20 animate-in fade-in duration-200"
        style={style}
      >
        <div
          className="w-full h-full text-center rounded-lg border-l-4 border-2 px-2.5 overflow-hidden flex flex-col justify-center items-center shadow-lg"
          style={{
            borderLeftColor: operatorColor,
            borderColor: operatorColor,
            backgroundColor: `color-mix(in srgb, ${operatorColor} 18%, hsl(var(--card)))`,
          }}
        >
          {isShort ? (
            <AutoFitText className="font-semibold leading-tight w-full" style={{ color: `color-mix(in srgb, ${operatorColor} 12%, hsl(var(--foreground)))` }} minSize={8} maxSize={11}>
              {clientName}
            </AutoFitText>
          ) : (
            <>
              <AutoFitText className="font-semibold leading-tight w-full" style={{ color: `color-mix(in srgb, ${operatorColor} 12%, hsl(var(--foreground)))` }} minSize={8} maxSize={13}>
                {clientName}
              </AutoFitText>
              <AutoFitText className="leading-tight w-full opacity-70 font-medium" style={{ color: operatorColor }} minSize={7} maxSize={10}>
                {format(start, "HH:mm")} - {format(end, "HH:mm")}
              </AutoFitText>
            </>
          )}
        </div>
      </div>
    );
  };

  // Current time indicator
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isToday = isSameDay(currentDate, now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const gridEndMinutes = (HOURS[HOURS.length - 1] + 1) * 60;
  const nowInRange = isToday && nowMinutes >= GRID_START_MINUTES && nowMinutes <= gridEndMinutes;
  const nowTopPx = ((nowMinutes - GRID_START_MINUTES) / 30) * SLOT_HEIGHT;

  // Reset pending reschedule on date/view change
  useEffect(() => {
    setPendingReschedule(null);
  }, [currentDate, viewMode]);

  // Auto-scroll: 1/3 past, 2/3 future
  // dayGridRef moved above for useTouchDrag
  useEffect(() => {
    if (isToday && dayGridRef.current && viewMode === "day") {
      // Small delay to ensure layout is rendered and heights are computed
      requestAnimationFrame(() => {
        if (!dayGridRef.current) return;
        const containerHeight = dayGridRef.current.clientHeight;
        const scrollTarget = nowTopPx - (containerHeight / 3);
        dayGridRef.current.scrollTop = Math.max(0, scrollTarget);
      });
    }
  }, [currentDate, viewMode, nowTopPx, isToday, openingHours]);

  // Sorted day appointments - only upcoming (not yet ended), in_progress first
  const isInProgressByTime = (a: Appointment) => {
    const s = parseISO(a.start_time);
    const e = parseISO(a.end_time);
    return s <= now && e > now;
  };

  const dayAppointments = useMemo(() => {
    return filteredAppointments
      .filter((a) => isSameDay(parseISO(a.start_time), currentDate) && parseISO(a.end_time) > now)
      .sort((a, b) => {
        const aIp = isInProgressByTime(a) ? 0 : 1;
        const bIp = isInProgressByTime(b) ? 0 : 1;
        if (aIp !== bIp) return aIp - bIp;
        return a.start_time.localeCompare(b.start_time);
      });
  }, [filteredAppointments, currentDate, now]);

  // Count of non-in-progress appointments for badge
  const upcomingCount = useMemo(() => {
    return dayAppointments.filter(a => !isInProgressByTime(a)).length;
  }, [dayAppointments, now]);

  // DAY VIEW — compact grid + TheraFlow list
  const renderDayView = () => {
    const showMultiOp = operatorFilter === "all" && activeOperators.length > 1;

    return (
      <div className="flex flex-col flex-1 min-h-0">
        {/* Compact block grid - fills available space */}
        <div className="overflow-x-auto relative flex-1 min-h-0 overflow-y-auto" ref={dayGridRef} style={{ overscrollBehavior: 'none', ...(touchDrag.isDragging ? { touchAction: 'none', overflow: 'hidden' } : {}) }}>
          {showMultiOp ? (
            <div className="relative" style={{ width: 'fit-content', minWidth: '100%' }}>
              {/* Grid layer */}
              <div style={{ display: "grid", gridTemplateColumns: `${isMobile ? '36px' : '56px'} repeat(${activeOperators.length}, minmax(${isMobile ? '100px' : '120px'}, 1fr))` }}>
                {/* Header */}
                <div ref={operatorHeaderRef} className="sticky left-0 top-0 bg-card z-40 border-b border-primary/10" />
                {activeOperators.map((op, index) => (
                  <div
                    key={op.id}
                    className="sticky top-0 bg-card z-40 text-center py-2 border-b border-primary/10"
                    data-tour="operators-header"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-white shadow-sm" style={{ backgroundColor: op.calendar_color }} />
                      <span className="text-[11px] sm:text-sm font-medium truncate text-foreground">{op.name}</span>
                    </div>
                  </div>
                ))}
                {/* Time slots */}
                {HALF_HOUR_SLOTS.map((slot) => (
                  <React.Fragment key={`row-${slot.hour}-${slot.minute}`}>
                    <div className={`sticky left-0 bg-card z-20 text-[10px] text-muted-foreground text-right pr-1 sm:pr-2 font-sans font-medium tabular-nums relative ${slot.minute === 30 ? 'border-b border-border/80' : ''}`} style={{ height: SLOT_HEIGHT }}>
                      {slot.minute === 0 && <span className="absolute right-1 sm:right-2" style={{ top: 0 }}>{`${String(slot.hour).padStart(2, "0")}:00`}</span>}
                    </div>
                    {activeOperators.map((op) => (
                      <div
                        key={`${op.id}-${slot.hour}-${slot.minute}`}
                        className={`agenda-cell border-l border-solid border-border/60 cursor-pointer transition-colors ${slot.minute === 0 ? 'agenda-dashed-bottom' : 'border-b border-b-border/80'}`}
                         style={{ height: SLOT_HEIGHT }}
                        onClick={() => openNewAppointment(format(currentDate, "yyyy-MM-dd"), `${String(slot.hour).padStart(2, "0")}:${String(slot.minute).padStart(2, "0")}`, op.id)}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, currentDate, slot.hour, slot.minute, op.id)}
                      />
                    ))}
                  </React.Fragment>
                ))}
              </div>
              {/* Event overlay - absolute, same width as grid via fit-content wrapper */}
              <div className="absolute pointer-events-none" style={{ top: measuredHeaderHeight, left: 0, right: 0, bottom: 0, zIndex: 10 }}>
                {(() => {
                  const dayApts = filteredAppointments.filter((a) => isSameDay(parseISO(a.start_time), currentDate));
                  // Group by operator and compute overlap columns per operator
                  const overlapByOp = new Map<string, Map<string, { colIndex: number; totalCols: number }>>();
                  for (const op of activeOperators) {
                    const opApts = dayApts.filter(a => a.operator_id === op.id);
                    overlapByOp.set(op.id, computeOverlapColumns(opApts));
                  }
                  return dayApts.map((a) => {
                    const opIndex = activeOperators.findIndex(op => op.id === a.operator_id);
                    if (opIndex === -1) return null;
                    const start = parseISO(a.start_time);
                    const end = parseISO(a.end_time);
                    const startMin = start.getHours() * 60 + start.getMinutes();
                    const durationMin = (end.getTime() - start.getTime()) / 60000;
                    const topPx = ((startMin - GRID_START_MINUTES) / 30) * SLOT_HEIGHT + 1;
                    const heightPx = Math.max((durationMin / 30) * SLOT_HEIGHT - 4, 10);
                    const timeColWidth = isMobile ? 36 : 56;
                    const opCount = activeOperators.length;
                    const overlap = overlapByOp.get(a.operator_id)?.get(a.id) || { colIndex: 0, totalCols: 1 };
                    return (
                      <div
                        key={a.id}
                        className={`absolute pointer-events-auto${a.id === animatingId ? " transition-[top,left,height] duration-300 ease-out" : ""}`}
                        style={{
                          top: topPx,
                          height: heightPx,
                          left: `calc(${timeColWidth}px + (100% - ${timeColWidth}px) * ${opIndex} / ${opCount} + (100% - ${timeColWidth}px) / ${opCount} * ${overlap.colIndex} / ${overlap.totalCols} + 2px)`,
                          width: `calc((100% - ${timeColWidth}px) / ${opCount} / ${overlap.totalCols} - 4px)`,
                        }}
                      >
                        {renderAppointmentCard(a, true, { startMinute: startMin, durationMinutes: durationMin, opIndex })}
                      </div>
                    );
                  });
                })()}
                {renderReschedulePreview(true)}
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Grid lines layer */}
              {HALF_HOUR_SLOTS.map((slot) => (
                <div
                  key={`${slot.hour}-${slot.minute}`}
                  className="flex"
                  style={{ height: SLOT_HEIGHT }}
                >
                  <div className={`w-10 sm:w-14 shrink-0 text-[10px] sm:text-xs text-muted-foreground text-right pr-1.5 sm:pr-2 font-sans font-medium tabular-nums bg-card z-20 relative ${slot.minute === 30 ? 'border-b border-border/80' : ''}`} style={{ height: SLOT_HEIGHT }}>
                    {slot.minute === 0 && <span className="absolute right-1.5 sm:right-2" style={{ top: 0 }}>{`${String(slot.hour).padStart(2, "0")}:00`}</span>}
                  </div>
                  <div
                    className={`agenda-cell flex-1 cursor-pointer transition-colors rounded ${slot.minute === 0 ? 'agenda-dashed-bottom' : 'border-b border-b-border/80'}`}
                    onClick={() => openNewAppointment(format(currentDate, "yyyy-MM-dd"), `${String(slot.hour).padStart(2, "0")}:${String(slot.minute).padStart(2, "0")}`)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, currentDate, slot.hour, slot.minute)}
                  />
                </div>
              ))}
              {/* Event overlay layer - sits ABOVE grid borders */}
              <div className="absolute inset-0 z-10 pointer-events-none">
                {(() => {
                  const dayApts = filteredAppointments.filter((a) => isSameDay(parseISO(a.start_time), currentDate));
                  const overlapMap = computeOverlapColumns(dayApts);
                  return dayApts.map((a) => {
                    const start = parseISO(a.start_time);
                    const end = parseISO(a.end_time);
                    const startMin = start.getHours() * 60 + start.getMinutes();
                    const durationMin = (end.getTime() - start.getTime()) / 60000;
                    const topPx = ((startMin - GRID_START_MINUTES) / 30) * SLOT_HEIGHT + 1;
                    const heightPx = Math.max((durationMin / 30) * SLOT_HEIGHT - 4, 10);
                    const timeColLeft = isMobile ? 40 : 56;
                    const overlap = overlapMap.get(a.id) || { colIndex: 0, totalCols: 1 };
                    return (
                      <div
                        key={a.id}
                        className={`absolute pointer-events-auto${a.id === animatingId ? " transition-[top,height] duration-300 ease-out" : ""}`}
                        style={{
                          top: topPx,
                          left: `calc(${timeColLeft}px + (100% - ${timeColLeft}px - 4px) * ${overlap.colIndex} / ${overlap.totalCols})`,
                          width: `calc((100% - ${timeColLeft}px - 4px) / ${overlap.totalCols})`,
                          height: heightPx,
                        }}
                      >
                        {renderAppointmentCard(a, false, { startMinute: startMin, durationMinutes: durationMin, opIndex: 0 })}
                      </div>
                    );
                  });
                })()}
                {renderReschedulePreview(false)}
              </div>
            </div>
          )}
          {/* Current time indicator */}
          {nowInRange && (
            <div
              className="absolute left-0 right-0 z-30 pointer-events-none"
              style={{ top: nowTopPx + (showMultiOp ? 36 : 0) - 7 }}
            >
              <div className="flex items-center">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive shrink-0 -ml-1 animate-timeline-pulse" />
                <div className="flex-1 h-[2px] bg-destructive animate-timeline-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Touch drag ghost - rendered via portal to escape transform containing block */}
        {touchDrag.isDragging && touchDrag.draggedId && (() => {
          const draggedApt = appointments.find(a => a.id === touchDrag.draggedId);
          if (!draggedApt) return null;
          const operatorColor = draggedApt.operators?.calendar_color || "hsl(var(--primary))";
          const clientName = draggedApt.clients ? `${draggedApt.clients.first_name} ${draggedApt.clients.last_name || ""}`.trim() : t("agenda.clientLabel");
          const ghostStyle = touchDrag.getGhostStyle();
          const showService = ghostStyle.height > SLOT_HEIGHT;
          const h = Math.floor(touchDrag.currentMinute / 60);
          const m = touchDrag.currentMinute % 60;
          const timeLabel = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          return createPortal(
            <div
              className="fixed z-50 pointer-events-none"
              style={{
                top: ghostStyle.top,
                left: ghostStyle.left,
                width: ghostStyle.width,
                height: ghostStyle.height,
              }}
            >
              <div
                className="w-full h-full rounded-lg border-l-4 px-1.5 flex flex-col justify-start items-center pt-0.5 shadow-lg ring-2"
                style={{
                  borderLeftColor: operatorColor,
                  backgroundColor: `color-mix(in srgb, ${operatorColor} 15%, hsl(var(--card)))`,
                  transform: 'scale(1.04)',
                  '--tw-ring-color': `color-mix(in srgb, ${operatorColor} 35%, transparent)`,
                } as React.CSSProperties}
              >
                <span className="text-[9px] font-semibold" style={{ color: operatorColor }}>{timeLabel}</span>
                <AutoFitText className="font-medium leading-tight w-full text-center" style={{ color: `color-mix(in srgb, ${operatorColor} 60%, hsl(var(--foreground)))` }} minSize={8} maxSize={12}>
                  {clientName}
                </AutoFitText>
                {showService && (
                  <AutoFitText className="leading-tight w-full text-center" style={{ color: `color-mix(in srgb, ${operatorColor} 35%, hsl(var(--muted-foreground)))` }} minSize={7} maxSize={9}>
                    {draggedApt.services?.name || ""}
                  </AutoFitText>
                )}
              </div>
            </div>,
            document.body
          );
        })()}


        {dayAppointments.length > 0 && (
          <div
            className="shrink-0 relative z-20 bg-card"
            style={{ boxShadow: '0 -2px 4px -1px rgba(0,0,0,0.06)' }}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              (e.currentTarget as any)._swipeStartY = touch.clientY;
              (e.currentTarget as any)._swipeStartTime = Date.now();
            }}
            onTouchEnd={(e) => {
              const el = e.currentTarget as any;
              const startY = el._swipeStartY;
              const startTime = el._swipeStartTime;
              if (startY == null) return;
              const endY = e.changedTouches[0].clientY;
              const dy = endY - startY;
              const dt = Date.now() - startTime;
              if (dt < 400 && Math.abs(dy) > 20) {
                if (dy > 0 && !upcomingCollapsed) setUpcomingCollapsed(true);
                if (dy < 0 && upcomingCollapsed) setUpcomingCollapsed(false);
              }
              el._swipeStartY = null;
            }}
          >
            <button
              onClick={() => setUpcomingCollapsed(c => !c)}
              className="flex items-center justify-between w-full py-3 pb-2.5 px-2 cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">{t("agenda.upcoming")}</h3>
                <Badge variant="outline" className="text-[10px] rounded-full border-primary/20 text-primary bg-primary/5">{upcomingCount}</Badge>
              </div>
              {upcomingCollapsed ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </button>
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                maxHeight: upcomingCollapsed ? 0 : (isMobile ? 'min(35vh, 240px)' : '25vh'),
                opacity: upcomingCollapsed ? 0 : 1,
              }}
            >
              <div className="space-y-1.5 overflow-y-auto px-1.5 py-1" style={{ maxHeight: isMobile ? 'min(35vh, 240px)' : '25vh' }}>
                 {dayAppointments.map((apt) => (
                   <AppointmentListItem
                     key={apt.id}
                     appointment={apt}
                     now={now}
                     onEdit={openEditAppointment}
                     onCheckout={handleCheckout}
                     isNewClient={isNewClient(apt.client_id)}
                   />
                 ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // MONTH VIEW
  const renderMonthView = () => (
    <div>
      <div className="grid grid-cols-7 gap-px">
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
        ))}
        {monthDays.map((day) => {
          const dayAppts = getAppointmentsForDay(day);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isDayToday = isSameDay(day, new Date());
          const dayStart = startOfDay(day);
          const todayStart = startOfDay(new Date());
          const isDayPast = dayStart < todayStart;

          // For today: split completed vs upcoming
          let labelNode: React.ReactNode = "";
          if (dayAppts.length > 0) {
            if (isDayToday) {
              const done = dayAppts.filter(a => a.status === "completed").length;
              const upcoming = dayAppts.length - done;
              if (done > 0 && upcoming > 0) labelNode = <span className="flex items-center gap-0.5">{done}<Check className="w-2.5 h-2.5 inline" /> {upcoming}<ChevronRight className="w-2.5 h-2.5 inline" /></span>;
              else if (done > 0) labelNode = <span className="flex items-center gap-0.5">{done}<Check className="w-2.5 h-2.5 inline" /></span>;
              else labelNode = `${upcoming}`;
            } else {
              labelNode = `${dayAppts.length}`;
            }
          }

          return (
            <div
              key={day.toISOString()}
              onClick={() => {
                setCurrentDate(day);
                setViewMode("day");
              }}
              className={`min-h-[52px] sm:min-h-[64px] p-1.5 border border-primary/[0.08] rounded-xl cursor-pointer transition-all hover:bg-primary/[0.04] hover:border-primary/20 flex flex-col items-center ${
                !isCurrentMonth ? "opacity-40" : ""
              } ${isDayToday ? "ring-2 ring-primary/30 bg-primary/5 shadow-sm" : ""}`}
            >
              <p className={`text-xs font-medium ${isDayToday ? "text-primary font-semibold" : ""}`}>
                {format(day, "d")}
              </p>
              {dayAppts.length > 0 && (
                <div className={`mt-auto text-[10px] font-medium rounded-full px-1.5 py-0.5 ${
                  isDayPast 
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                    : "bg-primary/15 text-primary"
                }`}>
                  {labelNode}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );

  const renderOperatorHours = () => {
    if (viewMode !== "month" || activeOperators.length === 0) return null;
    return (
      <div className="rounded-2xl border border-primary/10 bg-card overflow-hidden shadow-card p-3 sm:p-4">
        <h3 className="text-xs font-medium text-foreground text-center mb-3">{t("agenda.operatorHours", "Ore operatori nel mese")}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {activeOperators.map((op) => {
            const opAppts = filteredAppointments.filter(a => a.operator_id === op.id && a.status !== "cancelled");
            const totalMinutes = opAppts.reduce((sum, a) => {
              const start = parseISO(a.start_time);
              const end = parseISO(a.end_time);
              return sum + (end.getTime() - start.getTime()) / 60000;
            }, 0);
            const hours = Math.floor(totalMinutes / 60);
            const mins = Math.round(totalMinutes % 60);
            const timeLabel = hours > 0 && mins > 0 ? `${hours}h ${mins}m` : hours > 0 ? `${hours}h` : mins > 0 ? `${mins}m` : '0h';
            return (
              <div key={op.id} className="flex items-center gap-2 rounded-xl bg-primary/[0.04] px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-white shadow-sm" style={{ backgroundColor: op.calendar_color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-foreground truncate">{op.name}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{timeLabel}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const controlsContent = (
    <div className="flex items-center justify-between gap-1">
      {/* Left: date navigation */}
      <div className="flex items-center gap-1.5" data-tour="date-nav">
        <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg shrink-0" onClick={() => navigateDate(-1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <div className="flex flex-col items-center min-w-0 shrink-0">
          {viewMode === "day" ? (
            <>
              <span className="text-[10px] text-muted-foreground capitalize leading-tight flex items-center gap-1 whitespace-nowrap">
                {headerDayName || '\u00A0'}
                {isToday && (
                  <Badge variant="default" className="text-[8px] px-1 py-0 rounded-full bg-primary/15 text-primary border-0 leading-tight">{t("agenda.today", "Oggi")}</Badge>
                )}
              </span>
              <span className="text-sm font-medium text-foreground capitalize leading-tight whitespace-nowrap">
                {headerDateLabel}
              </span>
            </>
          ) : (
            <span className="text-sm font-medium text-foreground capitalize leading-tight py-0.5">
              {headerDateLabel}
            </span>
          )}
        </div>
        <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg shrink-0" onClick={() => navigateDate(1)}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        {!isToday && !(viewMode === "month" && isSameMonth(currentDate, new Date())) && (
          <Button variant="outline" size="sm" className="text-[10px] h-6 px-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" onClick={goToday}>
            {t("agenda.goToday")}
          </Button>
        )}
      </div>

      {/* Right: view toggle + smart booking */}
      <div className="flex gap-0.5 shrink-0 items-center" data-tour="view-toggle">
        {/* <UnconfirmedBadge /> */}
        <Button
          variant={viewMode === "day" ? "default" : "outline"}
          size="sm"
          className="text-[10px] h-6 px-2.5 rounded-lg"
          onClick={() => setViewMode("day")}
        >
          {t("agenda.viewDay")}
        </Button>
        <Button
          variant={viewMode === "month" ? "default" : "outline"}
          size="sm"
          className="text-[10px] h-6 px-2.5 rounded-lg"
          onClick={() => setViewMode("month")}
          data-glowup-id="agenda-month-btn"
        >
          {t("agenda.viewMonth")}
        </Button>
        <Button
          size="icon"
          className="h-7 w-7 rounded-lg"
          onClick={() => setSmartBookingOpen(true)}
          data-tour="add-btn"
          data-glowup-id="agenda-new-btn"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const calendarContent = (
    <>
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <>
          {viewMode === "day" && renderDayView()}
          {viewMode === "month" && renderMonthView()}
        </>
      )}

    </>
  );

  return (
    <DashboardLayout>
      <div className="animate-fade-in bg-rose-light/30 overflow-hidden flex flex-col gap-1.5 select-none" style={{ margin: embedded ? 0 : (isMobile ? '-1rem -1rem -5rem' : '-1.5rem'), padding: embedded ? (isMobile ? '0.75rem 0.75rem calc(5rem + env(safe-area-inset-bottom))' : '0.75rem') : (isMobile ? '0.75rem 0.75rem calc(3.5rem + env(safe-area-inset-bottom) + 12px)' : '0.75rem 1.25rem 18px'), height: embedded ? '100%' : (isMobile ? 'calc(100% + 1rem + 5rem)' : 'calc(100% + 3rem)'), WebkitUserSelect: 'none' }}>
        {/* Controls */}
        <div className="px-1 py-1">
          {controlsContent}
        </div>

        {/* Calendar */}
        <div className="rounded-2xl border border-primary/10 bg-card overflow-hidden shadow-soft flex-1 min-h-0 flex flex-col" data-tour="calendar-grid">
          <div className="p-1.5 sm:p-3 flex-1 min-h-0 flex flex-col">
            {calendarContent}
          </div>
        </div>
        {renderOperatorHours()}
      </div>

      <AppointmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={editingAppointment}
        defaultDate={defaultDate}
        defaultTime={defaultTime}
        defaultOperatorId={defaultOperatorId}
        onReschedule={({ id, oldApt, newPayload }) => {
          const isSameSlot =
            new Date(newPayload.start_time).getTime() === new Date(oldApt.start_time).getTime() &&
            newPayload.operator_id === oldApt.operator_id;
          if (isSameSlot) return;

          const hasPhone = !!oldApt.clients?.phone;
          setResendConfirmation(false);
          setPendingReschedule({
            apt: oldApt,
            newStart: newPayload.start_time,
            newEnd: newPayload.end_time,
            operatorId: newPayload.operator_id,
            hasPhone,
            fullPayload: newPayload,
          });
        }}
      />
      <SmartBookingDialog open={smartBookingOpen} onOpenChange={setSmartBookingOpen} />
      {!embedded && <AgendaTour ref={tourRef} key="agenda-tour-v3" autoStart />}

      {/* Reschedule confirmation dialog */}
      <AlertDialog open={!!pendingReschedule} onOpenChange={(open) => { if (!open) setPendingReschedule(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("agenda.rescheduleConfirmTitle", "Spostare l'appuntamento?")}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {pendingReschedule && (() => {
                const operatorChanged = pendingReschedule.operatorId !== pendingReschedule.apt.operator_id;
                const timeChanged = pendingReschedule.newStart !== pendingReschedule.apt.start_time;
                const oldOpName = pendingReschedule.apt.operators?.name || "";
                const newOpName = activeOperators.find(o => o.id === pendingReschedule.operatorId)?.name || "";
                return (
                  <div className="space-y-2">
                    <span className="block font-medium text-foreground">
                      {pendingReschedule.apt.clients?.first_name} {pendingReschedule.apt.clients?.last_name}
                      {" — "}
                      {pendingReschedule.apt.services?.name}
                    </span>
                    {timeChanged && (
                      <>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground line-through opacity-60">
                          <Clock className="h-3.5 w-3.5" />
                          {format(parseISO(pendingReschedule.apt.start_time), "HH:mm")} - {format(parseISO(pendingReschedule.apt.end_time), "HH:mm")}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {format(parseISO(pendingReschedule.newStart), "HH:mm")} - {format(parseISO(pendingReschedule.newEnd), "HH:mm")}
                        </div>
                      </>
                    )}
                    {operatorChanged && (
                      <>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground line-through opacity-60">
                          <User className="h-3.5 w-3.5" />
                          {oldOpName}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <User className="h-3.5 w-3.5 text-primary" />
                          {newOpName}
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingReschedule?.hasPhone && isAutomatic && (
            <div className="flex items-center gap-2 py-2 px-1">
              <Checkbox
                id="resend-confirmation"
                checked={resendConfirmation}
                onCheckedChange={(v) => setResendConfirmation(!!v)}
              />
              <label htmlFor="resend-confirmation" className="text-sm flex items-center gap-1.5 cursor-pointer">
                <Send className="h-3.5 w-3.5 text-muted-foreground" />
                {t("agenda.resendConfirmation", "Reinvia conferma appuntamento al cliente")}
              </label>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReschedule}>
              {t("agenda.confirmMove", "Sposta")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </DashboardLayout>
  );
}
