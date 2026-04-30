import { motion } from "framer-motion";
import { CheckCircle2, Calendar, Bell, Clock, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

export function LandingShowcase() {
  const { t } = useTranslation();

  const points = [
    { icon: Calendar, text: t("landing.showcasePoint1") },
    { icon: Bell, text: t("landing.showcasePoint2") },
    { icon: Clock, text: t("landing.showcasePoint3") },
    { icon: Star, text: t("landing.showcasePoint4") },
  ];

  return (
    <section className="py-16 md:py-24 px-4 bg-secondary/30 relative overflow-hidden">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex justify-center order-2 lg:order-1"
          >
            <div className="relative w-[240px] sm:w-[280px] lg:w-[300px]">
              {/* Phone frame */}
              <div className="relative rounded-[2.5rem] border-[6px] border-foreground/80 bg-card overflow-hidden shadow-2xl">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-foreground/80 rounded-b-2xl z-10" />
                {/* Screen content - stylized app */}
                <div className="pt-8 pb-4 px-4 min-h-[420px] sm:min-h-[520px]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <img src="/icon-512.png" alt="" className="h-5 w-5 rounded" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">GlowUp</p>
                      <p className="text-[9px] text-muted-foreground">I tuoi appuntamenti</p>
                    </div>
                  </div>
                  {/* Mock appointment cards */}
                  {[
                    { time: "09:30", service: "Pulizia Viso", color: "bg-primary/10 border-primary/20" },
                    { time: "11:00", service: "Manicure Gel", color: "bg-accent/10 border-accent/20" },
                    { time: "14:30", service: "Massaggio Relax", color: "bg-rose-light border-primary/10" },
                  ].map((apt, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.15 }}
                      className={`rounded-xl border p-3 mb-2.5 ${apt.color}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs font-semibold text-foreground">{apt.service}</p>
                          <p className="text-[10px] text-muted-foreground">{apt.time}</p>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                    </motion.div>
                  ))}
                  {/* Points badge */}
                  <div className="mt-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/10 p-3">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-accent" />
                      <div>
                        <p className="text-xs font-bold text-foreground">1.250 punti</p>
                        <p className="text-[9px] text-muted-foreground">Livello Gold</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
              {t("landing.showcaseTitle")}
            </h2>
            <p className="text-muted-foreground mt-4 text-base leading-relaxed">
              {t("landing.showcaseSubtitle")}
            </p>
            <div className="mt-8 space-y-4">
              {points.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <point.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm sm:text-base text-foreground font-medium">{point.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
