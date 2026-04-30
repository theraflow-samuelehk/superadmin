import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff, Check, X } from "lucide-react";

const PASSWORD_RULES = [
  { key: "length", test: (p: string) => p.length >= 8 },
  { key: "uppercase", test: (p: string) => /[A-Z]/.test(p) },
  { key: "number", test: (p: string) => /\d/.test(p) },
];

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const passwordValid = PASSWORD_RULES.every(r => r.test(password));

  const hasRecoveryHash = useMemo(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    return params.get("type") === "recovery" || hash.includes("access_token");
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setCanReset(Boolean(data.session) || hasRecoveryHash);
      setCheckingLink(false);
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setCanReset(Boolean(session) || hasRecoveryHash);
        setCheckingLink(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hasRecoveryHash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordValid) {
      toast({ title: t("auth.error"), description: t("auth.passwordRequirements"), variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: t("auth.error"),
        description: t("auth.passwordsDoNotMatch"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
      return;
    }

    window.history.replaceState(null, "", "/reset-password");
    toast({
      title: t("auth.resetPasswordSuccess"),
      description: t("auth.resetPasswordSuccessDesc"),
    });
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card border-border/50">
        <CardHeader className="text-center relative">
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t("common.back")}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex justify-center mb-3">
            <img src="/icon-512.png" alt="GlowUp" className="h-12 w-12 rounded-xl" />
          </div>
          <CardTitle className="text-2xl font-serif">{t("auth.resetPasswordTitle")}</CardTitle>
          <CardDescription>{t("auth.resetPasswordSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {checkingLink ? (
            <p className="text-sm text-center text-muted-foreground">{t("common.loading")}</p>
          ) : canReset ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">{t("auth.newPassword")}</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (!passwordTouched) setPasswordTouched(true); }}
                    required
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordTouched && (
                  <div className="space-y-1 pt-1">
                    {PASSWORD_RULES.map(rule => {
                      const passed = rule.test(password);
                      return (
                        <div key={rule.key} className="flex items-center gap-1.5 text-xs">
                          {passed
                            ? <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                            : <X className="h-3 w-3 text-muted-foreground shrink-0" />
                          }
                          <span className={passed ? "text-emerald-500" : "text-muted-foreground"}>
                            {t(`auth.pwRule_${rule.key}`)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t("auth.confirmPassword")}</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder={t("auth.confirmPasswordPlaceholder")}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading || !passwordValid}>
                {loading ? t("auth.resetPasswordSaving") : t("auth.resetPasswordButton")}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div>
                <p className="text-sm font-medium text-foreground">{t("auth.invalidRecoveryLink")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("auth.invalidRecoveryLinkDesc")}</p>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                {t("auth.backToLogin")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}