import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import IntegrationSettings from "@/components/settings/IntegrationSettings";
import { CreditCard, Key, Eye, EyeOff, Save, ExternalLink, Info, CheckCircle2, AlertCircle, MapPin, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
}

export function AdminSettingsTab() {
  const { t } = useTranslation();
  const [stripeKey, setStripeKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [priceIds, setPriceIds] = useState<Record<string, { monthly: string; yearly: string }>>({});
  const [savingPrices, setSavingPrices] = useState(false);
  const [keysConfigured, setKeysConfigured] = useState(false);
  const [googleMapsKey, setGoogleMapsKey] = useState("");
  const [googleMapsAccountEmail, setGoogleMapsAccountEmail] = useState("");
  const [showGoogleMapsKey, setShowGoogleMapsKey] = useState(false);
  const [googleMapsConfigured, setGoogleMapsConfigured] = useState(false);
  const [savingGoogleMaps, setSavingGoogleMaps] = useState(false);

  const [smsUnitPrice, setSmsUnitPrice] = useState("0.08");
  const [whatsappUnitPrice, setWhatsappUnitPrice] = useState("0.05");
  const [stripeSmsPrice, setStripeSmsPrice] = useState("");
  const [stripeWhatsappPrice, setStripeWhatsappPrice] = useState("");
  const [savingMetered, setSavingMetered] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchPlans();
    fetchMeteredPrices();
  }, []);

  const fetchSettings = async () => {
    const [{ data }, googleMapsResponse] = await Promise.all([
      supabase.rpc("get_stripe_platform_keys_status"),
      supabase.functions.invoke("admin-settings", { body: { action: "get_google_maps_settings" } }),
    ]);

    if (data) {
      const status = data as any;
      setKeysConfigured(status.has_secret_key === true);
      if (status.has_secret_key) setStripeKey("••••••••••••••••");
      if (status.has_webhook_secret) setWebhookSecret("••••••••••••••••");
    }

    const googleMapsData = googleMapsResponse.data as any;
    if (!googleMapsResponse.error && !googleMapsData?.error) {
      setGoogleMapsKey(googleMapsData?.google_maps_api_key || "");
      setGoogleMapsAccountEmail(googleMapsData?.google_maps_account_email || "");
      setGoogleMapsConfigured(Boolean(googleMapsData?.google_maps_api_key));
    }
  };

  const fetchPlans = async () => {
    const { data } = await supabase
      .from("plans")
      .select("id, name, slug, price_monthly, price_yearly, stripe_price_id_monthly, stripe_price_id_yearly")
      .is("deleted_at", null)
      .order("sort_order");

    if (data) {
      setPlans(data);
      const ids: Record<string, { monthly: string; yearly: string }> = {};
      data.forEach((p: Plan) => {
        ids[p.id] = {
          monthly: p.stripe_price_id_monthly || "",
          yearly: p.stripe_price_id_yearly || "",
        };
      });
      setPriceIds(ids);
    }
  };

  const fetchMeteredPrices = async () => {
    const { data } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["sms_unit_price", "whatsapp_unit_price", "stripe_sms_price_id", "stripe_whatsapp_price_id"]);

    if (data) {
      data.forEach((s: any) => {
        if (s.key === "sms_unit_price") setSmsUnitPrice(s.value || "0.08");
        if (s.key === "whatsapp_unit_price") setWhatsappUnitPrice(s.value || "0.05");
        if (s.key === "stripe_sms_price_id") setStripeSmsPrice(s.value || "");
        if (s.key === "stripe_whatsapp_price_id") setStripeWhatsappPrice(s.value || "");
      });
    }
  };

  const saveMeteredPrices = async () => {
    setSavingMetered(true);
    try {
      const updates = [
        { key: "sms_unit_price", value: smsUnitPrice },
        { key: "whatsapp_unit_price", value: whatsappUnitPrice },
        { key: "stripe_sms_price_id", value: stripeSmsPrice },
        { key: "stripe_whatsapp_price_id", value: stripeWhatsappPrice },
      ];
      for (const u of updates) {
        await supabase.from("platform_settings").update({ value: u.value }).eq("key", u.key);
      }
      toast.success(t("billing.saveMeteredPrices"));
    } catch (e: any) {
      toast.error(e.message || "Errore");
    } finally {
      setSavingMetered(false);
    }
  };

  const isMasked = (val: string) => val === "••••••••••••••••";

  const saveStripeKeys = async () => {
    const newKey = isMasked(stripeKey) ? null : stripeKey;
    const newWebhook = isMasked(webhookSecret) ? null : webhookSecret;

    if (!newKey && !newWebhook) {
      toast.info(t("admin.settings.noChanges", "Nessuna modifica da salvare"));
      return;
    }

    if (newKey && !newKey.startsWith("sk_")) {
      toast.error(t("admin.settings.invalidStripeKey"));
      return;
    }

    setSavingKeys(true);
    try {
      const res = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "save_stripe_keys",
          ...(newKey ? { stripe_secret_key: newKey } : {}),
          ...(newWebhook ? { stripe_webhook_secret: newWebhook } : {}),
        },
      });

      if (res.error || (res.data as any)?.error) throw new Error(res.error?.message || (res.data as any)?.error);

      setKeysConfigured(true);
      if (newKey) setStripeKey("••••••••••••••••");
      if (newWebhook) setWebhookSecret("••••••••••••••••");
      toast.success(t("admin.settings.keysSaved"));
    } catch (e: any) {
      toast.error(e.message || "Errore nel salvataggio");
    } finally {
      setSavingKeys(false);
    }
  };

  const saveGoogleMapsSettings = async () => {
    if (!googleMapsKey.startsWith("AIza")) {
      toast.error(t("admin.settings.googleMapsInvalidKey"));
      return;
    }

    setSavingGoogleMaps(true);
    try {
      const res = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "save_google_maps_settings",
          google_maps_api_key: googleMapsKey,
          google_maps_account_email: googleMapsAccountEmail,
        },
      });

      if (res.error || (res.data as any)?.error) throw new Error(res.error?.message || (res.data as any)?.error);

      setGoogleMapsConfigured(true);
      toast.success(t("admin.settings.googleMapsSaved"));
    } catch (e: any) {
      toast.error(e.message || "Errore nel salvataggio");
    } finally {
      setSavingGoogleMaps(false);
    }
  };

  const savePriceIds = async () => {
    setSavingPrices(true);
    try {
      for (const plan of plans) {
        const ids = priceIds[plan.id];
        if (!ids) continue;

        const { error } = await supabase
          .from("plans")
          .update({
            stripe_price_id_monthly: ids.monthly || null,
            stripe_price_id_yearly: ids.yearly || null,
          })
          .eq("id", plan.id);

        if (error) throw error;
      }
      toast.success(t("admin.settings.pricesSaved"));
    } catch (e: any) {
      toast.error(e.message || "Errore nel salvataggio");
    } finally {
      setSavingPrices(false);
    }
  };

  const updatePriceId = (planId: string, field: "monthly" | "yearly", value: string) => {
    setPriceIds((prev) => ({
      ...prev,
      [planId]: { ...prev[planId], [field]: value },
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card border-border/50 border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            {t("admin.settings.guideTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="space-y-2">
            <p className="font-medium text-foreground">{t("admin.settings.step1Title")}</p>
            <p>{t("admin.settings.step1Desc")}</p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="font-medium text-foreground">{t("admin.settings.step2Title")}</p>
            <p>{t("admin.settings.step2Desc")}</p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="font-medium text-foreground">{t("admin.settings.step3Title")}</p>
            <p>{t("admin.settings.step3Desc")}</p>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="font-medium text-foreground">{t("admin.settings.step4Title")}</p>
            <p>{t("admin.settings.step4Desc1")}</p>
            <div className="mt-2 space-y-1.5">
              <p className="font-medium text-foreground text-xs">{t("admin.settings.webhookUrlLabel", "URL Endpoint da inserire:")}</p>
              <code className="block rounded-md bg-muted px-3 py-2 text-xs font-mono select-all break-all">
                https://uetddchrfllgywgdlozt.supabase.co/functions/v1/stripe-webhook
              </code>
            </div>
            <div className="mt-2 space-y-1.5">
              <p className="font-medium text-foreground text-xs">{t("admin.settings.webhookEventsLabel", "Eventi da selezionare:")}</p>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                <li><code className="bg-muted px-1 rounded">checkout.session.completed</code></li>
                <li><code className="bg-muted px-1 rounded">customer.subscription.updated</code></li>
                <li><code className="bg-muted px-1 rounded">customer.subscription.deleted</code></li>
                <li><code className="bg-muted px-1 rounded">invoice.payment_failed</code></li>
              </ul>
            </div>
            <p className="mt-2">{t("admin.settings.step4Desc2", "Dopo aver creato l'endpoint, copia il signing secret e incollalo qui sotto.")}</p>
          </div>
          <div className="pt-2">
            <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm font-medium">
              {t("admin.settings.openStripeDashboard")} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                {t("admin.settings.stripeKeysTitle")}
              </CardTitle>
              <CardDescription>{t("admin.settings.stripeKeysDesc")}</CardDescription>
            </div>
            {keysConfigured ? (
              <Badge className="gap-1 border-emerald-200 bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> {t("admin.settings.configured")}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 border-amber-200 text-amber-600">
                <AlertCircle className="h-3 w-3" /> {t("admin.settings.notConfigured")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stripe-key">{t("admin.settings.secretKey")}</Label>
            <div className="relative">
              <Input id="stripe-key" type={showKey ? "text" : "password"} value={stripeKey} onChange={(e) => setStripeKey(e.target.value)} onFocus={() => { if (isMasked(stripeKey)) setStripeKey(""); }} placeholder="sk_test_..." className="pr-10 font-mono text-sm" />
              <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-10 w-10" onClick={() => setShowKey(!showKey)}>
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook-secret">{t("admin.settings.webhookSecret")}</Label>
            <div className="relative">
              <Input id="webhook-secret" type={showWebhook ? "text" : "password"} value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} onFocus={() => { if (isMasked(webhookSecret)) setWebhookSecret(""); }} placeholder="whsec_..." className="pr-10 font-mono text-sm" />
              <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-10 w-10" onClick={() => setShowWebhook(!showWebhook)}>
                {showWebhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button onClick={saveStripeKeys} disabled={savingKeys || !stripeKey} className="gap-2">
            <Save className="h-4 w-4" />
            {savingKeys ? t("common.loading") : t("admin.settings.saveKeys")}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {t("admin.settings.priceMappingTitle")}
          </CardTitle>
          <CardDescription>{t("admin.settings.priceMappingDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {plans.map((plan) => (
            <div key={plan.id} className="space-y-3 rounded-xl border border-border/50 bg-secondary/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{plan.name}</p>
                  <p className="text-xs text-muted-foreground">€{plan.price_monthly}/mese{plan.price_yearly != null && ` · €${plan.price_yearly}/anno`}</p>
                </div>
                {priceIds[plan.id]?.monthly ? (
                  <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700 text-xs">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Collegato
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">Da configurare</Badge>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("admin.settings.monthlyPriceId")}</Label>
                  <Input value={priceIds[plan.id]?.monthly || ""} onChange={(e) => updatePriceId(plan.id, "monthly", e.target.value)} placeholder="price_..." className="h-9 font-mono text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("admin.settings.yearlyPriceId")}</Label>
                  <Input value={priceIds[plan.id]?.yearly || ""} onChange={(e) => updatePriceId(plan.id, "yearly", e.target.value)} placeholder="price_..." className="h-9 font-mono text-xs" />
                </div>
              </div>
            </div>
          ))}

          <Button onClick={savePriceIds} disabled={savingPrices} className="gap-2">
            <Save className="h-4 w-4" />
            {savingPrices ? t("common.loading") : t("admin.settings.savePrices")}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {t("admin.settings.googleMapsTitle")}
              </CardTitle>
              <CardDescription>{t("admin.settings.googleMapsDesc")}</CardDescription>
            </div>
            {googleMapsConfigured ? (
              <Badge className="gap-1 border-emerald-200 bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> {t("admin.settings.configured")}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 border-amber-200 text-amber-600">
                <AlertCircle className="h-3 w-3" /> {t("admin.settings.notConfigured")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google-maps-key">{t("admin.settings.googleMapsKeyLabel")}</Label>
            <div className="relative">
              <Input id="google-maps-key" type={showGoogleMapsKey ? "text" : "password"} value={googleMapsKey} onChange={(e) => setGoogleMapsKey(e.target.value)} placeholder="AIza..." className="pr-10 font-mono text-sm" />
              <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-10 w-10" onClick={() => setShowGoogleMapsKey(!showGoogleMapsKey)}>
                {showGoogleMapsKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="google-maps-account">{t("admin.settings.googleMapsAccountEmailLabel")}</Label>
            <Input id="google-maps-account" value={googleMapsAccountEmail} onChange={(e) => setGoogleMapsAccountEmail(e.target.value)} placeholder="samuelehk@gmail.com" className="text-sm" />
          </div>

          <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 text-sm text-muted-foreground space-y-3">
            <p className="font-medium text-foreground">{t("admin.settings.googleMapsGuideTitle")}</p>
            <p>{t("admin.settings.googleMapsGuideIntro")}</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>{t("admin.settings.googleMapsGuideStep1")}</li>
              <li>{t("admin.settings.googleMapsGuideStep2")}</li>
              <li>{t("admin.settings.googleMapsGuideStep3")}</li>
              <li>{t("admin.settings.googleMapsGuideStep4")}</li>
              <li>{t("admin.settings.googleMapsGuideStep5")}</li>
            </ol>
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm font-medium">
              {t("admin.settings.googleMapsOpenConsole")} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <Button onClick={saveGoogleMapsSettings} disabled={savingGoogleMaps || !googleMapsKey} className="gap-2">
            <Save className="h-4 w-4" />
            {savingGoogleMaps ? t("common.loading") : t("admin.settings.googleMapsSave")}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {t("billing.meteredPricesTitle")}
          </CardTitle>
          <CardDescription>{t("billing.meteredPricesDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("billing.smsUnitPrice")}</Label>
              <Input type="number" step="0.01" min="0" value={smsUnitPrice} onChange={(e) => setSmsUnitPrice(e.target.value)} className="font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label>{t("billing.whatsappUnitPrice")}</Label>
              <Input type="number" step="0.01" min="0" value={whatsappUnitPrice} onChange={(e) => setWhatsappUnitPrice(e.target.value)} className="font-mono text-sm" />
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("billing.stripeSmsPrice")}</Label>
              <Input value={stripeSmsPrice} onChange={(e) => setStripeSmsPrice(e.target.value)} placeholder="price_..." className="font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label>{t("billing.stripeWhatsappPrice")}</Label>
              <Input value={stripeWhatsappPrice} onChange={(e) => setStripeWhatsappPrice(e.target.value)} placeholder="price_..." className="font-mono text-sm" />
            </div>
          </div>
          <Button onClick={saveMeteredPrices} disabled={savingMetered} className="gap-2">
            <Save className="h-4 w-4" />
            {savingMetered ? t("common.loading") : t("billing.saveMeteredPrices")}
          </Button>
        </CardContent>
      </Card>

      <IntegrationSettings />
    </div>
  );
}
