import { Link } from "react-router-dom";
import { ArrowRight, TrendingDown } from "lucide-react";
import SmartImage from "../components/SmartImage";
import Stars from "../components/Stars";
import { IMAGES } from "../images";
import { useT } from "../lang/LanguageContext";

export default function Hero() {
  const { t } = useT();
  return (
    <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at top, #F5F0E8 0%, #FBF8F3 50%, #FBF8F3 100%)",
        }}
      />

      <div className="container-x grid md:grid-cols-2 gap-16 items-center">
        <div className="space-y-7 animate-fade-up">
          <div className="inline-flex items-center gap-2">
            <span className="label-eyebrow">{t("hero.eyebrow")}</span>
            <span className="inline-flex items-center gap-1.5 bg-mint-light/50 text-mint-dark text-[10px] uppercase tracking-widest px-2 py-1 rounded-full font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-mint-dark animate-pulse" />
              {t("hero.lowstock")}
            </span>
          </div>

          <h1 className="h-display text-5xl md:text-6xl lg:text-7xl leading-[1.02]">
            {t("hero.h1.line1")}
            <br />
            {t("hero.h1.line2")}
            <br />
            <span className="italic text-rosegold">{t("hero.h1.line3")}</span>
          </h1>

          <p className="text-lg md:text-xl text-ink leading-snug font-medium max-w-md">
            {t("hero.subhead.pre")}{" "}
            <strong>{t("hero.subhead.bold")}</strong>
            {t("hero.subhead.post")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/hush" className="btn-primary">
              {t("hero.cta.shop")} <ArrowRight size={16} />
            </Link>
            <a href="#science" className="btn-outline">
              {t("hero.cta.science")}
            </a>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Stars />
            <span className="text-sm text-ink-soft">
              <span className="font-medium text-ink">4.8/5</span> · 12,000+{" "}
              {t("hero.rating.suffix")}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 max-w-md">
            {[
              t("hero.badge.snacking"),
              t("hero.badge.lossweight"),
              t("hero.badge.fast"),
            ].map((s, i) => (
              <div
                key={i}
                className="bg-cream-100 rounded-xl p-2.5 flex items-center gap-1.5 text-[11px] text-ink-soft border border-cream-200/60"
              >
                <TrendingDown size={12} className="text-rosegold flex-shrink-0" />
                <span className="font-medium text-ink leading-tight">{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="aspect-[4/5] bg-cream-100 rounded-[3rem] overflow-hidden shadow-2xl shadow-rosegold/10 flex items-center justify-center">
            <SmartImage
              src={IMAGES.hero}
              alt="HUSH diffuser releasing aromatic vapor"
              label="Hero diffuser shot"
              className="w-full h-full"
              imgClassName="object-contain w-full h-full"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 bg-cream-50 rounded-2xl shadow-xl p-5 max-w-[220px] hidden md:block border border-cream-200">
            <div className="font-display text-3xl text-ink leading-none">
              {t("hero.floatcard.title")}
            </div>
            <div className="text-xs uppercase tracking-widest text-rosegold mt-1.5">
              {t("hero.floatcard.label")}
            </div>
            <p className="text-xs text-ink-soft mt-2 leading-relaxed">
              {t("hero.floatcard.body")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
