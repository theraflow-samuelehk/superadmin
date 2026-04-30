import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

export function LandingPricing() {
  const { t } = useTranslation();

  const benefits = [
    "Accesso completo a tutte le funzionalità",
    "Supporto dedicato H24 a vita",
    "Modifiche e personalizzazioni gratuite",
  ];

  const pricing = [
    {
      name: "Starter",
      price: "29",
      desc: "Per chi inizia",
      limits: ["100 appuntamenti/mese", "Fino a 2 operatrici"],
    },
    {
      name: "Growth",
      price: "39",
      desc: "Per centri in espansione",
      limits: ["250 appuntamenti/mese", "Fino a 3 operatrici"],
      popular: true,
    },
    {
      name: "Professional",
      price: "59",
      desc: "Per centri estetici in crescita",
      limits: ["Appuntamenti illimitati", "Fino a 5 operatrici"],
    },
    {
      name: "Enterprise",
      price: "99",
      desc: "Per catene e grandi centri",
      limits: ["Appuntamenti illimitati", "Operatrici illimitate"],
    },
  ];

  return (
    <section id="plans" className="px-4">
      <div className="container mx-auto">
        <div className="pt-8 pb-4">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-serif font-bold text-foreground">
                    {t("landing.pricingTitle")}{" "}
                    <span className="text-primary">{t("landing.pricingTitleHighlight")}</span>
                  </h2>
                  <p className="text-muted-foreground mt-3">{t("landing.pricingSubtitle")}</p>
                  <p className="text-sm text-primary font-medium mt-2">{t("landing.pricingTrial")}</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                  {pricing.map((plan) => (
                    <div
                      key={plan.name}
                      className={`p-6 rounded-2xl border h-full flex flex-col ${
                        plan.popular
                          ? "bg-card border-primary shadow-glow relative"
                          : "bg-card border-border/50 shadow-card"
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-gradient-hero text-primary-foreground gap-1 px-4 py-1">
                            <Sparkles className="h-3 w-3" /> {t("landing.mostPopular")}
                          </Badge>
                        </div>
                      )}
                      <h3 className="text-lg font-serif font-semibold text-foreground">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-foreground">€{plan.price}</span>
                        <span className="text-muted-foreground">{t("landing.perMonth")}</span>
                      </div>
                      
                      <div className="mt-4 space-y-1.5">
                        {plan.limits.map((l) => (
                          <p key={l} className="text-sm text-muted-foreground">{l}</p>
                        ))}
                      </div>

                      <ul className="mt-4 space-y-2.5 flex-1 border-t border-border/50 pt-4">
                        {benefits.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Button
                        variant={plan.popular ? "hero" : "outline-hero"}
                        className="mt-6 w-full"
                      >
                        {t("landing.ctaStartNow")}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
      </div>
    </section>
  );
}
