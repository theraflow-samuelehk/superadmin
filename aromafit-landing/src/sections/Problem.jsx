import { useT } from "../lang/LanguageContext";

export default function Problem() {
  const { t } = useT();
  return (
    <section className="py-24 md:py-32 bg-ink text-cream-50">
      <div className="container-narrow text-center space-y-7">
        <div className="text-xs uppercase tracking-widest text-rosegold-light">
          {t("problem.eyebrow")}
        </div>
        <h2 className="h-display text-4xl md:text-6xl text-cream-50 leading-tight">
          {t("problem.h2.line1")}
          <br />
          <span className="italic text-rosegold-light">{t("problem.h2.line2")}</span>
        </h2>
        <div className="space-y-5 text-cream-100/85 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
          <p>{t("problem.body1")}</p>
          <p>{t("problem.body2")}</p>
          <p className="font-display text-cream-50 italic text-2xl md:text-3xl pt-2">
            {t("problem.body3")}
          </p>
        </div>
      </div>
    </section>
  );
}
