import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare, Plus, Pencil, Trash2, Send, Bot, ChevronDown,
  FileText, Zap, History, Loader2, AlertCircle, Wifi, WifiOff,
  QrCode, Settings2, RefreshCw, Eye, EyeOff, Save, ExternalLink,
  Smartphone, Unplug, Copy, CheckCircle2,
} from "lucide-react";
import whatsappPairingGuide from "@/assets/whatsapp-pairing-guide.jpg";

const COUNTRY_PREFIXES: Record<string, string> = {
  IT: "+39", MT: "+356", US: "+1", GB: "+44", DE: "+49", FR: "+33",
  ES: "+34", PT: "+351", AT: "+43", CH: "+41", BE: "+32", NL: "+31",
  GR: "+30", SE: "+46", NO: "+47", DK: "+45", FI: "+358", PL: "+48",
  CZ: "+420", RO: "+40", HU: "+36", HR: "+385", SK: "+421", SI: "+386",
  BG: "+359", LT: "+370", LV: "+371", EE: "+372", IE: "+353", LU: "+352",
  CY: "+357", AL: "+355", RS: "+381", BA: "+387", ME: "+382", MK: "+389",
  BR: "+55", AR: "+54", MX: "+52", CO: "+57", IN: "+91", AU: "+61",
};

const CONDITION_LABELS: Record<string, string> = {
  no_funnel: "Non entrato nel funnel",
  funnel_started_no_steps: "Entrato nel funnel ma nessuno step",
  funnel_partial: "Funnel parziale (alcuni step poi uscito)",
  funnel_complete_no_wa: "Funnel completato ma non ha scritto su WA",
  funnel_complete_wa: "Funnel completato e ha scritto su WA",
};

const VARIABLES = ["{{nome}}", "{{cognome}}", "{{telefono}}", "{{email}}", "{{fonte}}"];

