import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FacebookLeadsSettings from "./FacebookLeadsSettings";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MessageSquare, Phone, Loader2, Eye, EyeOff, ExternalLink, HelpCircle, BookOpen, ChevronDown, FlaskConical, Zap, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { toast } from "sonner";

interface SalonIntegration {
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_phone_number: string;
  twilio_sender_id: string;
  twilio_messaging_service_sid: string;
  sender_id_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  whatsapp_token: string;
  whatsapp_phone_id: string;
  whatsapp_phone_number: string;
  whatsapp_verify_token: string;
  test_mode: boolean;
  fast_flow_mode: boolean;
  baileys_service_url: string;
  baileys_api_key: string;
}

const defaultIntegration: SalonIntegration = {
  twilio_account_sid: "",
  twilio_auth_token: "",
  twilio_phone_number: "",
  twilio_sender_id: "GlowUp",
  twilio_messaging_service_sid: "",
  sender_id_enabled: true,
  sms_enabled: false,
  whatsapp_enabled: false,
  whatsapp_token: "",
  whatsapp_phone_id: "",
  whatsapp_phone_number: "",
  whatsapp_verify_token: "",
  test_mode: false,
  fast_flow_mode: false,
  baileys_service_url: "",
  baileys_api_key: "",
};

// Columns safe to fetch from the database (excludes secrets: twilio_auth_token, whatsapp_token)
const SAFE_COLUMNS = "id, user_id, twilio_account_sid, twilio_phone_number, twilio_sender_id, twilio_messaging_service_sid, sender_id_enabled, sms_enabled, whatsapp_enabled, whatsapp_phone_id, whatsapp_phone_number, whatsapp_verify_token, test_mode, fast_flow_mode, baileys_service_url, created_at, updated_at";

function FieldWithHelp({ label, help, children }: { label: string; help: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-sm">{label}</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {help}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {children}
    </div>
  );
}

