import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { format, addDays, startOfDay } from "date-fns";
import { it } from "date-fns/locale";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MessageCircle, CheckCircle2, Coffee, Sun, Sunset, Moon, Users, Clock, Zap, Send, ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ReminderAppointmentRow from "@/components/reminder/ReminderAppointmentRow";
import ReminderConfigPanel, { type SlotConfig, type WaTemplates, type SmsTemplates, DEFAULT_WA_TEMPLATES, DEFAULT_SMS_TEMPLATES } from "@/components/reminder/ReminderConfigPanel";
import { DEFAULT_SLOTS, getSlotTimeRange, buildAppointmentActionUrl, buildWhatsAppUrl, buildSmsUrl, renderTemplate } from "@/components/reminder/reminderUtils";

const DEFAULT_WA_TEMPLATE = `Ciao {{client_name}}! 👋

*{{salon_name}}* ti ricorda il tuo appuntamento:

📅 *{{day_label}}*, {{date}}
⏰ *Ore {{time}}*
💇 {{service_name}}

Conferma o annulla qui:
{{link}}

Ti aspettiamo! ✨`;

const DEFAULT_SMS_TEMPLATE = `{{salon_name}}: promemoria appuntamento {{day_label}} {{date}} ore {{time}} - {{service_name}}. Conferma: {{link}}`;

const SLOT_ICONS: Record<string, React.ReactNode> = {
  morning: <Coffee className="h-4 w-4" />,
  midday: <Sun className="h-4 w-4" />,
  afternoon: <Sunset className="h-4 w-4" />,
  evening: <Moon className="h-4 w-4" />,
};

