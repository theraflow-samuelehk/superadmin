import { ExternalLink } from "lucide-react";
import { useT } from "../lang/LanguageContext";

export default function Science() {
  const { t } = useT();

  const studies = [
    {
      tag: t("science.s1.tag"),
      year: "2008",
      author: t("science.s1.author"),
      citation:
        "Raudenbush B. (2008). Effects of peppermint scent on appetite control and caloric intake. Wheeling Jesuit University.",
      finding: t("science.s1.finding"),
      sourceLabel: "PubMed · Raudenbush research",
      sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/?term=raudenbush+B+peppermint",
    },
    {
      tag: t("science.s2.tag"),
      year: "2003",
      author: t("science.s2.author"),
      citation:
        "Niijima A, Nagai K. (2003). Effect of olfactory stimulation with flavor of grapefruit oil on the activity of sympathetic branch in the white adipose tissue of the epididymis. Exp Biol Med, 228(10), 1190-1192.",
      finding: t("science.s2.finding"),
      sourceLabel: "PubMed · PMID 14595132",
      sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/14595132/",
    },
    {
      tag: t("science.s3.tag"),
      year: "1999",
      author: t("science.s3.author"),
      citation:
        "Collins C. (1999). Vanilla aromatic patches for sweet craving control. St. George's Hospital Medical School. Findings reported in BBC News, 4 August 1999.",
      finding: t("science.s3.finding"),
      sourceLabel: "BBC News archive",
      sourceUrl: "http://news.bbc.co.uk/2/hi/health/411493.stm",
    },
  ];

  const moreLinks = [
    {
      label: "NIH · Peppermint Oil overview",
      url: "https://www.nccih.nih.gov/health/peppermint-oil",
    },
    {
      label: "PubMed · Aromatherapy & appetite",
      url: "https://pubmed.ncbi.nlm.nih.gov/?term=aromatherapy+appetite",
    },
    {
      label: "PubMed · Olfaction & food intake",
      url: "https://pubmed.ncbi.nlm.nih.gov/?term=olfaction+food+intake",
    },
  ];

  return (
    <section id="science" className="py-24 md:py-32 bg-ink text-cream-50">
      <div className="container-x">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="text-xs uppercase tracking-widest text-rosegold-light">
            {t("science.eyebrow")}
          </div>
          <h2 className="h-display text-4xl md:text-5xl text-cream-50">
            {t("science.h2.line1")}
            <br />
            <span className="italic text-rosegold-light">
              {t("science.h2.line2")}
            </span>
          </h2>
          <p className="text-lg text-cream-100/80 pt-2">{t("science.lead")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {studies.map((s, i) => (
            <article
              key={i}
              className="bg-cream-50/[0.04] border border-cream-50/15 rounded-3xl p-7 space-y-4 flex flex-col"
            >
              <div>
                <div className="font-display text-4xl text-rosegold-light leading-none">
                  0{i + 1}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-rosegold-light/80 mt-3">
                  {s.tag} · {s.year}
                </div>
                <div className="text-sm text-cream-100/70 mt-1">{s.author}</div>
              </div>
              <p className="text-cream-100/90 text-sm leading-relaxed flex-1">
                {s.finding}
              </p>
              <p className="text-[10px] text-cream-100/50 leading-relaxed border-t border-cream-50/10 pt-4 italic">
                {s.citation}
              </p>
              <a
                href={s.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-xs text-rosegold-light hover:text-cream-50 transition border border-rosegold-light/30 hover:border-rosegold-light/60 rounded-full px-3 py-2 self-start"
              >
                {s.sourceLabel} <ExternalLink size={12} />
              </a>
            </article>
          ))}
        </div>

        <div className="mt-12 max-w-3xl mx-auto bg-rosegold/15 border border-rosegold/30 rounded-3xl p-6 md:p-8">
          <p className="text-cream-50 text-base md:text-lg leading-relaxed">
            <strong>{t("science.closer.bold")}</strong>
            {t("science.closer.body")}
          </p>
        </div>

        {/* Further reading */}
        <div className="mt-10 max-w-3xl mx-auto text-center">
          <div className="text-[10px] uppercase tracking-widest text-cream-100/50 mb-4">
            {t("science.furtherreading")}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {moreLinks.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-xs text-cream-100/70 hover:text-cream-50 transition border border-cream-50/15 hover:border-cream-50/40 rounded-full px-3 py-2"
              >
                {l.label} <ExternalLink size={12} />
              </a>
            ))}
          </div>
        </div>

        <p className="text-xs text-cream-100/40 mt-12 max-w-3xl mx-auto text-center leading-relaxed">
          {t("science.disclaimer")}
        </p>
      </div>
    </section>
  );
}
