import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return <span ref={ref}>{count.toLocaleString("it-IT")}{suffix}</span>;
}

const stats = [
  { numKey: "trustCentersNum", labelKey: "trustCenters", target: 2500, suffix: "+", mobileLabel: "2.500+" },
  { numKey: "trustAppointmentsNum", labelKey: "trustAppointments", target: 1200000, suffix: "+", mobileLabel: "1.2M+" },
  { numKey: "trustClientsNum", labelKey: "trustClients", target: 850000, suffix: "+", mobileLabel: "850K+" },
];

export function LandingTrustBar() {
  const { t } = useTranslation();

  return (
    <section className="py-6 md:py-14 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/40 to-transparent pointer-events-none" />
      <div className="container mx-auto relative z-10">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-muted-foreground font-medium mb-8"
        >
          {t("landing.trustTitle")}
        </motion.p>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.labelKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <p className="text-lg sm:text-3xl md:text-4xl font-bold text-foreground">
                <span className="sm:hidden">{stat.mobileLabel}</span>
                <span className="hidden sm:inline"><CountUp target={stat.target} suffix={stat.suffix} /></span>
              </p>
              <p className="text-[10px] sm:text-sm text-muted-foreground mt-1">{t(`landing.${stat.labelKey}`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
