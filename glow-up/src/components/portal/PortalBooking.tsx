import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Users, ArrowLeft, CheckCircle2, Download, Share, MoreVertical, CalendarClock, Package } from "lucide-react";
import { format, addDays } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import type { PortalData } from "@/hooks/useClientPortal";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { setPortalPreference } from "@/lib/portalPreference";
import { useLocalization } from "@/hooks/useLocalization";

export interface RescheduleInfo {
  appointmentId: string;
  serviceId: string;
  operatorId: string;
  packageId?: string | null;
}

interface PortalBookingProps {
  data: PortalData;
  fetchSlots: (date: string, operatorId: string, duration: number, salonUserId: string, serviceId?: string, excludeAppointmentId?: string) => Promise<{ slots: string[]; slot_operators?: Record<string, string> }>;
  bookAppointment: (serviceId: string, operatorId: string, startTime: string, packageId?: string, excludeAppointmentId?: string) => Promise<{ id: string; start_time: string; end_time: string; operator_id: string; service_id: string } | undefined>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
  onBooked: () => void;
  rescheduleInfo?: RescheduleInfo | null;
  onRescheduleDone?: () => void;
}


export default function PortalBooking({ data, fetchSlots, bookAppointment, cancelAppointment, onBooked, rescheduleInfo, onRescheduleDone }: PortalBookingProps) {
  const { t } = useTranslation();
  const { formatDate, formatTime } = useLocalization();
  const isRescheduling = !!rescheduleInfo;

  // When rescheduling, start at step 2 (date selection) with service+operator pre-selected
  const initialStep = isRescheduling ? 2 : 0;
  const [step, setStep] = useState(initialStep);
  const [serviceId, setServiceId] = useState<string | null>(isRescheduling ? rescheduleInfo.serviceId : null);
  const [operatorId, setOperatorId] = useState<string | null>(isRescheduling ? rescheduleInfo.operatorId : null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotOperators, setSlotOperators] = useState<Record<string, string>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(isRescheduling ? (rescheduleInfo.packageId ?? null) : null);

  // Reset state when rescheduleInfo changes
  useEffect(() => {
    if (rescheduleInfo) {
      setStep(2);
      setServiceId(rescheduleInfo.serviceId);
      setOperatorId(rescheduleInfo.operatorId);
      setSelectedDate(null);
      setSelectedSlot(null);
      setSlots([]);
      setDone(false);
      setSelectedPackageId(rescheduleInfo.packageId ?? null);
    }
  }, [rescheduleInfo?.appointmentId]);

  // Set preferred_portal as soon as booking is confirmed
  useEffect(() => {
    if (done) {
      setPortalPreference("client");
    }
  }, [done]);

  const service = data.services.find(s => s.id === serviceId);
  const operator = data.operators.find(o => o.id === operatorId);

  // Active packages with remaining sessions
  const activePackages = useMemo(() => {
    return (data.packages || []).filter(
      p => p.status === "active" && p.used_sessions < p.total_sessions && p.service_id
    );
  }, [data.packages]);

  const availableDates = useMemo(() => {
    const dates: string[] = [];
    for (let i = 0; dates.length < 14; i++) {
      const d = addDays(new Date(), i);
      dates.push(format(d, "yyyy-MM-dd"));
    }
    return dates;
  }, []);

  // Auto-select today when entering step 2
  useEffect(() => {
    if (step === 2 && !selectedDate && availableDates.length > 0) {
      const firstAvailable = availableDates.find(d => !(data.salon.booking_blocked_from && d >= data.salon.booking_blocked_from && (!data.salon.booking_blocked_until || d <= data.salon.booking_blocked_until)));
      if (firstAvailable) setSelectedDate(firstAvailable);
    }
  }, [step]);

  // Filter out past slots when viewing today
  const isToday = selectedDate === format(new Date(), "yyyy-MM-dd");
  const filteredSlots = useMemo(() => {
    if (!isToday) return slots;
    const now = new Date();
    return slots.filter(slot => new Date(slot) > now);
  }, [slots, isToday]);

  useEffect(() => {
    if (selectedDate && operatorId && service) {
      setLoadingSlots(true);
      setSelectedSlot(null);
      fetchSlots(
        selectedDate,
        operatorId,
        service.duration_minutes,
        data.salon.user_id,
        service.id,
        isRescheduling ? rescheduleInfo.appointmentId : undefined
      )
        .then((result) => {
          setSlots(result.slots);
          setSlotOperators(result.slot_operators || {});
        })
        .catch(() => { setSlots([]); setSlotOperators({}); })
        .finally(() => setLoadingSlots(false));
    }
  }, [selectedDate, operatorId, service]);

  const categorized = useMemo(() => {
    const map: Record<string, typeof data.services> = {};
    for (const s of data.services) {
      const cat = data.categories.find(c => c.id === s.category_id);
      const key = cat ? `${cat.emoji || ""} ${cat.name}` : t("services.uncategorized");
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [data.services, data.categories, t]);

  const handleBook = async () => {
    if (!service || !operatorId || !selectedSlot) return;
      const resolvedOperatorId = operatorId === "any" ? (slotOperators[selectedSlot] || operatorId) : operatorId;
    setSubmitting(true);
    try {
      // Book new appointment first
      const bookedAppointment = await bookAppointment(
        service.id,
        resolvedOperatorId,
        selectedSlot,
        selectedPackageId || undefined,
        isRescheduling ? rescheduleInfo.appointmentId : undefined,
      );

      if (isRescheduling) {
        await cancelAppointment(rescheduleInfo.appointmentId);
        toast.success(t("portal.rescheduleSuccess"));
        onRescheduleDone?.();
      } else {
        toast.success(t("portal.bookingConfirmed"));
      }

      setDone(true);
    } catch {
      toast.error(isRescheduling ? t("portal.rescheduleError") : t("portal.bookingError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (isRescheduling && step <= 2) {
      // Go back to appointments tab
      onRescheduleDone?.();
      return;
    }
    setStep(step - 1);
  };

  const { canInstall, installApp, dismiss, hasNativePrompt, isIOS, isInstalled } = usePWAInstall();
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
  const [pwaCardDismissed, setPwaCardDismissed] = useState(false);

  if (done) {
    const showPwaCard = !isStandalone && !isInstalled && !pwaCardDismissed && !isRescheduling;
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
          <h3 className="text-xl font-serif font-bold">
            {isRescheduling ? t("portal.rescheduleSuccess") : t("portal.bookingConfirmed")}
          </h3>
          <p className="text-muted-foreground">{t("portal.bookingConfirmedDesc")}</p>
          <Button onClick={() => {
            setDone(false);
            setStep(0);
            setServiceId(null);
            setOperatorId(null);
            setSelectedDate(null);
            setSelectedSlot(null);
            setSlotOperators({});
            setSelectedPackageId(null);
            setPwaCardDismissed(false);
            if (isRescheduling) onRescheduleDone?.();
          }}>
          {t("portal.bookAnother")}
          </Button>
          {selectedPackageId && (
            <p className="text-sm text-primary font-medium">{t("portal.packageSessionBooked")}</p>
          )}

          {showPwaCard && (
            <div className="mt-6 rounded-lg border bg-muted/50 p-5 text-left space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t("portal.installApp")}</p>
                  <p className="text-xs text-muted-foreground">{t("portal.installAppDescription")}</p>
                </div>
              </div>

              {hasNativePrompt ? (
                <Button onClick={() => { setPortalPreference("client"); installApp(); }} className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  {t("portal.installButton")}
                </Button>
              ) : (
                <div className="text-sm text-muted-foreground space-y-1.5">
                  {isIOS ? (
                    <ol className="list-decimal list-inside space-y-1">
                      <li className="flex items-center gap-2">
                        <Share className="h-4 w-4 shrink-0 text-primary" />
                        {t("portal.installIosTapShare")}
                      </li>
                      <li>{t("portal.installIosAddHome")}</li>
                    </ol>
                  ) : (
                    <p className="flex items-start gap-2">
                      <MoreVertical className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                      {t("portal.installBrowserGeneric")}
                    </p>
                  )}
                </div>
              )}

              <button onClick={() => setPwaCardDismissed(true)} className="text-xs text-muted-foreground hover:underline w-full text-center">
                {t("portal.installLater")}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Find the appointment being rescheduled for the banner
  const rescheduleApt = isRescheduling ? data.appointments.find(a => a.id === rescheduleInfo.appointmentId) : null;

  return (
    <div className="space-y-4">
      {step > 0 && (
        <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />{t("common.back")}
        </Button>
      )}

      {/* Reschedule banner */}
      {isRescheduling && rescheduleApt && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-primary shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground">{t("portal.reschedulingFor")}</p>
              <p className="text-muted-foreground">
                {service?.name} · {format(new Date(rescheduleApt.start_time), "EEEE d MMM, HH:mm", { locale: it })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 0 && (
        <div className="space-y-4">
          {/* Active packages banner */}
          {activePackages.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {t("portal.activePackagesBanner")}
              </h3>
              {activePackages.map(pkg => {
                const pkgService = data.services.find(s => s.id === pkg.service_id);
                const remaining = pkg.total_sessions - pkg.used_sessions;
                return (
                  <Card key={pkg.id} className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{pkg.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {pkgService?.name} · {remaining}/{pkg.total_sessions} {t("portal.sessionsRemaining")}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedPackageId(pkg.id);
                          setServiceId(pkg.service_id);
                          setStep(1);
                        }}
                      >
                        {t("portal.bookPackageSession")}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <h3 className="font-serif font-bold text-lg">{t("portal.chooseService")}</h3>
          {Object.entries(categorized).map(([cat, services]) => (
            <div key={cat} className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">{cat}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {services.map(s => (
                  <Card key={s.id} className={`cursor-pointer transition-all hover:shadow-soft ${serviceId === s.id ? "ring-2 ring-primary" : ""}`}
                    onClick={() => { setServiceId(s.id); setStep(1); }}>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.duration_minutes} min</p>
                      </div>
                      <Badge variant="secondary">€{s.price}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 1 && (() => {
        const filteredOps = data.operators.filter(op => op.service_ids && op.service_ids.length > 0 && serviceId && op.service_ids.includes(serviceId));
        return (
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-lg">{t("portal.chooseOperator")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredOps.length > 1 && (
              <Card className={`cursor-pointer transition-all hover:shadow-soft ${operatorId === "any" ? "ring-2 ring-primary" : ""}`}
                onClick={() => { setOperatorId("any"); setStep(2); }}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t("portal.anyOperator")}</p>
                    <p className="text-xs text-muted-foreground">{t("portal.anyOperatorDesc")}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {filteredOps.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">{t("operators.noOperatorsForService")}</p>
            ) : filteredOps.map(op => (
              <Card key={op.id} className={`cursor-pointer transition-all hover:shadow-soft ${operatorId === op.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => { setOperatorId(op.id); setStep(2); }}>
                <CardContent className="p-4 flex items-center gap-3">
                  {op.photo_url ? (
                    <img src={op.photo_url} alt={op.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm"
                      style={{ backgroundColor: op.calendar_color }}>
                      {op.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-foreground">{op.name}</p>
                    {op.specializations && (
                      <p className="text-xs text-muted-foreground">{op.specializations.join(", ")}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        );
      })()}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-lg">{t("portal.chooseDateTime")}</h3>

          {/* Summary */}
          <div className="flex gap-2 flex-wrap">
            {service && <Badge variant="outline">{service.name} · €{service.price}</Badge>}
            {operator && <Badge variant="outline"><User className="h-3 w-3 mr-1" />{operator.name}</Badge>}
            {operatorId === "any" && !operator && <Badge variant="outline"><Users className="h-3 w-3 mr-1" />{t("portal.anyOperator")}</Badge>}
          </div>

          {/* Date selection */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {availableDates.map(d => {
              const isBlocked = !!(data.salon.booking_blocked_from && d >= data.salon.booking_blocked_from && (!data.salon.booking_blocked_until || d <= data.salon.booking_blocked_until));
              return (
              <button key={d}
                className={`flex-shrink-0 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  isBlocked ? "opacity-40 cursor-not-allowed border-border/30" :
                  selectedDate === d ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"
                }`}
                onClick={() => {
                  if (isBlocked) {
                    const msg = data.salon.booking_blocked_message || t("booking.periodBlocked");
                    import("sonner").then(({ toast }) => toast.info(msg));
                  } else {
                    setSelectedDate(d);
                  }
                }}>
                <div className="font-semibold">{format(new Date(d), "EEE", { locale: it })}</div>
                <div className="text-xs">{format(new Date(d), "d MMM", { locale: it })}</div>
              </button>
              );
            })}
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />{t("portal.availableSlots")}
              </h4>
              {loadingSlots ? (
                <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
              ) : filteredSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("portal.noSlots")}</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {filteredSlots.map(slot => (
                    <button key={slot}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        selectedSlot === slot ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"
                      }`}
                      onClick={() => setSelectedSlot(slot)}>
                      {format(new Date(slot), "HH:mm")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedSlot && (
            <Button variant="hero" size="lg" className="w-full" onClick={handleBook} disabled={submitting}>
              {submitting ? t("common.loading") : isRescheduling ? t("portal.rescheduleAppointment") : t("portal.confirmBooking")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
