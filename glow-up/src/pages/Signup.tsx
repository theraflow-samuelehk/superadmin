import { useState, useEffect } from "react";
import { checkLeakedPassword } from "@/lib/checkLeakedPassword";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Check, X, ChevronDown } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";

const COUNTRY_PREFIXES: Record<string, string> = {
  IT: "+39", MT: "+356", US: "+1", GB: "+44", DE: "+49", FR: "+33",
  ES: "+34", PT: "+351", AT: "+43", CH: "+41", BE: "+32", NL: "+31",
  IE: "+353", GR: "+30", PL: "+48", RO: "+40", HR: "+385", CZ: "+420",
  SK: "+421", HU: "+36", SI: "+386", BG: "+359", SE: "+46", DK: "+45",
  FI: "+358", NO: "+47", LT: "+370", LV: "+371", EE: "+372",
  CY: "+357", LU: "+352", AL: "+355", RS: "+381", BA: "+387",
  ME: "+382", MK: "+389", TR: "+90", RU: "+7", UA: "+380",
  BR: "+55", AR: "+54", MX: "+52", CO: "+57", CL: "+56",
  AU: "+61", NZ: "+64", JP: "+81", CN: "+86", IN: "+91",
  AE: "+971", SA: "+966", IL: "+972", ZA: "+27", EG: "+20",
  MA: "+212", TN: "+216", KE: "+254", NG: "+234",
};

function detectCountryPrefix(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const locale = navigator.language || navigator.languages?.[0] || "";

    // Try timezone-based detection first
    const tzCountryMap: Record<string, string> = {
      "Europe/Rome": "IT", "Europe/Malta": "MT", "America/New_York": "US",
      "America/Chicago": "US", "America/Denver": "US", "America/Los_Angeles": "US",
      "Europe/London": "GB", "Europe/Berlin": "DE", "Europe/Paris": "FR",
      "Europe/Madrid": "ES", "Europe/Lisbon": "PT", "Europe/Vienna": "AT",
      "Europe/Zurich": "CH", "Europe/Brussels": "BE", "Europe/Amsterdam": "NL",
      "Europe/Dublin": "IE", "Europe/Athens": "GR", "Europe/Warsaw": "PL",
      "Europe/Bucharest": "RO", "Europe/Zagreb": "HR", "Europe/Prague": "CZ",
      "Europe/Bratislava": "SK", "Europe/Budapest": "HU", "Europe/Ljubljana": "SI",
      "Europe/Sofia": "BG", "Europe/Stockholm": "SE", "Europe/Copenhagen": "DK",
      "Europe/Helsinki": "FI", "Europe/Oslo": "NO", "Europe/Vilnius": "LT",
      "Europe/Riga": "LV", "Europe/Tallinn": "EE", "Asia/Nicosia": "CY",
      "Europe/Luxembourg": "LU", "Europe/Istanbul": "TR", "Europe/Moscow": "RU",
      "Europe/Kiev": "UA", "America/Sao_Paulo": "BR", "America/Argentina/Buenos_Aires": "AR",
      "America/Mexico_City": "MX", "America/Bogota": "CO", "America/Santiago": "CL",
      "Australia/Sydney": "AU", "Pacific/Auckland": "NZ", "Asia/Tokyo": "JP",
      "Asia/Shanghai": "CN", "Asia/Kolkata": "IN", "Asia/Dubai": "AE",
      "Asia/Riyadh": "SA", "Asia/Jerusalem": "IL", "Africa/Johannesburg": "ZA",
      "Africa/Cairo": "EG", "Africa/Casablanca": "MA", "Africa/Tunis": "TN",
      "Africa/Nairobi": "KE", "Africa/Lagos": "NG",
    };

    if (tz && tzCountryMap[tz]) {
      const code = tzCountryMap[tz];
      return COUNTRY_PREFIXES[code] || "+39";
    }

    // Fallback to locale
    const countryFromLocale = locale.split("-")[1]?.toUpperCase();
    if (countryFromLocale && COUNTRY_PREFIXES[countryFromLocale]) {
      return COUNTRY_PREFIXES[countryFromLocale];
    }
  } catch {}
  return "+39";
}

const PASSWORD_RULES = [
  { key: "length", test: (p: string) => p.length >= 8 },
  { key: "uppercase", test: (p: string) => /[A-Z]/.test(p) },
  { key: "number", test: (p: string) => /\d/.test(p) },
];

export default function Signup() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+39");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [prefixOpen, setPrefixOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setPhonePrefix(detectCountryPrefix());
  }, []);

  const passwordValid = PASSWORD_RULES.every(r => r.test(password));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid) {
      toast({ title: t("auth.error"), description: t("auth.passwordRequirements"), variant: "destructive" });
      return;
    }
    setLoading(true);

    const leakedCount = await checkLeakedPassword(password);
    if (leakedCount > 0) {
      setLoading(false);
      toast({ title: t("auth.error"), description: t("auth.passwordLeaked"), variant: "destructive" });
      return;
    }

    const fullPhone = phoneNumber.trim() ? `${phonePrefix}${phoneNumber.trim().replace(/\s/g, "")}` : undefined;

    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: {
          display_name: email.split("@")[0],
          ...(fullPhone ? { phone: fullPhone } : {}),
        },
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("auth.signupSuccess"), description: t("auth.checkEmail") });
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
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <img src="/icon-512.png" alt="GlowUp" className="h-12 w-12 rounded-xl" />
          </div>
          <CardTitle className="text-2xl font-serif">{t("auth.signupTitle")}</CardTitle>
          <CardDescription>{t("auth.signupSubtitle")}</CardDescription>
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

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("auth.email")}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={t("auth.emailPlaceholder")} />
            </div>

            <div className="space-y-2">
              <Label>{t("auth.phone")}</Label>
              <div className="flex gap-2">
                <Popover open={prefixOpen} onOpenChange={setPrefixOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-md border border-input bg-muted/50 px-3 text-sm text-foreground h-10 shrink-0 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <span className="font-medium">{phonePrefix}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-1" align="start">
                    <ScrollArea className="h-60">
                      {Object.entries(COUNTRY_PREFIXES).map(([code, prefix]) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => { setPhonePrefix(prefix); setPrefixOpen(false); }}
                          className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors cursor-pointer ${
                            phonePrefix === prefix
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          <span>{code}</span>
                          <span className="text-muted-foreground">{prefix}</span>
                        </button>
                      ))}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
                <Input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={t("auth.phoneNumberPlaceholder")}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("auth.password")}</Label>
              <div className="relative">
                <Input
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

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading || !passwordValid}>
              {loading ? t("auth.signingUp") : t("auth.signupButton")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link to="/auth" className="text-primary hover:underline font-medium">
              {t("auth.loginButton")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
