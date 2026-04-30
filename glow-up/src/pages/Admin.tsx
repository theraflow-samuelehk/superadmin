import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users, Store, TrendingUp, Shield, Eye, CalendarPlus,
  ToggleLeft, Ban, CheckCircle2, LogIn, Handshake, LifeBuoy, Clock, Sparkles, Ticket, Copy,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AffiliateTab } from "@/components/admin/AffiliateTab";
import { AdminTodoTab } from "@/components/admin/AdminTodoTab";
import { AdminTutorialTab } from "@/components/admin/AdminTutorialTab";
import { AdminSupportChat } from "@/components/admin/AdminSupportChat";
import { AdminSettingsTab } from "@/components/admin/AdminSettingsTab";
import IntegrationSettings from "@/components/settings/IntegrationSettings";
import FlussiContent from "@/components/FlussiContent";
import AdminFunnelTab from "@/components/admin/AdminFunnelTab";
import AdminLeadsTab from "@/components/admin/AdminLeadsTab";
import LeadWhatsAppTab from "@/components/admin/LeadWhatsAppTab";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "react-i18next";
import { useLocalization } from "@/hooks/useLocalization";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useImpersonation } from "@/lib/impersonation";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

interface Retailer {
  id: string;
  user_id: string;
  salon_name: string | null;
  display_name: string | null;
  email: string | null;
  status: string;
  created_at: string;
  phone: string | null;
  address: string | null;
  client_count: number;
  operator_count: number;
  location_count: number;
  plan_name: string | null;
  trial_ends_at: string | null;
  last_login: string | null;
  total_logins: number;
  // Onboarding data
  website: string | null;
  business_category: string[] | null;
  other_category_text: string | null;
  account_type: string | null;
  team_size: string | null;
  service_locations: string[] | null;
  current_software: string | null;
  referral_source: string | null;
  referral_other_text: string | null;
  onboarding_phase: number;
}

interface LoginLog {
  id: string;
  event_type: string;
  created_at: string;
  user_agent: string | null;
}

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
}

