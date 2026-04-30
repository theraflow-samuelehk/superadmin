import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SmartImage from "../components/SmartImage";
import { IMAGES } from "../images";
import { useT } from "../lang/LanguageContext";

export default function FinalCTA() {
  const { t } = useT();
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, #F5F0E8 0%, #FBF8F3 70%)",
        }}
      />
      <div className="container-x grid md:grid-cols-2 gap-16 items-center">
        <div className="rounded-[2.5rem] overflow-hidden bg-cream-100 order-last md:order-first">
          <SmartImage
            src={IMAGES.lifestyleBedside}
            alt="HUSH diffuser on a marble bedside table at golden hour"
            label="Lifestyle — bedside moment"
            className="w-full h-auto"
            imgClassName="object-contain w-full h-auto"
          />
        </div>

        <div className="space-y-8">
          <div className="label-eyebrow">{t("finalcta.eyebrow")}</div>
          <h2 className="h-display text-4xl md:text-6xl leading-tight">
            {t("finalcta.h1.line1")}
            <br />
            <span className="italic text-rosegold">{t("finalcta.h1.line2")}</span>
          </h2>
          <p className="text-lg text-ink-soft max-w-md leading-relaxed">
            {t("finalcta.body")}
          </p>
          <Link to="/hush" className="btn-primary">
            {t("finalcta.cta")} <ArrowRight size={16} />
          </Link>
          <p className="text-xs text-ink-soft">{t("finalcta.subline")}</p>
        </div>
      </div>
    </section>
  );
}
