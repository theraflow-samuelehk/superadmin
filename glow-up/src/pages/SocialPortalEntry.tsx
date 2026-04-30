import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, UserPlus, LogIn, ArrowLeft, Sparkles, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { setPortalPreference } from "@/lib/portalPreference";

type Step = "choice" | "existing" | "new";
type LoginMode = "email" | "phone";

export default function SocialPortalEntry() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [salonName, setSalonName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState<Step>("choice");
  const [submitting, setSubmitting] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>("email");

  // Existing client form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPhone, setLoginPhone] = useState("");

  // New client form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!slug) return;
    const resolve = async () => {
      setLoading(true);
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/client-portal?action=resolve-salon&slug=${encodeURIComponent(slug)}`;
      const res = await fetch(url, {
        headers: { "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setNotFound(true);
      } else {
        setSalonName(json.salon_name);
      }
      setLoading(false);
    };
    resolve();
  }, [slug]);

  const handleLogin = async () => {
    const identifier = loginMode === "email" ? loginEmail.trim() : loginPhone.trim();
    if (!identifier) return;
    setSubmitting(true);
    try {
      const bodyPayload = loginMode === "email"
        ? { slug, email: identifier }
        : { slug, phone: identifier };

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/client-portal?action=social-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify(bodyPayload),
        }
      );
      const json = await res.json();
      if (!res.ok || json.error) {
        if (json.error === "email_not_found") {
          toast.error(t("portal.socialEmailNotFound"));
        } else if (json.error === "phone_not_found") {
          toast.error(t("portal.socialPhoneNotFound"));
        } else if (json.error === "rate_limited") {
          toast.error(t("portal.rateLimited"));
        } else {
          toast.error(t("portal.loginFailed"));
        }
        setSubmitting(false);
        return;
      }
      const { error } = await supabase.auth.verifyOtp({
        token_hash: json.token_hash,
        type: "magiclink",
      });
      if (error) {
        toast.error(t("portal.loginFailed"));
        setSubmitting(false);
        return;
      }
      setPortalPreference("client");
      navigate("/portal");
    } catch {
      toast.error(t("portal.loginFailed"));
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!firstName.trim() || !email.trim()) {
      toast.error(t("clients.requiredField"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/client-portal?action=social-register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            slug,
            first_name: firstName,
            last_name: lastName,
            phone,
            email,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok || json.error) {
        if (json.error === "client_already_exists") {
          toast.error(t("portal.socialClientExists"));
        } else {
          toast.error(t("portal.loginFailed"));
        }
        setSubmitting(false);
        return;
      }
      const { error } = await supabase.auth.verifyOtp({
        token_hash: json.token_hash,
        type: "magiclink",
      });
      if (error) {
        toast.error(t("portal.loginFailed"));
        setSubmitting(false);
        return;
      }
      setPortalPreference("client");
      navigate("/portal");
    } catch {
      toast.error(t("portal.loginFailed"));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <p className="text-lg font-medium text-foreground">{t("portal.socialSalonNotFound")}</p>
            <p className="text-sm text-muted-foreground mt-2">{t("portal.socialSalonNotFoundDesc")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loginValue = loginMode === "email" ? loginEmail : loginPhone;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="max-w-md w-full shadow-lg border-border/50">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl font-serif">{salonName}</CardTitle>
          {step === "choice" && (
            <CardDescription className="text-base">{t("portal.socialAreYouClient")}</CardDescription>
          )}
          {step === "existing" && (
            <CardDescription>{t("portal.socialExistingDesc")}</CardDescription>
          )}
          {step === "new" && (
            <CardDescription>{t("portal.socialNewDesc")}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "choice" && (
            <div className="space-y-3">
              <Button
                variant="hero"
                size="lg"
                className="w-full gap-2"
                onClick={() => setStep("existing")}
              >
                <LogIn className="h-5 w-5" />
                {t("portal.socialExistingClient")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2"
                onClick={() => setStep("new")}
              >
                <UserPlus className="h-5 w-5" />
                {t("portal.socialNewClient")}
              </Button>
            </div>
          )}

          {step === "existing" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={loginMode === "email" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => setLoginMode("email")}
                >
                  <Mail className="h-4 w-4" />
                  {t("portal.socialLoginByEmail")}
                </Button>
                <Button
                  variant={loginMode === "phone" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => setLoginMode("phone")}
                >
                  <Phone className="h-4 w-4" />
                  {t("portal.socialLoginByPhone")}
                </Button>
              </div>

              {loginMode === "email" ? (
                <div className="space-y-2">
                  <Label>{t("clients.email")}</Label>
                  <Input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={t("auth.emailPlaceholder")}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{t("clients.phone")}</Label>
                  <Input
                    type="tel"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="388 1234567"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                </div>
              )}

              <Button
                variant="hero"
                className="w-full"
                onClick={handleLogin}
                disabled={submitting || !loginValue.trim()}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {t("portal.loginButton")}
              </Button>
              <Button
                variant="ghost"
                className="w-full gap-1"
                onClick={() => setStep("choice")}
              >
                <ArrowLeft className="h-4 w-4" />
                {t("common.back")}
              </Button>
            </div>
          )}

          {step === "new" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("clients.firstName")} *</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("clients.lastName")}</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("clients.phone")}</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("clients.email")} *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                />
              </div>
              <Button
                variant="hero"
                className="w-full"
                onClick={handleRegister}
                disabled={submitting || !firstName.trim() || !email.trim()}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {t("portal.socialRegisterAndAccess")}
              </Button>
              <Button
                variant="ghost"
                className="w-full gap-1"
                onClick={() => setStep("choice")}
              >
                <ArrowLeft className="h-4 w-4" />
                {t("common.back")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
