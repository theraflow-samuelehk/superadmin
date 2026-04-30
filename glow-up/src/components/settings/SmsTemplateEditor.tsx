import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { MessageSquareText, Save, RotateCcw, Variable, ChevronDown, Info, Bell, Smartphone, MessageCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import NotificationPreview from "./NotificationPreview";

interface SmsTemplateEditorProps {
  model: {
    id: string;
    name: string;
    flow_config: any;
    is_active: boolean;
  } | null;
  readOnly?: boolean;
}

interface TemplateConfig {
  key: string;
  label: string;
  description: string;
  defaultTemplate: string;
  icon: string;
}

const SMS_VARIABLES: { key: string; label: string; example: string }[] = [
  { key: "{{salon_name}}", label: "Nome Salone", example: "BeautyPro Studio Milano" },
  { key: "{{short_data}}", label: "Data breve", example: "Ven, 20 Mar" },
  { key: "{{data}}", label: "Data estesa", example: "venerdì 20 marzo" },
  { key: "{{ora}}", label: "Orario", example: "09:00" },
  { key: "{{link}}", label: "Link azione", example: "https://glow-up.it/app/abc123" },
  { key: "{{service_name}}", label: "Nome servizio", example: "Manicure Base" },
  { key: "{{client_name}}", label: "Nome cliente", example: "Maria" },
];

const PUSH_VARIABLES: { key: string; label: string; example: string }[] = [
  { key: "{{salon_name}}", label: "Nome Salone", example: "BeautyPro Studio Milano" },
  { key: "{{short_data}}", label: "Data breve", example: "Ven, 20 Mar" },
  { key: "{{data}}", label: "Data estesa", example: "venerdì 20 marzo" },
  { key: "{{ora}}", label: "Orario", example: "09:00" },
  { key: "{{service_name}}", label: "Nome servizio", example: "Manicure Base" },
  { key: "{{client_name}}", label: "Nome cliente", example: "Maria" },
];

const SMS_TEMPLATES: TemplateConfig[] = [
  {
    key: "immediate_confirmation",
    label: "Conferma Immediata",
    description: "Inviato subito dopo la creazione dell'appuntamento (Step 0)",
    icon: "✅",
    defaultTemplate: `{{salon_name}}:\nAppuntamento confermato\n{{short_data}} {{ora}}\n\nSe vuoi annullarlo o spostarlo clicca qui:\n{{link}}`,
  },
  {
    key: "reminder_24h",
    label: "Promemoria 24h",
    description: "Inviato il giorno prima dell'appuntamento",
    icon: "🔔",
    defaultTemplate: `Azione Richiesta!\n{{salon_name}}:\nDomani alle {{ora}}\n\nConferma o annulla appuntamento qui:\n{{link}}`,
  },
  {
    key: "reminder_bcd",
    label: "Promemoria Breve (Casi B/C/D)",
    description: "Inviato poche ore prima per appuntamenti ravvicinati",
    icon: "⚡",
    defaultTemplate: `Azione Richiesta!\n{{salon_name}}:\nOggi, ore {{ora}}\n\nConferma o annulla appuntamento qui:\n{{link}}`,
  },
  {
    key: "reminder_confirmed",
    label: "Promemoria Confermato",
    description: "Inviato il giorno stesso se il cliente ha già confermato",
    icon: "💚",
    defaultTemplate: `{{salon_name}}:\nOggi alle {{ora}}\n\nSe vuoi modificare clicca qui:\n{{link}}`,
  },
  {
    key: "no_response",
    label: "Sollecito (Nessuna risposta)",
    description: "Inviato se il cliente non ha ancora risposto al promemoria",
    icon: "🔁",
    defaultTemplate: `Azione Richiesta!\n{{salon_name}}:\nOggi, ore {{ora}}\n\nConferma o annulla appuntamento qui:\n{{link}}`,
  },
  {
    key: "mid_treatment",
    label: "Link App (Mid-treatment)",
    description: "Inviato a metà trattamento per invitare a scaricare l'app",
    icon: "📲",
    defaultTemplate: `{{salon_name}}: Scarica la nostra app! https://glow-up.it`,
  },
];

// WhatsApp templates — same keys but with wa_ prefix, initially identical to SMS
const WA_TEMPLATES: TemplateConfig[] = SMS_TEMPLATES.map(t => ({
  ...t,
  key: `wa_${t.key}`,
}));

const PUSH_TEMPLATES: TemplateConfig[] = [
  {
    key: "push_immediate_confirmation",
    label: "Conferma Immediata",
    description: "Push inviata subito dopo la creazione dell'appuntamento",
    icon: "✅",
    defaultTemplate: `{{salon_name}}:\nAppuntamento confermato\n{{short_data}} {{ora}}\n\nApri l'app per annullare o spostare`,
  },
  {
    key: "push_reminder_24h",
    label: "Promemoria 24h",
    description: "Push inviata il giorno prima dell'appuntamento",
    icon: "🔔",
    defaultTemplate: `Azione Richiesta!\n{{salon_name}}:\nDomani alle {{ora}}\n\nApri l'app per confermare o annullare`,
  },
  {
    key: "push_reminder_bcd",
    label: "Promemoria Breve (Casi B/C/D)",
    description: "Push inviata poche ore prima per appuntamenti ravvicinati",
    icon: "⚡",
    defaultTemplate: `Azione Richiesta!\n{{salon_name}}:\nOggi, ore {{ora}}\n\nApri l'app per confermare o annullare`,
  },
  {
    key: "push_reminder_confirmed",
    label: "Promemoria Confermato",
    description: "Push inviata il giorno stesso se il cliente ha già confermato",
    icon: "💚",
    defaultTemplate: `{{salon_name}}:\nOggi alle {{ora}}\n\nApri l'app per modificare`,
  },
  {
    key: "push_no_response",
    label: "Sollecito (Nessuna risposta)",
    description: "Push inviata se il cliente non ha ancora risposto",
    icon: "🔁",
    defaultTemplate: `Azione Richiesta!\n{{salon_name}}:\nOggi, ore {{ora}}\n\nApri l'app per confermare o annullare`,
  },
  {
    key: "push_mid_treatment",
    label: "Link App (Mid-treatment)",
    description: "Push per invitare a scaricare l'app",
    icon: "📲",
    defaultTemplate: `{{salon_name}}: Scarica la nostra app!`,
  },
];

function charCount(text: string): { chars: number; segments: number; isGsm: boolean } {
  const gsm7 = /^[\x20-\x7E\n\r€£¥§¿¡ÄÅÆÇÉÑÖØÜßàäåæèéìñòöùü]*$/;
  const resolved = text
    .replace(/\{\{salon_name\}\}/g, "BeautyPro Studio")
    .replace(/\{\{short_data\}\}/g, "Ven, 20 Mar")
    .replace(/\{\{data\}\}/g, "venerdì 20 marzo")
    .replace(/\{\{ora\}\}/g, "09:00")
    .replace(/\{\{link\}\}/g, "https://glow-up.it/app/iQ70iydqBkA=")
    .replace(/\{\{service_name\}\}/g, "Manicure")
    .replace(/\{\{client_name\}\}/g, "Maria")
    .replace(/\\n/g, "\n");
  const isGsm = gsm7.test(resolved);
  const chars = resolved.length;
  const limit = isGsm ? 160 : 70;
  const segments = Math.ceil(chars / limit) || 1;
  return { chars, segments, isGsm };
}

function TemplateSection({
  title,
  description,
  icon: Icon,
  templates: templateConfigs,
  variables,
  values,
  existingMessages,
  readOnly,
  onChange,
  onReset,
  textareaRefs,
  showSmsStats,
  previewType,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  templates: TemplateConfig[];
  variables: { key: string; label: string; example: string }[];
  values: Record<string, string>;
  existingMessages: Record<string, string>;
  readOnly: boolean;
  onChange: (key: string, value: string) => void;
  onReset: (key: string) => void;
  textareaRefs: React.MutableRefObject<Record<string, HTMLTextAreaElement | null>>;
  showSmsStats?: boolean;
  previewType?: "sms" | "push" | "whatsapp";
}) {
  const insertVariable = useCallback((templateKey: string, variable: string) => {
    const textarea = textareaRefs.current[templateKey];
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = values[templateKey] || "";
    const newValue = current.substring(0, start) + variable + current.substring(end);
    onChange(templateKey, newValue);
    setTimeout(() => {
      textarea.focus();
      const newPos = start + variable.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }, [values, onChange, textareaRefs]);

  return (
    <div className="space-y-4">
      {/* Variable legend */}
      <div className="rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Variable className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Variabili disponibili</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {variables.map(v => (
            <Tooltip key={v.key}>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="cursor-default text-[11px] font-mono bg-background hover:bg-primary/5 transition-colors"
                >
                  {v.key}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{v.label}</p>
                <p className="text-muted-foreground text-xs">Es: {v.example}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      {templateConfigs.map(config => {
        const value = values[config.key] || "";
        const stats = charCount(value);
        const isModified = value !== config.defaultTemplate;

        return (
          <div key={config.key} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{config.icon}</span>
                <div>
                  <h4 className="text-sm font-semibold leading-tight">{config.label}</h4>
                  <p className="text-[11px] text-muted-foreground leading-snug">{config.description}</p>
                </div>
              </div>
              {!readOnly && (
                <div className="flex items-center gap-1 shrink-0">
                  {variables.map(v => (
                    <Tooltip key={v.key}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded border bg-background hover:bg-primary/10 hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
                          onClick={() => insertVariable(config.key, v.key)}
                        >
                          {v.key.replace(/\{\{|\}\}/g, "")}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Inserisci {v.label}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => onReset(config.key)}
                        disabled={!isModified}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ripristina default</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              <div className="flex flex-col justify-center">
                <Textarea
                  ref={el => { textareaRefs.current[config.key] = el; }}
                  value={value}
                  onChange={e => !readOnly && onChange(config.key, e.target.value)}
                  readOnly={readOnly}
                  rows={4}
                  className={cn(
                    "font-mono text-xs leading-relaxed resize-y flex-1 min-h-[120px]",
                    isModified && !readOnly && "border-primary/40",
                    readOnly && "opacity-70 cursor-default"
                  )}
                  placeholder={config.defaultTemplate}
                />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2">
                  <div className="flex items-center gap-3">
                    <span>~{stats.chars} caratteri</span>
                    {showSmsStats && (
                      <>
                        <span>{stats.segments} SMS</span>
                        <span className={stats.isGsm ? "text-green-600" : "text-amber-600"}>
                          {stats.isGsm ? "GSM-7" : "Unicode (⚠ 70 char/SMS)"}
                        </span>
                      </>
                    )}
                  </div>
                  {isModified && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                      Modificato
                    </Badge>
                  )}
                </div>
              </div>
              <NotificationPreview
                smsText={previewType === "sms" ? value : undefined}
                pushText={previewType === "push" ? value : undefined}
                whatsappText={previewType === "whatsapp" ? value : undefined}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SmsTemplateEditor({ model, readOnly = false }: SmsTemplateEditorProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [pushOpen, setPushOpen] = useState(false);
  const [waOpen, setWaOpen] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);

  const existingMessages: Record<string, string> = model?.flow_config?.messages || {};

  const [templates, setTemplates] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const t of SMS_TEMPLATES) {
      initial[t.key] = existingMessages[t.key] || t.defaultTemplate;
    }
    for (const t of WA_TEMPLATES) {
      // Fallback: if no wa_ key stored, use the SMS equivalent
      const smsKey = t.key.replace("wa_", "");
      initial[t.key] = existingMessages[t.key] || existingMessages[smsKey] || t.defaultTemplate;
    }
    for (const t of PUSH_TEMPLATES) {
      initial[t.key] = existingMessages[t.key] || t.defaultTemplate;
    }
    return initial;
  });

  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const handleChange = useCallback((key: string, value: string) => {
    setTemplates(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback((key: string) => {
    const config = [...SMS_TEMPLATES, ...WA_TEMPLATES, ...PUSH_TEMPLATES].find(t => t.key === key);
    if (config) {
      setTemplates(prev => ({ ...prev, [key]: config.defaultTemplate }));
    }
  }, []);

  const handleSave = async () => {
    if (!model) return;
    setSaving(true);
    try {
      const updatedConfig = {
        ...model.flow_config,
        messages: { ...templates },
      };
      const { error } = await supabase
        .from("reminder_flow_models")
        .update({ flow_config: updatedConfig })
        .eq("id", model.id);
      if (error) throw error;

      // Propagate messages to all sibling simple models (exclude GlowUp Pro / complex)
      const { data: allModels } = await supabase
        .from("reminder_flow_models")
        .select("id, flow_config")
        .neq("id", model.id);

      if (allModels) {
        const siblingUpdates = allModels
          .filter((m: any) => {
            const cfg = m.flow_config as any;
            if (!cfg?.cases) return false;
            const cases = Object.values(cfg.cases) as any[];
            const hasTimingTables = cases.some((c: any) => c.timing_tables && Object.keys(c.timing_tables).length > 0);
            const allNodes = cases.flatMap((c: any) => c.nodes || []);
            const hasComplex = allNodes.some((n: any) =>
              n.node_type === "admin_escalation" || n.node_type === "mid_treatment_link" || n.node_type === "no_response_followup"
            );
            return !hasTimingTables && !hasComplex;
          })
          .map((m: any) =>
            supabase
              .from("reminder_flow_models")
              .update({ flow_config: { ...m.flow_config, messages: { ...templates } } })
              .eq("id", m.id)
          );
        await Promise.all(siblingUpdates);
      }

      await queryClient.invalidateQueries({ queryKey: ["reminder-flow-models"] });
      toast.success("Template salvati e propagati con successo");
    } catch (e: any) {
      toast.error(e.message || "Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  if (!model) return null;

  const channelSections = [
    {
      id: "push",
      open: pushOpen,
      setOpen: setPushOpen,
      icon: Bell,
      title: "Notifiche Push",
      description: "Messaggi nell'app — senza link, le azioni sono nella card appuntamento",
      templates: PUSH_TEMPLATES,
      variables: PUSH_VARIABLES,
      showSmsStats: false,
      previewType: "push" as const,
    },
    {
      id: "whatsapp",
      open: waOpen,
      setOpen: setWaOpen,
      icon: MessageCircle,
      title: "Messaggi WhatsApp",
      description: "Messaggi inviati via WhatsApp (contengono il link per gestire l'appuntamento)",
      templates: WA_TEMPLATES,
      variables: SMS_VARIABLES,
      showSmsStats: false,
      previewType: "whatsapp" as const,
    },
    {
      id: "sms",
      open: smsOpen,
      setOpen: setSmsOpen,
      icon: Smartphone,
      title: "Messaggi SMS",
      description: "Messaggi inviati via SMS (contengono il link per gestire l'appuntamento)",
      templates: SMS_TEMPLATES,
      variables: SMS_VARIABLES,
      showSmsStats: true,
      previewType: "sms" as const,
    },
  ];

  return (
    <div className="space-y-3">
      {channelSections.map(section => (
        <Collapsible key={section.id} open={section.open} onOpenChange={section.setOpen}>
          <div className="rounded-lg border">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <section.icon className="h-4 w-4 text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold">{section.title}</h3>
                    <p className="text-[11px] text-muted-foreground">{section.description}</p>
                  </div>
                  {readOnly && (
                    <Badge variant="secondary" className="text-[10px] ml-2">Solo lettura</Badge>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${section.open ? "rotate-180" : ""}`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 pt-1">
                <TemplateSection
                  title={section.title}
                  description={section.description}
                  icon={section.icon}
                  templates={section.templates}
                  variables={section.variables}
                  values={templates}
                  existingMessages={existingMessages}
                  readOnly={readOnly}
                  onChange={handleChange}
                  onReset={handleReset}
                  textareaRefs={textareaRefs}
                  showSmsStats={section.showSmsStats}
                  previewType={section.previewType}
                />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}

      {!readOnly && (
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Salvataggio..." : "Salva Template"}
          </Button>
        </div>
      )}
    </div>
  );
}