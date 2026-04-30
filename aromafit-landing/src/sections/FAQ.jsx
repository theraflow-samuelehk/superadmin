import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useT } from "../lang/LanguageContext";

function Item({ q, a, open, onClick }) {
  return (
    <div className="border-b border-cream-200/80">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between gap-4 py-6 text-left"
      >
        <span className="font-display text-xl md:text-2xl text-ink">{q}</span>
        <span className="flex-shrink-0 text-rosegold">
          {open ? <Minus size={22} /> : <Plus size={22} />}
        </span>
      </button>
      {open && (
        <p className="pb-6 pr-10 text-ink-soft leading-relaxed text-base md:text-lg">
          {a}
        </p>
      )}
    </div>
  );
}

export default function FAQ() {
  const { t } = useT();
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6") },
    { q: t("faq.q7"), a: t("faq.a7") },
    { q: t("faq.q8"), a: t("faq.a8") },
    { q: t("faq.q9"), a: t("faq.a9") },
  ];

  return (
    <section id="faq" className="py-24 md:py-32 bg-cream-100">
      <div className="container-narrow">
        <div className="text-center mb-16 space-y-4">
          <div className="label-eyebrow">{t("faq.eyebrow")}</div>
          <h2 className="h-display text-4xl md:text-5xl">{t("faq.h2")}</h2>
        </div>
        <div>
          {faqs.map((f, i) => (
            <Item
              key={i}
              q={f.q}
              a={f.a}
              open={openIndex === i}
              onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
