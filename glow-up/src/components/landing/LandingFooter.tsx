import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function LandingFooter() {
  const { t } = useTranslation();

  return (
    <footer className="py-10 md:py-16 px-4 border-t border-border/50">
      <div className="container mx-auto">
        {/* Golden divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent mb-10" />

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/icon-512.png" alt="GlowUp" className="h-8 w-8 rounded-lg" />
              <span className="text-lg font-serif font-bold text-foreground">GlowUp</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t("landing.footerDesc")}
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="font-serif font-semibold text-foreground mb-3">{t("landing.footerProduct")}</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("landing.navFeatures")}</a></li>
              <li><a href="#how" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("landing.navHowItWorks")}</a></li>
              <li><a href="#plans" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("landing.pricingTitle")}</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-serif font-semibold text-foreground mb-3">{t("landing.footerSupport")}</h4>
            <ul className="space-y-2">
              <li><a href="mailto:info@glowup.it" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t("landing.footerContact")}</a></li>
              <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/30">
          <div className="text-center space-y-1 text-xs text-muted-foreground">
            <p className="font-semibold text-sm text-foreground">MERCURIUSECOM DI T. C.</p>
            <p>Via Baranello 27, 00131 Roma (RM)</p>
            <p><span className="font-bold text-foreground">P.IVA 17271371001</span> | C.F. CMLTMS94C07D542S</p>
            <p>REA RM-1707656</p>
            <p>PEC: <a href="mailto:mercuriusecom@pec.it" className="hover:text-foreground transition-colors underline">mercuriusecom@pec.it</a></p>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">{t("landing.footerRights")}</p>
        </div>
      </div>
    </footer>
  );
}
