import { useState } from "react";
import Stars from "../components/Stars";
import { ChevronDown } from "lucide-react";
import { useT } from "../lang/LanguageContext";

const reviews = [
  {
    name: "Rachel K.",
    location: "Phoenix, AZ",
    stars: 5,
    title: "Down 4 kg in 3 weeks. Without trying.",
    body: "I bought it laughing — 'a diffuser?' Three weeks later my jeans fit. I didn't change anything else.",
    date: "Mar 12, 2026",
    scent: "Mint",
  },
  {
    name: "Sarah M.",
    location: "Austin, TX",
    stars: 5,
    title: "I quit my 9 PM kitchen ritual.",
    body: "Two weeks in, my partner asked if I'd stopped eating after dinner. I hadn't even noticed. Down 1.8 kg without dieting.",
    date: "Feb 28, 2026",
    scent: "Spice",
  },
  {
    name: "Maria L.",
    location: "Columbus, OH",
    stars: 5,
    title: "My jeans button without the jump.",
    body: "Three months in, my Spice capsule is gone — and so are the afternoon cookies. Calmer brain. Same me.",
    date: "Mar 03, 2026",
    scent: "Spice",
  },
  {
    name: "Brad S.",
    location: "Reno, NV",
    stars: 5,
    title: "My wife stopped asking for ice cream runs.",
    body: "She lit it on a Tuesday. By Friday the requests had vanished. Either coincidence or witchcraft.",
    date: "Feb 14, 2026",
    scent: "Mint",
  },
  {
    name: "Janine T.",
    location: "Boston, MA",
    stars: 5,
    title: "Cheaper than a personal trainer.",
    body: "Tried 4 diet apps. Tried 3 weight-loss supplements. None survived past week 2. HUSH has been on my desk for 4 months.",
    date: "Jan 21, 2026",
    scent: "Citrus",
  },
  {
    name: "Giada L.",
    location: "Los Angeles, CA",
    stars: 2,
    title: "Works too well — careful.",
    body: "Took the joy out of my favorite midnight snack. I don't crave it anymore. 2 stars because I miss the chaos.",
    date: "Mar 05, 2026",
    scent: "Spice",
  },
  {
    name: "Marcus J.",
    location: "Atlanta, GA",
    stars: 5,
    title: "Bought it for my partner. Now I steal it.",
    body: "She lit it on a Tuesday and the kitchen got quiet. Three weeks later, I asked if I could move it to my office. The Mint capsule lives there now.",
    date: "Feb 09, 2026",
    scent: "Mint",
  },
  {
    name: "Ellie T.",
    location: "Brooklyn, NY",
    stars: 5,
    title: "Seven nights changed my evenings.",
    body: "I tried fasting, apps, the whole thing. A friend sent me HUSH with one line: 'try it anyway.' Night seven, I realized I hadn't gone to the pantry all week.",
    date: "Feb 02, 2026",
    scent: "Mint",
  },
  {
    name: "Danielle R.",
    location: "Seattle, WA",
    stars: 5,
    title: "It made it easier to slow down.",
    body: "I'm not a wellness person. But pressing one button after dinner became my whole routine. Three months in, my Spice capsule is gone.",
    date: "Jan 30, 2026",
    scent: "Spice",
  },
  {
    name: "Emily H.",
    location: "Denver, CO",
    stars: 5,
    title: "Down a dress size in 6 weeks.",
    body: "I didn't believe the reviews. I do now. The afternoon snacking just... stopped. Citrus is my favorite.",
    date: "Mar 18, 2026",
    scent: "Citrus",
  },
  {
    name: "Carlos M.",
    location: "Miami, FL",
    stars: 4,
    title: "Helps. Not magic. Helps.",
    body: "It's not a miracle, but it genuinely changed my evening habits. Down 1.5 kg in a month with zero other changes. Honest 4 stars.",
    date: "Feb 22, 2026",
    scent: "Mint",
  },
  {
    name: "Lauren P.",
    location: "Nashville, TN",
    stars: 5,
    title: "I sleep better and I eat less.",
    body: "Spice capsule before bed. The sweet cravings disappeared and I started sleeping deeper. Two birds, one button.",
    date: "Mar 11, 2026",
    scent: "Spice",
  },
  {
    name: "Tyler W.",
    location: "Chicago, IL",
    stars: 5,
    title: "Saved my late-night work hours.",
    body: "I work from 8 PM to midnight on big projects. Used to graze constantly. HUSH on the desk + Citrus capsule = focused, no snacking.",
    date: "Feb 17, 2026",
    scent: "Citrus",
  },
  {
    name: "Heather B.",
    location: "Portland, OR",
    stars: 4,
    title: "Took 2 weeks but it clicked.",
    body: "First week I thought it was just a nice smell. Week two something shifted — I stopped reaching for chocolate after lunch. Down 1 kg.",
    date: "Feb 24, 2026",
    scent: "Citrus",
  },
  {
    name: "James K.",
    location: "Dallas, TX",
    stars: 5,
    title: "−2.7 kg in 5 weeks. No effort.",
    body: "Not exaggerating. I didn't change my diet. I didn't start working out. My wife noticed before I did. Mint, daily, after dinner.",
    date: "Mar 07, 2026",
    scent: "Mint",
  },
  {
    name: "Priya S.",
    location: "San Francisco, CA",
    stars: 5,
    title: "The only wellness gadget I actually use.",
    body: "I have a graveyard of abandoned wellness products. HUSH is the only one still on my nightstand four months later.",
    date: "Jan 12, 2026",
    scent: "Mint",
  },
  {
    name: "Megan R.",
    location: "Minneapolis, MN",
    stars: 5,
    title: "Replaced my evening ice cream habit.",
    body: "Every single night, ice cream. Couldn't stop. HUSH on, ice cream off. Three weeks in and I haven't even thought about it.",
    date: "Feb 19, 2026",
    scent: "Spice",
  },
  {
    name: "Nicole V.",
    location: "Tampa, FL",
    stars: 5,
    title: "Three months in, still in love.",
    body: "I keep waiting for it to stop working. It hasn't. Down 3.5 kg, calmer evenings, no rebound. The Discovery Pack was worth every cent.",
    date: "Jan 06, 2026",
    scent: "Mint",
  },
];

