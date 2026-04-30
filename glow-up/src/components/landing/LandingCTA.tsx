import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

export function LandingCTA() {
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-foreground via-rose-dark to-foreground" />
      {/* Decorative dots */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "radial-gradient(circle, hsl(0 0% 100%) 1px, transparent 1px)",
        backgroundSize: "24px 24px"
      }} />

      <div className="container mx-auto text-center max-w-2xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Sparkles className="h-10 w-10 text-accent mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-primary-foreground leading-tight">
            {t("landing.ctaTitle")}
          </h2>
          <p className="text-primary-foreground/70 mt-4 text-base sm:text-lg">
            {t("landing.ctaSubtitle")}
          </p>
          <Link to="/auth?tab=signup">
            <Button variant="gold" size="xl" className="mt-8 animate-pulse-glow">
              {t("landing.ctaStartToday")}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
