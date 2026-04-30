import SmartImage from "../components/SmartImage";
import { IMAGES } from "../images";
import { Link } from "react-router-dom";
import { useT } from "../lang/LanguageContext";

export default function Scents() {
  const { t } = useT();
  const scents = [
    {
      name: t("scent.mint.name"),
      color: "#A9C4A8",
      notes: t("scents.mint.notes"),
      moment: t("scents.mint.moment"),
      description: t("scents.mint.desc"),
    },
    {
      name: t("scent.citrus.name"),
      color: "#E8D69A",
      notes: t("scents.citrus.notes"),
      moment: t("scents.citrus.moment"),
      description: t("scents.citrus.desc"),
    },
    {
      name: t("scent.spice.name"),
      color: "#D4A582",
      notes: t("scents.spice.notes"),
      moment: t("scents.spice.moment"),
      description: t("scents.spice.desc"),
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-cream-100">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <div className="label-eyebrow">{t("scents.eyebrow")}</div>
          <h2 className="h-display text-4xl md:text-5xl">
            {t("scents.h2.line1")}
            <br />
            <span className="italic text-rosegold">{t("scents.h2.line2")}</span>
          </h2>
          <p className="text-lg text-ink-soft pt-2">{t("scents.lead")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {scents.map((s, i) => (
            <article
              key={i}
              className="bg-cream-50 rounded-3xl p-8 flex flex-col gap-5 border border-cream-200/70 hover:shadow-xl hover:shadow-rosegold/5 transition"
            >
              <div className="flex items-center justify-between">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: s.color }}
                />
                <span className="text-xs uppercase tracking-widest text-ink-soft">
                  HUSH
                </span>
              </div>

              <div>
                <h3 className="font-display text-3xl">{s.name}</h3>
                <p className="text-xs uppercase tracking-widest text-rosegold mt-1">
                  {s.notes}
                </p>
              </div>

              <p className="text-ink-soft text-sm leading-relaxed flex-1">
                {s.description}
              </p>

              <div className="text-xs text-ink-soft pt-2 border-t border-cream-200/80">
                {t("scents.bestfor")}{" "}
                <span className="text-ink font-medium">{s.moment}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-12 items-center">
          <div className="rounded-[2.5rem] overflow-hidden bg-cream-200">
            <SmartImage
              src={IMAGES.discoveryPack}
              alt="HUSH Discovery Pack with three scents"
              label="HUSH Discovery Pack"
              className="w-full h-auto"
              imgClassName="object-contain w-full h-auto"
            />
          </div>
          <div className="space-y-5">
            <div className="label-eyebrow">{t("scents.discovery.eyebrow")}</div>
            <h3 className="h-display text-3xl md:text-4xl">
              {t("scents.discovery.h3.line1")}
              <br />
              <span className="italic text-rosegold">{t("scents.discovery.h3.line2")}</span>
            </h3>
            <p className="text-ink-soft text-lg">{t("scents.discovery.body")}</p>
            <Link to="/hush" className="btn-primary">
              {t("scents.discovery.cta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
