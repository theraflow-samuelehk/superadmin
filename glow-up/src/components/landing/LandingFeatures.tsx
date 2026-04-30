import { motion } from "framer-motion";
import {
  Calendar, Users, CreditCard, Package, Heart, BarChart3,
  Smartphone, Scissors, MapPin, UserCheck, ShoppingBag,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const heroFeatures = [
  { icon: Calendar, titleKey: "featureAgenda", descKey: "featureAgendaDesc", gradient: "from-primary/10 to-primary/5" },
  { icon: Smartphone, titleKey: "featureClientPortal", descKey: "featureClientPortalDesc", gradient: "from-accent/10 to-accent/5" },
  { icon: UserCheck, titleKey: "featureStaffPortal", descKey: "featureStaffPortalDesc", gradient: "from-rose-light/60 to-rose-light/20" },
];

const minorFeatures = [
  { icon: Users, titleKey: "featureCRM", descKey: "featureCRMDesc" },
  { icon: CreditCard, titleKey: "featurePOS", descKey: "featurePOSDesc" },
  { icon: Package, titleKey: "featureInventory", descKey: "featureInventoryDesc" },
  { icon: Heart, titleKey: "featureLoyalty", descKey: "featureLoyaltyDesc" },
  { icon: ShoppingBag, titleKey: "featureShop", descKey: "featureShopDesc" },
  { icon: BarChart3, titleKey: "featureReports", descKey: "featureReportsDesc" },
  { icon: Scissors, titleKey: "featureServices", descKey: "featureServicesDesc" },
  { icon: MapPin, titleKey: "featureMultiSede", descKey: "featureMultiSedeDesc" },
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

export function LandingFeatures() {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-10 md:py-24 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8 md:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-foreground"
          >
            {t("landing.featuresTitle")}{" "}
            <span className="text-gradient-primary">{t("landing.featuresTitleHighlight")}</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground mt-4 max-w-2xl mx-auto"
          >
            {t("landing.featuresDescription")}
          </motion.p>
        </div>

        {/* Hero features - 3 large cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-6">
          {heroFeatures.map((f, i) => (
            <motion.div
              key={f.titleKey}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className={`gradient-border p-6 sm:p-8 rounded-2xl bg-gradient-to-br ${f.gradient} hover:shadow-glow hover:scale-[1.02] transition-all duration-300 h-full group`}>
                <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-serif font-bold text-foreground">{t(`landing.${f.titleKey}`)}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{t(`landing.${f.descKey}`)}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Minor features - compact grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
          {minorFeatures.map((f, i) => (
            <motion.div
              key={f.titleKey}
              custom={i + 3}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="gradient-border p-4 rounded-xl bg-card hover:shadow-soft transition-all duration-300 h-full group">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2.5 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-xs sm:text-sm font-serif font-semibold text-foreground">{t(`landing.${f.titleKey}`)}</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-relaxed">{t(`landing.${f.descKey}`)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
