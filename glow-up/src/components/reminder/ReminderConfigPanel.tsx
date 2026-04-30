import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Settings, ChevronDown, Save, CheckCircle2, Bell, Zap, RotateCcw, MessageSquare } from "lucide-react";
import TimePicker from "./TimePicker";
import { toast } from "sonner";
import ReminderTemplatePreview from "./ReminderTemplatePreview";
import SmsTemplatePreview, { resolveSmsTemplate } from "./SmsTemplatePreview";
import SmsRichEditor from "./SmsRichEditor";
import WhatsAppRichEditor from "./WhatsAppRichEditor";
import { decodeUrlEncodedChunks } from "./reminderUtils";

export interface SlotConfig {
  key: string;
  label: string;
  hour: number;
  minute?: number;
  enabled: boolean;
  isNextDay: boolean;
  /** Start hour for appointments shown in this slot (inclusive). Falls back to slot.hour if missing. */
  aptStartHour?: number;
  /** End hour for appointments shown in this slot (exclusive). Falls back to next slot hour if missing. */
  aptEndHour?: number;
}

export interface WaTemplates {
  confirmation: string;
  day_before: string;
  same_day: string;
}

export type SmsTemplates = WaTemplates;

interface Props {
  userId: string;
  configId: string | null;
  slots: SlotConfig[];
  waTemplate: string;
  smsTemplate: string;
  waTemplates?: WaTemplates;
  smsTemplates?: SmsTemplates;
}

const DEFAULT_CONFIRMATION = `{{salon_name}}

✅ *Appuntamento confermato*

{{#client_name}}👤 {{client_name}}{{/client_name}}
{{#service_name}}💆‍♂️ {{service_name}}{{/service_name}}
📅 {{short_data}} - {{time}}
{{#duration}}⏱ {{duration}} min{{/duration}}

👉 Se vuoi annullare o spostare l'appuntamento, clicca qui: {{link}}

⚠️ _Se il link qui sopra non è cliccabile, salva il nostro numero e riapri il messaggio: il link diventerà cliccabile_`;

const DEFAULT_DAY_BEFORE = `✍️ *Azione Richiesta!*
🗓️ Domani - {{time}}

👉 Conferma o annulla appuntamento qui: {{link}}

⚠️ _Se il link qui sopra non è cliccabile, salva il nostro numero e riapri il messaggio: il link diventerà cliccabile_`;

const DEFAULT_SAME_DAY = `🕐 Oggi alle {{time}}
{{salon_name}}

👉 Se vuoi modificare l'appuntamento clicca qui: {{link}}

⚠️ _Se il link qui sopra non è cliccabile, salva il nostro numero e riapri il messaggio: il link diventerà cliccabile_`;

export const DEFAULT_WA_TEMPLATES: WaTemplates = {
  confirmation: DEFAULT_CONFIRMATION,
  day_before: DEFAULT_DAY_BEFORE,
  same_day: DEFAULT_SAME_DAY,
};

const DEFAULT_SMS_CONFIRMATION = `{{salon_name}}:
Appuntamento confermato
{{short_data}} {{time}}

Se vuoi annullarlo o spostarlo vai qui: {{link}}`;

const DEFAULT_SMS_DAY_BEFORE = `Azione Richiesta!
{{salon_name}}:
Domani alle {{time}}

Conferma o annulla appuntamento qui: {{link}}`;

const DEFAULT_SMS_SAME_DAY = `{{salon_name}}:
Oggi alle {{time}}

Se vuoi modificare l'appuntamento clicca qui: {{link}}`;

export const DEFAULT_SMS_TEMPLATES: SmsTemplates = {
  confirmation: DEFAULT_SMS_CONFIRMATION,
  day_before: DEFAULT_SMS_DAY_BEFORE,
  same_day: DEFAULT_SMS_SAME_DAY,
};

const TEMPLATE_CONFIG = [
  {
    key: "confirmation" as const,
    icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    title: "Conferma Immediata",
    description: "Inviato subito dopo la creazione dell'appuntamento",
    badgeColor: "bg-green-100 text-green-700",
  },
  {
    key: "day_before" as const,
    icon: <Bell className="h-4 w-4 text-amber-600" />,
    title: "Promemoria Giorno Prima",
    description: "Inviato la sera prima dell'appuntamento",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    key: "same_day" as const,
    icon: <Zap className="h-4 w-4 text-blue-600" />,
    title: "Promemoria Giorno Stesso",
    description: "Inviato il giorno stesso, poche ore prima",
    badgeColor: "bg-blue-100 text-blue-700",
  },
];

const VARIABLES = ["salon_name", "short_data", "date", "time", "link", "service_name", "client_name", "duration"];

/* wrapSelection removed — formatting now handled by WhatsAppRichEditor */

function normalizeTemplateText(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  return decodeUrlEncodedChunks(value);
}

