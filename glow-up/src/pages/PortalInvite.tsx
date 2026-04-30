import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, AlertCircle, RefreshCw, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PWAInstallDialog from "@/components/portal/PWAInstallDialog";
import { toast } from "sonner";
import { setPortalPreference } from "@/lib/portalPreference";

type LoginMode = "email" | "phone";

export default function PortalInvite() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, session, refreshRoles } = useAuth();

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<{ salon_name: string; client_name: string; client_email: string; client_phone?: string; already_accepted?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<LoginMode>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const fetchInvite = () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    fetch(`https://${projectId}.supabase.co/functions/v1/client-portal?action=validate-invite&token=${token}`, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setInviteData(data);
          setEmail(data.client_email || "");
          setPhone(data.client_phone || "");
          // If client has phone but no email, default to phone mode
          if (!data.client_email && data.client_phone) {
            setMode("phone");
          }
        }
      })
      .catch(() => setError("network_error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPortalPreference("client");
    fetchInvite();
  }, [token]);

  useEffect(() => {
    if (inviteData?.already_accepted && user && session) {
      navigate("/portal");
    }
  }, [inviteData, user, session]);

  useEffect(() => {
    if (user && session && inviteData && token && !accepting && !inviteData.already_accepted) {
      acceptInvite();
    }
  }, [user, session, inviteData]);

  const acceptInvite = async () => {
    if (!session || !token) return;
    setAccepting(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/client-portal?action=accept-invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ token }),
      });
      const result = await res.json();
      if (result.error) {
        toast.error(t("portal.acceptError"));
        setError(result.error);
      } else {
        await refreshRoles();
        setPortalPreference("client");
        toast.success(t("portal.inviteAccepted"));
        navigate("/portal");
      }
    } catch {
      toast.error(t("portal.acceptError"));
    } finally {
      setAccepting(false);
    }
  };

  const handleInstantLogin = async () => {
    if (!token) return;
    if (mode === "email" && !email) return;
    if (mode === "phone" && !phone) return;

    setSending(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

      const bodyPayload = mode === "email"
        ? { email: email.trim().toLowerCase(), token }
        : { phone: phone.trim(), token };

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/client-portal?action=invite-quick-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(bodyPayload),
        }
      );
      const data = await res.json();

      if (!res.ok || data?.error) {
        const errorMap: Record<string, string> = {
          email_mismatch: t("portal.emailNotFound"),
          phone_mismatch: t("portal.phoneNotFound", "Numero di telefono non corrispondente"),
          no_email_on_record: t("portal.noEmailOnRecord", "Questo cliente non ha un'email associata. Contatta il salone."),
          rate_limited: t("portal.rateLimited"),
        };
        toast.error(errorMap[data?.error] || t("portal.loginFailed"));
        setSending(false);
        return;
      }

      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink",
      });

      if (otpError) {
        toast.error(otpError.message);
      }
    } catch {
      toast.error(t("portal.loginFailed"));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-auto bg-background flex items-center justify-center p-4">
        <Skeleton className="h-64 w-full max-w-md rounded-xl" />
      </div>
    );
  }

  if (error) {
    const errorMessages: Record<string, string> = {
      client_already_linked: t("portal.clientAlreadyLinked"),
      invite_not_found: t("portal.invalidInvite"),
    };

    return (
      <div className="h-full overflow-auto bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-soft">
          <CardContent className="py-12 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-muted-foreground">{errorMessages[error] || t("portal.invalidInvite")}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={fetchInvite}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t("portal.retry")}
              </Button>
              <Button onClick={() => navigate("/portal/login")}>{t("portal.goToPortal")}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepting) {
    return (
      <div className="h-full overflow-auto bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-soft">
          <CardContent className="py-12 text-center space-y-4">
            <div className="animate-pulse text-muted-foreground">{t("portal.accepting")}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isValid = mode === "email" ? !!email.trim() : !!phone.trim();

  return (
    <div className="h-full overflow-auto bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-serif text-xl">{inviteData?.salon_name}</CardTitle>
          <CardDescription>
            {inviteData?.already_accepted
              ? t("portal.alreadyAcceptedLogin")
              : t("portal.inviteMessage", { name: inviteData?.client_name })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode toggle - only show if client has both email and phone */}
          {inviteData?.client_email && inviteData?.client_phone && (
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => setMode("email")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === "email" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setMode("phone")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === "phone" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Phone className="h-3.5 w-3.5" />
                {t("portal.phoneLabel", "Telefono")}
              </button>
            </div>
          )}

          {mode === "email" ? (
            <div className="space-y-2">
              <Label>{t("auth.email")}</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t("portal.phoneLabel", "Telefono")}</Label>
              <Input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder={t("portal.phonePlaceholder", "+39 3XX XXX XXXX")}
              />
            </div>
          )}

          <Button variant="hero" className="w-full" onClick={handleInstantLogin} disabled={sending || !isValid}>
            {sending ? t("common.loading") : t("portal.accessPortal")}
          </Button>
        </CardContent>
      </Card>
      <PWAInstallDialog />
    </div>
  );
}
