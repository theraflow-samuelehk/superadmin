import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, Clock, Search, User, UserPlus, Check, CalendarDays, Scissors, Loader2, Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useServices, useServiceCategories } from "@/hooks/useServices";
import { useOperators } from "@/hooks/useOperators";
import { useClients } from "@/hooks/useClients";
import { useOperatorShifts } from "@/hooks/useStaffManagement";
import { useAppointments } from "@/hooks/useAppointments";
import { useLocalization } from "@/hooks/useLocalization";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, addMonths, isSameDay, parseISO, startOfDay, startOfMonth, endOfMonth, isBefore } from "date-fns";
import { it } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffectiveUserId } from "@/hooks/useEffectiveUserId";

interface SmartBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "service" | "operator" | "datetime" | "client";

type OpeningHourConfig = {
  open?: string;
  close?: string;
  enabled?: boolean;
  dual_slot?: boolean;
  morning_open?: string;
  morning_close?: string;
  afternoon_open?: string;
  afternoon_close?: string;
};

function buildFallbackShiftsForDay(dayConfig?: OpeningHourConfig | null) {
  if (!dayConfig?.enabled) return [] as { start_time: string; end_time: string }[];

  if (dayConfig.dual_slot) {
    const segments = [
      dayConfig.morning_open && dayConfig.morning_close
        ? { start_time: dayConfig.morning_open, end_time: dayConfig.morning_close }
        : null,
      dayConfig.afternoon_open && dayConfig.afternoon_close
        ? { start_time: dayConfig.afternoon_open, end_time: dayConfig.afternoon_close }
        : null,
    ].filter(Boolean) as { start_time: string; end_time: string }[];

    if (segments.length > 0) return segments;
  }

  if (dayConfig.open && dayConfig.close) {
    return [{ start_time: dayConfig.open, end_time: dayConfig.close }];
  }

  return [] as { start_time: string; end_time: string }[];
}

