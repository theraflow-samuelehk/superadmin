import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Handshake, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AffiliatePortalLogin() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/affiliate-portal", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/affiliate-portal?action=quick-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        }
      );
      const data = await response.json();

      if (!response.ok || data?.error) {
        let errorMsg: string;
        if (data?.error === "email_not_found") {
          errorMsg = t("affiliatePortal.emailNotFound");
        } else if (data?.error === "rate_limited") {
          errorMsg = t("affiliatePortal.rateLimited");
        } else {
          errorMsg = t("affiliatePortal.loginFailed");
        }
        toast({ title: t("auth.error"), description: errorMsg, variant: "destructive" });
        setSending(false);
        return;
      }

      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink",
      });

      if (otpError) {
        toast({ title: t("auth.error"), description: otpError.message, variant: "destructive" });
        setSending(false);
        return;
      }
    } catch {
      toast({ title: t("auth.error"), description: t("affiliatePortal.loginFailed"), variant: "destructive" });
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card border-border/50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Handshake className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-serif">{t("affiliatePortal.loginTitle")}</CardTitle>
          <CardDescription>{t("affiliatePortal.loginSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleQuickLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("auth.email")}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t("auth.emailPlaceholder")}
              />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full gap-2" disabled={sending}>
              <LogIn className="h-4 w-4" />
              {sending ? t("common.loading") : t("affiliatePortal.loginButton")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