function normalizeTemplateSet<T extends WaTemplates>(templates: Partial<T> | undefined, defaults: T): T {
  return {
    confirmation: normalizeTemplateText(templates?.confirmation, defaults.confirmation),
    day_before: normalizeTemplateText(templates?.day_before, defaults.day_before),
    same_day: normalizeTemplateText(templates?.same_day, defaults.same_day),
  } as T;
}

function TemplateSection({
  channelLabel,
  channelIcon,
  channelColor,
  templates,
  defaults,
  onUpdate,
  onReset,
  openKey,
  setOpenKey,
  idPrefix,
}: {
  channelLabel: string;
  channelIcon: React.ReactNode;
  channelColor: string;
  templates: WaTemplates;
  defaults: WaTemplates;
  onUpdate: (key: keyof WaTemplates, value: string) => void;
  onReset: (key: keyof WaTemplates) => void;
  openKey: string | null;
  setOpenKey: (k: string | null) => void;
  idPrefix: string;
}) {
  const isWa = idPrefix === "wa";

  return (
    <div>

      <div className="space-y-2">
        {TEMPLATE_CONFIG.map(tpl => {
          const isOpen = openKey === `${idPrefix}-${tpl.key}`;
          const taId = `${idPrefix}-${tpl.key}`;
          return (
            <Collapsible key={tpl.key} open={isOpen} onOpenChange={v => setOpenKey(v ? taId : null)}>
              <div className="rounded-xl border bg-card overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center gap-3 p-3 hover:bg-accent/30 transition-colors text-left">
                    {tpl.icon}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">{tpl.title}</p>
                      <p className="text-[11px] text-muted-foreground leading-snug">{tpl.description}</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-3 pb-3 space-y-3 border-t pt-3">
                    {isWa ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <WhatsAppRichEditor
                          value={templates[tpl.key]}
                          onChange={v => onUpdate(tpl.key, v)}
                          onReset={() => onReset(tpl.key)}
                          rows={7}
                        />
                        <ReminderTemplatePreview text={templates[tpl.key]} />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <SmsRichEditor
                          value={templates[tpl.key]}
                          onChange={v => onUpdate(tpl.key, v)}
                          onReset={() => onReset(tpl.key)}
                          rows={5}
                        />
                        <SmsTemplatePreview text={templates[tpl.key]} />
                      </div>
                    )}
                    {!isWa ? (() => {
                      const resolved = resolveSmsTemplate(templates[tpl.key]);
                      const len = resolved.length;
                      const over = len > 160;
                      return (
                        <p className={`text-[10px] font-medium ${over ? "text-destructive" : "text-muted-foreground"}`}>
                          {len}/160 caratteri {over && "⚠️ Supera il limite SMS!"}
                        </p>
                      );
                    })() : (
                      <p className="text-[10px] text-muted-foreground">~{templates[tpl.key].length} caratteri</p>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}

export default function ReminderConfigPanel({ userId, configId, slots: initialSlots, waTemplate: initialWa, smsTemplate: initialSms, waTemplates: initialWaTemplates, smsTemplates: initialSmsTemplates }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [openTemplate, setOpenTemplate] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotConfig[]>(initialSlots);
  const [waTemps, setWaTemps] = useState<WaTemplates>(() => normalizeTemplateSet(initialWaTemplates, DEFAULT_WA_TEMPLATES));
  const [smsTemps, setSmsTemps] = useState<SmsTemplates>(() => normalizeTemplateSet(initialSmsTemplates, DEFAULT_SMS_TEMPLATES));

  useEffect(() => {
    setSlots(initialSlots);
  }, [initialSlots]);

  useEffect(() => {
    setWaTemps(normalizeTemplateSet(initialWaTemplates, DEFAULT_WA_TEMPLATES));
  }, [initialWaTemplates]);

  useEffect(() => {
    setSmsTemps(normalizeTemplateSet(initialSmsTemplates, DEFAULT_SMS_TEMPLATES));
  }, [initialSmsTemplates]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        slots: slots as any,
        wa_template: waTemps.same_day,
        sms_template: smsTemps.same_day,
        wa_templates: waTemps as any,
        sms_templates: smsTemps as any,
      };
      if (configId) {
        const { error } = await supabase
          .from("manual_reminder_config")
          .update(payload)
          .eq("id", configId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("manual_reminder_config")
          .insert({ user_id: userId, ...payload });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-reminder-config"] });
      toast.success(t("waReminder.configSaved", "Configurazione salvata"));
    },
    onError: () => toast.error(t("common.error", "Errore")),
  });

  const updateSlot = (key: string, field: keyof SlotConfig, value: any) => {
    setSlots(prev => prev.map(s => s.key === key ? { ...s, [field]: value } : s));
  };

  const [openSlots, setOpenSlots] = useState(false);
  const [openWa, setOpenWa] = useState(false);
  const [openSms, setOpenSms] = useState(false);

  return (
    <div className="space-y-3">
      {/* ── Fasce orarie ── */}
      <Collapsible open={openSlots} onOpenChange={setOpenSlots}>
        <Card className="border-muted">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors rounded-t-lg">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Fasce orarie</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openSlots ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                {slots.map(slot => (
                  <div key={slot.key} className="rounded-lg border bg-card p-3 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <Switch
                        checked={slot.enabled}
                        onCheckedChange={v => updateSlot(slot.key, "enabled", v)}
                      />
                      <Input
                        value={slot.label}
                        onChange={e => updateSlot(slot.key, "label", e.target.value)}
                        className="h-8 text-sm w-28 sm:w-32"
                      />
                    </div>

                    {/* Notification time */}
                    <div className="flex items-center gap-2 pl-10 sm:pl-12">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{t("waReminder.notifyAt", "notifica ore")}</span>
                      <TimePicker
                        hour={slot.hour}
                        minute={slot.minute ?? 0}
                        onChangeHour={v => updateSlot(slot.key, "hour", v)}
                        onChangeMinute={v => updateSlot(slot.key, "minute", v)}
                        size="sm"
                      />
                    </div>

                    {/* Appointment range */}
                    {!slot.isNextDay && (
                      <div className="flex flex-wrap items-center gap-1.5 pl-10 sm:pl-12">
                        <span className="text-[11px] text-muted-foreground">{t("waReminder.aptRange", "Appuntamenti dalle")}</span>
                        <Input
                          type="number"
                          min={0}
                          max={23}
                          value={slot.aptStartHour ?? slot.hour}
                          onChange={e => updateSlot(slot.key, "aptStartHour", parseInt(e.target.value) || 0)}
                          className="w-14 h-7 text-xs text-center"
                        />
                        <span className="text-[11px] text-muted-foreground">{t("waReminder.aptRangeTo", "alle")}</span>
                        <Input
                          type="number"
                          min={0}
                          max={24}
                          value={slot.aptEndHour ?? 24}
                          onChange={e => updateSlot(slot.key, "aptEndHour", parseInt(e.target.value) || 24)}
                          className="w-14 h-7 text-xs text-center"
                        />
                        <span className="text-[11px] text-muted-foreground">:00</span>
                      </div>
                    )}
                    {slot.isNextDay && (
                      <p className="text-[11px] text-muted-foreground pl-10 sm:pl-12">
                        📅 {t("waReminder.nextDayNote", "Pre-reminder per gli appuntamenti di domani")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full" size="sm">
                <Save className="h-4 w-4 mr-2" />
                {t("waReminder.saveConfig", "Salva configurazione")}
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ── Template WhatsApp ── */}
      <Collapsible open={openWa} onOpenChange={setOpenWa}>
        <Card className="border-muted">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: "hsl(142 60% 40%)" }}>
                  <MessageSquare className="h-3 w-3 text-white" />
                </div>
                <span className="font-medium text-sm">Template WhatsApp</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openWa ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <TemplateSection
                channelLabel="Template WhatsApp"
                channelIcon={<MessageSquare className="h-3.5 w-3.5 text-white" />}
                channelColor="hsl(142 60% 40%)"
                templates={waTemps}
                defaults={DEFAULT_WA_TEMPLATES}
                onUpdate={(k, v) => setWaTemps(prev => ({ ...prev, [k]: v }))}
                onReset={(k) => setWaTemps(prev => ({ ...prev, [k]: DEFAULT_WA_TEMPLATES[k] }))}
                openKey={openTemplate}
                setOpenKey={setOpenTemplate}
                idPrefix="wa"
              />
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full" size="sm">
                <Save className="h-4 w-4 mr-2" />
                {t("waReminder.saveConfig", "Salva configurazione")}
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ── Template SMS ── */}
      <Collapsible open={openSms} onOpenChange={setOpenSms}>
        <Card className="border-muted">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: "hsl(217 91% 60%)" }}>
                  <MessageSquare className="h-3 w-3 text-white" />
                </div>
                <span className="font-medium text-sm">Template SMS</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openSms ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <TemplateSection
                channelLabel="Template SMS"
                channelIcon={<MessageSquare className="h-3.5 w-3.5 text-white" />}
                channelColor="hsl(217 91% 60%)"
                templates={smsTemps}
                defaults={DEFAULT_SMS_TEMPLATES}
                onUpdate={(k, v) => setSmsTemps(prev => ({ ...prev, [k]: v }))}
                onReset={(k) => setSmsTemps(prev => ({ ...prev, [k]: DEFAULT_SMS_TEMPLATES[k] }))}
                openKey={openTemplate}
                setOpenKey={setOpenTemplate}
                idPrefix="sms"
              />
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full" size="sm">
                <Save className="h-4 w-4 mr-2" />
                {t("waReminder.saveConfig", "Salva configurazione")}
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
