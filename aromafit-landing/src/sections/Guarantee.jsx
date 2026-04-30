import { Shield } from "lucide-react";
import { useT } from "../lang/LanguageContext";

export default function Guarantee() {
  const { t } = useT();
  return (
    <section className="py-24 md:py-32">
      <div className="container-narrow">
        <div className="rounded-[2.5rem] bg-cream-100 border border-cream-200/60 p-10 md:p-16 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cream-50 border border-cream-200">
            <Shield size={28} className="text-rosegold" />
          </div>
          <div className="label-eyebrow">{t("guarantee.eyebrow")}</div>
          <h2 className="h-display text-3xl md:text-5xl">
            {t("guarantee.h2.line1")}
            <br />
            <span className="italic text-rosegold">{t("guarantee.h2.line2")}</span>
          </h2>
          <p className="text-lg text-ink-soft max-w-2xl mx-auto leading-relaxed">
            {t("guarantee.body")}
          </p>
          <p className="text-xs text-ink-soft pt-2">{t("guarantee.fineprint")}</p>
        </div>
      </div>
    </section>
  );
}