export default function LeadWhatsAppTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [connectionOpen, setConnectionOpen] = useState(true);
  const [templatesOpen, setTemplatesOpen] = useState(true);
  const [automationsOpen, setAutomationsOpen] = useState(true);
  const [logsOpen, setLogsOpen] = useState(false);

  // Connection settings
  const [baileysUrl, setBaileysUrl] = useState("");
  const [baileysApiKey, setBaileysApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingConnection, setSavingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "service_online" | "disconnected" | "checking">("unknown");
  const [qrHtml, setQrHtml] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrErrorDetail, setQrErrorDetail] = useState<string | null>(null);

  // Pairing code state
  const [showPairing, setShowPairing] = useState(false);
  const [pairingPhone, setPairingPhone] = useState("");
  const [pairingPrefix, setPairingPrefix] = useState("+39");
  const [prefixOpen, setPrefixOpen] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [loadingPairing, setLoadingPairing] = useState(false);
  const [pairingCopied, setPairingCopied] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Template dialog
  const [templateDialog, setTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [tplName, setTplName] = useState("");
  const [tplBody, setTplBody] = useState("");

  // Automation dialog
  const [autoDialog, setAutoDialog] = useState(false);
  const [editingAuto, setEditingAuto] = useState<any>(null);
  const [autoName, setAutoName] = useState("");
  const [autoTemplateId, setAutoTemplateId] = useState("");
  const [autoCondition, setAutoCondition] = useState("no_funnel");
  const [autoDelay, setAutoDelay] = useState("60");
  const [autoMaxSends, setAutoMaxSends] = useState("1");

  // Load Baileys config from salon_integrations
  const { data: integration, isLoading: loadingIntegration } = useQuery({
    queryKey: ["baileys-integration"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salon_integrations")
        .select("baileys_service_url, baileys_api_key, whatsapp_enabled")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Sync integration data to local state
  useState(() => {
    if (integration) {
      setBaileysUrl(integration.baileys_service_url || "");
      setBaileysApiKey(integration.baileys_api_key || "");
    }
  });

  // Update local state when integration data loads
  const [initDone, setInitDone] = useState(false);
  if (integration && !initDone) {
    setBaileysUrl(integration.baileys_service_url || "");
    setBaileysApiKey(integration.baileys_api_key || "");
    setInitDone(true);
  }

  // Connection functions
  async function saveConnection() {
    setSavingConnection(true);
    try {
      // Upsert salon_integrations
      const { data: existing } = await supabase
        .from("salon_integrations")
        .select("id")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("salon_integrations")
          .update({
            baileys_service_url: baileysUrl,
            baileys_api_key: baileysApiKey,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("salon_integrations")
          .insert([{
            baileys_service_url: baileysUrl,
            baileys_api_key: baileysApiKey,
            whatsapp_enabled: true,
            user_id: user?.id || "",
          }]);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["baileys-integration"] });
      toast.success("Connessione WhatsApp salvata");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingConnection(false);
    }
  }

  async function checkHealth() {
    if (!baileysUrl) {
      toast.error("Inserisci prima l'URL del servizio Baileys");
      return;
    }

    setConnectionStatus("checking");
    try {
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "baileys_health",
          service_url: baileysUrl,
          api_key: baileysApiKey,
        },
      });

      if (error) {
        throw error;
      }

      const whatsappState = typeof data?.whatsapp === "string" ? data.whatsapp.toLowerCase() : "";
      const statusState = typeof data?.status === "string" ? data.status.toLowerCase() : "";
      const isConnected =
        data?.connected === true ||
        data?.whatsapp_connected === true ||
        statusState === "connected" ||
        whatsappState === "connected" ||
        whatsappState === "ready" ||
        whatsappState === "open";
      const isServiceOnline =
        isConnected ||
        statusState === "ok" ||
        statusState === "service_online" ||
        data?.success === true ||
        Boolean(data);

      const nextStatus = isConnected ? "connected" : isServiceOnline ? "service_online" : "disconnected";
      setConnectionStatus(nextStatus);

      if (nextStatus === "service_online") {
        toast.info("Servizio attivo: ora collega il numero WhatsApp");
      }
    } catch (error: any) {
      setConnectionStatus("disconnected");
      toast.error(error?.message || "Il servizio Baileys non risponde");
    }
  }

  async function loadQrCode() {
    if (!baileysUrl) {
      toast.error("Inserisci prima l'URL del servizio Baileys");
      return;
    }

    setLoadingQr(true);
    setShowQr(true);
    setQrHtml(null);
    setQrErrorDetail(null);

    let pendingQrDetected = false;
    try {
      const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const isQrMarkup = (html: string) => /<(img|svg|canvas)\b/i.test(html);
      const isAlreadyConnected = (html: string) => /gia collegato|già collegato|already connected/i.test(html.toLowerCase());
      const isPendingQr = (html: string) => /qr code in generazione|ricarica tra qualche secondo/i.test(html.toLowerCase());
      let lastHtml = "";

      for (let attempt = 0; attempt < 20; attempt += 1) {
        const { data, error } = await supabase.functions.invoke("admin-settings", {
          body: {
            action: "baileys_qr",
            service_url: baileysUrl,
            api_key: baileysApiKey,
          },
        });

        if (error) {
          throw error;
        }

        const nextHtml = typeof data?.html === "string" ? data.html : "";
        lastHtml = nextHtml;

        if (isQrMarkup(nextHtml) || isAlreadyConnected(nextHtml)) {
          setQrHtml(nextHtml || null);
          setQrErrorDetail(null);

          if (isAlreadyConnected(nextHtml)) {
            setConnectionStatus("connected");
            toast.success("WhatsApp risulta già collegato");
          }

          return;
        }

        if (isPendingQr(nextHtml)) {
          pendingQrDetected = true;
          setConnectionStatus("service_online");
        }

        if (attempt < 19) {
          await wait(3000);
        }
      }

      if (lastHtml && isPendingQr(lastHtml)) {
        throw new Error(t("admin.leadWhatsApp.qrPending"));
      }

      throw new Error(t("admin.leadWhatsApp.qrUnavailable"));
    } catch (error: any) {
      const nextError = error?.message || t("admin.leadWhatsApp.qrUnavailable");

      if (pendingQrDetected) {
        setConnectionStatus("service_online");
      }

      toast.error(nextError);
      setQrHtml(null);
      setQrErrorDetail(nextError);
    } finally {
      setLoadingQr(false);
    }
  }

  async function requestPairingCode() {
    if (!baileysUrl) {
      toast.error("Inserisci prima l'URL del servizio");
      return;
    }

    if (!pairingPhone) {
      toast.error("Inserisci il numero di telefono");
      return;
    }

    setLoadingPairing(true);
    setPairingCode(null);

    try {
      const digits = pairingPhone.replace(/\D/g, "");
      const prefixDigits = pairingPrefix.replace(/\D/g, "");
      const phone = `${prefixDigits}${digits}`;

      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "baileys_pair",
          service_url: baileysUrl,
          api_key: baileysApiKey,
          phone,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.code === "pairing_not_supported") {
        toast.error(data.error || "Questo microservizio non supporta il collegamento con numero");
        setShowPairing(false);
        await loadQrCode();
        return;
      }

      const pairingValue =
        typeof data?.pairing_code === "string"
          ? data.pairing_code
          : typeof data?.code === "string"
            ? data.code
            : null;

      if (data?.success && pairingValue) {
        setPairingCode(pairingValue);
        toast.success("Codice generato! Inseriscilo su WhatsApp");
      } else {
        const errMsg = data?.error || "Errore nella generazione del codice";

        if (errMsg.toLowerCase().includes("connection closed") || errMsg.toLowerCase().includes("not open") || errMsg.toLowerCase().includes("closed")) {
          toast.error("La sessione WhatsApp non è pronta. Clicca prima 'Disconnetti', attendi qualche secondo, poi riprova 'Collega con Numero'.");
        } else {
          toast.error(errMsg);
        }
      }
    } catch (error: any) {
      toast.error(error?.message || "Impossibile contattare il servizio");
    } finally {
      setLoadingPairing(false);
    }
  }

  async function disconnectSession() {
    if (!baileysUrl) return;
    setDisconnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "baileys_disconnect",
          service_url: baileysUrl,
          api_key: baileysApiKey,
        },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setConnectionStatus("disconnected");
        toast.success("Sessione disconnessa. Ora puoi collegare un nuovo numero.");
      } else {
        toast.error(data.error || "Errore nella disconnessione");
      }
    } catch (error: any) {
      toast.error(error?.message || "Impossibile contattare il servizio");
    } finally {
      setDisconnecting(false);
    }
  }

  function copyPairingCode() {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      setPairingCopied(true);
      setTimeout(() => setPairingCopied(false), 2000);
    }
  }

  // Queries
  const { data: templates = [], isLoading: loadingTpls } = useQuery({
    queryKey: ["lead-wa-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_wa_templates" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: automations = [], isLoading: loadingAutos } = useQuery({
    queryKey: ["lead-wa-automations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_wa_automations" as any)
        .select("*, lead_wa_templates(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: sendLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ["lead-wa-send-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_wa_send_log" as any)
        .select("*, facebook_leads(full_name, phone)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  // Template mutations
  const saveTemplate = useMutation({
    mutationFn: async () => {
      const vars = VARIABLES.filter((v) => tplBody.includes(v));
      if (editingTemplate) {
        const { error } = await supabase
          .from("lead_wa_templates" as any)
          .update({ name: tplName, body: tplBody, variables: vars, updated_at: new Date().toISOString() })
          .eq("id", editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("lead_wa_templates" as any)
          .insert({ name: tplName, body: tplBody, variables: vars });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-wa-templates"] });
      toast.success("Template salvato");
      closeTemplateDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lead_wa_templates" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-wa-templates"] });
      toast.success("Template eliminato");
    },
  });

  // Automation mutations
  const saveAutomation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: autoName,
        template_id: autoTemplateId || null,
        condition_type: autoCondition,
        delay_minutes: parseInt(autoDelay) || 60,
        max_sends_per_lead: parseInt(autoMaxSends) || 1,
      };
      if (editingAuto) {
        const { error } = await supabase
          .from("lead_wa_automations" as any)
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editingAuto.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("lead_wa_automations" as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-wa-automations"] });
      toast.success("Automazione salvata");
      closeAutoDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleAutomation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("lead_wa_automations" as any)
        .update({ is_active: active, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-wa-automations"] });
    },
  });

  const deleteAutomation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lead_wa_automations" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-wa-automations"] });
      toast.success("Automazione eliminata");
    },
  });

  function openNewTemplate() {
    setEditingTemplate(null);
    setTplName("");
    setTplBody("");
    setTemplateDialog(true);
  }

  function openEditTemplate(t: any) {
    setEditingTemplate(t);
    setTplName(t.name);
    setTplBody(t.body);
    setTemplateDialog(true);
  }

  function closeTemplateDialog() {
    setTemplateDialog(false);
    setEditingTemplate(null);
  }

  function openNewAuto() {
    setEditingAuto(null);
    setAutoName("");
    setAutoTemplateId("");
    setAutoCondition("no_funnel");
    setAutoDelay("60");
    setAutoMaxSends("1");
    setAutoDialog(true);
  }

  function openEditAuto(a: any) {
    setEditingAuto(a);
    setAutoName(a.name);
    setAutoTemplateId(a.template_id || "");
    setAutoCondition(a.condition_type);
    setAutoDelay(String(a.delay_minutes));
    setAutoMaxSends(String(a.max_sends_per_lead));
    setAutoDialog(true);
  }

  function closeAutoDialog() {
    setAutoDialog(false);
    setEditingAuto(null);
  }

  function insertVariable(variable: string) {
    setTplBody((prev) => prev + variable);
  }

  return (
    <div className="space-y-4">
      {/* ─── CONNESSIONE WHATSAPP ─── */}
      <Collapsible open={connectionOpen} onOpenChange={setConnectionOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Connessione WhatsApp (Baileys)</CardTitle>
                  {connectionStatus === "connected" && (
                    <Badge variant="secondary" className="border border-primary/30 bg-primary/10 text-primary text-[10px]"><Wifi className="w-3 h-3 mr-1" /> Connesso</Badge>
                  )}
                  {connectionStatus === "service_online" && (
                    <Badge variant="outline" className="text-[10px]"><Smartphone className="w-3 h-3 mr-1" /> Servizio attivo</Badge>
                  )}
                  {connectionStatus === "disconnected" && (
                    <Badge variant="destructive" className="text-[10px]"><WifiOff className="w-3 h-3 mr-1" /> Disconnesso</Badge>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${connectionOpen ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {loadingIntegration ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium">URL Servizio Baileys</Label>
                      <Input
                        value={baileysUrl}
                        onChange={(e) => setBaileysUrl(e.target.value)}
                        placeholder="https://your-baileys-server.com"
                        className="mt-1"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">L'indirizzo del microservizio Baileys (es. VPS Hetzner)</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">API Key</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          value={baileysApiKey}
                          onChange={(e) => setBaileysApiKey(e.target.value)}
                          placeholder="Chiave API del servizio"
                        />
                        <Button size="icon" variant="outline" onClick={() => setShowApiKey(!showApiKey)}>
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={saveConnection} disabled={savingConnection || !baileysUrl}>
                      {savingConnection ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                      Salva Configurazione
                    </Button>
                    <Button size="sm" variant="outline" onClick={checkHealth} disabled={!baileysUrl || connectionStatus === "checking"}>
                      {connectionStatus === "checking" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                      Verifica Connessione
                    </Button>
                    <Button size="sm" onClick={() => { setShowPairing(true); setShowQr(false); }} disabled={!baileysUrl}>
                      <Smartphone className="w-4 h-4 mr-1" />
                      Collega con Numero (Consigliato)
                    </Button>
                    <Button size="sm" variant="outline" onClick={loadQrCode} disabled={!baileysUrl || loadingQr}>
                      {loadingQr ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <QrCode className="w-4 h-4 mr-1" />}
                      Collega con QR Code
                    </Button>
                    <Button size="sm" variant="destructive" onClick={disconnectSession} disabled={disconnecting || !baileysUrl}>
                      {disconnecting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Unplug className="w-4 h-4 mr-1" />}
                      Disconnetti
                    </Button>
                  </div>

                  {/* Pairing Code flow */}
                  {showPairing && (
                    <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Collega con Numero di Telefono</p>
                        <Button size="sm" variant="ghost" onClick={() => { setShowPairing(false); setPairingCode(null); setPairingPhone(""); }}>
                          ✕
                        </Button>
                      </div>
                      
                      {!pairingCode ? (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">Numero WhatsApp da collegare</Label>
                            <div className="flex gap-2 mt-1">
                              <Popover open={prefixOpen} onOpenChange={setPrefixOpen}>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="flex items-center gap-1 rounded-md border border-input bg-muted/50 px-3 text-sm text-foreground h-10 shrink-0 hover:bg-muted transition-colors cursor-pointer"
                                  >
                                    <span className="font-medium">{pairingPrefix}</span>
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-1" align="start">
                                  <ScrollArea className="h-60">
                                    {Object.entries(COUNTRY_PREFIXES).map(([code, prefix]) => (
                                      <button
                                        key={code}
                                        type="button"
                                        onClick={() => { setPairingPrefix(prefix); setPrefixOpen(false); }}
                                        className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors cursor-pointer ${
                                          pairingPrefix === prefix
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : 'hover:bg-muted text-foreground'
                                        }`}
                                      >
                                        <span>{code}</span>
                                        <span className="text-muted-foreground">{prefix}</span>
                                      </button>
                                    ))}
                                  </ScrollArea>
                                </PopoverContent>
                              </Popover>
                              <Input
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={pairingPhone}
                                onChange={(e) => setPairingPhone(e.target.value.replace(/[^0-9]/g, ""))}
                                placeholder="3xx xxx xxxx"
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Seleziona il prefisso e inserisci il numero senza lo zero iniziale</p>
                          </div>
                          <Button size="sm" onClick={requestPairingCode} disabled={loadingPairing || !pairingPhone}>
                            {loadingPairing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Smartphone className="w-4 h-4 mr-1" />}
                            Genera Codice
                          </Button>
                          {/* Guida visiva */}
                          <div className="border rounded-lg p-3 bg-background">
                            <p className="text-xs font-medium mb-2">📱 Dopo aver generato il codice, segui questi passaggi su WhatsApp:</p>
                            <img
                              src={whatsappPairingGuide}
                              alt="Guida collegamento WhatsApp con codice di accoppiamento"
                              className="w-full rounded-md"
                              loading="lazy"
                              width={1280}
                              height={512}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 text-center">
                          <p className="text-xs text-muted-foreground">Inserisci questo codice su WhatsApp:</p>
                          <div className="flex items-center justify-center gap-3">
                            <span className="text-3xl font-mono font-bold tracking-[0.3em] text-primary">{pairingCode}</span>
                            <Button size="icon" variant="outline" onClick={copyPairingCode} className="h-8 w-8">
                              {pairingCopied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                          {/* Guida visiva con codice */}
                          <div className="border rounded-lg p-3 bg-background space-y-2">
                            <p className="text-xs font-medium">📱 Come inserire il codice:</p>
                            <img
                              src={whatsappPairingGuide}
                              alt="Guida collegamento WhatsApp con codice di accoppiamento"
                              className="w-full rounded-md"
                              loading="lazy"
                              width={1280}
                              height={512}
                            />
                            <ol className="text-[11px] text-muted-foreground space-y-0.5 list-decimal list-inside text-left">
                              <li>Apri <strong>WhatsApp</strong> sul telefono</li>
                              <li>Vai su <strong>Impostazioni → Dispositivi collegati</strong></li>
                              <li>Tocca <strong>Collega un dispositivo</strong></li>
                              <li>Tocca <strong>{'"'}Collega con numero di telefono{'"'}</strong> (in basso)</li>
                              <li>Inserisci il codice <strong>{pairingCode}</strong></li>
                            </ol>
                          </div>
                          <div className="flex justify-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setPairingCode(null); }}>
                              <RefreshCw className="w-3 h-3 mr-1" /> Nuovo Codice
                            </Button>
                            <Button size="sm" variant="outline" onClick={checkHealth}>
                              <Wifi className="w-3 h-3 mr-1" /> Verifica Collegamento
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* QR Code display */}
                  {showQr && (
                    <div className="border rounded-lg p-4 bg-muted/30 text-center">
                      {loadingQr ? (
                        <div className="flex flex-col items-center gap-2 py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Caricamento QR Code...</p>
                        </div>
                      ) : qrHtml ? (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-foreground">Scansiona il QR con WhatsApp</p>
                          <p className="text-xs text-muted-foreground">Apri WhatsApp → Dispositivi collegati → Collega un dispositivo</p>
                          <div className="flex justify-center">
                            <iframe
                              srcDoc={`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100%;background:transparent}img,svg,canvas{max-width:100%!important;height:auto!important}</style></head><body>${qrHtml}</body></html>`}
                              className="w-full max-w-[400px] aspect-square border-0 rounded bg-white"
                              title="WhatsApp QR Code"
                              sandbox="allow-scripts"
                            />
                          </div>
                          <div className="flex justify-center gap-2">
                            <Button size="sm" variant="outline" onClick={loadQrCode}>
                              <RefreshCw className="w-3 h-3 mr-1" /> Aggiorna QR
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setShowQr(false); setQrHtml(null); }}>
                              Chiudi
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 space-y-2">
                          <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
                          <p className="text-sm text-destructive">
                            {connectionStatus === "service_online"
                              ? t("admin.leadWhatsApp.qrServiceOnlineTitle")
                              : t("admin.leadWhatsApp.qrUnavailable")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {qrErrorDetail || (connectionStatus === "service_online"
                              ? t("admin.leadWhatsApp.qrServiceOnlineHint")
                              : t("admin.leadWhatsApp.qrUnavailableOfflineHint"))}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Connection status details */}
                  {connectionStatus !== "unknown" && connectionStatus !== "checking" && (
                    <div className={`flex items-start gap-2 rounded-lg border p-3 ${
                      connectionStatus === "connected"
                        ? "border-primary/30 bg-primary/10"
                        : connectionStatus === "service_online"
                          ? "border-border bg-secondary/60"
                          : "border-destructive/30 bg-destructive/10"
                    }`}>
                      {connectionStatus === "connected" ? (
                        <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      ) : connectionStatus === "service_online" ? (
                        <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                      ) : (
                        <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {connectionStatus === "connected"
                            ? "WhatsApp connesso ✓"
                            : connectionStatus === "service_online"
                              ? "Servizio attivo, numero da collegare"
                              : "Microservizio non raggiungibile"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {connectionStatus === "connected"
                            ? "Il servizio è attivo e pronto per inviare messaggi ai lead"
                            : connectionStatus === "service_online"
                              ? "Render risponde correttamente: ora collega il numero con QR Code o con il codice di accoppiamento"
                              : "Controlla URL, deploy e API key del microservizio Baileys"}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ─── TEMPLATES ─── */}
      <Collapsible open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Template Messaggi</CardTitle>
                  <Badge variant="secondary" className="text-xs">{templates.length}</Badge>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${templatesOpen ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              <Button size="sm" onClick={openNewTemplate}>
                <Plus className="w-4 h-4 mr-1" /> Nuovo Template
              </Button>
              {loadingTpls ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : templates.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nessun template creato</p>
              ) : (
                <div className="space-y-2">
                  {templates.map((t: any) => (
                    <div key={t.id} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{t.name}</span>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditTemplate(t)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteTemplate.mutate(t.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">{t.body}</p>
                      {t.variables?.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {t.variables.map((v: string) => (
                            <Badge key={v} variant="outline" className="text-[10px]">{v}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ─── AUTOMATIONS ─── */}
      <Collapsible open={automationsOpen} onOpenChange={setAutomationsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Automazioni</CardTitle>
                  <Badge variant="secondary" className="text-xs">{automations.length}</Badge>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${automationsOpen ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              <Button size="sm" onClick={openNewAuto}>
                <Plus className="w-4 h-4 mr-1" /> Nuova Automazione
              </Button>
              {loadingAutos ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : automations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nessuna automazione creata</p>
              ) : (
                <div className="space-y-2">
                  {automations.map((a: any) => (
                    <div key={a.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{a.name}</span>
                          <Badge variant={a.is_active ? "default" : "secondary"} className="text-[10px]">
                            {a.is_active ? "Attiva" : "Disattivata"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={a.is_active}
                            onCheckedChange={(checked) => toggleAutomation.mutate({ id: a.id, active: checked })}
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditAuto(a)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteAutomation.mutate(a.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>📋 {CONDITION_LABELS[a.condition_type] || a.condition_type}</span>
                        <span>⏱️ Dopo {a.delay_minutes} min</span>
                        <span>📤 Max {a.max_sends_per_lead}x per lead</span>
                        {a.lead_wa_templates && <span>📝 {a.lead_wa_templates.name}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ─── SEND LOG ─── */}
      <Collapsible open={logsOpen} onOpenChange={setLogsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Storico Invii</CardTitle>
                  <Badge variant="secondary" className="text-xs">{sendLogs.length}</Badge>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${logsOpen ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {loadingLogs ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : sendLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nessun invio registrato</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Lead</TableHead>
                        <TableHead className="text-xs">Telefono</TableHead>
                        <TableHead className="text-xs">Stato</TableHead>
                        <TableHead className="text-xs">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sendLogs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">{log.facebook_leads?.full_name || "—"}</TableCell>
                          <TableCell className="text-xs font-mono">{log.phone}</TableCell>
                          <TableCell>
                            <Badge variant={log.status === "sent" ? "default" : "destructive"} className="text-[10px]">
                              {log.status === "sent" ? "✓ Inviato" : "✗ Fallito"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ─── TEMPLATE DIALOG ─── */}
      <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Modifica Template" : "Nuovo Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Es. Benvenuto Lead" />
            </div>
            <div>
              <Label>Messaggio</Label>
              <Textarea
                value={tplBody}
                onChange={(e) => setTplBody(e.target.value)}
                placeholder="Ciao {{nome}}, grazie per il tuo interesse..."
                rows={5}
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {VARIABLES.map((v) => (
                  <Button key={v} type="button" variant="outline" size="sm" className="text-xs h-6 px-2" onClick={() => insertVariable(v)}>
                    {v}
                  </Button>
                ))}
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium mb-1">Anteprima:</p>
              <p className="text-sm whitespace-pre-wrap">
                {tplBody
                  .replace(/\{\{nome\}\}/gi, "Anna")
                  .replace(/\{\{cognome\}\}/gi, "Borrelli")
                  .replace(/\{\{telefono\}\}/gi, "+39 379 175 2038")
                  .replace(/\{\{email\}\}/gi, "anna@email.it")
                  .replace(/\{\{fonte\}\}/gi, "Facebook")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeTemplateDialog}>Annulla</Button>
            <Button onClick={() => saveTemplate.mutate()} disabled={!tplName || !tplBody || saveTemplate.isPending}>
              {saveTemplate.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── AUTOMATION DIALOG ─── */}
      <Dialog open={autoDialog} onOpenChange={setAutoDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAuto ? "Modifica Automazione" : "Nuova Automazione"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={autoName} onChange={(e) => setAutoName(e.target.value)} placeholder="Es. Follow-up no funnel" />
            </div>
            <div>
              <Label>Condizione</Label>
              <Select value={autoCondition} onValueChange={setAutoCondition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Template messaggio</Label>
              <Select value={autoTemplateId} onValueChange={setAutoTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ritardo (minuti)</Label>
                <Input type="number" value={autoDelay} onChange={(e) => setAutoDelay(e.target.value)} min="1" />
                <p className="text-[10px] text-muted-foreground mt-1">Minuti dopo l'ingresso del lead</p>
              </div>
              <div>
                <Label>Max invii per lead</Label>
                <Input type="number" value={autoMaxSends} onChange={(e) => setAutoMaxSends(e.target.value)} min="1" max="5" />
              </div>
            </div>
            {autoCondition === "funnel_complete_wa" && (
              <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                <p className="text-xs text-warning">
                  Questi lead hanno già scritto su WhatsApp. Di solito non serve inviare nulla perché l'automation di risposta è già attiva.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAutoDialog}>Annulla</Button>
            <Button onClick={() => saveAutomation.mutate()} disabled={!autoName || !autoTemplateId || saveAutomation.isPending}>
              {saveAutomation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
