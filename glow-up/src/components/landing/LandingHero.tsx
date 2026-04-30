import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ArrowRight, CheckCircle2, CalendarCheck, TrendingUp, Heart } from "lucide-react";
import heroImage from "@/assets/hero-salon-premium.jpg";
import { useTranslation } from "react-i18next";

const floatingCards = [
  { icon: CalendarCheck, text: "+230", sub: "prenotazioni oggi", delay: 0, className: "top-2 left-2 lg:top-8 lg:-left-6 animate-float" },
  { icon: Star, text: "4.9", sub: "stelle", delay: 0.3, className: "top-2 right-2 lg:top-1/3 lg:-right-8 animate-float-delayed" },
  { icon: Heart, text: "98%", sub: "soddisfatti", delay: 0.6, className: "bottom-2 left-2 lg:bottom-12 lg:-left-4 animate-float" },
];

export function LandingHero() {
  const { t } = useTranslation();

  return (
    <section className="pt-20 pb-6 md:pt-32 md:pb-16 px-4 relative overflow-hidden">
      {/* Animated blob shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, hsl(340 65% 55% / 0.4), transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], x: [0, 20, 0], y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 -left-40 w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, hsl(38 75% 55% / 0.5), transparent 70%)" }}
          animate={{ scale: [1, 1.2, 1], x: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.div
          className="absolute -bottom-20 right-1/4 w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(340 60% 70% / 0.5), transparent 70%)" }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center lg:text-left"
          >
            <motion.div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-gold text-primary-foreground text-sm font-semibold mb-6"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Star className="h-4 w-4" />
              {t("landing.heroBadge")}
            </motion.div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold text-foreground leading-[1.1] tracking-tight">
              {t("landing.heroTitle")}{" "}
              <span className="text-gradient-primary">{t("landing.heroTitleHighlight")}</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mt-6 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {t("landing.heroDescription")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8 justify-center lg:justify-start">
              <Link to="/auth?tab=signup">
                <Button variant="hero" size="xl" className="w-full sm:w-auto animate-pulse-glow">
                  {t("landing.ctaStart")}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline-hero" size="xl" className="w-full sm:w-auto">
                  {t("landing.ctaLearnMore")}
                </Button>
              </a>
            </div>
            <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-1.5 sm:gap-6 mt-8 text-xs sm:text-sm text-muted-foreground justify-center lg:justify-start">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> {t("landing.freeTrial")}</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> {t("landing.noCard")}</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> {t("landing.quickSetup")}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Golden frame effect */}
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-gold/30 via-primary/10 to-gold-light/20 blur-sm" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-gold/20 transform lg:rotate-1 lg:hover:rotate-0 transition-transform duration-500">
              <img
                src={heroImage}
                alt={t("landing.heroTitle")}
                className="w-full h-[280px] sm:h-[360px] lg:h-[520px] object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
            </div>

            {/* Floating cards */}
            {floatingCards.map((card, i) => (
              <div key={i} className={`absolute ${card.className} glass-card rounded-xl p-2 sm:p-3 shadow-soft z-10 scale-75 sm:scale-90 lg:scale-100`}>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <card.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{card.text}</p>
                    <p className="text-[10px] text-muted-foreground">{card.sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
