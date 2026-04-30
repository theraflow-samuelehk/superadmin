import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function LandingNavbar() {
  const { t } = useTranslation();

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-xl border-b border-border/30">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <img src="/icon-512.png" alt="GlowUp" className="h-8 w-8 rounded-lg" />
          <span className="text-xl font-serif font-bold text-foreground">GlowUp</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("landing.navFeatures")}</a>
          <a href="#how" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("landing.navHowItWorks")}</a>
          <a href="#plans" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("landing.navPlans")}</a>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/auth?tab=login">
            <Button variant="outline-hero" size="sm">{t("landing.loginButton")}</Button>
          </Link>
          <Link to="/signup">
            <Button variant="hero" size="sm">{t("landing.tryFree")}</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