export default function SmartBookingDialog({ open, onOpenChange }: SmartBookingDialogProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useLocalization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const effectiveUserId = useEffectiveUserId();

  const [step, setStep] = useState<Step>("service");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientLastName, setNewClientLastName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  const { services } = useServices();
  const { categories } = useServiceCategories();
  const { operators } = useOperators();
  const { clients, createClient } = useClients();
  const isAnyOperator = selectedOperatorId === "any";
  const { shifts } = useOperatorShifts(isAnyOperator ? undefined : (selectedOperatorId || undefined));
  const { data: openingHours } = useQuery({
    queryKey: ["smart-booking-opening-hours", effectiveUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("opening_hours")
        .eq("user_id", effectiveUserId!)
        .single();

      if (error) throw error;
      return (data?.opening_hours as Record<string, OpeningHourConfig> | null) ?? null;
    },
    enabled: !!effectiveUserId,
    staleTime: 5 * 60 * 1000,
  });

  const dateRange = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const from = format(isBefore(monthStart, new Date()) ? startOfDay(new Date()) : monthStart, "yyyy-MM-dd'T'00:00:00");
    const to = format(endOfMonth(selectedDate), "yyyy-MM-dd'T'23:59:59");
    return { from, to };
  }, [selectedDate]);
  const { appointments } = useAppointments(dateRange);

  const activeServices = useMemo(() =>
    services.filter(s => !s.deleted_at), [services]);

  const activeCategories = useMemo(() =>
    categories.filter(c => !c.deleted_at), [categories]);

  const selectedService = useMemo(() =>
    activeServices.find(s => s.id === selectedServiceId), [activeServices, selectedServiceId]);

  const selectedOperator = useMemo(() =>
    isAnyOperator ? null : operators.find(o => o.id === selectedOperatorId), [operators, selectedOperatorId, isAnyOperator]);

  const groupedServices = useMemo(() => {
    const filtered = serviceSearch
      ? activeServices.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
      : activeServices;

    const groups: { category: { id: string; name: string; emoji: string | null } | null; services: typeof filtered }[] = [];
    const catMap = new Map<string, typeof filtered>();
    const uncategorized: typeof filtered = [];

    for (const svc of filtered) {
      if (svc.category_id) {
        if (!catMap.has(svc.category_id)) catMap.set(svc.category_id, []);
        catMap.get(svc.category_id)!.push(svc);
      } else {
        uncategorized.push(svc);
      }
    }

    for (const cat of activeCategories) {
      const svcs = catMap.get(cat.id);
      if (svcs && svcs.length > 0) {
        groups.push({ category: cat, services: svcs });
      }
    }
    if (uncategorized.length > 0) {
      groups.push({ category: null, services: uncategorized });
    }
    return groups;
  }, [activeServices, activeCategories, serviceSearch]);

  const availableOperators = useMemo(() => {
    if (!selectedServiceId) return [];
    return operators
      .filter(op => !op.deleted_at && op.service_ids?.includes(selectedServiceId));
  }, [operators, selectedServiceId]);

  const today = useMemo(() => startOfDay(new Date()), []);

  // Map slot time -> first available operator id (for "any" mode)
  const slotOperatorMap = useMemo(() => new Map<string, string>(), []);

  const availableSlots = useMemo(() => {
    if (!selectedOperatorId || !selectedService) return [];

    const duration = selectedService.duration_minutes;
    const dayOfWeek = selectedDate.getDay();
    const nowDate = new Date();
    const isToday = isSameDay(selectedDate, nowDate);
    const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes();

    slotOperatorMap.clear();

    const operatorsToCheck = isAnyOperator ? availableOperators : [{ id: selectedOperatorId }];

    const allSlots = new Set<string>();

    for (const op of operatorsToCheck) {
      const operatorDayShifts = (shifts || []).filter(
        s => s.operator_id === op.id && s.day_of_week === dayOfWeek && s.is_active
      );
      const fallbackDayShifts = buildFallbackShiftsForDay(openingHours?.[String(dayOfWeek)]);
      const dayShifts = operatorDayShifts.length > 0 ? operatorDayShifts : fallbackDayShifts;
      if (dayShifts.length === 0) continue;

      const dayAppts = appointments.filter(a =>
        a.operator_id === op.id &&
        isSameDay(parseISO(a.start_time), selectedDate) &&
        a.status !== "cancelled" && a.status !== "no_show" &&
        !a.deleted_at
      );

      for (const shift of dayShifts) {
        const [sh, sm] = shift.start_time.split(":").map(Number);
        const [eh, em] = shift.end_time.split(":").map(Number);
        const shiftStartMin = sh * 60 + sm;
        const shiftEndMin = eh * 60 + em;

        for (let min = shiftStartMin; min + duration <= shiftEndMin; min += 15) {
          if (isToday && min <= nowMin) continue;

          const slotEnd = min + duration;
          const hasOverlap = dayAppts.some(a => {
            const aStart = parseISO(a.start_time);
            const aEnd = parseISO(a.end_time);
            const aStartMin = aStart.getHours() * 60 + aStart.getMinutes();
            const aEndMin = aEnd.getHours() * 60 + aEnd.getMinutes();
            return min < aEndMin - 1 && slotEnd > aStartMin + 1;
          });

          if (!hasOverlap) {
            const h = Math.floor(min / 60);
            const m = min % 60;
            const slotStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
            if (!slotOperatorMap.has(slotStr)) {
              slotOperatorMap.set(slotStr, op.id);
            }
            allSlots.add(slotStr);
          }
        }
      }
    }

    return Array.from(allSlots).sort();
  }, [selectedOperatorId, selectedDate, selectedService, shifts, appointments, isAnyOperator, availableOperators, slotOperatorMap]);

  const filteredClients = useMemo(() => {
    const active = clients.filter(c => !c.deleted_at);
    if (!clientSearch) return active.slice(0, 20);
    const q = clientSearch.trim().toLowerCase();
    return active.filter(c =>
      c.first_name.toLowerCase().includes(q) ||
      (c.last_name || "").toLowerCase().includes(q) ||
      (c.phone || "").includes(q)
    ).slice(0, 20);
  }, [clients, clientSearch]);

  const reset = useCallback(() => {
    setStep("service");
    setSelectedServiceId(null);
    setSelectedOperatorId(null);
    setSelectedDate(new Date());
    setSelectedSlot(null);
    setSelectedClientId(null);
    setClientSearch("");
    setServiceSearch("");
    setShowNewClientForm(false);
    setNewClientName("");
    setNewClientLastName("");
    setNewClientPhone("");
    setNewClientEmail("");
  }, []);

  const handleClose = useCallback((open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  }, [onOpenChange, reset]);

  const handleSelectService = (id: string) => {
    setSelectedServiceId(id);
    setStep("operator");
  };

  const handleSelectOperator = (id: string) => {
    setSelectedOperatorId(id);
    setStep("datetime");
  };

  const handleSelectSlot = (slot: string) => {
    setSelectedSlot(slot);
    setStep("client");
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;
    setIsCreatingClient(true);
    try {
      const result = await createClient.mutateAsync({
        first_name: newClientName.trim(),
        last_name: newClientLastName.trim() || "",
        phone: newClientPhone.trim() || null,
        email: newClientEmail.trim() || null,
        birth_date: null,
        notes: null,
        allergies: null,
        privacy_consent: false,
        source: "smart_booking",
      });
      setSelectedClientId(result.id);
      setShowNewClientForm(false);
      setNewClientName("");
      setNewClientLastName("");
      setNewClientPhone("");
      setNewClientEmail("");
    } catch {
      // error handled by mutation
    } finally {
      setIsCreatingClient(false);
    }
  };

  const { createAppointment } = useAppointments();

  const handleConfirm = async () => {
    if (!selectedServiceId || !selectedOperatorId || !selectedSlot || !user) return;

    const resolvedOperatorId = isAnyOperator
      ? slotOperatorMap.get(selectedSlot) || availableOperators[0]?.id
      : selectedOperatorId;

    if (!resolvedOperatorId) return;

    setIsSubmitting(true);
    try {
      const [h, m] = selectedSlot.split(":").map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(h, m, 0, 0);
      const endTime = new Date(startTime.getTime() + selectedService!.duration_minutes * 60000);

      await createAppointment.mutateAsync({
        service_id: selectedServiceId,
        operator_id: resolvedOperatorId,
        client_id: selectedClientId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: "confirmed",
        final_price: selectedService!.price,
      });

      handleClose(false);
    } catch (err: any) {
      // error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitle: Record<Step, string> = {
    service: t("agenda.smartBooking.chooseService"),
    operator: t("agenda.smartBooking.chooseOperator"),
    datetime: t("agenda.smartBooking.chooseDateTime"),
    client: t("agenda.smartBooking.selectClient"),
  };

  const goBack = () => {
    if (step === "operator") setStep("service");
    else if (step === "datetime") setStep("operator");
    else if (step === "client") { setStep("datetime"); setSelectedSlot(null); }
  };

  const steps: Step[] = ["service", "operator", "datetime", "client"];

  const Breadcrumb = () => (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
      {steps.map((s, i) => {
        const isActive = step === s;
        const isCompleted =
          (s === "service" && !!selectedServiceId) ||
          (s === "operator" && !!selectedOperatorId) ||
          (s === "datetime" && !!selectedSlot) ||
          (s === "client" && step === "client");

        let label = "";
        if (s === "service") label = selectedService?.name || t("agenda.service");
        else if (s === "operator") label = isAnyOperator ? t("agenda.smartBooking.anyOperator", "Qualunque") : (selectedOperator?.name || t("agenda.operator"));
        else if (s === "datetime") label = selectedSlot ? `${format(selectedDate, "d MMM", { locale: it })} ${selectedSlot}` : t("agenda.smartBooking.dateTime");
        else if (s === "client") label = t("clients.title");

        return (
          <React.Fragment key={s}>
            {i > 0 && <span className="text-muted-foreground text-[10px]">›</span>}
            <span className={`text-[10px] font-medium truncate max-w-[80px] sm:max-w-none ${isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
              {label}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );

  // Show sticky confirm button on client step
  const showStickyConfirm = step === "client";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent aria-describedby={undefined} className={`${isMobile ? "max-w-[calc(100vw-2rem)] max-h-[90dvh]" : "max-w-lg max-h-[85vh]"} flex flex-col p-0 gap-0 overflow-hidden`}>
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            {step !== "service" && (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={goBack}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-base">{stepTitle[step]}</DialogTitle>
          </div>
          <Breadcrumb />
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 space-y-3">
            {/* STEP: SERVICE */}
            {step === "service" && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={t("agenda.searchService")}
                    value={serviceSearch}
                    onChange={e => setServiceSearch(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
                {groupedServices.map((group, gi) => (
                  <div key={gi}>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                      {group.category ? `${group.category.emoji || ""} ${group.category.name}` : t("services.uncategorized")}
                    </p>
                    <div className="space-y-1.5">
                      {group.services.map(svc => (
                        <button
                          key={svc.id}
                          onClick={() => handleSelectService(svc.id)}
                          className="w-full text-left px-3 py-2.5 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-primary/5 active:bg-primary/10 transition-all flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{svc.name}</p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                              <Clock className="h-3 w-3 shrink-0" />
                              {svc.duration_minutes} {t("agenda.minutesShort")}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-primary shrink-0">
                            {formatCurrency(svc.price)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {groupedServices.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">{t("services.noServices")}</p>
                )}
              </div>
            )}

            {/* STEP: OPERATOR */}
            {step === "operator" && (
              <div className="space-y-1.5">
                {availableOperators.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{t("operators.noOperatorsForService")}</p>
                ) : (
                  <>
                    {/* Any operator option */}
                    <button
                      onClick={() => handleSelectOperator("any")}
                      className="w-full text-left px-3 py-3 rounded-xl border border-primary/20 bg-primary/5 hover:border-primary/40 hover:bg-primary/10 active:bg-primary/15 transition-all flex items-center gap-3"
                    >
                      <span className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center bg-primary/15 text-primary">
                        <Users className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{t("agenda.smartBooking.anyOperator", "Qualunque operatrice")}</p>
                        <p className="text-[11px] text-muted-foreground">{t("agenda.smartBooking.anyOperatorDesc", "Mostra tutti gli orari disponibili")}</p>
                      </div>
                    </button>
                    {availableOperators.map(op => (
                    <button
                      key={op.id}
                      onClick={() => handleSelectOperator(op.id)}
                      className="w-full text-left px-3 py-3 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-primary/5 active:bg-primary/10 transition-all flex items-center gap-3"
                    >
                      <span className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: op.calendar_color }}>
                        {op.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{op.name}</p>
                        {op.role && <p className="text-[11px] text-muted-foreground">{op.role}</p>}
                      </div>
                    </button>
                  ))}
                  </>
                )}
              </div>
            )}

            {/* STEP: DATE & TIME */}
            {step === "datetime" && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => { if (d) { setSelectedDate(d); setSelectedSlot(null); } }}
                    disabled={(date) => isBefore(date, today)}
                    fromMonth={today}
                    toMonth={addMonths(today, 3)}
                    locale={it}
                    className="p-0 pointer-events-auto"
                  />
                </div>

                {availableSlots.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      {t("agenda.smartBooking.availableSlots")} ({availableSlots.length})
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {availableSlots.map(slot => (
                        <button
                          key={slot}
                          onClick={() => handleSelectSlot(slot)}
                          className="py-2.5 rounded-xl text-sm font-medium transition-all border border-border/60 hover:border-primary/30 hover:bg-primary/5 active:bg-primary/10 text-foreground"
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">{t("agenda.smartBooking.noSlots")}</p>
                )}
              </div>
            )}

            {/* STEP: CLIENT */}
            {step === "client" && (
              <div className="space-y-4">
                {/* Riepilogo prenotazione */}
                <div className="rounded-xl border border-border/50 bg-muted/30 p-3.5 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <Scissors className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{selectedService?.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedService?.duration_minutes} {t("agenda.minutesShort")} · {formatCurrency(selectedService?.price || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-4 w-4 rounded-full shrink-0"
                      style={{ backgroundColor: selectedOperator?.calendar_color }}
                    />
                    <p className="text-sm text-foreground">{selectedOperator?.name}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm text-foreground">
                      {format(selectedDate, "EEEE d MMMM", { locale: it })} · {selectedSlot}
                    </p>
                  </div>
                </div>

                {/* Ricerca cliente */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={t("agenda.selectClient")}
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    className="pl-9 h-10 text-sm rounded-xl bg-muted/30 border-border/40 focus:bg-background"
                    disabled={showNewClientForm}
                  />
                </div>

                {/* Bottone nuovo cliente */}
                {!showNewClientForm && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl gap-2"
                    onClick={() => setShowNewClientForm(true)}
                  >
                    <UserPlus className="h-4 w-4" />
                    {t("agenda.smartBooking.newClient")}
                  </Button>
                )}

                {/* Mini-form creazione cliente inline */}
                {showNewClientForm && (
                  <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-3.5 space-y-3">
                    <p className="text-sm font-semibold text-foreground">{t("agenda.smartBooking.newClient")}</p>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">{t("clients.firstName")} *</Label>
                        <Input
                          value={newClientName}
                          onChange={e => setNewClientName(e.target.value)}
                          className="h-9 text-sm rounded-lg mt-1"
                          autoFocus
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t("clients.lastName")}</Label>
                        <Input
                          value={newClientLastName}
                          onChange={e => setNewClientLastName(e.target.value)}
                          className="h-9 text-sm rounded-lg mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t("clients.phone")}</Label>
                        <Input
                          value={newClientPhone}
                          onChange={e => setNewClientPhone(e.target.value)}
                          type="tel"
                          className="h-9 text-sm rounded-lg mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t("clients.email")}</Label>
                        <Input
                          value={newClientEmail}
                          onChange={e => setNewClientEmail(e.target.value)}
                          type="email"
                          className="h-9 text-sm rounded-lg mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-lg"
                        onClick={() => {
                          setShowNewClientForm(false);
                          setNewClientName("");
                          setNewClientLastName("");
                          setNewClientPhone("");
                          setNewClientEmail("");
                        }}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 rounded-lg gap-1.5"
                        onClick={handleCreateClient}
                        disabled={!newClientName.trim() || isCreatingClient}
                      >
                        {isCreatingClient && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {t("agenda.smartBooking.saveAndSelect")}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Lista clienti con altezza limitata */}
                {!showNewClientForm && (
                  <div className="rounded-xl border border-border/40 overflow-hidden max-h-48 overflow-y-auto">
                    <div className="divide-y divide-border/30">
                      {/* Cliente senza nome */}
                      <button
                        onClick={() => setSelectedClientId(null)}
                        className={`w-full text-left px-3.5 py-3 transition-all text-sm flex items-center gap-2.5 ${
                          selectedClientId === null
                            ? "bg-primary/5 text-primary font-medium"
                            : "hover:bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        <span className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex-1">{t("agenda.smartBooking.walkIn")}</span>
                        {selectedClientId === null && (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </button>

                      {/* Clients */}
                      {filteredClients.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedClientId(c.id)}
                          className={`w-full text-left px-3.5 py-3 transition-all text-sm flex items-center gap-2.5 ${
                            selectedClientId === c.id
                              ? "bg-primary/5 text-primary font-medium"
                              : "hover:bg-muted/40 text-foreground"
                          }`}
                        >
                          <span className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                            {c.first_name.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="truncate block">{c.first_name} {c.last_name || ""}</span>
                            {c.phone && <span className="text-[11px] text-muted-foreground block">{c.phone}</span>}
                          </div>
                          {selectedClientId === c.id && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sticky confirm button */}
        {showStickyConfirm && (
          <div className="px-4 py-3 border-t border-border/50 bg-background">
            <Button
              className="w-full h-11 rounded-xl text-sm font-semibold"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? t("common.loading") : t("agenda.smartBooking.confirmBooking")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
