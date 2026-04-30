import { useState, useRef, useEffect } from "react";
import {
  Check,
  Truck,
  Shield,
  Leaf,
  Plus,
  Minus,
  Sparkles,
  Clock,
  ArrowRight,
  Award,
  Zap,
  Sun,
  Coffee,
  Box,
  Ruler,
  Battery,
  Volume2,
  AlertTriangle,
  TrendingDown,
  Flame,
  RefreshCw,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import SmartImage from "../components/SmartImage";
import Stars from "../components/Stars";
import { IMAGES } from "../images";
import { useT } from "../lang/LanguageContext";

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT DATA — translated builders
// ─────────────────────────────────────────────────────────────────────────────
function getScents(t) {
  return [
    {
      id: "mint",
      name: t("scent.mint.name"),
      notes: t("scent.mint.notes"),
      color: "#A9C4A8",
      description: t("scent.mint.desc"),
    },
    {
      id: "citrus",
      name: t("scent.citrus.name"),
      notes: t("scent.citrus.notes"),
      color: "#E8D69A",
      description: t("scent.citrus.desc"),
    },
    {
      id: "spice",
      name: t("scent.spice.name"),
      notes: t("scent.spice.notes"),
      color: "#D4A582",
      description: t("scent.spice.desc"),
    },
  ];
}

function getStarterBundles(t) {
  return [
    {
      id: "starter-1",
      name: t("bundle.starter"),
      desc: t("bundle.diffuserPlus1"),
      price: 79,
      crossed: 99,
      save: t("bundle.save22"),
      perCapsule: "—",
      capsules: 1,
      days: t("bundle.days1"),
    },
    {
      id: "starter-3",
      name: t("bundle.discovery"),
      desc: t("bundle.diffuserPlus3"),
      price: 89,
      crossed: 129,
      save: t("bundle.save31"),
      perCapsule: t("bundle.percapDiscovery"),
      popular: true,
      capsules: 3,
      days: t("bundle.days3"),
    },
    {
      id: "starter-6",
      name: t("bundle.ritual"),
      desc: t("bundle.diffuserPlus6"),
      price: 99,
      crossed: 169,
      save: t("bundle.save41"),
      perCapsule: t("bundle.percapRitual"),
      capsules: 6,
      days: t("bundle.days6"),
    },
  ];
}

function getRefillBundles(t) {
  return [
    {
      id: "refill-1",
      name: t("bundle.single"),
      desc: t("bundle.refill1"),
      price: 9,
      crossed: 14,
      save: t("bundle.save36"),
      perCapsule: "—",
      capsules: 1,
      days: t("bundle.days1"),
    },
    {
      id: "refill-3",
      name: t("bundle.triple"),
      desc: t("bundle.refill3"),
      price: 19,
      crossed: 39,
      save: t("bundle.save51"),
      perCapsule: t("bundle.percapTriple"),
      popular: true,
      capsules: 3,
      days: t("bundle.days3"),
    },
    {
      id: "refill-6",
      name: t("bundle.stash"),
      desc: t("bundle.refill6"),
      price: 29,
      crossed: 69,
      save: t("bundle.save58"),
      perCapsule: t("bundle.percapStash"),
      capsules: 6,
      days: t("bundle.days6"),
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Product() {
  const { t } = useT();
  const [mode, setMode] = useState("starter");
  const [bundleSize, setBundleSize] = useState(3);
  const [selectedScents, setSelectedScents] = useState(["mint", "mint", "mint"]);

  useEffect(() => {
    setSelectedScents((prev) => {
      const next = [];
      for (let i = 0; i < bundleSize; i++) next.push(prev[i] || "mint");
      return next;
    });
  }, [bundleSize]);

  const setScentAt = (idx, scentId) => {
    setSelectedScents((prev) => {
      const next = [...prev];
      next[idx] = scentId;
      return next;
    });
  };

  const currentBundles =
    mode === "starter" ? getStarterBundles(t) : getRefillBundles(t);
  const selectedBundle = currentBundles.find((b) => b.capsules === bundleSize);
  const finalPrice = selectedBundle.price;

  const ctaRef = useRef(null);
  const heroRef = useRef(null);
  const scrollToCheckout = () => {
    ctaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="pt-6 pb-0">
      <ProductHero
        mode={mode}
        setMode={setMode}
        bundleSize={bundleSize}
        setBundleSize={setBundleSize}
        selectedScents={selectedScents}
        setScentAt={setScentAt}
        currentBundles={currentBundles}
        selectedBundle={selectedBundle}
        finalPrice={finalPrice}
        heroRef={heroRef}
      />

      <TwoStarBanner />
      <StatsBar />
      <ScienceLed />
      <ProblemBlock />
      <HowItEnds />
      <ThreeMoments />
      <CapsuleMechanics onCta={scrollToCheckout} />
      <ReviewsGrid />
      <DangerWarning />
      <WhyHushBeats onCta={scrollToCheckout} />
      <UgcGrid />
      <LeakedLab />
      <WhatsInBox />
      <SpecsBlock />
      <QuietScience />
      <FoundersNote />
      <GuaranteeBlock />
      <BuildYourHush
        mode={mode}
        setMode={setMode}
        bundleSize={bundleSize}
        setBundleSize={setBundleSize}
        selectedScents={selectedScents}
        setScentAt={setScentAt}
        currentBundles={currentBundles}
        selectedBundle={selectedBundle}
        finalPrice={finalPrice}
        ctaRef={ctaRef}
      />
      <ProductFAQ />
      <FinalCTA onCta={scrollToCheckout} />

      <StickyAddToCart
        finalPrice={finalPrice}
        selectedBundle={selectedBundle}
        selectedScents={selectedScents}
        heroRef={heroRef}
        onCta={scrollToCheckout}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED — Capsule slot picker
// ─────────────────────────────────────────────────────────────────────────────
function CapsuleSlots({ count, selectedScents, setScentAt }) {
  const { t } = useT();
  const SCENTS = getScents(t);
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, idx) => {
        const current = selectedScents[idx] || "mint";
        return (
          <div
            key={idx}
            className="bg-cream-50 border border-cream-200 rounded-2xl p-3 flex items-center gap-3"
          >
            <div className="flex-shrink-0 text-[10px] uppercase tracking-widest text-ink-soft w-16">
              {t("buybox.capsule")} {idx + 1}
            </div>
            <div className="flex-1 grid grid-cols-3 gap-1.5">
              {SCENTS.map((s) => {
                const active = current === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setScentAt(idx, s.id)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition border ${
                      active
                        ? "bg-ink text-cream-50 border-ink"
                        : "bg-cream-50 text-ink border-cream-200 hover:border-ink/40"
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: s.color }}
                    />
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HERO
// ─────────────────────────────────────────────────────────────────────────────
function ProductHero({
  mode,
  setMode,
  bundleSize,
  setBundleSize,
  selectedScents,
  setScentAt,
  currentBundles,
  selectedBundle,
  finalPrice,
  heroRef,
}) {
  const { t } = useT();
  const SCENTS = getScents(t);
  const galleryImages = [
    { src: IMAGES.hero, label: "HUSH diffuser" },
    { src: IMAGES.family, label: "Full family" },
    { src: IMAGES.capsuleInsert, label: "Capsule insert" },
    { src: IMAGES.lifestyleBedside, label: "On a bedside" },
    { src: IMAGES.lifestyleSofa, label: "In the living room" },
    { src: IMAGES.discoveryPack, label: "Discovery Pack" },
  ];
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <section
      ref={heroRef}
      className="container-x grid lg:grid-cols-2 gap-10 lg:gap-16 pt-4"
    >
      {/* GALLERY */}
      <div className="space-y-3">
        <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-cream-100 flex items-center justify-center">
          <SmartImage
            src={galleryImages[activeIdx].src}
            alt={galleryImages[activeIdx].label}
            label={galleryImages[activeIdx].label}
            className="w-full h-full"
            imgClassName="object-contain w-full h-full"
          />
        </div>
        <div className="grid grid-cols-6 gap-2.5">
          {galleryImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`aspect-square rounded-2xl overflow-hidden bg-cream-100 transition border-2 flex items-center justify-center ${
                activeIdx === i
                  ? "border-ink"
                  : "border-transparent hover:border-ink/30"
              }`}
            >
              <SmartImage
                src={img.src}
                alt={img.label}
                label="·"
                className="w-full h-full"
                imgClassName="object-contain w-full h-full p-1"
              />
            </button>
          ))}
        </div>
      </div>

      {/* DETAILS / BUY BOX */}
      <div className="space-y-6 lg:py-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="label-eyebrow">{t("buybox.eyebrow")}</span>
            <span className="inline-flex items-center gap-1.5 bg-mint-light/50 text-mint-dark text-[10px] uppercase tracking-widest px-2 py-1 rounded-full font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-mint-dark animate-pulse" />
              {t("buybox.lowstock")}
            </span>
          </div>
          <h1 className="h-display text-4xl md:text-[3.4rem] leading-[1.02]">
            {t("buybox.h1.line1")}
            <br />
            {t("buybox.h1.line2")}{" "}
            <span className="italic text-rosegold">{t("buybox.h1.line3")}</span>
          </h1>
          <p className="text-base md:text-lg text-ink leading-snug font-medium">
            {t("buybox.subhead")}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
            <Stars />
            <span className="text-sm text-ink-soft">
              <strong className="text-ink">4.8</strong> · 2,184 reviews
            </span>
            <span className="text-ink-soft/40">·</span>
            <span className="text-sm text-ink-soft">
              <strong className="text-ink">12,000+</strong>{" "}
              {t("buybox.rating.suffix")}
            </span>
          </div>
        </div>

        {/* QUICK BENEFITS */}
        <div className="grid grid-cols-3 gap-2 py-1">
          {[
            { icon: <TrendingDown size={16} />, label: t("buybox.bench.cravings") },
            { icon: <Clock size={16} />, label: t("buybox.bench.fast") },
            { icon: <Sparkles size={16} />, label: t("buybox.bench.clinical") },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-cream-100 rounded-xl p-3 flex items-center gap-2 text-xs text-ink-soft"
            >
              <span className="text-rosegold">{s.icon}</span>
              <span className="font-medium text-ink leading-tight">{s.label}</span>
            </div>
          ))}
        </div>

        {/* MODE TOGGLE */}
        <div>
          <label className="text-xs uppercase tracking-widest text-ink font-medium mb-2.5 block">
            {t("buybox.q1")}
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setMode("starter")}
              className={`rounded-2xl p-4 text-left transition border-2 ${
                mode === "starter"
                  ? "border-ink bg-cream-100"
                  : "border-cream-200 bg-cream-50 hover:border-ink/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-display text-base">
                  {t("buybox.q1.starter.title")}
                </span>
                {mode === "starter" && <Check size={14} className="text-ink" />}
              </div>
              <div className="text-xs text-ink-soft leading-tight">
                {t("buybox.q1.starter.desc")}
              </div>
            </button>
            <button
              onClick={() => setMode("refill")}
              className={`rounded-2xl p-4 text-left transition border-2 ${
                mode === "refill"
                  ? "border-ink bg-cream-100"
                  : "border-cream-200 bg-cream-50 hover:border-ink/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-display text-base">
                  {t("buybox.q1.refill.title")}
                </span>
                {mode === "refill" && <Check size={14} className="text-ink" />}
              </div>
              <div className="text-xs text-ink-soft leading-tight">
                {t("buybox.q1.refill.desc")}
              </div>
            </button>
          </div>
        </div>

        {/* BUNDLE SIZE PICKER */}
        <div>
          <label className="text-xs uppercase tracking-widest text-ink font-medium mb-2.5 block">
            {t("buybox.q2")}
          </label>
          <div className="space-y-2.5">
            {currentBundles.map((b) => (
              <button
                key={b.id}
                onClick={() => setBundleSize(b.capsules)}
                className={`w-full rounded-2xl p-4 text-left transition border-2 flex items-center justify-between ${
                  bundleSize === b.capsules
                    ? "border-ink bg-cream-100"
                    : "border-cream-200 bg-cream-50 hover:border-ink/40"
                } relative`}
              >
                {b.popular && (
                  <span className="absolute -top-2.5 right-4 bg-rosegold text-cream-50 text-[10px] uppercase tracking-widest px-3 py-0.5 rounded-full">
                    {t("bundle.mostloved")}
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <span
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition ${
                      bundleSize === b.capsules
                        ? "border-ink bg-ink"
                        : "border-cream-200"
                    }`}
                  >
                    {bundleSize === b.capsules && (
                      <span className="h-2 w-2 rounded-full bg-cream-50" />
                    )}
                  </span>
                  <div>
                    <div className="font-display text-xl leading-tight">
                      {b.name}
                    </div>
                    <div className="text-xs text-ink-soft">
                      {b.desc} · <span className="text-rosegold">{b.days}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl">${b.price}</div>
                  <div className="text-xs">
                    <span className="line-through text-ink-soft/60 mr-1.5">
                      ${b.crossed}
                    </span>
                    <span className="text-rosegold font-medium">{b.save}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* SCENT PICKER */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs uppercase tracking-widest text-ink font-medium">
              {t("buybox.q3")}
            </label>
            <span className="text-xs text-ink-soft">{t("buybox.q3.helper")}</span>
          </div>
          <CapsuleSlots
            count={bundleSize}
            selectedScents={selectedScents}
            setScentAt={setScentAt}
          />
          <p className="text-[11px] text-ink-soft mt-2.5 leading-relaxed">
            <strong className="text-ink">{t("buybox.scenthint.mint")}</strong>{" "}
            {t("buybox.scenthint.suffix.mint")} ·{" "}
            <strong className="text-ink">{t("buybox.scenthint.citrus")}</strong>{" "}
            {t("buybox.scenthint.suffix.citrus")} ·{" "}
            <strong className="text-ink">{t("buybox.scenthint.spice")}</strong>{" "}
            {t("buybox.scenthint.suffix.spice")}
          </p>
        </div>

        {/* BUY BUTTON */}
        <div className="space-y-2.5 pt-2">
          <button className="btn-primary w-full !py-5 text-base !rounded-2xl">
            {t("buybox.cta")}{finalPrice}
            <ArrowRight size={18} />
          </button>
          <p className="text-xs text-center text-ink-soft">
            {t("buybox.cta.subline")}
          </p>
        </div>

        {/* TRUST ROW */}
        <div className="grid grid-cols-3 gap-3 pt-5 border-t border-cream-200/80">
          {[
            { icon: <Truck size={18} />, label: t("buybox.trust.shipping") },
            { icon: <Shield size={18} />, label: t("buybox.trust.refund") },
            { icon: <Leaf size={18} />, label: t("buybox.trust.plant") },
          ].map((tr, i) => (
            <div key={i} className="text-center">
              <div className="inline-flex text-rosegold mb-1.5">{tr.icon}</div>
              <div className="text-[11px] uppercase tracking-widest text-ink-soft">
                {tr.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TWO-STAR BANNER
// ─────────────────────────────────────────────────────────────────────────────
function TwoStarBanner() {
  const { t } = useT();
  return (
    <section className="mt-20 md:mt-28 bg-cream-100 border-y border-cream-200/70 py-12 md:py-14">
      <div className="container-narrow">
        <div className="bg-cream-50 rounded-3xl p-7 md:p-9 border border-cream-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <Stars count={2} size={18} />
            <span className="text-[10px] uppercase tracking-widest text-ink-soft">
              {t("twostar.location")}
            </span>
          </div>
          <h3 className="font-display text-2xl md:text-3xl text-ink mb-3 italic leading-snug">
            {t("twostar.quote")}
          </h3>
          <p className="text-ink-soft text-sm">{t("twostar.attribution")}</p>
          <div className="mt-6 pt-5 border-t border-cream-200/80 flex items-start gap-3">
            <span className="text-rosegold flex-shrink-0 mt-0.5">★</span>
            <p className="text-sm text-ink leading-relaxed">
              <strong>{t("twostar.note.bold")}</strong>
              {t("twostar.note.body")}
              <em>{t("twostar.note.em")}</em>
              {t("twostar.note.body2")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. STATS BAR
// ─────────────────────────────────────────────────────────────────────────────
function StatsBar() {
  const { t } = useT();
  const stats = [
    { value: "92%", label: t("stats.s1.label") },
    { value: "78%", label: t("stats.s2.label") },
    { value: "−4.1 kg", label: t("stats.s3.label") },
    { value: "12,000+", label: t("stats.s4.label") },
  ];
  return (
    <section className="py-16 md:py-20">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="label-eyebrow">{t("stats.eyebrow")}</div>
          <h2 className="h-display text-3xl md:text-4xl">
            {t("stats.h2.line1")}
            <br />
            <span className="italic text-rosegold">{t("stats.h2.line2")}</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {stats.map((s, i) => (
            <div
              key={i}
              className="bg-cream-100 rounded-2xl p-6 text-center border border-cream-200/60"
            >
              <div className="font-display text-4xl md:text-5xl text-rosegold leading-none mb-2">
                {s.value}
              </div>
              <div className="text-xs md:text-sm text-ink-soft leading-snug">
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-ink-soft/70 text-center mt-6 max-w-2xl mx-auto">
          {t("stats.disclaimer")}
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SCIENCE-LED
// ─────────────────────────────────────────────────────────────────────────────
function ScienceLed() {
  const { t } = useT();
  const studies = [
    {
      tag: t("scienceled.s1.tag"),
      year: "2008",
      author: t("scienceled.s1.author"),
      citation:
        "Raudenbush B. (2008). Effects of peppermint scent on appetite control and caloric intake. Wheeling Jesuit University.",
      finding: t("scienceled.s1.finding"),
      sourceLabel: "PubMed · Raudenbush research",
      sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/?term=raudenbush+B+peppermint",
    },
    {
      tag: t("scienceled.s2.tag"),
      year: "2003",
      author: t("scienceled.s2.author"),
      citation:
        "Niijima A, Nagai K. (2003). Effect of olfactory stimulation with grapefruit oil on the activity of sympathetic branch in white adipose tissue. Exp Biol Med, 228(10), 1190-1192.",
      finding: t("scienceled.s2.finding"),
      sourceLabel: "PubMed · PMID 14595132",
      sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/14595132/",
    },
    {
      tag: t("scienceled.s3.tag"),
      year: "1999",
      author: t("scienceled.s3.author"),
      citation:
        "Collins C. (1999). Vanilla aromatic patches for sweet craving control. St. George's Hospital Medical School. Findings reported in BBC News, 4 August 1999.",
      finding: t("scienceled.s3.finding"),
      sourceLabel: "BBC News archive",
      sourceUrl: "http://news.bbc.co.uk/2/hi/health/411493.stm",
    },
  ];

  const moreLinks = [
    { label: "NIH · Peppermint Oil", url: "https://www.nccih.nih.gov/health/peppermint-oil" },
    { label: "PubMed · Aromatherapy & appetite", url: "https://pubmed.ncbi.nlm.nih.gov/?term=aromatherapy+appetite" },
    { label: "PubMed · Olfaction & food intake", url: "https://pubmed.ncbi.nlm.nih.gov/?term=olfaction+food+intake" },
  ];

  return (
    <section className="py-20 md:py-28 bg-ink text-cream-50">
      <div className="container-x">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="text-xs uppercase tracking-widest text-rosegold-light">
            {t("scienceled.eyebrow")}
          </div>
          <h2 className="h-display text-3xl md:text-5xl text-cream-50 leading-tight">
            {t("scienceled.h2.line1")}
            <br />
            <span className="italic text-rosegold-light">
              {t("scienceled.h2.line2")}
            </span>
          </h2>
          <p className="text-cream-100/80 text-lg pt-3 max-w-2xl mx-auto leading-relaxed">
            {t("scienceled.lead")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {studies.map((s, i) => (
            <article
              key={i}
              className="bg-cream-50/[0.04] border border-cream-50/15 rounded-3xl p-6 space-y-4 flex flex-col"
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
              <p className="text-[10px] text-cream-100/50 leading-relaxed border-t border-cream-50/10 pt-3 italic">
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
            <strong>{t("scienceled.closer.bold")}</strong>
            {t("scienceled.closer.body")}
          </p>
        </div>

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

        <p className="text-[11px] text-cream-100/40 text-center mt-10 max-w-3xl mx-auto leading-relaxed">
          {t("scienceled.disclaimer")}
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. PROBLEM
// ─────────────────────────────────────────────────────────────────────────────
function ProblemBlock() {
  const { t } = useT();
  return (
    <section className="py-20 md:py-28 bg-ink text-cream-50">
      <div className="container-narrow text-center space-y-7">
        <div className="text-xs uppercase tracking-widest text-rosegold-light">
          {t("pproblem.eyebrow")}
        </div>
        <h2 className="h-display text-3xl md:text-5xl text-cream-50 leading-tight">
          {t("pproblem.h2.line1")}
          <br />
          <span className="italic text-rosegold-light">
            {t("pproblem.h2.line2")}
          </span>
        </h2>
        <div className="space-y-5 text-cream-100/85 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
          <p>{t("pproblem.body1")}</p>
          <p>
            {t("pproblem.body2")}
            <em>{t("pproblem.body2.em")}</em>
            {t("pproblem.body2.post")}
          </p>
          <p className="font-display text-cream-50 italic text-2xl md:text-3xl pt-2">
            {t("pproblem.body3")}
          </p>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. HOW IT ENDS
// ─────────────────────────────────────────────────────────────────────────────
function HowItEnds() {
  const { t } = useT();
  const steps = [
    { n: "01", title: t("ends.s1.title"), body: t("ends.s1.body") },
    { n: "02", title: t("ends.s2.title"), body: t("ends.s2.body") },
    { n: "03", title: t("ends.s3.title"), body: t("ends.s3.body") },
  ];

  return (
    <section className="py-20 md:py-28 bg-cream-100">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="label-eyebrow">{t("ends.eyebrow")}</div>
          <h2 className="h-display text-3xl md:text-5xl">
            {t("ends.h2.pre")}{" "}
            <span className="italic text-rosegold">{t("ends.h2.bold")}</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-cream-200 flex items-center justify-center">
            <SmartImage
              src={IMAGES.capsuleInsert}
              alt="Hand inserting a HUSH capsule"
              label="Capsule insert"
              className="w-full h-full"
              imgClassName="object-contain w-full h-full"
            />
          </div>
          <ol className="space-y-9">
            {steps.map((s) => (
              <li key={s.n} className="flex gap-5">
                <div className="font-display text-5xl text-rosegold/70 leading-none flex-shrink-0">
                  {s.n}
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-display mb-2 text-ink">
                    {s.title}
                  </h3>
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

// ─────────────────────────────────────────────────────────────────────────────
// 7. THREE MOMENTS
// ─────────────────────────────────────────────────────────────────────────────
function ThreeMoments() {
  const { t } = useT();
  const moments = [
    {
      icon: <Sun size={24} />,
      time: t("moments.morning.time"),
      title: t("moments.morning.title"),
      body: t("moments.morning.body"),
    },
    {
      icon: <Coffee size={24} />,
      time: t("moments.afternoon.time"),
      title: t("moments.afternoon.title"),
      body: t("moments.afternoon.body"),
    },
    {
      icon: <Flame size={24} />,
      time: t("moments.evening.time"),
      title: t("moments.evening.title"),
      body: t("moments.evening.body"),
    },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="label-eyebrow">{t("moments.eyebrow")}</div>
          <h2 className="h-display text-3xl md:text-5xl leading-tight">
            {t("moments.h2.line1")}
            <br />
            <span className="italic text-rosegold">{t("moments.h2.line2")}</span>
          </h2>
          <p className="text-lg text-ink-soft pt-2 max-w-xl mx-auto">
            {t("moments.lead")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {moments.map((m, i) => (
            <article
              key={i}
              className="bg-cream-50 rounded-3xl p-7 border border-cream-200/60 space-y-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-rosegold">{m.icon}</span>
                <span className="text-xs uppercase tracking-widest text-rosegold font-medium">
                  {m.time}
                </span>
              </div>
              <h3 className="font-display text-2xl text-ink leading-tight">
                {m.title}
              </h3>
              <p className="text-ink-soft text-sm md:text-base leading-relaxed">
                {m.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. CAPSULE MECHANICS
// ─────────────────────────────────────────────────────────────────────────────
function CapsuleMechanics({ onCta }) {
  const { t } = useT();
  return (
    <section className="py-20 md:py-28 bg-cream-100">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="label-eyebrow">{t("mech.eyebrow")}</div>
          <h2 className="h-display text-3xl md:text-5xl">
            {t("mech.h2.line1")}
            <br />
            <span className="italic text-rosegold">{t("mech.h2.line2")}</span>
          </h2>
        </div>

        <div className="max-w-5xl mx-auto bg-cream-50 rounded-3xl p-8 md:p-10 border border-cream-200/60">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="font-display text-5xl text-rosegold leading-none mb-2">
                30
              </div>
              <div className="text-sm text-ink-soft">{t("mech.label1")}</div>
            </div>
            <div className="text-center">
              <div className="font-display text-5xl text-rosegold leading-none mb-2">
                25 min
              </div>
              <div className="text-sm text-ink-soft">{t("mech.label2")}</div>
            </div>
            <div className="text-center">
              <div className="font-display text-5xl text-rosegold leading-none mb-2">
                1–3
              </div>
              <div className="text-sm text-ink-soft">{t("mech.label3")}</div>
            </div>
          </div>

          <div className="border-t border-cream-200 pt-7 space-y-3">
            <div className="text-xs uppercase tracking-widest text-ink font-medium mb-3">
              {t("mech.tableTitle")}
            </div>
            {[
              { mode: t("mech.row1.mode"), time: t("mech.row1.time"), duration: t("mech.row1.duration") },
              { mode: t("mech.row2.mode"), time: t("mech.row2.time"), duration: t("mech.row2.duration") },
              { mode: t("mech.row3.mode"), time: t("mech.row3.time"), duration: t("mech.row3.duration") },
            ].map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 py-3 border-b border-cream-200/60 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg text-ink">{row.mode}</span>
                  <span className="text-xs text-ink-soft hidden md:inline">
                    · {row.time}
                  </span>
                </div>
                <span className="font-display text-lg text-rosegold">
                  {row.duration}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-cream-100 rounded-2xl p-5 flex items-start gap-3">
            <Sparkles size={18} className="text-rosegold mt-0.5 flex-shrink-0" />
            <p className="text-sm text-ink-soft leading-relaxed">
              <strong className="text-ink">{t("mech.popular.bold")}</strong>
              {t("mech.popular.body")}
            </p>
          </div>

          <div className="mt-7 text-center">
            <button onClick={onCta} className="btn-primary">
              {t("mech.cta")} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. REVIEWS GRID
// ─────────────────────────────────────────────────────────────────────────────
const PRODUCT_REVIEWS = [
  { name: "Rachel K.", loc: "Phoenix, AZ", stars: 5, title: "Down 4 kg in 3 weeks. Without trying.", body: "I bought it laughing — 'a diffuser?' Three weeks later my jeans fit. I didn't change anything else.", date: "Mar 12, 2026", scent: "Mint" },
  { name: "Sarah M.", loc: "Austin, TX", stars: 5, title: "I quit my 9 PM kitchen ritual.", body: "Two weeks in, my partner asked if I'd stopped eating after dinner. I hadn't even noticed. Down 1.8 kg without dieting.", date: "Feb 28, 2026", scent: "Spice" },
  { name: "Maria L.", loc: "Columbus, OH", stars: 5, title: "My jeans button without the jump.", body: "Three months in, my Spice capsule is gone — and so are the afternoon cookies. Calmer brain. Same me.", date: "Mar 03, 2026", scent: "Spice" },
  { name: "Brad S.", loc: "Reno, NV", stars: 5, title: "My wife stopped asking for ice cream runs.", body: "She lit it on a Tuesday. By Friday the requests had vanished. Either coincidence or witchcraft.", date: "Feb 14, 2026", scent: "Mint" },
  { name: "Janine T.", loc: "Boston, MA", stars: 5, title: "Cheaper than a personal trainer.", body: "Tried 4 diet apps. Tried 3 weight-loss supplements. None survived past week 2. HUSH has been on my desk for 4 months.", date: "Jan 21, 2026", scent: "Citrus" },
  { name: "Giada L.", loc: "Los Angeles, CA", stars: 2, title: "Works too well — careful.", body: "Took the joy out of my favorite midnight snack. I don't crave it anymore. 2 stars because I miss the chaos.", date: "Mar 05, 2026", scent: "Spice" },
  { name: "Marcus J.", loc: "Atlanta, GA", stars: 5, title: "Bought it for my partner. Now I steal it.", body: "She lit it on a Tuesday and the kitchen got quiet. Three weeks later, I asked if I could move it to my office.", date: "Feb 09, 2026", scent: "Mint" },
  { name: "Ellie T.", loc: "Brooklyn, NY", stars: 5, title: "Seven nights changed my evenings.", body: "I tried fasting, apps, the whole thing. A friend sent me HUSH with one line: 'try it anyway.' Night seven, I realized I hadn't gone to the pantry all week.", date: "Feb 02, 2026", scent: "Mint" },
  { name: "Danielle R.", loc: "Seattle, WA", stars: 5, title: "It made it easier to slow down.", body: "I'm not a wellness person. But pressing one button after dinner became my whole routine. Three months in, my Spice capsule is gone.", date: "Jan 30, 2026", scent: "Spice" },
  { name: "Emily H.", loc: "Denver, CO", stars: 5, title: "Down a dress size in 6 weeks.", body: "I didn't believe the reviews. I do now. The afternoon snacking just... stopped. Citrus is my favorite.", date: "Mar 18, 2026", scent: "Citrus" },
  { name: "Carlos M.", loc: "Miami, FL", stars: 4, title: "Helps. Not magic. Helps.", body: "It's not a miracle, but it genuinely changed my evening habits. Down 1.5 kg in a month with zero other changes. Honest 4 stars.", date: "Feb 22, 2026", scent: "Mint" },
  { name: "Lauren P.", loc: "Nashville, TN", stars: 5, title: "I sleep better and I eat less.", body: "Spice capsule before bed. The sweet cravings disappeared and I started sleeping deeper. Two birds, one button.", date: "Mar 11, 2026", scent: "Spice" },
  { name: "Tyler W.", loc: "Chicago, IL", stars: 5, title: "Saved my late-night work hours.", body: "I work from 8 PM to midnight on big projects. Used to graze constantly. HUSH on the desk + Citrus = focused, no snacking.", date: "Feb 17, 2026", scent: "Citrus" },
  { name: "Heather B.", loc: "Portland, OR", stars: 4, title: "Took 2 weeks but it clicked.", body: "First week I thought it was just a nice smell. Week two something shifted — I stopped reaching for chocolate after lunch. Down 1 kg.", date: "Feb 24, 2026", scent: "Citrus" },
  { name: "James K.", loc: "Dallas, TX", stars: 5, title: "−2.7 kg in 5 weeks. No effort.", body: "Not exaggerating. I didn't change my diet. I didn't start working out. My wife noticed before I did. Mint, daily, after dinner.", date: "Mar 07, 2026", scent: "Mint" },
  { name: "Priya S.", loc: "San Francisco, CA", stars: 5, title: "The only wellness gadget I actually use.", body: "I have a graveyard of abandoned wellness products. HUSH is the only one still on my nightstand four months later.", date: "Jan 12, 2026", scent: "Mint" },
  { name: "Megan R.", loc: "Minneapolis, MN", stars: 5, title: "Replaced my evening ice cream habit.", body: "Every single night, ice cream. Couldn't stop. HUSH on, ice cream off. Three weeks in and I haven't even thought about it.", date: "Feb 19, 2026", scent: "Spice" },
  { name: "Nicole V.", loc: "Tampa, FL", stars: 5, title: "Three months in, still in love.", body: "I keep waiting for it to stop working. It hasn't. Down 3.5 kg, calmer evenings, no rebound. The Discovery Pack was worth every cent.", date: "Jan 06, 2026", scent: "Mint" },
];

function ReviewsGrid() {
  const { t } = useT();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? PRODUCT_REVIEWS : PRODUCT_REVIEWS.slice(0, 9);

  return (
    <section className="py-20 md:py-28">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-2">
            <div className="label-eyebrow">{t("previews.eyebrow")}</div>
            <h2 className="h-display text-3xl md:text-4xl leading-tight">
              {t("previews.h2.pre")}{" "}
              <span className="italic text-rosegold">{t("previews.h2.bold")}</span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Stars size={18} />
            <span className="text-sm text-ink-soft">
              <strong className="text-ink">4.8 / 5</strong>{" "}
              {t("previews.rating.label")}
            </span>
          </div>
        </div>

        {/* Stars distribution */}
        <div className="max-w-2xl mx-auto mb-10 bg-cream-100 rounded-2xl p-5 border border-cream-200/60">
          {[
            { stars: 5, pct: 84, count: 1834 },
            { stars: 4, pct: 11, count: 240 },
            { stars: 3, pct: 3, count: 65 },
            { stars: 2, pct: 1, count: 23 },
            { stars: 1, pct: 1, count: 22 },
          ].map((row) => (
            <div key={row.stars} className="flex items-center gap-3 py-1">
              <div className="flex-shrink-0 w-12 text-xs text-ink-soft">
                {row.stars} <span className="text-rosegold">★</span>
              </div>
              <div className="flex-1 h-2 bg-cream-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rosegold rounded-full"
                  style={{ width: `${row.pct}%` }}
                />
              </div>
              <div className="flex-shrink-0 w-16 text-right text-xs text-ink-soft">
                {row.count}
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((r, i) => (
            <article
              key={i}
              className={`rounded-3xl p-6 border ${
                r.stars < 4
                  ? "bg-cream-100 border-cream-200"
                  : "bg-cream-50 border-cream-200/60"
              } space-y-3`}
            >
              <div className="flex items-center justify-between">
                <Stars count={r.stars} size={14} />
                <span className="text-[10px] uppercase tracking-widest text-ink-soft">
                  {r.date}
                </span>
              </div>
              <h3 className="font-display text-lg text-ink leading-snug">
                "{r.title}"
              </h3>
              <p className="text-ink-soft text-sm leading-relaxed">{r.body}</p>
              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-cream-200/80">
                <div className="text-ink-soft">
                  <span className="font-medium text-ink">{r.name}</span> · {r.loc}
                </div>
                <span className="text-rosegold font-medium">HUSH {r.scent}</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-rosegold">
                ✓ {t("previews.verified")}
              </div>
            </article>
          ))}
        </div>

        {PRODUCT_REVIEWS.length > 9 && (
          <div className="text-center mt-10">
            <button
              onClick={() => setExpanded(!expanded)}
              className="btn-outline"
            >
              {expanded ? t("previews.showless") : t("previews.showmore")}
              <ChevronDown
                size={16}
                className={`transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        )}

        <p className="text-[11px] text-ink-soft/70 text-center mt-8 max-w-2xl mx-auto">
          {t("previews.disclaimer")}
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. DANGER WARNING
// ─────────────────────────────────────────────────────────────────────────────
function DangerWarning() {
  const { t } = useT();
  return (
    <section className="py-16 md:py-20 bg-cream-100">
      <div className="container-narrow">
        <div className="bg-cream-50 rounded-3xl p-7 md:p-10 border-2 border-rosegold/40 shadow-md">
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-rosegold/10 flex items-center justify-center">
              <AlertTriangle size={22} className="text-rosegold" />
            </div>
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-widest text-rosegold font-medium">
                {t("danger.eyebrow")}
              </div>
              <h3 className="font-display text-2xl md:text-3xl text-ink leading-snug">
                {t("danger.h3.pre")}{" "}
                <em className="text-rosegold">{t("danger.h3.em")}</em>
                {t("danger.h3.post")}
              </h3>
              <p className="text-ink-soft leading-relaxed">{t("danger.body")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. WHY HUSH BEATS DIETS
// ─────────────────────────────────────────────────────────────────────────────
function WhyHushBeats({ onCta }) {
  const { t } = useT();
  const rows = [
    { feature: t("vs.row1"), diet: true, supp: false, hush: false },
    { feature: t("vs.row2"), diet: true, supp: false, hush: false },
    { feature: t("vs.row3"), diet: false, supp: true, hush: false },
    { feature: t("vs.row4"), diet: false, supp: true, hush: false },
    { feature: t("vs.row5"), diet: true, supp: true, hush: false },
    { feature: t("vs.row6"), diet: false, supp: false, hush: true },
    { feature: t("vs.row7"), diet: false, supp: false, hush: true },
    { feature: t("vs.row8"), diet: false, supp: false, hush: true },
    { feature: t("vs.row9"), diet: false, supp: false, hush: true },
  ];

  const Cell = ({ on }) =>
    on ? (
      <span className="text-rosegold">×</span>
    ) : (
      <span className="text-ink-soft/30">·</span>
    );
  const HushCell = ({ on }) =>
    on ? (
      <Check size={16} className="text-rosegold-light inline" />
    ) : (
      <span className="text-cream-100/30">·</span>
    );

  return (
    <section className="py-20 md:py-28">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="label-eyebrow">{t("vs.eyebrow")}</div>
          <h2 className="h-display text-3xl md:text-5xl leading-tight">
            {t("vs.h2.line1")}
            <br />
            <span className="italic text-rosegold">{t("vs.h2.line2")}</span>
          </h2>
          <p className="text-lg text-ink-soft pt-2">{t("vs.lead")}</p>
        </div>

        <div className="max-w-4xl mx-auto bg-cream-100 rounded-3xl border border-cream-200/60 overflow-hidden">
          <div className="grid grid-cols-[1.7fr_1fr_1fr_1fr] text-[11px] md:text-xs uppercase tracking-widest font-medium border-b border-cream-200">
            <div className="p-4 text-ink-soft">&nbsp;</div>
            <div className="p-4 text-ink-soft text-center">{t("vs.col.diet")}</div>
            <div className="p-4 text-ink-soft text-center">{t("vs.col.supp")}</div>
            <div className="p-4 text-cream-50 bg-ink text-center">
              {t("vs.col.hush")}
            </div>
          </div>
          {rows.map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-[1.7fr_1fr_1fr_1fr] text-sm border-b border-cream-200/60 last:border-0"
            >
              <div className="p-4 text-ink-soft">{r.feature}</div>
              <div className="p-4 text-center text-lg">
                <Cell on={r.diet} />
              </div>
              <div className="p-4 text-center text-lg">
                <Cell on={r.supp} />
              </div>
              <div className="p-4 text-center text-lg bg-ink/95">
                <HushCell on={r.hush} />
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button onClick={onCta} className="btn-primary">
            {t("vs.cta")} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. UGC GRID
// ─────────────────────────────────────────────────────────────────────────────
function UgcGrid() {
  const { t } = useT();
  const photos = [
    { src: IMAGES.ugc1, label: "@sarahm — Austin, TX", caption: t("ugc.cap.1") },
    { src: IMAGES.ugc2, label: "@bradnreno — Reno, NV", caption: t("ugc.cap.2") },
    { src: IMAGES.ugc3, label: "@danielleseattle — Seattle, WA", caption: t("ugc.cap.3") },
    { src: IMAGES.ugc4, label: "@_marcusj — Atlanta, GA", caption: t("ugc.cap.4") },
    { src: IMAGES.ugc5, label: "@hellomaria_ — Columbus, OH", caption: t("ugc.cap.5") },
    { src: IMAGES.ugc6, label: "@ellie.tk — Brooklyn, NY", caption: t("ugc.cap.6") },
  ];

  return (
    <section className="py-20 md:py-28 bg-cream-100">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-3">
            <div className="label-eyebrow">{t("ugc.eyebrow")}</div>
            <h2 className="h-display text-3xl md:text-5xl leading-tight">
              {t("ugc.h2.line1")}
              <br />
              <span className="italic text-rosegold">{t("ugc.h2.line2")}</span>
            </h2>
          </div>
          <p className="text-ink-soft md:max-w-xs">
            {t("ugc.lead.pre")}{" "}
            <span className="text-ink font-medium">{t("ugc.lead.handle")}</span>{" "}
            {t("ugc.lead.post")}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {photos.map((p, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-square rounded-2xl overflow-hidden bg-cream-50 flex items-center justify-center">
                <SmartImage
                  src={p.src}
                  alt={p.label}
                  label="UGC photo"
                  className="w-full h-full"
                  imgClassName="object-cover w-full h-full"
                />
              </div>
              <div className="px-1">
                <div className="text-[11px] text-ink font-medium truncate">
                  {p.label}
                </div>
                <div className="text-[11px] text-ink-soft truncate">{p.caption}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. LEAKED LAB
// ─────────────────────────────────────────────────────────────────────────────
function LeakedLab() {
  const { t } = useT();
  const compounds = [
    { name: t("lab.b1.name"), desc: t("lab.b1.desc") },
    { name: t("lab.b2.name"), desc: t("lab.b2.desc") },
    { name: t("lab.b3.name"), desc: t("lab.b3.desc") },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="label-eyebrow">{t("lab.eyebrow")}</div>
          <h2 className="h-display text-3xl md:text-5xl leading-tight">
            {t("lab.h2.line1")}
            <br />
            <span className="italic text-rosegold">{t("lab.h2.line2")}</span>
          </h2>
          <p className="text-lg text-ink-soft pt-2 max-w-xl mx-auto">
            {t("lab.lead")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {compounds.map((c, i) => (
            <article
              key={i}
              className="bg-cream-100 rounded-3xl p-7 border border-cream-200/60 space-y-3"
            >
              <div className="text-xs uppercase tracking-widest text-rosegold font-medium">
                {t("lab.blend.label")} {i + 1}
              </div>
              <h3 className="font-display text-2xl text-ink leading-tight">
                {c.name}
              </h3>
              <p className="text-ink-soft text-sm leading-relaxed">{c.desc}</p>
            </article>
          ))}
        </div>

        <p className="text-[11px] text-ink-soft/70 text-center mt-8 max-w-2xl mx-auto">
          {t("lab.disclaimer")}
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. WHAT'S IN THE BOX
// ─────────────────────────────────────────────────────────────────────────────
function WhatsInBox() {
  const { t } = useT();
  const items = [
    { icon: <Box size={18} />, label: t("box.item1") },
    { icon: <Sparkles size={18} />, label: t("box.item2") },
    { icon: <Zap size={18} />, label: t("box.item3") },
    { icon: <Coffee size={18} />, label: t("box.item4") },
    { icon: <Sparkles size={18} />, label: t("box.item5") },
    { icon: <Shield size={18} />, label: t("box.item6") },
  ];

  return (
    <section className="py-20 md:py-28 bg-cream-100">
      <div className="container-x grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-cream-50 flex items-center justify-center">
          <SmartImage
            src={IMAGES.whatsInBox}
            alt="What's in the box — flat lay"
            label="What's in the box"
            className="w-full h-full"
            imgClassName="object-contain w-full h-full"
          />
        </div>

        <div className="space-y-6">
          <div className="label-eyebrow">{t("box.eyebrow")}</div>
          <h2 className="h-display text-3xl md:text-5xl leading-tight">
            {t("box.h2.line1")}
            <br />
            <span className="italic text-rosegold">{t("box.h2.line2")}</span>
          </h2>
          <p className="text-lg text-ink-soft leading-relaxed">{t("box.lead")}</p>
          <ul className="grid sm:grid-cols-2 gap-3 pt-2">
            {items.map((it, i) => (
              <li
                key={i}
                className="flex gap-3 items-center bg-cream-50 rounded-2xl p-3.5 border border-cream-200/70"
              >
                <span className="text-rosegold flex-shrink-0">{it.icon}</span>
                <span className="text-sm text-ink">{it.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. SPECS
// ─────────────────────────────────────────────────────────────────────────────
function SpecsBlock() {
  const { t } = useT();
  const specs = [
    { icon: <Ruler size={20} />, label: t("specs.l1"), value: t("specs.v1") },
    { icon: <Box size={20} />, label: t("specs.l2"), value: t("specs.v2") },
    { icon: <Battery size={20} />, label: t("specs.l3"), value: t("specs.v3") },
    { icon: <Volume2 size={20} />, label: t("specs.l4"), value: t("specs.v4") },
    { icon: <Clock size={20} />, label: t("specs.l5"), value: t("specs.v5") },
    { icon: <RefreshCw size={20} />, label: t("specs.l6"), value: t("specs.v6") },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="label-eyebrow">{t("specs.eyebrow")}</div>
          <h2 className="h-display text-3xl md:text-5xl">
            {t("specs.h2.pre")}{" "}
            <span className="italic text-rosegold">{t("specs.h2.bold")}</span>
            {t("specs.h2.post")}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-4xl mx-auto">
          {specs.map((s, i) => (
            <div
              key={i}
              className="bg-cream-100 rounded-2xl p-5 border border-cream-200/60 space-y-2"
            >
              <div className="text-rosegold">{s.icon}</div>
              <div className="text-[10px] uppercase tracking-widest text-ink-soft">
                {s.label}
              </div>
              <div className="font-display text-xl text-ink leading-tight">
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. QUIET SCIENCE
// ─────────────────────────────────────────────────────────────────────────────
function QuietScience() {
  const { t } = useT();
  return (
    <section id="science" className="py-20 md:py-28 bg-ink text-cream-50">
      <div className="container-narrow">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="text-xs uppercase tracking-widest text-rosegold-light">
            {t("qs.eyebrow")}
          </div>
          <h2 className="h-display text-3xl md:text-5xl text-cream-50 leading-tight">
            {t("qs.h2.line1")}
            <br />
            <span className="italic text-rosegold-light">{t("qs.h2.line2")}</span>
          </h2>
        </div>

        <div className="space-y-7 text-cream-100/85 leading-relaxed text-base md:text-lg">
          <p>
            <strong className="text-cream-50">{t("qs.s1.bold")}</strong>
            {t("qs.s1.body")}
          </p>
          <p>
            <strong className="text-cream-50">{t("qs.s2.bold")}</strong>
            {t("qs.s2.body")}
          </p>
          <p>
            <strong className="text-cream-50">{t("qs.s3.bold")}</strong>
            {t("qs.s3.body")}
          </p>
          <p className="font-display italic text-2xl md:text-3xl text-cream-50 pt-3 leading-snug">
            {t("qs.closer.line1")}
            <br />
            {t("qs.closer.line2")}
          </p>
        </div>

        <p className="text-xs text-cream-100/40 mt-12 text-center leading-relaxed">
          {t("qs.disclaimer")}
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. FOUNDER'S NOTE
// ─────────────────────────────────────────────────────────────────────────────
function FoundersNote() {
  const { t } = useT();
  return (
    <section className="py-20 md:py-28">
      <div className="container-x grid md:grid-cols-5 gap-12 items-center">
        <div className="md:col-span-2">
          <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-cream-100 flex items-center justify-center">
            <SmartImage
              src={IMAGES.founder}
              alt="The founder of HUSH"
              label="Founder portrait"
              className="w-full h-full"
              imgClassName="object-cover w-full h-full"
            />
          </div>
        </div>
        <div className="md:col-span-3 space-y-6">
          <div className="label-eyebrow">{t("founder.eyebrow")}</div>
          <h2 className="h-display text-3xl md:text-5xl leading-tight">
            {t("founder.h2.line1")}
            <br />
            <span className="italic text-rosegold">{t("founder.h2.line2")}</span>
          </h2>
          <div className="space-y-4 text-ink-soft text-base md:text-lg leading-relaxed">
            <p>{t("founder.body1")}</p>
            <p>{t("founder.body2")}</p>
            <p>{t("founder.body3")}</p>
          </div>
          <div className="pt-2 flex items-center gap-3">
            <span className="font-display text-xl italic text-ink">
              {t("founder.signature")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 18. GUARANTEE
// ─────────────────────────────────────────────────────────────────────────────
function GuaranteeBlock() {
  const { t } = useT();
  return (
    <section className="py-20 md:py-28 bg-cream-100">
      <div className="container-narrow">
        <div className="rounded-[2.5rem] bg-cream-50 border border-cream-200/60 p-8 md:p-14 text-center space-y-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cream-100 border border-cream-200">
            <Shield size={28} className="text-rosegold" />
          </div>
          <div className="label-eyebrow">{t("pguarantee.eyebrow")}</div>
          <h2 className="h-display text-3xl md:text-5xl leading-tight">
            {t("pguarantee.h2.line1")}
            <br />
            <span className="italic text-rosegold">{t("pguarantee.h2.line2")}</span>
          </h2>
          <p className="text-lg text-ink-soft max-w-2xl mx-auto leading-relaxed">
            {t("pguarantee.body")}
          </p>
          <p className="text-xs text-ink-soft pt-2">{t("pguarantee.fineprint")}</p>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 19. BUILD YOUR HUSH
// ─────────────────────────────────────────────────────────────────────────────
function BuildYourHush({
  mode,
  setMode,
  bundleSize,
  setBundleSize,
  selectedScents,
  setScentAt,
  currentBundles,
  selectedBundle,
  finalPrice,
  ctaRef,
}) {
  const { t } = useT();
  return (
    <section
      ref={ctaRef}
      id="build"
      className="py-20 md:py-28 bg-cream-100 scroll-mt-20"
    >
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="label-eyebrow">{t("build.eyebrow")}</div>
          <h2 className="h-display text-3xl md:text-5xl">
            {t("build.h2.line1")}
            <br />
            <span className="italic text-rosegold">{t("build.h2.line2")}</span>
          </h2>
          <p className="text-lg text-ink-soft pt-2">{t("build.lead")}</p>
        </div>

        {/* MODE TABS */}
        <div className="max-w-md mx-auto mb-8">
          <div className="grid grid-cols-2 gap-2.5 bg-cream-50 p-1.5 rounded-2xl border border-cream-200">
            <button
              onClick={() => setMode("starter")}
              className={`rounded-xl py-3 text-sm font-medium transition ${
                mode === "starter"
                  ? "bg-ink text-cream-50"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {t("build.tab.starter")}
            </button>
            <button
              onClick={() => setMode("refill")}
              className={`rounded-xl py-3 text-sm font-medium transition ${
                mode === "refill"
                  ? "bg-ink text-cream-50"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {t("build.tab.refill")}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto mb-10">
          {currentBundles.map((b) => (
            <article
              key={b.id}
              onClick={() => setBundleSize(b.capsules)}
              className={`relative rounded-3xl p-7 cursor-pointer transition border-2 ${
                bundleSize === b.capsules
                  ? "border-ink"
                  : "border-cream-200 hover:border-ink/30"
              } ${
                b.popular
                  ? "bg-ink text-cream-50 shadow-2xl shadow-ink/10 md:scale-[1.03]"
                  : "bg-cream-50 text-ink"
              }`}
            >
              {b.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rosegold text-cream-50 text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full">
                  {t("bundle.mostloved")}
                </div>
              )}
              <div className="space-y-1.5 mb-5">
                <h3 className="font-display text-3xl">{b.name}</h3>
                <p
                  className={`text-sm ${
                    b.popular ? "text-cream-100/70" : "text-ink-soft"
                  }`}
                >
                  {b.desc}
                </p>
                <p
                  className={`text-xs ${
                    b.popular ? "text-rosegold-light" : "text-rosegold"
                  }`}
                >
                  {b.days}
                </p>
              </div>
              <div className="flex items-baseline gap-3 mb-1">
                <span className="font-display text-5xl">${b.price}</span>
                <span
                  className={`text-sm line-through ${
                    b.popular ? "text-cream-100/40" : "text-ink-soft/50"
                  }`}
                >
                  ${b.crossed}
                </span>
              </div>
              <div
                className={`text-xs mb-6 ${
                  b.popular ? "text-rosegold-light" : "text-rosegold"
                }`}
              >
                {b.save} · {b.perCapsule}
              </div>
              <div
                className={`text-xs uppercase tracking-widest text-center py-2 rounded-full ${
                  bundleSize === b.capsules
                    ? b.popular
                      ? "bg-cream-50 text-ink"
                      : "bg-ink text-cream-50"
                    : b.popular
                    ? "bg-cream-50/10 text-cream-50/80"
                    : "bg-cream-100 text-ink-soft"
                }`}
              >
                {bundleSize === b.capsules ? t("bundle.selected") : t("bundle.select")}
              </div>
            </article>
          ))}
        </div>

        {/* MULTI SCENT SELECTOR */}
        <div className="max-w-md mx-auto mb-6">
          <div className="text-xs uppercase tracking-widest text-ink font-medium mb-2.5 text-center">
            {t("build.scentlabel")}
          </div>
          <CapsuleSlots
            count={bundleSize}
            selectedScents={selectedScents}
            setScentAt={setScentAt}
          />
        </div>

        <div className="max-w-md mx-auto">
          <button className="btn-primary w-full !py-5 text-base !rounded-2xl">
            {t("build.cta")}{finalPrice}
            <ArrowRight size={18} />
          </button>
          <p className="text-xs text-center text-ink-soft mt-3">
            {t("build.cta.subline")}
          </p>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 20. PRODUCT FAQ
// ─────────────────────────────────────────────────────────────────────────────
function ProductFAQ() {
  const { t } = useT();
  const [open, setOpen] = useState(0);

  const faqs = [
    { q: t("pfaq.q1"), a: t("pfaq.a1") },
    { q: t("pfaq.q2"), a: t("pfaq.a2") },
    { q: t("pfaq.q3"), a: t("pfaq.a3") },
    { q: t("pfaq.q4"), a: t("pfaq.a4") },
    { q: t("pfaq.q5"), a: t("pfaq.a5") },
    { q: t("pfaq.q6"), a: t("pfaq.a6") },
    { q: t("pfaq.q7"), a: t("pfaq.a7") },
    { q: t("pfaq.q8"), a: t("pfaq.a8") },
    { q: t("pfaq.q9"), a: t("pfaq.a9") },
    { q: t("pfaq.q10"), a: t("pfaq.a10") },
    { q: t("pfaq.q11"), a: t("pfaq.a11") },
  ];

  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="container-narrow">
        <div className="text-center mb-12 space-y-3">
          <div className="label-eyebrow">{t("pfaq.eyebrow")}</div>
          <h2 className="h-display text-3xl md:text-5xl">{t("pfaq.h2")}</h2>
        </div>
        <div>
          {faqs.map((f, i) => (
            <div key={i} className="border-b border-cream-200/80">
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="w-full flex items-center justify-between gap-4 py-6 text-left"
              >
                <span className="font-display text-lg md:text-2xl text-ink">
                  {f.q}
                </span>
                <span className="flex-shrink-0 text-rosegold">
                  {open === i ? <Minus size={22} /> : <Plus size={22} />}
                </span>
              </button>
              {open === i && (
                <p className="pb-6 pr-10 text-ink-soft leading-relaxed text-base md:text-lg">
                  {f.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 21. FINAL CTA
// ─────────────────────────────────────────────────────────────────────────────
function FinalCTA({ onCta }) {
  const { t } = useT();
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, #F5F0E8 0%, #FBF8F3 70%)",
        }}
      />
      <div className="container-narrow text-center space-y-7">
        <div className="label-eyebrow">{t("pfinalcta.eyebrow")}</div>
        <h2 className="h-display text-4xl md:text-7xl leading-[1.02]">
          {t("pfinalcta.h1.line1")}
          <br />
          {t("pfinalcta.h1.line2")}
          <br />
          <span className="italic text-rosegold">{t("pfinalcta.h1.line3")}</span>
        </h2>
        <p className="text-lg md:text-xl text-ink-soft max-w-xl mx-auto leading-relaxed">
          {t("pfinalcta.body")}
        </p>
        <div className="pt-2">
          <button onClick={onCta} className="btn-primary text-base !py-5 !px-10">
            {t("pfinalcta.cta")} <ArrowRight size={18} />
          </button>
        </div>
        <p className="text-xs text-ink-soft">{t("pfinalcta.subline")}</p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STICKY CART
// ─────────────────────────────────────────────────────────────────────────────
function StickyAddToCart({
  finalPrice,
  selectedBundle,
  selectedScents,
  heroRef,
  onCta,
}) {
  const { t } = useT();
  const SCENTS = getScents(t);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (!heroRef.current) return;
      const heroBottom = heroRef.current.getBoundingClientRect().bottom;
      setShow(heroBottom < 0);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [heroRef]);

  const scentSummary = (() => {
    const counts = selectedScents.reduce((acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([id, n]) => {
        const name = SCENTS.find((s) => s.id === id)?.name || id;
        return n > 1 ? `${n}× ${name}` : name;
      })
      .join(" · ");
  })();

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-40 transition-transform duration-300 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-cream-50/95 backdrop-blur-md border-t border-ink/10 shadow-2xl">
        <div className="container-x py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-cream-100 overflow-hidden flex-shrink-0 hidden sm:flex items-center justify-center">
              <SmartImage
                src={IMAGES.hero}
                alt=""
                label="·"
                className="w-full h-full"
                imgClassName="object-contain w-full h-full"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-ink-soft truncate">
                HUSH · {scentSummary}
              </div>
              <div className="font-display text-base md:text-lg leading-tight truncate">
                {selectedBundle.name} · ${finalPrice}
              </div>
            </div>
          </div>
          <button
            onClick={onCta}
            className="btn-primary !py-3 !px-5 md:!px-7 text-xs md:text-sm flex-shrink-0"
          >
            {t("stickycart.add")} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
