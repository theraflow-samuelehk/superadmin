import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Handshake, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function AffiliatePortalInvite() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, session } = useAuth();

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<{ affiliate_name: string; affiliate_email: string; already_accepted?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const fetchInvite = () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    fetch(`https://${projectId}.supabase.co/functions/v1/affiliate-portal?action=validate-invite&token=${token}`, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setInviteData(data);
          setEmail(data.affiliate_email || "");
        }
      })
      .catch(() => setError("network_error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInvite(); }, [token]);

  useEffect(() => {
    if (inviteData?.already_accepted && user && session) {
      navigate("/affiliate-portal");
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
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/affiliate-portal?action=accept-invite`, {
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
        toast.error(t("affiliatePortal.acceptError"));
        setError(result.error);
      } else {
        toast.success(t("affiliatePortal.inviteAccepted"));
        navigate("/affiliate-portal");
      }
    } catch {
      toast.error(t("affiliatePortal.acceptError"));
    } finally {
      setAccepting(false);
    }
  };

  const handleInstantLogin = async () => {
    if (!email || !token) return;
    setSending(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/affiliate-portal?action=invite-quick-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ email: email.trim().toLowerCase(), token }),
        }
      );
      const data = await res.json();

      if (!res.ok || data?.error) {
        toast.error(t("affiliatePortal.loginFailed"));
        setSending(false);
        return;
      }

      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink",
      });

      if (otpError) toast.error(otpError.message);
    } catch {
      toast.error(t("affiliatePortal.loginFailed"));
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
    return (
      <div className="h-full overflow-auto bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-soft">
          <CardContent className="py-12 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-muted-foreground">{t("affiliatePortal.invalidInvite")}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={fetchInvite}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t("portal.retry")}
              </Button>
              <Button onClick={() => navigate("/affiliate-portal/login")}>{t("affiliatePortal.goToLogin")}</Button>
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
            <div className="animate-pulse text-muted-foreground">{t("affiliatePortal.accepting")}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Handshake className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-serif text-xl">{t("affiliatePortal.inviteTitle")}</CardTitle>
          <CardDescription>
            {inviteData?.already_accepted
              ? t("affiliatePortal.alreadyAccepted")
              : t("affiliatePortal.inviteMessage", { name: inviteData?.affiliate_name })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("auth.email")}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
            />
          </div>
          <Button variant="hero" className="w-full" onClick={handleInstantLogin} disabled={sending || !email}>
            {sending ? t("common.loading") : t("affiliatePortal.accessPortal")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
