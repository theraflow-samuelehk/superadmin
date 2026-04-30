import SmartImage from "../components/SmartImage";
import { IMAGES } from "../images";
import { useT } from "../lang/LanguageContext";

export default function Story() {
  const { t } = useT();
  return (
    <section className="py-24 md:py-32">
      <div className="container-x grid md:grid-cols-5 gap-16 items-center">
        <div className="md:col-span-3 space-y-7">
          <div className="label-eyebrow">{t("story.eyebrow")}</div>
          <h2 className="h-display text-4xl md:text-5xl leading-tight">
            {t("story.h2.line1")}
            <br />
            <span className="italic text-rosegold">{t("story.h2.line2")}</span>
          </h2>

          <div className="space-y-5 text-ink-soft text-lg leading-relaxed">
            <p>{t("story.body1")}</p>
            <p>
              {t("story.body2.pre")}{" "}
              <em>{t("story.body2.em")}</em>
              {t("story.body2.post")}
            </p>
            <p>
              {t("story.body3.pre")}{" "}
              <em>{t("story.body3.em")}</em>
            </p>
            <p>
              {t("story.body4.pre")}
              <strong className="text-ink">{t("story.body4.bold")}</strong>
              {t("story.body4.post")}
            </p>
            <p className="text-ink font-medium italic font-display text-2xl">
              {t("story.body5")}
            </p>
          </div>

          <div className="text-xs text-ink-soft/80 pt-2">
            {t("story.attribution")}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="rounded-[2.5rem] overflow-hidden bg-cream-100">
            <SmartImage
              src={IMAGES.lifestyleSofa}
              alt="A woman relaxing on a sofa with a HUSH diffuser nearby"
              label="Lifestyle — sofa moment"
              className="w-full h-auto"
              imgClassName="object-contain w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
