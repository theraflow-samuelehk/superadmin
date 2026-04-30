import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Store, Bell, Clock, Shield, Globe, History, CalendarCheck, Copy, Check, Crown, Loader2, Users, Star, HelpCircle, Plug, RotateCcw, Receipt } from "lucide-react";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocalization } from "@/hooks/useLocalization";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import NotificationSettings from "@/components/settings/NotificationSettings";
import IntegrationSettings from "@/components/settings/IntegrationSettings";
import BillingTab from "@/components/settings/BillingTab";


interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  created_at: string;
}

interface OpeningHour {
  open: string;
  close: string;
  enabled: boolean;
  morning_open?: string;
  morning_close?: string;
  afternoon_open?: string;
  afternoon_close?: string;
  dual_slot?: boolean;
}

interface NotificationPrefs {
  sms_reminder: boolean;
  email_reminder: boolean;
  booking_confirmation: boolean;
  inventory_alert: boolean;
  weekly_report: boolean;
}

interface ProfileData {
  salon_name: string;
  phone: string;
  address: string;
  vat_number: string;
  opening_hours: Record<string, OpeningHour>;
  notification_prefs: NotificationPrefs;
  booking_enabled: boolean;
  booking_slug: string;
}

const defaultOpeningHours: Record<string, OpeningHour> = {
  "0": { open: "08:00", close: "21:00", enabled: true, dual_slot: false, morning_open: "08:00", morning_close: "13:00", afternoon_open: "14:00", afternoon_close: "21:00" },
  "1": { open: "08:00", close: "21:00", enabled: true, dual_slot: false, morning_open: "08:00", morning_close: "13:00", afternoon_open: "14:00", afternoon_close: "21:00" },
  "2": { open: "08:00", close: "21:00", enabled: true, dual_slot: false, morning_open: "08:00", morning_close: "13:00", afternoon_open: "14:00", afternoon_close: "21:00" },
  "3": { open: "08:00", close: "21:00", enabled: true, dual_slot: false, morning_open: "08:00", morning_close: "13:00", afternoon_open: "14:00", afternoon_close: "21:00" },
  "4": { open: "08:00", close: "21:00", enabled: true, dual_slot: false, morning_open: "08:00", morning_close: "13:00", afternoon_open: "14:00", afternoon_close: "21:00" },
  "5": { open: "08:00", close: "21:00", enabled: true, dual_slot: false, morning_open: "08:00", morning_close: "13:00", afternoon_open: "14:00", afternoon_close: "21:00" },
  "6": { open: "08:00", close: "21:00", enabled: true, dual_slot: false, morning_open: "08:00", morning_close: "13:00", afternoon_open: "14:00", afternoon_close: "21:00" },
};

const defaultNotificationPrefs: NotificationPrefs = {
  sms_reminder: true,
  email_reminder: true,
  booking_confirmation: true,
  inventory_alert: true,
  weekly_report: false,
};