export default function ReminderWhatsApp() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  // Fetch config
  const { data: config } = useQuery({
    queryKey: ["manual-reminder-config", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("manual_reminder_config")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const slots: SlotConfig[] = useMemo(() => {
    if (config?.slots && Array.isArray(config.slots)) {
      return (config.slots as any[]).filter((s: any) => s.enabled !== false);
    }
    return DEFAULT_SLOTS;
  }, [config]);

  const allSlots: SlotConfig[] = useMemo(() => {
    if (config?.slots && Array.isArray(config.slots)) return config.slots as any[];
    return DEFAULT_SLOTS;
  }, [config]);

  const waTemplate = config?.wa_template || DEFAULT_WA_TEMPLATE;
  const smsTemplate = config?.sms_template || DEFAULT_SMS_TEMPLATE;

  const waTemplates: WaTemplates = useMemo(() => {
    const stored = config?.wa_templates as any;
    if (stored && typeof stored === "object") {
      return {
        confirmation: stored.confirmation || DEFAULT_WA_TEMPLATES.confirmation,
        day_before: stored.day_before || DEFAULT_WA_TEMPLATES.day_before,
        same_day: stored.same_day || DEFAULT_WA_TEMPLATES.same_day,
      };
    }
    return DEFAULT_WA_TEMPLATES;
  }, [config]);

  const smsTemplates: SmsTemplates = useMemo(() => {
    const stored = config?.sms_templates as any;
    if (stored && typeof stored === "object") {
      return {
        confirmation: stored.confirmation || DEFAULT_SMS_TEMPLATES.confirmation,
        day_before: stored.day_before || DEFAULT_SMS_TEMPLATES.day_before,
        same_day: stored.same_day || DEFAULT_SMS_TEMPLATES.same_day,
      };
    }
    return DEFAULT_SMS_TEMPLATES;
  }, [config]);

  const [activeSlot, setActiveSlot] = useState<string>(slots[0]?.key || "morning");
  const currentSlot = slots.find(s => s.key === activeSlot) || slots[0];

  // Fetch salon profile
  const { data: profile } = useQuery({
    queryKey: ["profile-salon-name", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("salon_name, display_name")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch today's appointments (auto-refresh every 30s)
  const { data: todayAppts, isLoading: loadingToday } = useQuery({
    queryKey: ["reminder-wa-today", user?.id, today.toISOString()],
    queryFn: async () => {
      const dayEnd = new Date(today);
      dayEnd.setHours(23, 59, 59, 999);
      const { data } = await supabase
        .from("appointments")
        .select("id, short_code, start_time, end_time, client_id, service_id, status, client_confirmed, contact_phone, created_at")
        .eq("user_id", user!.id)
        .is("deleted_at", null)
        .in("status", ["confirmed", "in_progress"])
        .gte("start_time", today.toISOString())
        .lte("start_time", dayEnd.toISOString())
        .order("start_time");
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30_000,
  });

  // Fetch tomorrow's appointments (auto-refresh every 30s)
  const { data: tomorrowAppts, isLoading: loadingTomorrow } = useQuery({
    queryKey: ["reminder-wa-tomorrow", user?.id, tomorrow.toISOString()],
    queryFn: async () => {
      const dayEnd = new Date(tomorrow);
      dayEnd.setHours(23, 59, 59, 999);
      const { data } = await supabase
        .from("appointments")
        .select("id, short_code, start_time, end_time, client_id, service_id, status, client_confirmed, contact_phone, created_at")
        .eq("user_id", user!.id)
        .is("deleted_at", null)
        .in("status", ["confirmed", "in_progress"])
        .gte("start_time", tomorrow.toISOString())
        .lte("start_time", dayEnd.toISOString())
        .order("start_time");
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30_000,
  });

  // Fetch clients
  const clientIds = useMemo(() => {
    const ids = new Set<string>();
    todayAppts?.forEach(a => { if (a.client_id) ids.add(a.client_id); });
    tomorrowAppts?.forEach(a => { if (a.client_id) ids.add(a.client_id); });
    return [...ids];
  }, [todayAppts, tomorrowAppts]);

  const { data: clients } = useQuery({
    queryKey: ["reminder-wa-clients", clientIds.sort().join(",")],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, first_name, last_name, phone").in("id", clientIds);
      return data || [];
    },
    enabled: clientIds.length > 0,
  });

  // Fetch services
  const serviceIds = useMemo(() => {
    const ids = new Set<string>();
    todayAppts?.forEach(a => ids.add(a.service_id));
    tomorrowAppts?.forEach(a => ids.add(a.service_id));
    return [...ids];
  }, [todayAppts, tomorrowAppts]);

  const { data: services } = useQuery({
    queryKey: ["reminder-wa-services", serviceIds.sort().join(",")],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("id, name, duration_minutes").in("id", serviceIds);
      return data || [];
    },
    enabled: serviceIds.length > 0,
  });

  // Fetch reminder logs for today + tomorrow appointments
  const allAptIds = useMemo(() => {
    const ids: string[] = [];
    todayAppts?.forEach(a => ids.push(a.id));
    tomorrowAppts?.forEach(a => ids.push(a.id));
    return ids;
  }, [todayAppts, tomorrowAppts]);

  const { data: reminderLogs } = useQuery({
    queryKey: ["manual-reminder-logs", allAptIds.sort().join(",")],
    queryFn: async () => {
      const { data } = await supabase
        .from("manual_reminder_logs")
        .select("appointment_id, channel, sent_at, slot_key")
        .in("appointment_id", allAptIds);
      return data || [];
    },
    enabled: allAptIds.length > 0,
  });

  // Realtime: instantly refresh when appointments or clients change
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("reminder-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["reminder-wa-today"] });
        queryClient.invalidateQueries({ queryKey: ["reminder-wa-tomorrow"] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "clients", filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["reminder-wa-clients"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const getClient = (id: string | null) => clients?.find(c => c.id === id);
  const getService = (id: string) => services?.find(s => s.id === id);
  const salonName = profile?.salon_name || profile?.display_name || "Il tuo salone";

  // Get appointments for current slot, excluding ones created within the same slot (walk-ins)
  const slotAppointments = useMemo(() => {
    if (!currentSlot) return [];
    const baseAppts = currentSlot.isNextDay ? (tomorrowAppts || []) : (todayAppts || []);

    if (!currentSlot.isNextDay) {
      const range = getSlotTimeRange(currentSlot, allSlots);
      if (range) {
        return baseAppts.filter(a => {
          const h = new Date(a.start_time).getHours();
          if (h < range.startHour || h >= range.endHour) return false;
          // Skip if created within this same slot window (walk-in / just added)
          const createdAt = new Date(a.created_at);
          const createdH = createdAt.getHours();
          const createdDate = createdAt.toDateString();
          const aptDate = new Date(a.start_time).toDateString();
          if (createdDate === aptDate && createdH >= range.startHour && createdH < range.endHour) {
            return false; // created in same slot = walk-in, skip
          }
          return true;
        });
      }
    }
    // Evening (next day) — show all tomorrow's appointments (pre-reminder)
    return baseAppts;
  }, [currentSlot, todayAppts, tomorrowAppts, allSlots]);

  // Build set of sent appointment IDs for this slot context
  const sentIdsInSlot = useMemo(() => {
    if (!currentSlot) return new Set<string>();
    const sameDaySlotKeys = new Set(allSlots.filter(s => !s.isNextDay).map(s => s.key));
    return new Set(
      (reminderLogs || [])
        .filter(l => {
          if (currentSlot.isNextDay) return l.slot_key === currentSlot.key;
          return sameDaySlotKeys.has(l.slot_key);
        })
        .map(l => l.appointment_id)
    );
  }, [currentSlot, allSlots, reminderLogs]);

  const pendingCount = slotAppointments.filter(a => !sentIdsInSlot.has(a.id)).length;

  const totalInSlot = slotAppointments.length;

  const logReminderMutation = useMutation({
    mutationFn: async ({ appointmentId, channel, slotKey }: { appointmentId: string; channel: string; slotKey: string }) => {
      const { error } = await supabase.from("manual_reminder_logs").insert({
        appointment_id: appointmentId,
        salon_user_id: user!.id,
        channel,
        slot_key: slotKey,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-reminder-logs"] });
    },
  });

  const buildVars = (apt: any) => {
    const client = getClient(apt.client_id);
    const service = getService(apt.service_id);
    const aptDate = new Date(apt.start_time);
    const isNextDay = currentSlot?.isNextDay || false;
    const durationMin = service?.duration_minutes;
    const startTime = new Date(apt.start_time);
    const endTime = new Date(apt.end_time);
    const calcDuration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
    return {
      client_name: client?.first_name || "",
      salon_name: salonName,
      service_name: service?.name || "",
      date: format(aptDate, "EEEE d MMMM", { locale: it }),
      short_data: format(aptDate, "EEE, d MMM", { locale: it }),
      time: format(aptDate, "HH:mm"),
      day_label: isNextDay ? "domani" : "oggi",
      link: buildAppointmentActionUrl(apt.short_code || apt.id),
      duration: durationMin ? String(durationMin) : calcDuration > 0 ? String(calcDuration) : "",
    };
  };

  // Pick the right WA template based on current slot context
  const getWaTemplateForSlot = (): string => {
    if (!currentSlot) return waTemplates.same_day;
    if (currentSlot.isNextDay) return waTemplates.day_before;
    return waTemplates.same_day;
  };

  const getSmsTemplateForSlot = (): string => {
    if (!currentSlot) return smsTemplates.same_day;
    if (currentSlot.isNextDay) return smsTemplates.day_before;
    return smsTemplates.same_day;
  };

  const handleSendWhatsApp = (apt: any) => {
    const client = getClient(apt.client_id);
    const phone = apt.contact_phone || client?.phone;
    if (!phone) { toast.error(t("waReminder.noPhone")); return; }
    const vars = buildVars(apt);
    const msg = renderTemplate(getWaTemplateForSlot(), vars);
    window.open(buildWhatsAppUrl(phone, msg), "_blank");
    logReminderMutation.mutate({ appointmentId: apt.id, channel: "whatsapp", slotKey: currentSlot?.key || "" });
    toast.success(t("waReminder.opened"));
  };

  const handleSendSms = (apt: any) => {
    const client = getClient(apt.client_id);
    const phone = apt.contact_phone || client?.phone;
    if (!phone) { toast.error(t("waReminder.noPhone")); return; }
    const vars = buildVars(apt);
    const msg = renderTemplate(getSmsTemplateForSlot(), vars);
    window.open(buildSmsUrl(phone, msg), "_blank");
    logReminderMutation.mutate({ appointmentId: apt.id, channel: "sms", slotKey: currentSlot?.key || "" });
    toast.success(t("waReminder.smsOpened", "SMS aperto con il messaggio precompilato"));
  };

  const isLoading = loadingToday || loadingTomorrow;
  const now = new Date();
  const currentHour = now.getHours();

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto px-1 sm:px-0">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
            <MessageCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
              {t("waReminder.title")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("waReminder.subtitle")}</p>
          </div>
        </div>

        {/* ─── GUIDA RAPIDA (collapsible) ─── */}
        <Collapsible>
          <Card className="border-dashed border-primary/30 bg-primary/5">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-primary/10 transition-colors py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm text-foreground">{t("waReminder.guideTitle", "Come funziona?")}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 pb-4">
                <ul className="space-y-1.5 text-sm text-muted-foreground list-none">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold shrink-0">1.</span>
                    {t("waReminder.guideStep1", "Scegli la fascia oraria (Mattina, Mezzogiorno, Pomeriggio) per vedere gli appuntamenti di oggi in quella finestra.")}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold shrink-0">2.</span>
                    {t("waReminder.guideStep2", "Clicca \"WA\" o \"SMS\" accanto al cliente: si aprirà WhatsApp o Messaggi con il testo già pronto.")}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold shrink-0">3.</span>
                    {t("waReminder.guideStep3", "Invia e il sistema segna automaticamente il reminder come completato per quella fascia.")}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold shrink-0">4.</span>
                    {t("waReminder.guideStep4", "Usa la tab \"Sera\" per inviare un pre-avviso la sera prima — il cliente riapparirà comunque il giorno stesso per il reminder definitivo.")}
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground/70 italic mt-2">
                  {t("waReminder.guideTip", "💡 Riceverai una notifica push negli orari configurati per ricordarti di inviare i promemoria.")}
                </p>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Tabs value={activeSlot} onValueChange={setActiveSlot}>
          <TabsList className="flex w-full gap-1 p-1 h-auto">
            {slots.map(slot => {
              const slotMinutes = slot.hour * 60 + (slot.minute ?? 0);
              const currentMinutes = currentHour * 60 + now.getMinutes();
              const isCurrent = !slot.isNextDay
                ? currentMinutes >= slotMinutes && currentMinutes < slotMinutes + 240
                : currentMinutes >= slotMinutes;
              const timeLabel = `${String(slot.hour).padStart(2, "0")}:${String(slot.minute ?? 0).padStart(2, "0")}`;
              return (
                <TabsTrigger key={slot.key} value={slot.key} className="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 text-xs sm:flex-row sm:gap-1.5 sm:text-sm sm:py-1.5">
                  {SLOT_ICONS[slot.key] || <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  <span className="text-[11px] sm:text-sm leading-tight">{timeLabel}</span>
                  {isCurrent && <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-green-100 text-green-700 leading-tight">ORA</Badge>}
                </TabsTrigger>
              );
            })}
          </TabsList>


          {slots.map(slot => (
            <TabsContent key={slot.key} value={slot.key}>
              <Card>
                <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="font-serif flex items-center gap-2 text-base sm:text-lg">
                        {SLOT_ICONS[slot.key]}
                        {slot.label} — {slot.isNextDay ? "Domani" : "Oggi"}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {slot.isNextDay
                          ? t("waReminder.slotDescTomorrow", "Reminder per gli appuntamenti di domani")
                          : (() => {
                              const range = getSlotTimeRange(slot, allSlots);
                              const from = range ? range.startHour : slot.hour;
                              const toHour = range ? range.endHour : 24;
                              const toLabel = toHour === 24 ? "23:59" : `${toHour - 1}:59`;
                              return t("waReminder.slotDescToday", "Appuntamenti dalle {{from}}:00 alle {{to}}", { from, to: toLabel });
                            })()}
                      </CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                       {pendingCount === 0 && totalInSlot > 0 && (
                         <Badge className="bg-green-100 text-green-700 text-[10px] sm:text-xs">
                           <CheckCircle2 className="h-3 w-3 mr-1" />
                           {t("waReminder.allSentShort", "Tutti inviati")}
                         </Badge>
                       )}
                       <Badge variant="outline" className="flex items-center gap-1 text-[10px] sm:text-xs">
                         <Users className="h-3 w-3" />
                         {pendingCount}/{totalInSlot}
                       </Badge>
                     </div>
                   </div>
                 </CardHeader>
                 <CardContent className="px-3 sm:px-6">
                   {isLoading ? (
                     <div className="space-y-3">
                       {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
                     </div>
                   ) : slotAppointments.length === 0 ? (
                     <div className="text-center py-8 text-muted-foreground">
                       <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
                       <p className="font-medium">
                         {slot.isNextDay
                           ? t("waReminder.noTomorrow")
                           : t("waReminder.noAppointments", "Nessun appuntamento in questa fascia")}
                       </p>
                     </div>
                   ) : (
                     <div className="space-y-2">
                       {(() => {
                         const isToday = !slot.isNextDay;
                         // Find where to insert the "now" indicator
                         // It goes AFTER the last appointment whose start_time <= now
                         let nowIndex = -1; // -1 = before all, slotAppointments.length-1 = after all
                         if (isToday) {
                           const nowStr = now.toISOString();
                           for (let i = 0; i < slotAppointments.length; i++) {
                             if (slotAppointments[i].start_time <= nowStr) nowIndex = i;
                           }
                         }

                         const timelineBadge = isToday ? (
                           <div className="flex items-center gap-2 py-1" key="__timeline__">
                             <div className="flex-1 h-px bg-destructive/50" />
                             <span className="text-[11px] font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                               ⏱ {format(now, "HH:mm")} — ora attuale
                             </span>
                             <div className="flex-1 h-px bg-destructive/50" />
                           </div>
                         ) : null;

                         const items: React.ReactNode[] = [];

                         // Insert before all if now < first appointment
                         if (isToday && nowIndex === -1) items.push(timelineBadge);

                          slotAppointments.forEach((apt, idx) => {
                            const aptIsPast = isToday && new Date(apt.start_time) <= now;
                            items.push(
                              <ReminderAppointmentRow
                                key={apt.id}
                                appointment={apt}
                                client={getClient(apt.client_id)}
                                service={getService(apt.service_id)}
                                reminderLogs={reminderLogs || []}
                                isSentInSlot={sentIdsInSlot.has(apt.id)}
                                isPast={aptIsPast}
                                onSendWhatsApp={handleSendWhatsApp}
                                onSendSms={handleSendSms}
                              />
                            );
                           // Insert after this row if this is the nowIndex
                           if (isToday && idx === nowIndex) items.push(timelineBadge);
                         });

                         return items;
                       })()}
                     </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Config panel */}
        {user && (
          <ReminderConfigPanel
            userId={user.id}
            configId={config?.id || null}
            slots={allSlots}
            waTemplate={waTemplate}
            smsTemplate={smsTemplate}
            waTemplates={waTemplates}
            smsTemplates={smsTemplates}
          />
        )}

        {/* ─── PREMIUM UPSELL: Flussi Automatici ─── */}
        <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-serif text-lg">
                  {t("waReminder.premiumTitle", "Flussi Automatici Premium")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("waReminder.premiumSubtitle", "Invia promemoria senza muovere un dito")}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visual flow preview — vertical on mobile, horizontal on desktop */}
            <div className="hidden sm:flex items-center justify-center gap-2 py-3">
              {[
                { icon: <Clock className="h-4 w-4" />, label: t("waReminder.flowStep2", "24h prima"), color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
                { icon: <Send className="h-4 w-4" />, label: "WhatsApp", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
                { icon: <MessageCircle className="h-4 w-4" />, label: "SMS fallback", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
              ].map((step, i, arr) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${step.color}`}>
                    {step.icon}
                    {step.label}
                  </div>
                  {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
                </div>
              ))}
            </div>
            {/* Mobile: compact inline flow */}
            <div className="flex sm:hidden items-center justify-center gap-1.5 py-2">
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <Clock className="h-3 w-3" />24h
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                <Send className="h-3 w-3" />WA
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                <MessageCircle className="h-3 w-3" />SMS
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />OK
              </div>
            </div>

            {/* Pricing row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg border bg-card">
                <div className="h-7 w-7 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">WhatsApp</p>
                  <p className="text-xs text-muted-foreground">€0,10 / msg</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg border bg-card">
                <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                  <Send className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">SMS</p>
                  <p className="text-xs text-muted-foreground">€0,12 / msg</p>
                </div>
              </div>
            </div>

            {/* Features list */}
            <ul className="space-y-1.5 text-[13px]">
              {[
                t("waReminder.feat1", "Invio 100% automatico, zero click"),
                t("waReminder.feat2", "Escalation WA → SMS se non consegnato"),
                t("waReminder.feat3", "Link conferma/annulla per il cliente"),
                t("waReminder.feat4", "Analytics e tracking in tempo reale"),
              ].map((feat, i) => (
                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <Button onClick={() => navigate("/impostazioni")} className="w-full gap-2" size="lg">
              <Zap className="h-4 w-4" />
              {t("waReminder.activatePremium", "Attiva Flussi Automatici")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
