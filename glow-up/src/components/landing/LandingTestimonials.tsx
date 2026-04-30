import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useTranslation } from "react-i18next";

const testimonials = [
  { nameKey: "testimonial1Name", roleKey: "testimonial1Role", quoteKey: "testimonial1Quote", color: "bg-primary", initial: "M" },
  { nameKey: "testimonial2Name", roleKey: "testimonial2Role", quoteKey: "testimonial2Quote", color: "bg-accent", initial: "G" },
  { nameKey: "testimonial3Name", roleKey: "testimonial3Role", quoteKey: "testimonial3Quote", color: "bg-rose-dark", initial: "F" },
];

export function LandingTestimonials() {
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-24 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-serif font-bold text-foreground"
          >
            {t("landing.testimonialsTitle")}{" "}
            <span className="text-gradient-primary">{t("landing.testimonialsTitleHighlight")}</span>
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((item, i) => (
            <motion.div
              key={item.nameKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <div className="gradient-border rounded-2xl p-6 bg-card h-full relative">
                <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed italic">
                  "{t(`landing.${item.quoteKey}`)}"
                </p>
                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border/50">
                  <div className={`h-10 w-10 rounded-full ${item.color} flex items-center justify-center text-primary-foreground font-bold text-sm`}>
                    {item.initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t(`landing.${item.nameKey}`)}</p>
                    <p className="text-xs text-muted-foreground">{t(`landing.${item.roleKey}`)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