export default function Impostazioni() {
  const { t, i18n } = useTranslation();
  const { formatDate, formatCurrency } = useLocalization();
  const { subscription } = useSubscription();
  const { user } = useAuth();
  const daysRaw = t("settings.days", { returnObjects: true });
  const days = Array.isArray(daysRaw) ? daysRaw as string[] : ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

  // Audit
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditFilterTable, setAuditFilterTable] = useState("all");
  const [auditFilterAction, setAuditFilterAction] = useState("all");

  // Profile data
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salonName, setSalonName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [openingHours, setOpeningHours] = useState<Record<string, OpeningHour>>(defaultOpeningHours);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(defaultNotificationPrefs);

  // Booking
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [bookingSlug, setBookingSlug] = useState("");
  const [bookingBlockedFrom, setBookingBlockedFrom] = useState("");
  const [bookingBlockedUntil, setBookingBlockedUntil] = useState("");
  const [bookingBlockedMessage, setBookingBlockedMessage] = useState("");

  // Loyalty
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [socialLinkCopied, setSocialLinkCopied] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Email
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [debugOnboardingResetting, setDebugOnboardingResetting] = useState(false);

  // Roles
  interface UserRole {
    id: string;
    user_id: string;
    role: string;
    created_at: string;
    email?: string;
  }
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [newRoleEmail, setNewRoleEmail] = useState("");
  const [newRole, setNewRole] = useState("operator");
  const [rolesSaving, setRolesSaving] = useState(false);

  // Load profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("salon_name, phone, address, vat_number, opening_hours, notification_prefs, booking_enabled, booking_slug, loyalty_enabled, booking_blocked_from, booking_blocked_until, booking_blocked_message")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setSalonName(data.salon_name || "");
        setPhone(data.phone || "");
        setAddress((data as any).address || "");
        setVatNumber((data as any).vat_number || "");
        const oh = (data as any).opening_hours;
        if (oh && typeof oh === "object") {
          // Migrate old format: if dual_slot is not set, default to true for weekdays
          const migrated: Record<string, OpeningHour> = {};
          Object.entries(oh as Record<string, OpeningHour>).forEach(([k, v]) => {
            const val = v as OpeningHour;
            if (val.dual_slot === undefined) {
              // Old format without dual_slot — default to dual for enabled days
              migrated[k] = {
                ...val,
                dual_slot: val.enabled,
                morning_open: val.open || "09:00",
                morning_close: "13:00",
                afternoon_open: "14:00",
                afternoon_close: val.close || "19:00",
              };
            } else {
              migrated[k] = val;
            }
          });
          setOpeningHours(migrated);
        }
        const np = (data as any).notification_prefs;
        if (np && typeof np === "object") setNotifPrefs(np as NotificationPrefs);
        setBookingEnabled(data.booking_enabled || false);
        setBookingSlug(data.booking_slug || "");
        setBookingBlockedFrom((data as any).booking_blocked_from || "");
        setBookingBlockedUntil((data as any).booking_blocked_until || "");
        setBookingBlockedMessage((data as any).booking_blocked_message || "");
        setLoyaltyEnabled((data as any).loyalty_enabled ?? true);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  // Save salon info
  const saveSalonInfo = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        salon_name: salonName || null,
        phone: phone || null,
        address: address || null,
        vat_number: vatNumber || null,
      } as any)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success(t("common.save"));
  };

  // Save opening hours
  const saveOpeningHours = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ opening_hours: openingHours } as any)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success(t("settings.saveHours"));
  };

  // Save notification prefs
  const saveNotifPrefs = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ notification_prefs: notifPrefs } as any)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success(t("common.save"));
  };

  // Save booking settings
  const saveBookingSettings = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        booking_enabled: true,
        booking_slug: bookingSlug || null,
        salon_name: salonName || null,
        booking_blocked_from: bookingBlockedFrom || null,
        booking_blocked_until: bookingBlockedUntil || null,
        booking_blocked_message: bookingBlockedMessage || null,
      } as any)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success(t("settings.bookingSaved"));
  };

  // Update password
  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error(t("auth.minPassword"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("settings.passwordMismatch"));
      return;
    }
    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success(t("settings.passwordUpdated"));
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  // Update email
  const handleUpdateEmail = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error(t("settings.invalidEmail"));
      return;
    }
    setEmailSaving(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setEmailSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success(t("settings.emailUpdateSent"));
      setNewEmail("");
    }
  };

  const updateHour = (dayIndex: string, field: keyof OpeningHour, value: string | boolean) => {
    setOpeningHours(prev => ({ ...prev, [dayIndex]: { ...prev[dayIndex], [field]: value } }));
  };

  const toggleDay = (dayIndex: string, enabled: boolean) => {
    setOpeningHours(prev => ({ ...prev, [dayIndex]: { ...prev[dayIndex], enabled } }));
  };

  const toggleDualSlot = (dayIndex: string, dual: boolean) => {
    setOpeningHours(prev => {
      const h = prev[dayIndex];
      if (dual) {
        // Switching to dual: split current range
        return { ...prev, [dayIndex]: { ...h, dual_slot: true, morning_open: h.open || "09:00", morning_close: "13:00", afternoon_open: "14:00", afternoon_close: h.close || "19:00" } };
      } else {
        // Switching to single: merge from morning open to afternoon close
        return { ...prev, [dayIndex]: { ...h, dual_slot: false, open: h.morning_open || "09:00", close: h.afternoon_close || "19:00" } };
      }
    });
  };

  const updateNotif = (key: keyof NotificationPrefs, value: boolean) => {
    setNotifPrefs(prev => ({ ...prev, [key]: value }));
  };

  const bookingUrl = bookingSlug ? `${window.location.origin}/app/${bookingSlug}` : "";
  const restartOnboardingDebug = async () => {
    if (!user) return;
    setDebugOnboardingResetting(true);
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_phase: 0 } as any)
      .eq("user_id", user.id);

    setDebugOnboardingResetting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    localStorage.setItem(`debug_onboarding_replay_${user.id}`, "1");
    window.dispatchEvent(new CustomEvent("glowup:onboarding-debug-reset"));
    toast.success(t("settings.onboardingDebugResetSuccess"));
  };

  const copyBookingLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setLinkCopied(true);
    toast.success(t("settings.linkCopied"));
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Audit logs
  useEffect(() => {
    const fetchAuditLogs = async () => {
      let query = supabase
        .from("audit_logs")
        .select("id, action, table_name, record_id, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (auditFilterTable !== "all") query = query.eq("table_name", auditFilterTable);
      if (auditFilterAction !== "all") query = query.eq("action", auditFilterAction);
      const { data } = await query;
      setAuditLogs(data || []);
    };
    fetchAuditLogs();
  }, [auditFilterTable, auditFilterAction]);

  // Fetch user roles
  useEffect(() => {
    const fetchUserRoles = async () => {
      const { data } = await supabase.from("user_roles").select("*").order("created_at", { ascending: false });
      setUserRoles(data || []);
    };
    fetchUserRoles();
  }, []);

  const roleLabels: Record<string, string> = {
    user: t("settings.roleUser"),
    owner: t("settings.roleOwner"),
    manager: t("settings.roleManager"),
    operator: t("settings.roleOperator"),
    receptionist: t("settings.roleReceptionist"),
    admin: t("settings.roleAdmin"),
    super_admin: t("settings.roleSuperAdmin"),
    moderator: t("settings.roleModerator"),
  };

  const roleDescriptions: Record<string, string> = {
    owner: t("settings.permOwner"),
    manager: t("settings.permManager"),
    operator: t("settings.permOperator"),
    receptionist: t("settings.permReceptionist"),
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">{t("settings.title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">{t("settings.subtitle")}</p>
        </div>

        <Tabs defaultValue="salone" className="space-y-4">
          <div className="relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 sm:hidden" />
          <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden scrollbar-hide flex-nowrap">
            <TabsTrigger value="salone" className="text-xs sm:text-sm whitespace-nowrap">{t("settings.salon")}</TabsTrigger>
            <TabsTrigger value="orari" className="text-xs sm:text-sm whitespace-nowrap">{t("settings.hours")}</TabsTrigger>
            <TabsTrigger value="booking" className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap"><CalendarCheck className="h-3.5 w-3.5 hidden sm:block" />{t("settings.booking")}</TabsTrigger>
            <TabsTrigger value="notifiche" className="text-xs sm:text-sm whitespace-nowrap">{t("settings.notifications")}</TabsTrigger>
            <TabsTrigger value="account" className="text-xs sm:text-sm whitespace-nowrap">{t("settings.account")}</TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap"><History className="h-3.5 w-3.5 hidden sm:block" />{t("audit.title")}</TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap"><Users className="h-3.5 w-3.5 hidden sm:block" />{t("settings.roles")}</TabsTrigger>
            <TabsTrigger value="integrazioni" className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap"><Plug className="h-3.5 w-3.5 hidden sm:block" />{t("settings.integrations")}</TabsTrigger>
            <TabsTrigger value="fatturazione" className="flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap"><Receipt className="h-3.5 w-3.5 hidden sm:block" />{t("billing.title")}</TabsTrigger>
          </TabsList>
          </div>

          {/* SALON INFO */}
          <TabsContent value="salone">
            <div className="space-y-6">
              <Card className="shadow-card border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" /> {t("pricing.activePlan")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    {subscription ? (
                      <>
                        <p className="text-lg font-bold text-foreground">{subscription.plan.name}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(subscription.plan.price_monthly)}/{t("pricing.month")}</p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">{t("pricing.noPlan")}</p>
                    )}
                  </div>
                  <Button variant="hero" size="sm" asChild className="w-full sm:w-auto">
                    <Link to="/pricing">{subscription ? t("pricing.managePlan") : t("pricing.upgradeNow")}</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card border-border/50" data-glowup-id="settings-salon-card">
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" /> {t("settings.salonInfo")}
                  </CardTitle>
                  <CardDescription>{t("settings.salonInfoDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>{t("settings.salonName")}</Label><Input value={salonName} onChange={e => setSalonName(e.target.value)} /></div>
                    <div className="space-y-2"><Label>{t("settings.phone")}</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
                    <div className="space-y-2"><Label>{t("settings.email")}</Label><Input value={user?.email || ""} disabled /></div>
                    <div className="space-y-2"><Label>{t("settings.address")}</Label><Input value={address} onChange={e => setAddress(e.target.value)} /></div>
                  </div>
                  <div className="space-y-2"><Label>{t("settings.vatNumber")}</Label><Input value={vatNumber} onChange={e => setVatNumber(e.target.value)} /></div>
                  <Button variant="hero" onClick={saveSalonInfo} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t("common.save")}
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" /> {t("settings.language")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{t("settings.language")}</Label>
                      <Select value={i18n.language} onValueChange={handleLanguageChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                          <SelectItem value="en">🇬🇧 English</SelectItem>
                          <SelectItem value="es">🇪🇸 Español</SelectItem>
                          <SelectItem value="fr">🇫🇷 Français</SelectItem>
                          <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" /> {t("settings.loyaltyEnabled")}
                  </CardTitle>
                  <CardDescription>{t("settings.loyaltyEnabledDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Label>{t("settings.loyaltyEnabled")}</Label>
                    <Switch
                      checked={loyaltyEnabled}
                      onCheckedChange={async (checked) => {
                        setLoyaltyEnabled(checked);
                        if (!user) return;
                        const { error } = await supabase
                          .from("profiles")
                          .update({ loyalty_enabled: checked } as any)
                          .eq("user_id", user.id);
                        if (error) toast.error(error.message);
                        else toast.success(t("common.save"));
                      }}
                    />
                  </div>
                </CardContent>
              </Card>


            </div>
          </TabsContent>

          {/* OPENING HOURS */}
          <TabsContent value="orari">
            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" /> {t("settings.openingHours")}
                </CardTitle>
                <CardDescription>{t("settings.openingHoursDesc", "Configura la fascia oraria mattina e pomeriggio per ogni giorno")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {days.map((day, i) => {
                  const key = String(i);
                  const hour = openingHours[key] || defaultOpeningHours[key];
                  const isDual = hour.dual_slot ?? false;
                  return (
                    <div key={day} className="py-4 border-b border-border/30 last:border-0">
                      {/* Day header with on/off switch */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-foreground text-sm sm:text-base">{day}</span>
                        <div className="flex items-center gap-2">
                          {!hour.enabled && <span className="text-[11px] text-muted-foreground">{t("settings.closed")}</span>}
                          <Switch checked={hour.enabled} onCheckedChange={v => toggleDay(key, v)} />
                        </div>
                      </div>

                      {hour.enabled && (
                        <div className="space-y-3">
                          {/* Segmented toggle: Continuato / Con pausa */}
                          <div className="inline-flex rounded-lg bg-muted p-0.5">
                            <button
                              type="button"
                              onClick={() => toggleDualSlot(key, false)}
                              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${!isDual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                              {t("settings.singleSlot", "Continuato")}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleDualSlot(key, true)}
                              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${isDual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                              {t("settings.dualSlotLabel", "Con pausa")}
                            </button>
                          </div>

                          {/* Time inputs */}
                          {isDual ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 bg-secondary/30 rounded-lg px-3 py-2.5">
                                <span className="text-[11px] text-muted-foreground font-medium w-20 shrink-0">☀️ {t("settings.morning", "Mattina")}</span>
                                <Input className="w-[72px] text-center text-sm h-8" value={hour.morning_open || "09:00"} onChange={e => updateHour(key, "morning_open", e.target.value)} />
                                <span className="text-muted-foreground text-xs">–</span>
                                <Input className="w-[72px] text-center text-sm h-8" value={hour.morning_close || "13:00"} onChange={e => updateHour(key, "morning_close", e.target.value)} />
                              </div>
                              <div className="flex items-center gap-2 bg-secondary/30 rounded-lg px-3 py-2.5">
                                <span className="text-[11px] text-muted-foreground font-medium w-20 shrink-0">🌙 {t("settings.afternoon", "Pomeriggio")}</span>
                                <Input className="w-[72px] text-center text-sm h-8" value={hour.afternoon_open || "14:00"} onChange={e => updateHour(key, "afternoon_open", e.target.value)} />
                                <span className="text-muted-foreground text-xs">–</span>
                                <Input className="w-[72px] text-center text-sm h-8" value={hour.afternoon_close || "19:00"} onChange={e => updateHour(key, "afternoon_close", e.target.value)} />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input className="w-[88px] text-center text-sm h-8" value={hour.open} onChange={e => updateHour(key, "open", e.target.value)} />
                              <span className="text-muted-foreground text-xs">–</span>
                              <Input className="w-[88px] text-center text-sm h-8" value={hour.close} onChange={e => updateHour(key, "close", e.target.value)} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="pt-3">
                  <Button variant="hero" onClick={saveOpeningHours} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t("settings.saveHours")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BOOKING */}
          <TabsContent value="booking" className="space-y-6">
            {/* Card 1: Pagina di prenotazione */}
            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-primary" /> {t("settings.onlineBooking")}
                </CardTitle>
                <CardDescription>{t("settings.onlineBookingDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("settings.salonNamePublic")}</Label>
                  <Input value={salonName} onChange={e => setSalonName(e.target.value)} placeholder="GlowUp Studio" />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.bookingSlug")}</Label>
                  <Input value={bookingSlug} onChange={e => setBookingSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="glowup-milano" />
                  <p className="text-xs text-muted-foreground">{t("settings.bookingSlugDesc")}</p>
                </div>
                {bookingSlug && (
                  <div className="p-3 sm:p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                    <p className="text-sm font-medium">{t("settings.bookingLink")}</p>
                    <p className="text-xs text-muted-foreground">{t("settings.bookingLinkDesc", "Condividi questo link con i clienti per permettere la prenotazione online")}</p>
                    <div className="flex items-center gap-2">
                      <Input value={bookingUrl} readOnly className="font-mono text-xs sm:text-sm min-w-0" />
                      <Button variant="outline" size="icon" className="shrink-0" onClick={copyBookingLink}>
                        {linkCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => {
                          const msg = encodeURIComponent(t("settings.bookingLinkWhatsApp", { salon: salonName, link: bookingUrl }));
                          window.open(`https://wa.me/?text=${msg}`, "_blank");
                        }}
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {bookingSlug && (
                  <div className="p-3 sm:p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-2">
                    <p className="text-sm font-medium">{t("settings.socialLinkTitle")}</p>
                    <p className="text-xs text-muted-foreground">{t("settings.socialLinkDesc")}</p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={`${window.location.origin}/portal/social/${bookingSlug}`}
                        readOnly
                        className="font-mono text-xs sm:text-sm min-w-0"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/portal/social/${bookingSlug}`);
                          setSocialLinkCopied(true);
                          toast.success(t("settings.socialLinkCopied"));
                          setTimeout(() => setSocialLinkCopied(false), 2000);
                        }}
                      >
                        {socialLinkCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => {
                          const socialUrl = `${window.location.origin}/portal/social/${bookingSlug}`;
                          const msg = encodeURIComponent(t("settings.socialLinkWhatsApp", { salon: salonName, link: socialUrl }));
                          window.open(`https://wa.me/?text=${msg}`, "_blank");
                        }}
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <Button variant="hero" onClick={saveBookingSettings} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t("common.save")}
                </Button>
              </CardContent>
            </Card>

            {/* Card 2: Blocco prenotazioni */}
            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> {t("settings.bookingBlock")}
                </CardTitle>
                <CardDescription>{t("settings.bookingBlockDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("settings.bookingBlockFrom")}</Label>
                    <Input
                      type="date"
                      value={bookingBlockedFrom}
                      onChange={e => setBookingBlockedFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings.bookingBlockUntil")}</Label>
                    <Input
                      type="date"
                      value={bookingBlockedUntil}
                      onChange={e => setBookingBlockedUntil(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.bookingBlockMessage")}</Label>
                  <Input
                    value={bookingBlockedMessage}
                    onChange={e => setBookingBlockedMessage(e.target.value)}
                    placeholder={t("settings.bookingBlockMessagePlaceholder")}
                  />
                </div>
                {bookingBlockedFrom && (
                  <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {t("settings.bookingBlockActive")}: {bookingBlockedFrom}{bookingBlockedUntil ? ` → ${bookingBlockedUntil}` : ` → ${t("common.noData").toLowerCase()}`}
                    </p>
                  </div>
                )}
                <Button variant="hero" onClick={saveBookingSettings} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t("common.save")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NOTIFICATIONS */}
          <TabsContent value="notifiche">
            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" /> {t("settings.notificationPrefs")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {([
                  // { key: "sms_reminder" as const, label: t("settings.smsReminder"), desc: t("settings.smsReminderDesc") },
                  { key: "email_reminder" as const, label: t("settings.emailReminder"), desc: t("settings.emailReminderDesc") },
                  { key: "booking_confirmation" as const, label: t("settings.bookingConfirmation"), desc: t("settings.bookingConfirmationDesc") },
                  { key: "inventory_alert" as const, label: t("settings.inventoryAlert"), desc: t("settings.inventoryAlertDesc") },
                  { key: "weekly_report" as const, label: t("settings.weeklyReport"), desc: t("settings.weeklyReportDesc") },
                ]).map((n) => (
                  <div key={n.key} className="flex items-start justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground">{n.label}</p>
                      <p className="text-xs text-muted-foreground">{n.desc}</p>
                    </div>
                    <Switch className="shrink-0 mt-0.5" checked={notifPrefs[n.key]} onCheckedChange={v => updateNotif(n.key, v)} />
                  </div>
                ))}
                <Separator />
                <Button variant="hero" onClick={saveNotifPrefs} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t("common.save")}
                </Button>
              </CardContent>
            </Card>
            <NotificationSettings />
          </TabsContent>

          {/* ACCOUNT */}
          <TabsContent value="account" className="space-y-6">
            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> {t("settings.accountSecurity")}
                </CardTitle>
                <CardDescription>{t("settings.accountSecurityDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current email display */}
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t("settings.currentEmail")}</p>
                  <p className="text-sm font-medium text-foreground">{user?.email || "—"}</p>
                </div>

                <Separator />

                {/* Change email */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">{t("settings.changeEmail")}</h3>
                  <p className="text-xs text-muted-foreground">{t("settings.changeEmailDesc")}</p>
                  <div className="space-y-2">
                    <Label>{t("settings.newEmail")}</Label>
                    <Input type="email" placeholder={t("settings.newEmailPlaceholder")} value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                  </div>
                  <Button variant="outline" onClick={handleUpdateEmail} disabled={emailSaving || !newEmail}>
                    {emailSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t("settings.updateEmail")}
                  </Button>
                </div>

                <Separator />

                {/* Change password */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">{t("settings.changePassword")}</h3>
                  <p className="text-xs text-muted-foreground">{t("settings.changePasswordDesc")}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("settings.newPassword")}</Label>
                      <Input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("settings.confirmPassword")}</Label>
                      <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleUpdatePassword} disabled={passwordSaving || !newPassword}>
                    {passwordSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t("settings.updatePassword")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Hidden debug: restart onboarding */}
            <div className="mt-10 flex justify-center">
              <button
                onClick={restartOnboardingDebug}
                disabled={debugOnboardingResetting}
                className="flex items-center gap-2 text-xs text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
                title="Debug: riavvia onboarding"
              >
                {debugOnboardingResetting ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                <span>Riavvia onboarding</span>
              </button>
            </div>
          </TabsContent>

          {/* AUDIT */}
          <TabsContent value="audit">
            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" /> {t("audit.title")}
                </CardTitle>
                <CardDescription>{t("audit.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">{t("audit.filterTable")}</Label>
                    <Select value={auditFilterTable} onValueChange={setAuditFilterTable}>
                      <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("audit.allTables")}</SelectItem>
                        <SelectItem value="profiles">Profiles</SelectItem>
                        <SelectItem value="plans">Plans</SelectItem>
                        <SelectItem value="subscriptions">Subscriptions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("audit.filterAction")}</Label>
                    <Select value={auditFilterAction} onValueChange={setAuditFilterAction}>
                      <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("audit.allActions")}</SelectItem>
                        <SelectItem value="INSERT">{t("audit.INSERT")}</SelectItem>
                        <SelectItem value="UPDATE">{t("audit.UPDATE")}</SelectItem>
                        <SelectItem value="SOFT_DELETE">{t("audit.SOFT_DELETE")}</SelectItem>
                        <SelectItem value="RESTORE">{t("audit.RESTORE")}</SelectItem>
                        <SelectItem value="DELETE">{t("audit.DELETE")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {auditLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">{t("audit.noLogs")}</p>
                ) : (
                  <>
                    {/* Mobile: card layout */}
                    <div className="space-y-2 sm:hidden">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="p-3 rounded-lg border border-border/50 space-y-1">
                          <div className="flex items-center justify-between">
                            <Badge variant={
                              log.action === "INSERT" ? "default" :
                              log.action === "SOFT_DELETE" ? "destructive" :
                              log.action === "RESTORE" ? "secondary" : "outline"
                            } className="text-xs">
                              {t(`audit.${log.action}` as any)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{log.table_name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString("it-IT")}</p>
                        </div>
                      ))}
                    </div>
                    {/* Desktop: table layout */}
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("audit.action")}</TableHead>
                            <TableHead>{t("audit.table")}</TableHead>
                            <TableHead>{t("audit.date")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {auditLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>
                                <Badge variant={
                                  log.action === "INSERT" ? "default" :
                                  log.action === "SOFT_DELETE" ? "destructive" :
                                  log.action === "RESTORE" ? "secondary" : "outline"
                                } className="text-xs">
                                  {t(`audit.${log.action}` as any)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{log.table_name}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(log.created_at).toLocaleString("it-IT")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ROLES */}
          <TabsContent value="roles">
            <Card className="shadow-card border-border/50">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> {t("settings.roles")}
                </CardTitle>
                <CardDescription>{t("settings.rolesDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Role descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(["owner", "manager", "operator", "receptionist"] as const).map((role) => (
                    <div key={role} className="p-3 rounded-lg border border-border/50 bg-secondary/30">
                      <p className="font-medium text-foreground text-sm">{roleLabels[role]}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{roleDescriptions[role]}</p>
                    </div>
                  ))}
                </div>
                <Separator />

                {/* Current roles */}
                {userRoles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{t("settings.noStaffRoles")}</p>
                ) : (
                  <>
                    {/* Mobile: card layout */}
                    <div className="space-y-2 sm:hidden">
                      {userRoles.map((ur) => (
                        <div key={ur.id} className="p-3 rounded-lg border border-border/50 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <Badge variant="secondary" className="text-xs">{roleLabels[ur.role] || ur.role}</Badge>
                            <p className="font-mono text-xs text-muted-foreground mt-1 truncate">{ur.user_id.slice(0, 12)}...</p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(ur.created_at).toLocaleDateString("it-IT")}</span>
                        </div>
                      ))}
                    </div>
                    {/* Desktop: table layout */}
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User ID</TableHead>
                            <TableHead>{t("settings.roleName")}</TableHead>
                            <TableHead>{t("audit.date")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userRoles.map((ur) => (
                            <TableRow key={ur.id}>
                              <TableCell className="font-mono text-xs text-muted-foreground">{ur.user_id.slice(0, 8)}...</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{roleLabels[ur.role] || ur.role}</Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(ur.created_at).toLocaleDateString("it-IT")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

          </TabsContent>

          {/* INTEGRATIONS */}
          <TabsContent value="integrazioni">
            <IntegrationSettings />
          </TabsContent>

          {/* BILLING */}
          <TabsContent value="fatturazione">
            <BillingTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
