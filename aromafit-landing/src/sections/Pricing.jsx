import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { useT } from "../lang/LanguageContext";

export default function Pricing() {
  const { t } = useT();
  const plans = [
    {
      name: t("pricing.starter.name"),
      price: "$79",
      crossed: "$99",
      desc: t("pricing.starter.desc"),
      days: t("pricing.starter.days"),
      features: [
        t("pricing.starter.f1"),
        t("pricing.starter.f2"),
        t("pricing.starter.f3"),
        t("pricing.starter.f4"),
      ],
      cta: t("pricing.starter.cta"),
      popular: false,
    },
    {
      name: t("pricing.discovery.name"),
      price: "$89",
      crossed: "$129",
      desc: t("pricing.discovery.desc"),
      days: t("pricing.discovery.days"),
      features: [
        t("pricing.discovery.f1"),
        t("pricing.discovery.f2"),
        t("pricing.discovery.f3"),
        t("pricing.discovery.f4"),
        t("pricing.discovery.f5"),
      ],
      cta: t("pricing.discovery.cta"),
      popular: true,
    },
    {
      name: t("pricing.ritual.name"),
      price: "$99",
      crossed: "$169",
      desc: t("pricing.ritual.desc"),
      days: t("pricing.ritual.days"),
      features: [
        t("pricing.ritual.f1"),
        t("pricing.ritual.f2"),
        t("pricing.ritual.f3"),
        t("pricing.ritual.f4"),
        t("pricing.ritual.f5"),
      ],
      cta: t("pricing.ritual.cta"),
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 md:py-32 bg-cream-100">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="label-eyebrow">{t("pricing.eyebrow")}</div>
          <h2 className="h-display text-4xl md:text-5xl">
            {t("pricing.h2.pre")}{" "}
            <span className="italic text-rosegold">{t("pricing.h2.bold")}</span>
          </h2>
          <p className="text-lg text-ink-soft pt-2">{t("pricing.lead")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <article
              key={p.name}
              className={`relative rounded-3xl p-8 flex flex-col ${
                p.popular
                  ? "bg-ink text-cream-50 shadow-2xl shadow-ink/20 md:scale-105"
                  : "bg-cream-50 text-ink border border-cream-200/60"
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rosegold text-cream-50 text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full">
                  {t("pricing.mostloved")}
                </div>
              )}

              <div className="space-y-2 mb-6">
                <h3 className="font-display text-3xl">{p.name}</h3>
                <p
                  className={`text-sm ${
                    p.popular ? "text-cream-100/70" : "text-ink-soft"
                  }`}
                >
                  {p.desc}
                </p>
                <p
                  className={`text-xs ${
                    p.popular ? "text-rosegold-light" : "text-rosegold"
                  }`}
                >
                  {p.days}
                </p>
              </div>

              <div className="flex items-baseline gap-3 mb-8">
                <span className="font-display text-5xl">{p.price}</span>
                <span
                  className={`text-sm line-through ${
                    p.popular ? "text-cream-100/40" : "text-ink-soft/50"
                  }`}
                >
                  {p.crossed}
                </span>
              </div>

              <ul className="space-y-3 mb-10 flex-1">
                {p.features.map((f, i) => (
                  <li key={i} className="flex gap-3 items-start text-sm">
                    <Check
                      size={16}
                      className={`mt-0.5 ${
                        p.popular ? "text-rosegold-light" : "text-rosegold"
                      }`}
                    />
                    <span
                      className={p.popular ? "text-cream-100/90" : "text-ink-soft"}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to="/hush"
                className={`text-center rounded-full py-4 text-xs uppercase tracking-widest font-medium transition ${
                  p.popular
                    ? "bg-cream-50 text-ink hover:bg-cream-100"
                    : "bg-ink text-cream-50 hover:bg-ink-soft"
                }`}
              >
                {p.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
