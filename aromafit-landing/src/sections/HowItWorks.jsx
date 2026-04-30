import SmartImage from "../components/SmartImage";
import { IMAGES } from "../images";
import { useT } from "../lang/LanguageContext";

export default function HowItWorks() {
  const { t } = useT();
  const steps = [
    { n: "01", title: t("how.step1.title"), body: t("how.step1.body") },
    { n: "02", title: t("how.step2.title"), body: t("how.step2.body") },
    { n: "03", title: t("how.step3.title"), body: t("how.step3.body") },
  ];

  return (
    <section id="how" className="py-24 md:py-32">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <div className="label-eyebrow">{t("how.eyebrow")}</div>
          <h2 className="h-display text-4xl md:text-5xl">
            {t("how.h2.pre")}{" "}
            <span className="italic text-rosegold">{t("how.h2.bold")}</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-center mb-20">
          <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-cream-100 flex items-center justify-center">
            <SmartImage
              src={IMAGES.capsuleInsert}
              alt="Hand inserting a HUSH capsule into the diffuser"
              label="Capsule insertion detail"
              className="w-full h-full"
              imgClassName="object-contain w-full h-full"
            />
          </div>

          <ol className="space-y-10">
            {steps.map((s) => (
              <li key={s.n} className="flex gap-6">
                <div className="font-display text-5xl text-rosegold/70 leading-none">
                  {s.n}
                </div>
                <div>
                  <h3 className="text-2xl font-display mb-2">{s.title}</h3>
                  <p className="text-ink-soft leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