export default function Admin() {
  const { t } = useTranslation();
  const { formatCurrency } = useLocalization();
  const { signOut } = useAuth();
  const { startImpersonation } = useImpersonation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("centers");
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [extendTarget, setExtendTarget] = useState<Retailer | null>(null);
  const [extendDays, setExtendDays] = useState("15");
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountTarget, setDiscountTarget] = useState<Retailer | null>(null);
  const [discountPercent, setDiscountPercent] = useState("20");
  const [discountDuration, setDiscountDuration] = useState("forever");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    fetchRetailers();
    fetchFlags();
  }, []);

  const fetchRetailers = async () => {
    setLoadingData(true);
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, user_id, salon_name, display_name, email, status, created_at, phone, address, trial_ends_at, website, business_category, other_category_text, account_type, team_size, service_locations, current_software, referral_source, referral_other_text, onboarding_phase")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch all roles to identify retailers (users with "user" role)
      const { data: allRoles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      // A retailer is anyone with the "user" role; exclude pure portal-only accounts
      // (those who ONLY have client/operator/affiliate roles and NOT "user")
      const userRoleSet = new Set(
        (allRoles || []).filter((r: any) => r.role === "user").map((r: any) => r.user_id)
      );
      const superAdminSet = new Set(
        (allRoles || []).filter((r: any) => r.role === "super_admin").map((r: any) => r.user_id)
      );

      const retailerProfiles = (profiles || []).filter(
        (p) => userRoleSet.has(p.user_id) && !superAdminSet.has(p.user_id)
      );

      const isEmailLike = (name: string | null) => {
        if (!name) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(name.trim());
      };

      const { data: clientCounts } = await supabase
        .from("clients")
        .select("user_id")
        .is("deleted_at", null);

      const countMap: Record<string, number> = {};
      (clientCounts || []).forEach((c: any) => {
        countMap[c.user_id] = (countMap[c.user_id] || 0) + 1;
      });

      const { data: operatorCounts } = await supabase
        .from("operators")
        .select("user_id")
        .is("deleted_at", null);

      const operatorCountMap: Record<string, number> = {};
      (operatorCounts || []).forEach((o: any) => {
        operatorCountMap[o.user_id] = (operatorCountMap[o.user_id] || 0) + 1;
      });

      const { data: locationCounts } = await supabase
        .from("locations")
        .select("user_id")
        .is("deleted_at", null);

      const locationCountMap: Record<string, number> = {};
      (locationCounts || []).forEach((l: any) => {
        locationCountMap[l.user_id] = (locationCountMap[l.user_id] || 0) + 1;
      });

      const { data: subs } = await supabase
        .from("subscriptions")
        .select("user_id, plans(name)")
        .is("deleted_at", null)
        .eq("status", "active");

      const planMap: Record<string, string> = {};
      (subs || []).forEach((s: any) => {
        if (s.plans?.name) planMap[s.user_id] = s.plans.name;
      });

      // Fetch last login per user from login_logs
      const { data: loginData } = await supabase
        .from("login_logs")
        .select("user_id, created_at, event_type")
        .eq("event_type", "login")
        .order("created_at", { ascending: false });

      const lastLoginMap: Record<string, string> = {};
      const loginCountMap: Record<string, number> = {};
      (loginData || []).forEach((l: any) => {
        if (!lastLoginMap[l.user_id]) lastLoginMap[l.user_id] = l.created_at;
        loginCountMap[l.user_id] = (loginCountMap[l.user_id] || 0) + 1;
      });

      const mapped: Retailer[] = retailerProfiles
        .map((p: any) => ({
          id: p.id,
          user_id: p.user_id,
          salon_name: p.salon_name,
          display_name: p.display_name,
          status: p.status,
          created_at: p.created_at,
          email: p.email,
          phone: p.phone,
          address: p.address,
          client_count: countMap[p.user_id] || 0,
          operator_count: operatorCountMap[p.user_id] || 0,
          location_count: locationCountMap[p.user_id] || 0,
          plan_name: planMap[p.user_id] || null,
          trial_ends_at: p.trial_ends_at || null,
          last_login: lastLoginMap[p.user_id] || null,
          total_logins: loginCountMap[p.user_id] || 0,
          website: p.website || null,
          business_category: p.business_category || null,
          other_category_text: p.other_category_text || null,
          account_type: p.account_type || null,
          team_size: p.team_size || null,
          service_locations: p.service_locations || null,
          current_software: p.current_software || null,
          referral_source: p.referral_source || null,
          referral_other_text: p.referral_other_text || null,
          onboarding_phase: p.onboarding_phase ?? 0,
        }));

      setRetailers(mapped);
    } catch (e) {
      console.error("Failed to fetch retailers:", e);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchFlags = async () => {
    const { data } = await supabase
      .from("feature_flags")
      .select("id, key, name, description, is_enabled")
      .is("deleted_at", null)
      .order("key");
    setFeatureFlags(data || []);
  };

  const toggleFlag = async (flag: FeatureFlag) => {
    const { error } = await supabase
      .from("feature_flags")
      .update({ is_enabled: !flag.is_enabled })
      .eq("id", flag.id);

    if (!error) {
      setFeatureFlags(prev =>
        prev.map(f => f.id === flag.id ? { ...f, is_enabled: !f.is_enabled } : f)
      );
      toast.success(`${flag.name}: ${!flag.is_enabled ? t("admin.flagEnabled") : t("admin.flagDisabled")}`);
    }
  };

  const toggleRetailerStatus = async (retailer: Retailer) => {
    const newStatus = retailer.status === "active" ? "suspended" : "active";
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", retailer.id);

    if (!error) {
      setRetailers(prev =>
        prev.map(r => r.id === retailer.id ? { ...r, status: newStatus } : r)
      );
      toast.success(newStatus === "active" ? t("admin.accountEnabled") : t("admin.accountDisabled"));
    }
  };

  const handleEnterRetailer = (retailer: Retailer) => {
    startImpersonation({
      id: retailer.id,
      user_id: retailer.user_id,
      salon_name: retailer.salon_name || retailer.display_name || "Centro",
    });
    navigate('/dashboard');
  };

  const openExtendDialog = (r: Retailer) => {
    setExtendTarget(r);
    setExtendDays("15");
    setExtendDialogOpen(true);
  };

  const handleExtendTrial = async () => {
    if (!extendTarget) return;
    const days = parseInt(extendDays);
    if (isNaN(days) || days < 1) {
      toast.error("Inserisci un numero di giorni valido");
      return;
    }
    // Se la scadenza attuale è nel futuro, aggiungi i giorni da quella data
    const now = new Date();
    const currentEnd = extendTarget.trial_ends_at ? new Date(extendTarget.trial_ends_at) : now;
    const baseDate = currentEnd > now ? currentEnd : now;
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() + days);

    const { error } = await supabase
      .from("profiles")
      .update({ trial_ends_at: newDate.toISOString() } as any)
      .eq("id", extendTarget.id);

    if (error) {
      toast.error("Errore nel prolungamento della prova");
      console.error(error);
    } else {
      toast.success(`Prova prolungata di ${days} giorni per ${extendTarget.salon_name || extendTarget.display_name}`);
      setRetailers(prev =>
        prev.map(r => r.id === extendTarget.id ? { ...r, trial_ends_at: newDate.toISOString() } : r)
      );
    }
    setExtendDialogOpen(false);
    setExtendTarget(null);
  };

  const fetchLoginLogs = async (userId: string) => {
    setLoadingLogs(true);
    const { data } = await supabase
      .from("login_logs")
      .select("id, event_type, created_at, user_agent")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    setLoginLogs((data as any) || []);
    setLoadingLogs(false);
  };

  const handleOpenDetail = (r: Retailer) => {
    setSelectedRetailer(r);
    fetchLoginLogs(r.user_id);
  };

  const openDiscountDialog = (r: Retailer) => {
    setDiscountTarget(r);
    setDiscountPercent("20");
    setDiscountDuration("forever");
    setGeneratedCode(null);
    setDiscountDialogOpen(true);
  };

  const handleGenerateDiscount = async () => {
    if (!discountTarget) return;
    setGeneratingCode(true);
    try {
      const salonSlug = (discountTarget.salon_name || discountTarget.display_name || "CENTRO")
        .toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      const code = `GLOWUP-${salonSlug}-${rand}`;

      const durationMonths = discountDuration === "forever" ? null
        : discountDuration === "1" ? 1
        : discountDuration === "3" ? 3
        : 6;

      const { error } = await supabase
        .from("discount_codes" as any)
        .insert({
          code,
          description: `Sconto per ${discountTarget.salon_name || discountTarget.display_name}`,
          discount_percent: parseInt(discountPercent),
          duration_months: durationMonths,
          target_user_id: discountTarget.user_id,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        } as any);

      if (error) throw error;
      setGeneratedCode(code);
      toast.success("Codice sconto generato!");
    } catch (e: any) {
      console.error(e);
      toast.error("Errore nella generazione del codice");
    } finally {
      setGeneratingCode(false);
    }
  };


  const activeRetailers = retailers.filter(r => r.status === "active");
  const totalClients = retailers.reduce((sum, r) => sum + r.client_count, 0);

  const getPlanStatusBadge = (r: Retailer) => {
    if (r.plan_name) {
      return <Badge variant="default" className="text-xs">{r.plan_name}</Badge>;
    }
    if (r.trial_ends_at) {
      const trialEnd = new Date(r.trial_ends_at);
      const now = new Date();
      if (trialEnd > now) {
        const expiryDate = trialEnd.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
        return (
          <div className="flex flex-col gap-0.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20 whitespace-nowrap">
              In prova
            </Badge>
            <span className="text-[10px] text-muted-foreground">→ {expiryDate}</span>
          </div>
        );
      } else {
        return (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
            Scaduto
          </Badge>
        );
      }
    }
    return <Badge variant="outline" className="text-[10px] px-1.5 py-0">Free</Badge>;
  };

  const monthlyRegistrations = (() => {
    const months: Record<string, number> = {};
    retailers.forEach(r => {
      const month = new Date(r.created_at).toLocaleDateString("it-IT", { month: "short", year: "2-digit" });
      months[month] = (months[month] || 0) + 1;
    });
    return Object.entries(months).map(([month, count]) => ({ month, count })).slice(-6);
  })();

  const planDistribution = (() => {
    const plans: Record<string, number> = {};
    retailers.forEach(r => {
      const plan = r.plan_name || "Free";
      plans[plan] = (plans[plan] || 0) + 1;
    });
    const colors = ["hsl(var(--muted-foreground))", "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--destructive))"];
    return Object.entries(plans).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  })();

  const mostActive = [...retailers].sort((a, b) => b.client_count - a.client_count).slice(0, 5);

  const globalStats = [
    { label: t("admin.totalRetailers"), value: String(retailers.length), icon: Store },
    { label: t("admin.totalUsers"), value: String(totalClients), icon: Users },
    { label: t("admin.activeRetailers"), value: String(activeRetailers.length), icon: CheckCircle2 },
    { label: t("admin.growth"), value: retailers.length > 0 ? `+${monthlyRegistrations[monthlyRegistrations.length - 1]?.count || 0}` : "0", icon: TrendingUp },
  ];

  const renderDetailDialogContent = () => {
    if (!selectedRetailer) return null;
    return (
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{t("admin.salon")}</p>
            <p className="font-medium">{selectedRetailer.salon_name || selectedRetailer.display_name || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium text-sm break-all">{selectedRetailer.email || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Telefono</p>
            <p className="font-medium">{selectedRetailer.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Indirizzo</p>
            <p className="font-medium">{selectedRetailer.address || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("admin.plan")}</p>
            <Badge variant="secondary">{selectedRetailer.plan_name || "Free"}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("admin.clients")}</p>
            <p className="font-medium">{selectedRetailer.client_count}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("admin.status")}</p>
            <Badge variant={selectedRetailer.status === "active" ? "default" : "destructive"}>
              {selectedRetailer.status === "active" ? "Attivo" : "Sospeso"}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("admin.registered")}</p>
            <p className="font-medium">{new Date(selectedRetailer.created_at).toLocaleDateString("it-IT")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ultimo accesso</p>
            <p className="font-medium">
              {selectedRetailer.last_login
                ? new Date(selectedRetailer.last_login).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
                : "Mai"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Totale accessi</p>
            <p className="font-medium">{selectedRetailer.total_logins}</p>
          </div>
        </div>

        {/* Onboarding Data Section */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="font-medium text-sm">Dati Onboarding</p>
            <Badge variant={selectedRetailer.onboarding_phase >= 7 ? "default" : "secondary"} className="text-[10px]">
              {selectedRetailer.onboarding_phase >= 7 ? "Completato" : `Step ${selectedRetailer.onboarding_phase}/7`}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Sito web</p>
              <p className="font-medium text-sm">{selectedRetailer.website || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Categorie</p>
              <p className="font-medium text-sm">{selectedRetailer.business_category?.join(", ") || "—"}</p>
              {selectedRetailer.other_category_text && (
                <p className="text-xs text-muted-foreground italic">"{selectedRetailer.other_category_text}"</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tipo account</p>
              <p className="font-medium text-sm">{selectedRetailer.account_type === "team" ? `Team (${selectedRetailer.team_size || "?"})` : selectedRetailer.account_type === "solo" ? "Solo" : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Modalità servizio</p>
              <p className="font-medium text-sm">{selectedRetailer.service_locations?.join(", ") || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Software precedente</p>
              <p className="font-medium text-sm">{selectedRetailer.current_software || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Come ci ha trovato</p>
              <p className="font-medium text-sm">
                {selectedRetailer.referral_source || "—"}
                {selectedRetailer.referral_other_text && ` — "${selectedRetailer.referral_other_text}"`}
              </p>
            </div>
          </div>
        </div>

        {/* Login Logs Section */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-primary" />
            <p className="font-medium text-sm">Registro Accessi</p>
          </div>
          {loadingLogs ? (
            <p className="text-sm text-muted-foreground animate-pulse">Caricamento...</p>
          ) : loginLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun accesso registrato.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Data / Ora</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs py-2">
                        {new Date(log.created_at).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant={log.event_type === "login" ? "default" : "outline"} className="text-xs">
                          {log.event_type === "login" ? "Login" : "Logout"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Mobile card for centers list
  const renderCenterCard = (r: Retailer) => (
    <Card key={r.id} className="shadow-card border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground truncate">{r.salon_name || r.display_name || "—"}</p>
            {r.phone && <p className="text-xs text-muted-foreground">{r.phone}</p>}
          </div>
          <Badge variant={r.status === "active" ? "default" : "destructive"} className="text-xs shrink-0">
            {r.status === "active" ? "Attivo" : "Sospeso"}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
          {getPlanStatusBadge(r)}
          <span>{r.client_count} clienti</span>
          <span>{r.operator_count} op.</span>
          <span>{r.location_count} sedi</span>
          <span>{new Date(r.created_at).toLocaleDateString("it-IT")}</span>
        </div>
        <div className="flex items-center gap-1 mt-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDetail(r)}>
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif">{t("admin.centerDetail")}</DialogTitle>
              </DialogHeader>
              {renderDetailDialogContent()}
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openExtendDialog(r)} title="Prolunga prova">
            <CalendarPlus className="h-4 w-4 text-accent-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleRetailerStatus(r)}>
            {r.status === "active" ? <Ban className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-primary" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDiscountDialog(r)} title="Genera codice sconto">
            <Ticket className="h-4 w-4 text-accent-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEnterRetailer(r)} title={t("admin.impersonation.enter")}>
            <LogIn className="h-4 w-4 text-primary" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-6 animate-fade-in">
        {/* Stats - hidden on leads tab (has its own stats) */}
        {activeTab !== "leads" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {globalStats.map((s) => (
              <Card key={s.label} className="shadow-card border-border/50">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{s.label}</p>
                      <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{s.value}</p>
                    </div>
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <s.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CENTERS */}
        {activeTab === "centers" && (
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="font-serif">{t("admin.allRetailers")}</CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? "px-4 pb-4 pt-0" : "p-0"}>
              {loadingData ? (
                <div className="p-8 text-center text-muted-foreground animate-pulse">Caricamento...</div>
              ) : retailers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Nessun centro estetico registrato.</div>
              ) : isMobile ? (
                <div className="space-y-3">
                  {retailers.map(renderCenterCard)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[160px]">{t("admin.salon")}</TableHead>
                      <TableHead className="w-[80px]">{t("admin.plan")}</TableHead>
                      <TableHead className="text-center w-[60px]">{t("admin.clients")}</TableHead>
                      <TableHead className="text-center w-[60px]">Operatori</TableHead>
                      <TableHead className="text-center w-[50px]">Sedi</TableHead>
                      <TableHead className="w-[70px]">{t("admin.status")}</TableHead>
                      <TableHead className="w-[110px]">Ultimo accesso</TableHead>
                      <TableHead className="w-[100px]">{t("admin.registered")}</TableHead>
                      <TableHead className="w-[140px]">{t("admin.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {retailers.map((r) => (
                      <TableRow key={r.id} className="group">
                        <TableCell className="py-2.5">
                          <div>
                            <p className="font-medium text-sm truncate max-w-[200px]">{r.salon_name || r.display_name || "—"}</p>
                            {r.phone && <p className="text-[11px] text-muted-foreground">{r.phone}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5">
                          {getPlanStatusBadge(r)}
                        </TableCell>
                        <TableCell className="text-center py-2.5 text-sm">{r.client_count}</TableCell>
                        <TableCell className="text-center py-2.5 text-sm">{r.operator_count}</TableCell>
                        <TableCell className="text-center py-2.5 text-sm">{r.location_count}</TableCell>
                        <TableCell className="py-2.5">
                          <Badge variant={r.status === "active" ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
                            {r.status === "active" ? "Attivo" : "Sospeso"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs py-2.5">
                          {r.last_login
                            ? new Date(r.last_login).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })
                            : <span className="text-muted-foreground/50">—</span>}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs py-2.5">
                          {new Date(r.created_at).toLocaleDateString("it-IT")}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-0.5">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenDetail(r)}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle className="font-medium">{t("admin.centerDetail")}</DialogTitle>
                                </DialogHeader>
                                {renderDetailDialogContent()}
                              </DialogContent>
                            </Dialog>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleRetailerStatus(r)}>
                              {r.status === "active" ? <Ban className="h-3.5 w-3.5 text-destructive" /> : <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openExtendDialog(r)} title="Prolunga prova">
                              <CalendarPlus className="h-3.5 w-3.5 text-accent-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDiscountDialog(r)} title="Genera codice sconto">
                              <Ticket className="h-3.5 w-3.5 text-accent-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEnterRetailer(r)} title={t("admin.impersonation.enter")}>
                              <LogIn className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* AFFILIATES */}
        {activeTab === "affiliates" && <AffiliateTab />}

        {/* SUPPORT */}
        {activeTab === "support" && <AdminSupportChat />}

        {/* ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-serif text-base">{t("admin.centersByMonth")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
                    <BarChart data={monthlyRegistrations}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-serif text-base">{t("admin.planDistribution")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {planDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
                      <PieChart>
                        <Pie data={planDistribution} cx="50%" cy="50%" outerRadius={isMobile ? 70 : 90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {planDistribution.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Nessun dato disponibile</p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-card border-border/50 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="font-serif text-base">{t("admin.mostActiveCenters")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mostActive.map((r, i) => (
                      <div key={r.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{r.salon_name || r.display_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{r.plan_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground">{r.client_count}</p>
                          <p className="text-xs text-muted-foreground">{t("admin.clients")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === "settings" && <AdminSettingsTab />}

        {/* FEATURE FLAGS */}
        {activeTab === "featureFlags" && (
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <ToggleLeft className="h-5 w-5 text-primary" /> {t("admin.featureFlags")}
              </CardTitle>
              <CardDescription>{t("admin.featureFlagsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {featureFlags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t("admin.noFlags")}</p>
              ) : (
                <div className="space-y-4">
                  {featureFlags.map((flag) => (
                    <div key={flag.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{flag.name}</p>
                        <p className="text-sm text-muted-foreground">{flag.description}</p>
                        <code className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded mt-1 inline-block">{flag.key}</code>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <Badge variant={flag.is_enabled ? "default" : "outline"} className="text-xs hidden sm:inline-flex">
                          {flag.is_enabled ? t("admin.flagEnabled") : t("admin.flagDisabled")}
                        </Badge>
                        <Switch checked={flag.is_enabled} onCheckedChange={() => toggleFlag(flag)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TO-DO LIST */}
        {activeTab === "todos" && <AdminTodoTab />}

        {/* TUTORIALS */}
        {activeTab === "tutorials" && <AdminTutorialTab />}

        {/* INTEGRATIONS */}
        {activeTab === "integrations" && <IntegrationSettings />}

        {/* FLUSSI */}
        {activeTab === "flussi" && <FlussiContent />}

        {/* FUNNEL */}
        {activeTab === "funnel" && <AdminFunnelTab />}

        {/* FACEBOOK LEADS */}
        {activeTab === "leads" && <AdminLeadsTab />}

        {/* LEAD WHATSAPP AUTOMATIONS */}
        {activeTab === "leadWhatsapp" && <LeadWhatsAppTab />}
      </div>

      {/* Extend Trial Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Prolunga periodo di prova</DialogTitle>
            <DialogDescription>
              {extendTarget && (
                <>Inserisci il numero di giorni da aggiungere per <strong>{extendTarget.salon_name || extendTarget.display_name}</strong>. La prova verrà estesa a partire da oggi.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="extend-days">Numero di giorni</Label>
              <Input
                id="extend-days"
                type="number"
                min="1"
                max="365"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                placeholder="15"
              />
            </div>
            {extendTarget?.trial_ends_at && (
              <p className="text-xs text-muted-foreground">
                Scadenza attuale: {new Date(extendTarget.trial_ends_at).toLocaleDateString("it-IT")}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleExtendTrial}>Conferma</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Discount Code Dialog */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Genera codice sconto</DialogTitle>
            <DialogDescription>
              {discountTarget && (
                <>Crea un codice sconto personalizzato per <strong>{discountTarget.salon_name || discountTarget.display_name}</strong>.</>
              )}
            </DialogDescription>
          </DialogHeader>
          {generatedCode ? (
            <div className="space-y-4 py-2">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Codice generato</p>
                <p className="text-lg font-bold font-mono text-foreground">{generatedCode}</p>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(generatedCode);
                  toast.success("Codice copiato!");
                }}
              >
                <Copy className="h-4 w-4" /> Copia codice
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Percentuale sconto</Label>
                <Select value={discountPercent} onValueChange={setDiscountPercent}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Durata sconto</Label>
                <Select value={discountDuration} onValueChange={setDiscountDuration}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 mese</SelectItem>
                    <SelectItem value="3">3 mesi</SelectItem>
                    <SelectItem value="6">6 mesi</SelectItem>
                    <SelectItem value="forever">Per sempre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscountDialogOpen(false)}>
              {generatedCode ? "Chiudi" : "Annulla"}
            </Button>
            {!generatedCode && (
              <Button onClick={handleGenerateDiscount} disabled={generatingCode}>
                {generatingCode ? "Generazione..." : "Genera"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
