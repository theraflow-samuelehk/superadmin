import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, LogIn, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { setPortalPreference, clearPortalPreference } from "@/lib/portalPreference";

type LoginMode = "email" | "phone";

export default function PortalLogin() {
  const { t } = useTranslation();
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<LoginMode>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setPortalPreference("client");
  }, []);

  useEffect(() => {
    if (!loading && user) {
      navigate("/app", { replace: true });
    }
  }, [user, roles, loading, navigate]);

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const bodyPayload = mode === "email"
        ? { email: email.trim().toLowerCase() }
        : { phone: phone.trim() };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/client-portal?action=quick-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
        }
      );
      const data = await response.json();

      if (!response.ok || data?.error) {
        const errorMap: Record<string, string> = {
          email_not_found: t("portal.emailNotFound"),
          phone_not_found: t("portal.phoneNotFound", "Nessun cliente trovato con questo numero"),
          no_email_on_record: t("portal.noEmailOnRecord", "Errore di accesso. Contatta il salone."),
          rate_limited: t("portal.rateLimited"),
        };
        toast({
          title: t("auth.error"),
          description: errorMap[data?.error] || t("portal.loginFailed"),
          variant: "destructive",
        });
        setSending(false);
        return;
      }

      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink",
      });

      if (otpError) {
        toast({
          title: t("auth.error"),
          description: otpError.message,
          variant: "destructive",
        });
        setSending(false);
        return;
      }
    } catch {
      toast({
        title: t("auth.error"),
        description: t("portal.loginFailed"),
        variant: "destructive",
      });
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Caricamento...</div>
      </div>
    );
  }

  const isValid = mode === "email" ? !!email.trim() : !!phone.trim();

  return (
    <div className="h-full overflow-auto bg-background flex flex-col items-center justify-center p-4 gap-4">
      <Card className="w-full max-w-md shadow-card border-border/50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-serif">{t("portal.loginTitle")}</CardTitle>
          <CardDescription>{t("portal.loginSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4">
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

          <form onSubmit={handleQuickLogin} className="space-y-4">
            {mode === "email" ? (
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
            ) : (
              <div className="space-y-2">
                <Label>{t("portal.phoneLabel", "Telefono")}</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder={t("portal.phonePlaceholder", "+39 3XX XXX XXXX")}
                />
              </div>
            )}
            <Button type="submit" variant="hero" size="lg" className="w-full gap-2" disabled={sending || !isValid}>
              <LogIn className="h-4 w-4" />
              {sending ? t("common.loading") : t("portal.loginButton")}
            </Button>
          </form>
        </CardContent>
      </Card>
      <button
        type="button"
        onClick={() => { clearPortalPreference(); navigate("/app"); }}
        className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
      >
        {t("appRedirect.switchPortal")}
      </button>
    </div>
  );
}
