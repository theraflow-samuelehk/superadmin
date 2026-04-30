import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, UserCog } from "lucide-react";
import { getPortalPreference, setPortalPreference } from "@/lib/portalPreference";
import { supabase } from "@/integrations/supabase/client";

export default function AppRedirect() {
  const { user, loading, roles } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);
  const [processingAuth, setProcessingAuth] = useState(true);
  const [lastChanceDone, setLastChanceDone] = useState(false);

  // Handle auth callback tokens in URL hash (from email verification link)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes("access_token") || hash.includes("type=signup") || hash.includes("type=recovery"))) {
      const timer = setTimeout(() => setProcessingAuth(false), 5000);
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          setProcessingAuth(false);
          window.history.replaceState(null, "", window.location.pathname);
        }
      });

      return () => {
        clearTimeout(timer);
        subscription.unsubscribe();
      };
    } else {
      setProcessingAuth(false);
    }
  }, []);

  // Increased timeout: 10s for PWA on slow mobile networks
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 10_000);
    return () => clearTimeout(timer);
  }, []);

  // Last-chance session check when timeout fires — avoids false "not authenticated"
  useEffect(() => {
    if (timedOut && !user && !lastChanceDone) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          // Session exists — force a page reload to let AuthProvider pick it up cleanly
          window.location.reload();
        } else {
          setLastChanceDone(true);
        }
      });
    }
  }, [timedOut, user, lastChanceDone]);

  if ((loading || processingAuth) && !(timedOut && lastChanceDone)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  // Authenticated: smart redirect based on role priority
  if (user) {
    if (roles.includes("super_admin")) {
      return <Navigate to="/admin" replace />;
    }
    const hasAdmin = roles.includes("user") || roles.includes("admin") || roles.includes("owner") || roles.includes("manager");
    
    const hasClient = roles.includes("client");
    const hasOperator = roles.includes("operator");

    if (hasClient && hasOperator && !hasAdmin) {
      const pref = getPortalPreference();
      if (pref === "operator") return <Navigate to="/staff-portal" replace />;
      if (pref === "client") return <Navigate to="/portal" replace />;
      setPortalPreference("operator");
      return <Navigate to="/staff-portal" replace />;
    }

    if (hasOperator && !hasAdmin) {
      setPortalPreference("operator");
      return <Navigate to="/staff-portal" replace />;
    }
    if (hasClient && !hasAdmin && !hasOperator) {
      setPortalPreference("client");
      return <Navigate to="/portal" replace />;
    }
    setPortalPreference("owner");
    return <Navigate to="/agenda" replace />;
  }

  // Not authenticated: check preferred portal for PWA re-open (iOS)
  const preferredPortal = getPortalPreference();
  if (preferredPortal === "owner") {
    return <Navigate to="/auth" replace />;
  }
  if (preferredPortal === "client") {
    return <Navigate to="/portal/login" replace />;
  }
  if (preferredPortal === "operator") {
    return <Navigate to="/staff-portal/login" replace />;
  }

  // Not standalone, no preference: show login choice
  const handleChoice = (path: string, portal: string) => {
    setPortalPreference(portal as "owner" | "client" | "operator");
    navigate(path);
  };

  const options = [
    {
      icon: Crown,
      label: t("appRedirect.owner"),
      description: t("appRedirect.ownerDesc"),
      path: "/auth",
      portal: "owner",
    },
    {
      icon: Sparkles,
      label: t("appRedirect.client"),
      description: t("appRedirect.clientDesc"),
      path: "/portal/login",
      portal: "client",
    },
    {
      icon: UserCog,
      label: t("appRedirect.operator"),
      description: t("appRedirect.operatorDesc"),
      path: "/staff-portal/login",
      portal: "operator",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-serif font-semibold text-foreground">
            {t("appRedirect.title")}
          </h1>
          <p className="text-muted-foreground">{t("appRedirect.subtitle")}</p>
        </div>

        <div className="space-y-3">
          {options.map((opt) => (
            <Card
              key={opt.path}
              className="cursor-pointer border-border/50 hover:border-primary/40 transition-colors shadow-sm hover:shadow-md"
              onClick={() => handleChoice(opt.path, opt.portal)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <opt.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{opt.label}</p>
                  <p className="text-sm text-muted-foreground">{opt.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