export default function IntegrationSettings() {
  const { t } = useTranslation();
  const { user, isSuperAdmin } = useAuth();
  
  const navigate = useNavigate();
  const [data, setData] = useState<SalonIntegration>(defaultIntegration);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showWhatsAppToken, setShowWhatsAppToken] = useState(false);
  const [hasTwilioToken, setHasTwilioToken] = useState(false);
  const [hasWhatsAppToken, setHasWhatsAppToken] = useState(false);
  const [storedTwilioToken, setStoredTwilioToken] = useState("");
  const [storedWhatsAppToken, setStoredWhatsAppToken] = useState("");
  const [hasMessagingSub, setHasMessagingSub] = useState(false);
  const [messagingCheckoutLoading, setMessagingCheckoutLoading] = useState(false);
  const [hasBaileysApiKey, setHasBaileysApiKey] = useState(false);
  const [searchParams] = useSearchParams();

  // Integration config is platform-level (shared across all centers).
  // Always load the single existing record regardless of current user.
  const [integrationUserId, setIntegrationUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchIntegration();
    fetchMessagingSubscription();
  }, [user, isSuperAdmin]);

  // Check for messaging checkout success/cancel from URL params
  useEffect(() => {
    if (searchParams.get("messaging") === "success") {
      toast.success(t("integrations.messagingActivated"));
      fetchMessagingSubscription();
    } else if (searchParams.get("messaging") === "canceled") {
      toast.info(t("integrations.messagingCanceled"));
    }
  }, [searchParams, t]);

  const fetchMessagingSubscription = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messaging_subscriptions" as any)
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    setHasMessagingSub(!!data);
  };

  const startMessagingCheckout = async () => {
    setMessagingCheckoutLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non autenticato");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-messaging-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            successUrl: `${window.location.origin}/impostazioni?tab=integrations&messaging=success`,
            cancelUrl: `${window.location.origin}/impostazioni?tab=integrations&messaging=canceled`,
          }),
        }
      );

      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || data.error) {
        toast.error(data.error || "Errore durante il checkout messaggistica");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Messaging checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Errore");
    } finally {
      setMessagingCheckoutLoading(false);
    }
  };

  const fetchIntegration = async () => {
    if (!user) return;

    setLoading(true);

    let query = supabase
      .from("salon_integrations")
      .select(SAFE_COLUMNS)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (!isSuperAdmin) {
      query = query.eq("user_id", user.id);
    }

    const { data: row } = await query.maybeSingle();

    if (row) {
      const rowUserId = (row as any).user_id;
      setIntegrationUserId(rowUserId);
      setData(prev => ({
        ...prev,
        twilio_account_sid: (row as any).twilio_account_sid || "",
        twilio_auth_token: "",
        twilio_phone_number: (row as any).twilio_phone_number || "",
        twilio_sender_id: (row as any).twilio_sender_id || "GlowUp",
        twilio_messaging_service_sid: (row as any).twilio_messaging_service_sid || "",
        sender_id_enabled: (row as any).sender_id_enabled ?? true,
        sms_enabled: (row as any).sms_enabled || false,
        whatsapp_enabled: (row as any).whatsapp_enabled || false,
        whatsapp_token: "",
        whatsapp_phone_id: (row as any).whatsapp_phone_id || "",
        whatsapp_phone_number: (row as any).whatsapp_phone_number || "",
        whatsapp_verify_token: (row as any).whatsapp_verify_token || "",
        test_mode: (row as any).test_mode || false,
        fast_flow_mode: (row as any).fast_flow_mode || false,
        baileys_service_url: (row as any).baileys_service_url || "",
        baileys_api_key: "",
      }));

      // Check actual secret status + load values for super admin
      const { data: secretsStatus } = await supabase.rpc("get_integration_secrets_status", { p_user_id: rowUserId });
      if (secretsStatus) {
        setHasTwilioToken(!!(secretsStatus as any).has_twilio_token);
        setHasWhatsAppToken(!!(secretsStatus as any).has_whatsapp_token);
        setHasBaileysApiKey(!!(secretsStatus as any).has_baileys_api_key);
      }

      // Super admin can read actual token values for the eye toggle
      if (isSuperAdmin) {
        const { data: secrets } = await supabase.rpc("get_integration_secrets", { p_integration_user_id: rowUserId });
        if (secrets) {
          setStoredTwilioToken((secrets as any).twilio_auth_token || "");
          setStoredWhatsAppToken((secrets as any).whatsapp_token || "");
        }
      }
    }

    setLoading(false);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);

    // Use existing record's user_id to avoid creating duplicate records
    const targetUserId = integrationUserId || user.id;

    // Build payload — only include secret fields if the user actually typed a new value
    const payload: Record<string, any> = {
      user_id: targetUserId,
      twilio_account_sid: data.twilio_account_sid || null,
      twilio_phone_number: data.twilio_phone_number || null,
      twilio_sender_id: data.twilio_sender_id || "GlowUp",
      twilio_messaging_service_sid: data.twilio_messaging_service_sid || null,
      sender_id_enabled: data.sender_id_enabled,
      sms_enabled: data.sms_enabled,
      whatsapp_enabled: data.whatsapp_enabled,
      whatsapp_phone_id: data.whatsapp_phone_id || null,
      whatsapp_phone_number: data.whatsapp_phone_number || null,
      whatsapp_verify_token: data.whatsapp_verify_token || null,
      test_mode: data.test_mode,
      fast_flow_mode: data.fast_flow_mode,
      baileys_service_url: data.baileys_service_url || null,
      updated_at: new Date().toISOString(),
    };

    // Only send secrets if the user typed a new value (non-empty)
    if (data.twilio_auth_token) {
      payload.twilio_auth_token = data.twilio_auth_token;
    }
    if (data.whatsapp_token) {
      payload.whatsapp_token = data.whatsapp_token;
    }
    if (data.baileys_api_key) {
      payload.baileys_api_key = data.baileys_api_key;
    }

    const { error } = await supabase
      .from("salon_integrations")
      .upsert(payload as any, { onConflict: "user_id" });

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("common.save"));
      // Refetch to update secret status indicators
      fetchIntegration();
    }
  };

  const update = (field: keyof SalonIntegration, value: string | boolean) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const canToggleChannel = hasMessagingSub || isSuperAdmin;
  const canEditCredentials = isSuperAdmin;
  const canSeeDebugTools = isSuperAdmin;
  const needsMessagingSub = !hasMessagingSub && !isSuperAdmin;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Alert banner: messaging subscription needed */}
      {needsMessagingSub && (
        <Alert className="border-primary/30 bg-primary/5">
          <CreditCard className="h-4 w-4 text-primary" />
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-sm text-foreground">
              {t("integrations.messagingSubRequired", "Per attivare SMS e WhatsApp, aggiungi il piano messaggistica. Paghi solo a consumo: SMS €0,12 e WhatsApp €0,10 per messaggio.")}
            </span>
            <Button
              size="sm"
              variant="hero"
              className="shrink-0 w-fit gap-2"
              onClick={startMessagingCheckout}
              disabled={messagingCheckoutLoading}
            >
              {messagingCheckoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {t("integrations.activateMessaging", "Attiva Messaggistica")}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {/* Twilio SMS */}
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-serif flex items-center gap-2 text-base">
                <Phone className="h-4 w-4 text-primary" /> {t("integrations.twilioTitle")}
              </CardTitle>
              <CardDescription className="mt-1">{t("integrations.twilioDesc")}</CardDescription>
            </div>
            <Switch
              checked={data.sms_enabled}
              onCheckedChange={(v) => update("sms_enabled", v)}
              disabled={!canToggleChannel}
            />
          </div>
        </CardHeader>
        {data.sms_enabled && canEditCredentials && (
          <CardContent className="space-y-4">
            <FieldWithHelp label="Account SID" help={t("integrations.twilioSidHelp")}>
              <Input
                value={data.twilio_account_sid}
                onChange={(e) => update("twilio_account_sid", e.target.value)}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </FieldWithHelp>

            <FieldWithHelp label="Auth Token" help={t("integrations.twilioTokenHelp")}>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  value={data.twilio_auth_token || (showToken ? storedTwilioToken : "")}
                  onChange={(e) => update("twilio_auth_token", e.target.value)}
                  placeholder={hasTwilioToken ? (showToken ? "" : "••••••••  Token salvato") : "Inserisci Auth Token"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
              {hasTwilioToken && !data.twilio_auth_token && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  ✅ Token salvato. Clicca 👁 per visualizzarlo, oppure inserisci un nuovo valore per sostituirlo.
                </p>
              )}
              {!hasTwilioToken && !data.twilio_auth_token && (
                <p className="text-xs text-destructive mt-1">
                  ⚠️ Nessun token configurato — inserisci l'Auth Token di Twilio.
                </p>
              )}
            </FieldWithHelp>

            <FieldWithHelp label="Messaging Service SID" help={t("integrations.twilioMsgSidHelp")}>
              <Input
                value={data.twilio_messaging_service_sid}
                onChange={(e) => update("twilio_messaging_service_sid", e.target.value)}
                placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </FieldWithHelp>
            {data.twilio_messaging_service_sid && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                ✅ {t("integrations.twilioMsgSidActive")}
              </p>
            )}

            {/* Sender ID section - FIRST */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <FieldWithHelp label="Sender ID" help={t("integrations.twilioSenderHelp")}>
                  <Input
                    value={data.twilio_sender_id}
                    onChange={(e) => update("twilio_sender_id", e.target.value)}
                    placeholder="GlowUp"
                    disabled={!data.sender_id_enabled}
                    className={!data.sender_id_enabled ? "opacity-50" : ""}
                    maxLength={11}
                  />
                </FieldWithHelp>
                <div className="flex items-center gap-2 pt-5 shrink-0">
                  <Switch
                    checked={data.sender_id_enabled}
                    onCheckedChange={(v) => update("sender_id_enabled", v)}
                  />
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                    {data.sender_id_enabled ? "Attivo" : "Off"}
                  </Label>
                </div>
              </div>
              {data.sender_id_enabled && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  ✅ Gli SMS verranno inviati con mittente "{data.twilio_sender_id || "GlowUp"}" — il numero di telefono non è necessario.
                </p>
              )}
              {!data.sender_id_enabled && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ {t("integrations.twilioPhoneRequired")}
                </p>
              )}
            </div>

            {/* Phone number - conditional */}
            <div className="space-y-1.5">
              <FieldWithHelp label={t("integrations.twilioPhone")} help={t("integrations.twilioPhoneHelp")}>
                <Input
                  value={data.twilio_phone_number}
                  onChange={(e) => update("twilio_phone_number", e.target.value)}
                  placeholder="+1234567890"
                  className={data.sender_id_enabled ? "opacity-50" : ""}
                />
              </FieldWithHelp>
              {data.sender_id_enabled && !data.twilio_phone_number && (
                <p className="text-xs text-muted-foreground italic">
                  {t("integrations.twilioPhoneNotNeeded")}
                </p>
              )}
            </div>

            <a
              href="https://console.twilio.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> {t("integrations.twilioConsoleLink")}
            </a>

            <Separator className="my-2" />

            {/* Guide 1: Initial Setup */}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full group">
                <BookOpen className="h-4 w-4 text-primary" />
                {t("integrations.twilioGuideTitle")}
                <ChevronDown className="h-3.5 w-3.5 ml-auto transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">{t("integrations.twilioGuideIntro")}</p>
                  <ol className="list-decimal list-inside space-y-2 pl-1">
                    <li>{t("integrations.twilioStep1")}</li>
                    <li>{t("integrations.twilioStep2")}</li>
                    <li>{t("integrations.twilioStep3")}</li>
                    <li>{t("integrations.twilioStep4")}</li>
                    <li>{t("integrations.twilioStep5")}</li>
                    <li>{t("integrations.twilioStep6")}</li>
                  </ol>
                  <div className="rounded-md bg-primary/5 border border-primary/10 p-3 text-xs">
                    <p className="font-semibold text-primary mb-1">💡 {t("integrations.twilioTip")}</p>
                    <p>{t("integrations.twilioTipText")}</p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Guide 2: Sender ID */}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full group">
                <BookOpen className="h-4 w-4 text-primary" />
                {t("integrations.senderIdGuideTitle")}
                <ChevronDown className="h-3.5 w-3.5 ml-auto transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">{t("integrations.senderIdGuideIntro")}</p>
                  <ol className="list-decimal list-inside space-y-2 pl-1">
                    <li>{t("integrations.senderIdStep1")}</li>
                    <li>{t("integrations.senderIdStep2")}</li>
                    <li>{t("integrations.senderIdStep3")}</li>
                    <li>{t("integrations.senderIdStep4")}</li>
                    <li>{t("integrations.senderIdStep5")}</li>
                    <li>{t("integrations.senderIdStep6")}</li>
                    <li>{t("integrations.senderIdStep7")}</li>
                  </ol>

                  <div className="space-y-2 mt-3">
                    <div className="rounded-md bg-primary/5 border border-primary/10 p-3 text-xs">
                      <p className="font-semibold text-primary mb-1">{t("integrations.senderIdNote1Title")}</p>
                      <p>{t("integrations.senderIdNote1Text")}</p>
                    </div>
                    <div className="rounded-md bg-primary/5 border border-primary/10 p-3 text-xs">
                      <p className="font-semibold text-primary mb-1">{t("integrations.senderIdNote2Title")}</p>
                      <p>{t("integrations.senderIdNote2Text")}</p>
                    </div>
                    <div className="rounded-md bg-amber-500/5 border border-amber-500/10 p-3 text-xs">
                      <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">{t("integrations.senderIdNote3Title")}</p>
                      <p>{t("integrations.senderIdNote3Text")}</p>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full group">
                <FlaskConical className="h-4 w-4 text-primary" />
                {t("integrations.scalingGuideTitle")}
                <ChevronDown className="h-3.5 w-3.5 ml-auto transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-4 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">{t("integrations.scalingGuideIntro")}</p>

                  {/* Batch processing */}
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">📦 {t("integrations.scalingBatchTitle")}</p>
                    <p>{t("integrations.scalingBatchText")}</p>
                    <p className="text-xs text-muted-foreground/70 italic">{t("integrations.scalingBatchCapacity")}</p>
                  </div>

                  {/* Sender ID */}
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">🏷️ {t("integrations.scalingSenderIdTitle")}</p>
                    <p>{t("integrations.scalingSenderIdText")}</p>
                  </div>

                  {/* A2P */}
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">📋 {t("integrations.scalingNoA2PTitle")}</p>
                    <p>{t("integrations.scalingNoA2PText")}</p>
                  </div>

                  {/* Domain */}
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">🔗 {t("integrations.scalingDomainTitle")}</p>
                    <p>{t("integrations.scalingDomainText")}</p>
                  </div>

                  {/* Future: Messaging Service */}
                  <div className="rounded-md bg-primary/5 border border-primary/10 p-3 space-y-2">
                    <p className="font-semibold text-primary">🚀 {t("integrations.scalingFutureTitle")}</p>
                    <p className="text-xs">{t("integrations.scalingFutureIntro")}</p>
                    <ol className="list-decimal list-inside space-y-1 pl-1 text-xs">
                      <li>{t("integrations.scalingFutureStep1")}</li>
                      <li>{t("integrations.scalingFutureStep2")}</li>
                      <li>{t("integrations.scalingFutureStep3")}</li>
                      <li>{t("integrations.scalingFutureStep4")}</li>
                    </ol>
                    <div className="rounded bg-primary/5 p-2 text-xs mt-2">
                      <p className="font-semibold text-primary mb-0.5">💡 {t("integrations.scalingFutureTip")}</p>
                      <p>{t("integrations.scalingFutureTipText")}</p>
                    </div>
                  </div>

                  {/* Volumes & ban risk */}
                  <div className="space-y-2 pt-2 border-t border-border/30">
                    <p className="font-medium text-foreground">⚡ {t("integrations.scalingVolumesTitle")}</p>
                    <p className="text-xs">{t("integrations.scalingVolumesText")}</p>
                    
                    <div className="rounded-md bg-destructive/5 border border-destructive/10 p-3 text-xs space-y-1">
                      <p className="font-semibold text-destructive">❌ {t("integrations.scalingBanRisksTitle")}</p>
                      <ul className="list-disc list-inside space-y-0.5 pl-1">
                        <li>{t("integrations.scalingBanRisk1")}</li>
                        <li>{t("integrations.scalingBanRisk2")}</li>
                        <li>{t("integrations.scalingBanRisk3")}</li>
                        <li>{t("integrations.scalingBanRisk4")}</li>
                      </ul>
                    </div>

                    <div className="rounded-md bg-emerald-500/5 border border-emerald-500/10 p-3 text-xs space-y-1">
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">✅ {t("integrations.scalingBanSafeTitle")}</p>
                      <ul className="list-disc list-inside space-y-0.5 pl-1">
                        <li>{t("integrations.scalingBanSafe1")}</li>
                        <li>{t("integrations.scalingBanSafe2")}</li>
                        <li>{t("integrations.scalingBanSafe3")}</li>
                        <li>{t("integrations.scalingBanSafe4")}</li>
                        <li>{t("integrations.scalingBanSafe5")}</li>
                      </ul>
                    </div>

                    <div className="rounded bg-primary/5 p-2 text-xs">
                      <p className="font-semibold text-primary mb-0.5">🛡️ {t("integrations.scalingProfileTip")}</p>
                      <p>{t("integrations.scalingProfileTipText")}</p>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        )}
        {data.sms_enabled && !canEditCredentials && (
          <CardContent>
            <div className="rounded-md bg-muted/50 border border-border/50 p-3 text-sm text-muted-foreground">
              <p>✅ {t("integrations.smsConfiguredByAdmin", "SMS configurato e gestito dall'amministratore della piattaforma.")}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* WhatsApp */}
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-serif flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-primary" /> {t("integrations.whatsappTitle")}
              </CardTitle>
              <CardDescription className="mt-1">{t("integrations.whatsappDesc")}</CardDescription>
            </div>
            <Switch
              checked={data.whatsapp_enabled}
              onCheckedChange={(v) => update("whatsapp_enabled", v)}
              disabled={!canToggleChannel}
            />
          </div>
        </CardHeader>
        {data.whatsapp_enabled && canEditCredentials && (
          <CardContent className="space-y-4">
            <FieldWithHelp label="Access Token" help={t("integrations.whatsappTokenHelp")}>
              <div className="relative">
                <Input
                  type={showWhatsAppToken ? "text" : "password"}
                  value={data.whatsapp_token || (showWhatsAppToken ? storedWhatsAppToken : "")}
                  onChange={(e) => update("whatsapp_token", e.target.value)}
                  placeholder={hasWhatsAppToken ? (showWhatsAppToken ? "" : "••••••••  Token salvato") : "Inserisci Access Token"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowWhatsAppToken(!showWhatsAppToken)}
                >
                  {showWhatsAppToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
              {hasWhatsAppToken && !data.whatsapp_token && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  ✅ Token salvato. Clicca 👁 per visualizzarlo, oppure inserisci un nuovo valore per sostituirlo.
                </p>
              )}
              {!hasWhatsAppToken && !data.whatsapp_token && (
                <p className="text-xs text-destructive mt-1">
                  ⚠️ Nessun token configurato — inserisci il token di Meta per attivare WhatsApp.
                </p>
              )}
            </FieldWithHelp>

            <FieldWithHelp label="Phone Number ID" help={t("integrations.whatsappPhoneIdHelp")}>
              <Input
                value={data.whatsapp_phone_id}
                onChange={(e) => update("whatsapp_phone_id", e.target.value)}
                placeholder="123456789012345"
              />
            </FieldWithHelp>

            <FieldWithHelp label={t("integrations.whatsappPhone")} help={t("integrations.whatsappPhoneHelp")}>
              <Input
                value={data.whatsapp_phone_number}
                onChange={(e) => update("whatsapp_phone_number", e.target.value)}
                placeholder="+39xxxxxxxxxx"
              />
            </FieldWithHelp>

            <FieldWithHelp label="Webhook Verify Token" help="Token di verifica per il webhook Meta. Devi copiare questo stesso valore nella configurazione webhook su Meta.">
              <Input
                value={data.whatsapp_verify_token}
                onChange={(e) => update("whatsapp_verify_token", e.target.value)}
                placeholder="glowup_wh_verify_2026"
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL Webhook: <code className="bg-muted px-1 py-0.5 rounded text-xs select-all">https://uetddchrfllgywgdlozt.supabase.co/functions/v1/whatsapp-webhook</code>
              </p>
            </FieldWithHelp>

            <a
              href="https://business.facebook.com/settings/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> {t("integrations.metaConsoleLink")}
            </a>

            <Separator className="my-2" />

            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full group">
                <BookOpen className="h-4 w-4 text-primary" />
                {t("integrations.whatsappGuideTitle")}
                <ChevronDown className="h-3.5 w-3.5 ml-auto transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">{t("integrations.whatsappGuideIntro")}</p>
                  <ol className="list-decimal list-inside space-y-2 pl-1">
                    <li>{t("integrations.whatsappStep1")}</li>
                    <li>{t("integrations.whatsappStep2")}</li>
                    <li>{t("integrations.whatsappStep3")}</li>
                    <li>{t("integrations.whatsappStep4")}</li>
                    <li>{t("integrations.whatsappStep5")}</li>
                    <li>{t("integrations.whatsappStep6")}</li>
                    <li>{t("integrations.whatsappStep7")}</li>
                  </ol>
                  <div className="rounded-md bg-primary/5 border border-primary/10 p-3 text-xs">
                    <p className="font-semibold text-primary mb-1">⚠️ {t("integrations.whatsappWarning")}</p>
                    <p>{t("integrations.whatsappWarningText")}</p>
                  </div>
                  <div className="rounded-md bg-primary/5 border border-primary/10 p-3 text-xs">
                    <p className="font-semibold text-primary mb-1">💡 {t("integrations.whatsappTip")}</p>
                    <p>{t("integrations.whatsappTipText")}</p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        )}
        {data.whatsapp_enabled && !canEditCredentials && (
          <CardContent>
            <div className="rounded-md bg-muted/50 border border-border/50 p-3 text-sm text-muted-foreground">
              <p>✅ {t("integrations.whatsappConfiguredByAdmin", "WhatsApp configurato e gestito dall'amministratore della piattaforma.")}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* WhatsApp Baileys - Super Admin only */}
      {canSeeDebugTools && (
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-serif flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-primary" /> WhatsApp Baileys (Microservizio)
              </CardTitle>
              <CardDescription className="mt-1">
                Collegamento al microservizio WhatsApp Baileys su Render. Permette di inviare messaggi WhatsApp senza API ufficiali Meta.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {hasBaileysApiKey && data.baileys_service_url ? "✅ Configurato" : "⚠️ Da configurare"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldWithHelp label="URL del Servizio" help="L'URL del microservizio Baileys su Render (es. https://glowup-whatsapp-service.onrender.com)">
            <Input
              value={data.baileys_service_url}
              onChange={(e) => update("baileys_service_url", e.target.value)}
              placeholder="https://glowup-whatsapp-service.onrender.com"
            />
          </FieldWithHelp>

          <FieldWithHelp label="API Key" help="La chiave API configurata come variabile d'ambiente API_KEY nel servizio Render">
            <Input
              type="password"
              value={data.baileys_api_key}
              onChange={(e) => update("baileys_api_key", e.target.value)}
              placeholder={hasBaileysApiKey ? "••••••••  Chiave salvata" : "Inserisci la API Key"}
            />
            {hasBaileysApiKey && !data.baileys_api_key && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                ✅ API Key salvata. Inserisci un nuovo valore per sostituirla.
              </p>
            )}
            {!hasBaileysApiKey && !data.baileys_api_key && (
              <p className="text-xs text-destructive mt-1">
                ⚠️ Nessuna chiave configurata — inserisci la API Key del microservizio Render.
              </p>
            )}
          </FieldWithHelp>

          <div className="rounded-md bg-muted/50 border border-border/50 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">📋 Endpoint disponibili:</p>
            <p><code className="bg-muted px-1 py-0.5 rounded">/status</code> — Stato della sessione WhatsApp</p>
            <p><code className="bg-muted px-1 py-0.5 rounded">/connect</code> — Genera QR code per collegare WhatsApp</p>
            <p><code className="bg-muted px-1 py-0.5 rounded">/send</code> — Invia messaggio WhatsApp</p>
          </div>
        </CardContent>
      </Card>
      )}

      {canSeeDebugTools && (
      <Card className={`shadow-card border-2 ${data.test_mode ? "border-amber-400 bg-amber-50/30 dark:bg-amber-950/10" : "border-border/50"}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${data.test_mode ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted"}`}>
                <FlaskConical className={`h-5 w-5 ${data.test_mode ? "text-amber-600" : "text-muted-foreground"}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="font-serif text-base">
                    {t("integrations.testModeTitle", "Modalità Test")}
                  </CardTitle>
                  {data.test_mode && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs">
                      {t("integrations.testModeActive", "ATTIVA")}
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-1">
                  {t("integrations.testModeDesc", "Azzera tutti i delay di escalation (Push → WhatsApp → SMS). I messaggi vengono inviati immediatamente in sequenza.")}
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={data.test_mode}
              onCheckedChange={(v) => update("test_mode", v)}
            />
          </div>
        </CardHeader>
        {data.test_mode && (
          <CardContent>
            <div className="rounded-md bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
              <p className="font-semibold mb-1">⚠️ {t("integrations.testModeWarning", "Attenzione")}</p>
              <p>{t("integrations.testModeWarningText", "In modalità test, tutti i canali (Push, WhatsApp, SMS) vengono tentati immediatamente senza attese. Disattiva questa modalità prima di andare in produzione.")}</p>
            </div>
          </CardContent>
        )}
      </Card>
      )}

      {/* Fast Flow Mode - Super Admin only */}
      {canSeeDebugTools && (
      <Card className={`shadow-card border-2 ${data.fast_flow_mode ? "border-orange-400 bg-orange-50/30 dark:bg-orange-950/10" : "border-border/50"}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${data.fast_flow_mode ? "bg-orange-100 dark:bg-orange-900/30" : "bg-muted"}`}>
                <Zap className={`h-5 w-5 ${data.fast_flow_mode ? "text-orange-600" : "text-muted-foreground"}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="font-serif text-base">
                    {t("integrations.fastFlowTitle", "Flusso Rapido")}
                  </CardTitle>
                  {data.fast_flow_mode && (
                    <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                      {t("integrations.testModeActive", "ATTIVA")}
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-1">
                  {t("integrations.fastFlowDesc", "Comprime tutti i tempi tra i nodi del flusso a 1 minuto. Permette di testare tutte le diramazioni (Caso A-E) in pochi minuti.")}
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={data.fast_flow_mode}
              onCheckedChange={(v) => update("fast_flow_mode", v)}
            />
          </div>
        </CardHeader>
        {data.fast_flow_mode && (
          <CardContent>
            <div className="rounded-md bg-orange-100/50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-3 text-sm text-orange-800 dark:text-orange-200">
              <p className="font-semibold mb-1">⚡ {t("integrations.fastFlowWarning", "Attenzione")}</p>
              <p>{t("integrations.fastFlowWarningText", "Tutti i nodi del flusso (conferma, reminder 24h, reminder 2h, escalation, ecc.) verranno programmati a 1 minuto di distanza l'uno dall'altro. Disattiva prima di andare in produzione.")}</p>
            </div>
          </CardContent>
        )}
      </Card>
      )}
      <Button variant="hero" onClick={save} disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {t("common.save")}
      </Button>

      {/* Facebook Lead Forms — solo super admin */}
      {isSuperAdmin && <FacebookLeadsSettings />}
    </div>
  );
}
