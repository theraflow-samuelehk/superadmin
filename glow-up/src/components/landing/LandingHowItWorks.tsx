import { motion } from "framer-motion";
import { UserPlus, Settings, Rocket } from "lucide-react";
import { useTranslation } from "react-i18next";

const steps = [
  { icon: UserPlus, step: 1 },
  { icon: Settings, step: 2 },
  { icon: Rocket, step: 3 },
];

export function LandingHowItWorks() {
  const { t } = useTranslation();

  return (
    <section id="how" className="py-16 md:py-24 px-4 bg-secondary/30">
      <div className="container mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-serif font-bold text-foreground"
          >
            {t("landing.howTitle")}{" "}
            <span className="text-gradient-primary">{t("landing.howTitleHighlight")}</span>
          </motion.h2>
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5">
            <motion.div
              className="h-full bg-gradient-to-r from-primary/30 via-primary to-primary/30"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              style={{ transformOrigin: "left" }}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ icon: Icon, step }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
                className="text-center relative"
              >
                <div className="relative inline-flex mb-5">
                  <div className="h-16 w-16 rounded-full bg-gradient-hero flex items-center justify-center shadow-glow relative z-10">
                    <Icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-accent text-primary-foreground text-xs font-bold flex items-center justify-center z-20">
                    {step}
                  </div>
                </div>
                <h3 className="text-lg font-serif font-bold text-foreground">{t(`landing.step${step}Title`)}</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-[250px] mx-auto">{t(`landing.step${step}Desc`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
