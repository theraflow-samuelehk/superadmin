import { useState, useCallback } from "react";
import { checkLeakedPassword } from "@/lib/checkLeakedPassword";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { setPortalPreference, clearPortalPreference } from "@/lib/portalPreference";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

function PasswordField({
  password, setPassword, showPassword, setShowPassword, minLength, t,
}: {
  password: string; setPassword: (v: string) => void;
  showPassword: boolean; setShowPassword: (v: boolean) => void;
  minLength?: number; t: (k: string) => string;
}) {
  return (
    <div className="space-y-2">
      <Label>{t("auth.password")}</Label>
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={minLength || undefined}
          placeholder="••••••••"
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
          aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {minLength && (
        <p className="text-xs text-muted-foreground">{t("auth.passwordHint")}</p>
      )}
    </div>
  );
}

export default function Auth() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    } else {
      navigate("/app");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Check leaked password via HaveIBeenPwned k-Anonymity API
    const leakedCount = await checkLeakedPassword(password);
    if (leakedCount > 0) {
      setLoading(false);
      toast({ title: t("auth.error"), description: t("auth.passwordLeaked"), variant: "destructive" });
      return;
    }

    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/app`, data: { display_name: displayName } },
    });
    setLoading(false);
    if (error) {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("auth.signupSuccess"), description: t("auth.checkEmail") });
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: t("auth.error"), description: t("auth.emailPlaceholder"), variant: "destructive" });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("auth.forgotPasswordSent"), description: t("auth.forgotPasswordDesc") });
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/app`,
      });

      if (error) {
        toast({ title: t("auth.error"), description: String(error), variant: "destructive" });
      }
    } catch (err) {
      toast({ title: t("auth.error"), description: String(err), variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="h-full overflow-auto bg-background flex flex-col items-center justify-center p-4 gap-4">
      <Card className="w-full max-w-md shadow-card border-border/50">
        <CardHeader className="text-center relative">
          <button
            type="button"
            onClick={() => { clearPortalPreference(); navigate("/app"); }}
            className="absolute left-4 top-4 h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={t("common.back")}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex justify-center mb-3">
            <img src="/icon-512.png" alt="GlowUp" className="h-12 w-12 rounded-xl" />
          </div>
          <CardTitle className="text-2xl font-serif">{t("auth.title")}</CardTitle>
          <CardDescription>{t("auth.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full gap-2 mb-4"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? t("common.loading") : t("auth.continueWithGoogle")}
          </Button>

          <div className="relative mb-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
              {t("common.or")}
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("auth.email")}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={t("auth.emailPlaceholder")} />
            </div>
            <PasswordField password={password} setPassword={setPassword} showPassword={showPassword} setShowPassword={setShowPassword} t={t} />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
              >
                {t("auth.forgotPassword")}
              </button>
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? t("auth.loggingIn") : t("auth.loginButton")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {t("auth.noAccount")}{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              {t("auth.signupButton")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
