import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, User, Users, Sparkles, CheckCircle2, ArrowLeft, ArrowRight, Download, UserCheck, Share, MoreVertical, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { setPortalPreference } from "@/lib/portalPreference";

interface SalonInfo {
  salon: { name: string };
  services: { id: string; name: string; duration_minutes: number; price: number; category_id: string | null }[];
  categories: { id: string; name: string; emoji: string | null }[];
  operators: { id: string; name: string; specializations: string[] | null; calendar_color: string; photo_url: string | null; service_ids: string[] | null }[];
  booking_blocked_from: string | null;
  booking_blocked_until: string | null;
  booking_blocked_message: string | null;
}

export default function PrenotaOnline() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const [salonInfo, setSalonInfo] = useState<SalonInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Steps: 1=service, 2=operator, 3=date/time, 4=info, 5=confirmed
  const [step, setStep] = useState(1);

  // Set preferred_portal as soon as booking is confirmed (step 5) — covers iOS manual install
  useEffect(() => {
    if (step === 5) {
      setPortalPreference("client");
    }
  }, [step]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedOperator, setSelectedOperator] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotOperators, setSlotOperators] = useState<Record<string, string>>({});
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Client info — Option B: phone-first
  const [clientPhone, setClientPhone] = useState("");
  const [clientFirstName, setClientFirstName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [phoneLookupDone, setPhoneLookupDone] = useState(false);
  const [phoneLookupFound, setPhoneLookupFound] = useState(false);
  const [phoneLookupShowName, setPhoneLookupShowName] = useState(true);
  const [lookingUpPhone, setLookingUpPhone] = useState(false);

  const { canInstall, installApp, dismiss, hasNativePrompt, isIOS, isInstalled } = usePWAInstall();

  const edgeFnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-booking`;

  useEffect(() => {
    const fetchSalon = async () => {
      try {
        const res = await fetch(`${edgeFnUrl}?slug=${slug}&action=info`);
        if (!res.ok) throw new Error("Salon not found");
        const data = await res.json();
        setSalonInfo(data);
      } catch {
        setError(t("booking.salonNotFound"));
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchSalon();
  }, [slug]);

  const service = salonInfo?.services.find((s) => s.id === selectedService);

  // Generate next 14 days starting from today
  const availableDates = useMemo(() => {
    const dates: string[] = [];
    const today = startOfDay(new Date());
    for (let i = 0; dates.length < 14; i++) {
      const d = addDays(today, i);
      dates.push(format(d, "yyyy-MM-dd"));
    }
    return dates;
  }, []);

  // Auto-select today when entering step 3
  useEffect(() => {
    if (step === 3 && !selectedDate && availableDates.length > 0) {
      const firstAvailable = availableDates.find(d => !(salonInfo?.booking_blocked_from && d >= salonInfo.booking_blocked_from && (!salonInfo.booking_blocked_until || d <= salonInfo.booking_blocked_until)));
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

  // Fetch slots when date selected
  useEffect(() => {
    if (!selectedDate || !selectedOperator || !service) return;
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        let url = `${edgeFnUrl}?slug=${slug}&action=slots&date=${selectedDate}&operator_id=${selectedOperator}&duration=${service.duration_minutes}`;
        if (selectedOperator === "any") {
          url += `&service_id=${selectedService}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setSlots(data.slots || []);
        setSlotOperators(data.slot_operators || {});
      } catch {
        setSlots([]);
        setSlotOperators({});
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [selectedDate, selectedOperator, service]);

  const handlePhoneLookup = async () => {
    if (!clientPhone.trim()) return;
    setLookingUpPhone(true);
    setError("");
    try {
      const res = await fetch(`${edgeFnUrl}?slug=${slug}&action=lookup_phone&phone=${encodeURIComponent(clientPhone.trim())}`);
      const data = await res.json();
      if (data.found) {
        setPhoneLookupFound(true);
        setPhoneLookupShowName(data.show_name !== false);
        if (data.show_name !== false) {
          setClientFirstName(data.first_name || "");
          setClientLastName(data.last_name || "");
          setClientEmail(data.email || "");
        } else {
          // Multi-match: don't pre-fill, ask for name
          setClientFirstName("");
          setClientLastName("");
          setClientEmail("");
        }
      } else {
        setPhoneLookupFound(false);
      }
      setPhoneLookupDone(true);
    } catch {
      setPhoneLookupFound(false);
      setPhoneLookupDone(true);
    } finally {
      setLookingUpPhone(false);
    }
  };

  const handleSubmit = async () => {
    if (!phoneLookupFound && (!clientFirstName.trim() || !clientLastName.trim())) return;
    setSubmitting(true);
    setError("");
    try {
      const clientName = `${clientFirstName.trim()} ${clientLastName.trim()}`.trim();
      const resolvedOperator = selectedOperator === "any" ? slotOperators[selectedSlot] : selectedOperator;
      const res = await fetch(`${edgeFnUrl}?slug=${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_existing_client: phoneLookupFound,
          client_name: clientName,
          client_phone: clientPhone,
          client_email: clientEmail,
          service_id: selectedService,
          operator_id: resolvedOperator,
          start_time: selectedSlot,
          notes,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      setStep(5);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-auto bg-background flex items-center justify-center">
        <Skeleton className="w-96 h-64 rounded-2xl" />
      </div>
    );
  }

  if (error && !salonInfo) {
    return (
      <div className="h-full overflow-auto bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <p className="text-lg text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!salonInfo) return null;

  // Group services by category
  const servicesByCategory = salonInfo.categories.map((cat) => ({
    ...cat,
    services: salonInfo.services.filter((s) => s.category_id === cat.id),
  }));
  const uncategorized = salonInfo.services.filter((s) => !s.category_id);

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border/50 py-6">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-serif font-bold text-foreground">{salonInfo.salon.name}</h1>
          </div>
          <p className="text-muted-foreground">{t("booking.subtitle")}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        {step < 5 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-2 rounded-full transition-all ${s <= step ? "w-12 bg-primary" : "w-8 bg-border"}`} />
            ))}
          </div>
        )}

        {/* STEP 1: Choose service */}
        {step === 1 && (
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="font-serif">{t("booking.chooseService")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {servicesByCategory.map((cat) =>
                cat.services.length > 0 ? (
                  <div key={cat.id}>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {cat.emoji} {cat.name}
                    </p>
                    <div className="grid gap-2">
                      {cat.services.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedService(s.id); setStep(2); }}
                          className={`p-4 rounded-xl border text-left transition-all hover:border-primary/50 hover:bg-primary/5 ${
                            selectedService === s.id ? "border-primary bg-primary/5" : "border-border/50"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-foreground">{s.name}</p>
                              <p className="text-sm text-muted-foreground">{s.duration_minutes} min</p>
                            </div>
                            <span className="font-bold text-primary">€{s.price}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
              {uncategorized.length > 0 && (
                <div className="grid gap-2">
                  {uncategorized.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedService(s.id); setStep(2); }}
                      className="p-4 rounded-xl border border-border/50 text-left transition-all hover:border-primary/50 hover:bg-primary/5"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-foreground">{s.name}</p>
                          <p className="text-sm text-muted-foreground">{s.duration_minutes} min</p>
                        </div>
                        <span className="font-bold text-primary">€{s.price}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Choose operator */}
        {step === 2 && (() => {
          const filteredOps = salonInfo.operators.filter(op => op.service_ids && op.service_ids.length > 0 && op.service_ids.includes(selectedService));
          return (
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <button onClick={() => setStep(1)} className="p-1 rounded-lg hover:bg-secondary">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <CardTitle className="font-serif">{t("booking.chooseOperator")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Any operator option */}
                {filteredOps.length > 1 && (
                  <Card
                    className="cursor-pointer transition-all hover:shadow-soft ring-0 hover:ring-2 hover:ring-primary"
                    onClick={() => { setSelectedOperator("any"); setStep(3); }}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{t("booking.anyOperator")}</p>
                        <p className="text-xs text-muted-foreground">{t("booking.anyOperatorDesc")}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {filteredOps.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">{t("operators.noOperatorsForService")}</p>
                ) : filteredOps.map((op) => (
                  <Card
                    key={op.id}
                    className="cursor-pointer transition-all hover:shadow-soft ring-0 hover:ring-2 hover:ring-primary"
                    onClick={() => { setSelectedOperator(op.id); setStep(3); }}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      {op.photo_url ? (
                        <img src={op.photo_url} alt={op.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm" style={{ backgroundColor: op.calendar_color }}>
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
            </CardContent>
          </Card>
          );
        })()}

        {/* STEP 3: Choose date & time */}
        {step === 3 && (
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <button onClick={() => setStep(2)} className="p-1 rounded-lg hover:bg-secondary">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <CardTitle className="font-serif">{t("booking.chooseDateTime")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date picker */}
              <div>
                <Label className="mb-2 block">{t("booking.selectDate")}</Label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {availableDates.map((d) => {
                    const dateObj = new Date(d + "T00:00:00");
                    const isBlocked = !!(salonInfo?.booking_blocked_from && d >= salonInfo.booking_blocked_from && (!salonInfo.booking_blocked_until || d <= salonInfo.booking_blocked_until));
                    return (
                      <button
                        key={d}
                        onClick={() => {
                          if (isBlocked) {
                            const msg = salonInfo?.booking_blocked_message || t("booking.periodBlocked");
                            import("sonner").then(({ toast }) => toast.info(msg));
                          } else {
                            setSelectedDate(d);
                            setSelectedSlot("");
                          }
                        }}
                        className={`flex-shrink-0 p-3 rounded-xl border text-center transition-all min-w-[72px] ${
                          isBlocked ? "opacity-40 cursor-not-allowed border-border/30" :
                          selectedDate === d ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30"
                        }`}
                      >
                        <p className="text-xs text-muted-foreground capitalize">
                          {format(dateObj, "EEE", { locale: it })}
                        </p>
                        <p className="text-lg font-bold">{format(dateObj, "d")}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {format(dateObj, "MMM", { locale: it })}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div>
                  <Label className="mb-2 block">{t("booking.selectTime")}</Label>
                  {slotsLoading ? (
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
                    </div>
                  ) : filteredSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{t("booking.noSlots")}</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {filteredSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                            selectedSlot === slot
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border/50 hover:border-primary/50"
                          }`}
                        >
                          {format(new Date(slot), "HH:mm")}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedSlot && (
                <Button className="w-full" variant="hero" onClick={() => setStep(4)}>
                  {t("common.next")} <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Client info — Phone-first */}
        {step === 4 && (
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <button onClick={() => { if (phoneLookupDone) { setPhoneLookupDone(false); setPhoneLookupFound(false); setClientFirstName(""); setClientLastName(""); setClientEmail(""); setError(""); } else setStep(3); }} className="p-1 rounded-lg hover:bg-secondary">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <CardTitle className="font-serif">
                  {phoneLookupDone ? t("booking.yourInfo") : t("booking.enterPhone")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">{service?.name}</p>
                  <p className="text-lg font-bold text-primary">€{service?.price}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedOperator === "any" ? t("booking.anyOperator") : salonInfo.operators.find((o) => o.id === selectedOperator)?.name}
                </p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(selectedSlot), "EEEE d MMMM", { locale: it })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {format(new Date(selectedSlot), "HH:mm")} – {format(new Date(new Date(selectedSlot).getTime() + (service?.duration_minutes || 30) * 60000), "HH:mm")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{service?.duration_minutes} min</p>
              </div>

              {/* Phase 1: Enter phone */}
              {!phoneLookupDone && (
                <div className="space-y-3">
                  <div>
                    <Label>{t("booking.phoneLabel")} *</Label>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                      placeholder="+39 333 1234567"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t("booking.phoneLookupHint")}</p>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button
                    className="w-full"
                    variant="hero"
                    size="lg"
                    onClick={handlePhoneLookup}
                    disabled={!clientPhone.trim() || lookingUpPhone}
                  >
                    {lookingUpPhone ? t("common.loading") : t("common.next")} {!lookingUpPhone && <ArrowRight className="h-4 w-4 ml-1" />}
                  </Button>
                </div>
              )}

              {/* Phase 2: Found — show pre-filled name + confirm */}
              {phoneLookupDone && phoneLookupFound && phoneLookupShowName && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{t("booking.welcomeBack")}, {clientFirstName}!</p>
                      <p className="text-xs text-muted-foreground">{t("booking.foundYourProfile")}</p>
                    </div>
                  </div>
                  <div>
                    <Label>{t("booking.notes")} <span className="text-muted-foreground font-normal">({t("common.optional")})</span></Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("booking.notesPlaceholder")} rows={2} />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button className="w-full" variant="hero" size="lg" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? t("common.loading") : t("booking.confirmBooking")}
                  </Button>
                </div>
              )}

              {/* Phase 2b: Found but multiple matches (same number, different people) — ask for name */}
              {phoneLookupDone && phoneLookupFound && !phoneLookupShowName && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{t("booking.welcomeBack")}!</p>
                      <p className="text-xs text-muted-foreground">{t("booking.multiMatchHint")}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{t("booking.firstName")} *</Label>
                      <Input value={clientFirstName} onChange={(e) => setClientFirstName(e.target.value)} placeholder={t("booking.firstNamePlaceholder")} />
                    </div>
                    <div>
                      <Label>{t("booking.lastName")} *</Label>
                      <Input value={clientLastName} onChange={(e) => setClientLastName(e.target.value)} placeholder={t("booking.lastNamePlaceholder")} />
                    </div>
                  </div>
                  <div>
                    <Label>{t("booking.notes")} <span className="text-muted-foreground font-normal">({t("common.optional")})</span></Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("booking.notesPlaceholder")} rows={2} />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button className="w-full" variant="hero" size="lg" onClick={handleSubmit} disabled={!clientFirstName.trim() || !clientLastName.trim() || submitting}>
                    {submitting ? t("common.loading") : t("booking.confirmBooking")}
                  </Button>
                </div>
              )}

              {/* Phase 2: Not found — show full form */}
              {phoneLookupDone && !phoneLookupFound && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{t("booking.phoneNotFoundFillForm")}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{t("booking.firstName")} *</Label>
                      <Input value={clientFirstName} onChange={(e) => setClientFirstName(e.target.value)} placeholder={t("booking.firstNamePlaceholder")} />
                    </div>
                    <div>
                      <Label>{t("booking.lastName")} *</Label>
                      <Input value={clientLastName} onChange={(e) => setClientLastName(e.target.value)} placeholder={t("booking.lastNamePlaceholder")} />
                    </div>
                  </div>
                  <div>
                    <Label>{t("booking.email")} <span className="text-muted-foreground font-normal">({t("common.optional")})</span></Label>
                    <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="email@esempio.it" />
                  </div>
                  <div>
                    <Label>{t("booking.notes")} <span className="text-muted-foreground font-normal">({t("common.optional")})</span></Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("booking.notesPlaceholder")} rows={2} />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button className="w-full" variant="hero" size="lg" onClick={handleSubmit} disabled={!clientFirstName.trim() || !clientLastName.trim() || submitting}>
                    {submitting ? t("common.loading") : t("booking.confirmBooking")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 5: Confirmed */}
        {step === 5 && (
          <Card className="shadow-card border-border/50 overflow-hidden">
            <CardContent className="p-0">
              {/* Success header */}
              <div className="bg-gradient-to-b from-primary/10 to-transparent px-8 pt-10 pb-6 text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto ring-4 ring-primary/10">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-foreground">{t("booking.confirmed")}</h2>
                <p className="text-muted-foreground text-sm">{t("booking.confirmedDesc")}</p>
              </div>

              {/* Booking details */}
              <div className="px-6 pb-6 space-y-4">
                <div className="p-5 rounded-2xl bg-secondary/60 border border-border/40 space-y-3">
                  <p className="text-lg font-semibold text-foreground text-center">{service?.name}</p>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 text-primary shrink-0" />
                      <span className="capitalize">{format(new Date(selectedSlot), "EEEE d MMM", { locale: it })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 text-primary shrink-0" />
                      <span>{format(new Date(selectedSlot), "HH:mm")} – {format(new Date(new Date(selectedSlot).getTime() + (service?.duration_minutes || 30) * 60000), "HH:mm")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4 text-primary shrink-0" />
                    <span>{t("booking.assignedOperator")}: <span className="font-medium text-foreground">{selectedOperator === "any" ? t("booking.anyOperator") : salonInfo.operators.find((o) => o.id === selectedOperator)?.name}</span></span>
                  </div>
                </div>

                {/* PWA Install suggestion */}
                {!isInstalled && (
                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Download className="h-5 w-5 text-primary" />
                      <p className="font-medium text-foreground">{t("booking.installApp")}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{t("booking.installAppDesc")}</p>
                    {hasNativePrompt ? (
                      <Button variant="hero" className="w-full gap-2" onClick={() => { setPortalPreference("client"); installApp(); }}>
                        <Download className="h-4 w-4" />
                        {t("booking.installButton")}
                      </Button>
                    ) : (
                      <div className="space-y-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
                        {isIOS ? (
                          <ol className="list-decimal list-inside space-y-1.5 text-left">
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
                    <button onClick={dismiss} className="text-sm text-muted-foreground hover:text-foreground underline">
                      {t("booking.continueInBrowser")}
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