export default function Reviews() {
  const { t } = useT();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? reviews : reviews.slice(0, 9);

  return (
    <section id="reviews" className="py-24 md:py-32">
      <div className="container-x">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <div className="label-eyebrow">{t("reviews.eyebrow")}</div>
          <h2 className="h-display text-4xl md:text-5xl">
            {t("reviews.h2.pre")}{" "}
            <span className="italic text-rosegold">{t("reviews.h2.bold")}</span>
          </h2>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Stars />
            <span className="text-sm text-ink-soft">
              <strong className="text-ink">4.8 / 5</strong>{" "}
              {t("reviews.rating.label")} · 2,184 {t("reviews.reviews")}
            </span>
          </div>
        </div>

        {/* Stars distribution bar */}
        <div className="max-w-2xl mx-auto mb-12 bg-cream-100 rounded-2xl p-5 border border-cream-200/60">
          {[
            { stars: 5, pct: 84, count: 1834 },
            { stars: 4, pct: 11, count: 240 },
            { stars: 3, pct: 3, count: 65 },
            { stars: 2, pct: 1, count: 23 },
            { stars: 1, pct: 1, count: 22 },
          ].map((row) => (
            <div key={row.stars} className="flex items-center gap-3 py-1">
              <div className="flex-shrink-0 w-12 text-xs text-ink-soft">
                {row.stars}{" "}
                <span className="text-rosegold">★</span>
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((r, i) => (
            <article
              key={i}
              className={`rounded-3xl p-7 border ${
                r.stars < 4
                  ? "bg-cream-100 border-cream-200"
                  : "bg-cream-50 border-cream-200/60"
              } space-y-4`}
            >
              <div className="flex items-center justify-between">
                <Stars count={r.stars} />
                <span className="text-[10px] uppercase tracking-widest text-ink-soft">
                  {r.date}
                </span>
              </div>
              <h3 className="font-display text-xl text-ink leading-snug">
                "{r.title}"
              </h3>
              <p className="text-ink-soft text-sm leading-relaxed">{r.body}</p>
              <div className="flex items-center justify-between text-xs pt-3 border-t border-cream-200/80">
                <div className="text-ink-soft">
                  <span className="font-medium text-ink">{r.name}</span> ·{" "}
                  {r.location}
                </div>
                <span className="text-rosegold font-medium">
                  HUSH {r.scent}
                </span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-rosegold">
                ✓ {t("reviews.verified")}
              </div>
            </article>
          ))}
        </div>

        {/* Show more / less button */}
        {reviews.length > 9 && (
          <div className="text-center mt-12">
            <button
              onClick={() => setExpanded(!expanded)}
              className="btn-outline"
            >
              {expanded ? t("reviews.showless") : t("reviews.showmore")}
              <ChevronDown
                size={16}
                className={`transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
