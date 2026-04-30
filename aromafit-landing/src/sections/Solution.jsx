import SmartImage from "../components/SmartImage";
import { IMAGES } from "../images";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { useT } from "../lang/LanguageContext";

export default function Solution() {
  const { t } = useT();
  return (
    <section className="py-24 md:py-32 bg-cream-100">
      <div className="container-x grid md:grid-cols-2 gap-16 items-center">
        <div className="rounded-[2.5rem] overflow-hidden bg-cream-200">
          <SmartImage
            src={IMAGES.family}
            alt="HUSH family product shot"
            label="Family product shot"
            className="w-full h-auto"
            imgClassName="object-contain w-full h-auto"
          />
        </div>

        <div className="space-y-7">
          <div className="label-eyebrow">{t("solution.eyebrow")}</div>
          <h2 className="h-display text-4xl md:text-5xl leading-tight">
            {t("solution.h2.line1")}
            <br />
            <span className="italic text-rosegold">{t("solution.h2.line2")}</span>
          </h2>
          <p className="text-lg text-ink-soft leading-relaxed">
            {t("solution.body")}
          </p>

          <ul className="space-y-3 pt-2">
            {[
              t("solution.bullet1"),
              t("solution.bullet2"),
              t("solution.bullet3"),
              t("solution.bullet4"),
            ].map((line, i) => (
              <li key={i} className="flex gap-3 items-start">
                <Check size={18} className="text-rosegold mt-1 flex-shrink-0" />
                <span className="text-ink-soft">{line}</span>
              </li>
            ))}
          </ul>

          <Link to="/hush" className="btn-primary mt-2">
            {t("solution.cta")} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
