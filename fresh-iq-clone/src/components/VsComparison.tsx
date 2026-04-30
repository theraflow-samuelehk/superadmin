import { X, Check, Ruler, Weight, Zap, Eye, DollarSign, Battery } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Translation } from '../i18n';
import competitor from '../assets/competitor-device.png';
import product from '../assets/product-blue.png';

const rowIcons = [Ruler, Weight, Zap, Eye, DollarSign, Battery];

export default function VsComparison({ t }: { t: Translation }) {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-freshiq-red/10 text-freshiq-red rounded-full px-4 py-1.5 text-xs font-bold tracking-wider mb-5">
            {t.vs.badge}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">{t.vs.title}</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7 }}
            className="relative bg-red-50/60 border-2 border-red-100 rounded-3xl p-8"
          >
            <span className="absolute top-4 right-4 bg-red-100 text-freshiq-red text-xs font-bold rounded-full px-3 py-1">
              {t.vs.othersTag}
            </span>
            <div className="flex flex-col items-center">
              <img src={competitor} alt="Clinical halimeter" className="w-40 md:w-48 h-auto mb-4" />
              <h3 className="text-xl md:text-2xl font-bold text-freshiq-red mb-2 text-center">{t.vs.othersTitle}</h3>
              <p className="text-sm md:text-base text-muted-foreground text-center max-w-sm">{t.vs.othersBody}</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative bg-teal-50/60 border-2 border-teal-100 rounded-3xl p-8"
          >
            <span className="absolute top-4 right-4 bg-teal-100 text-freshiq-teal text-xs font-bold rounded-full px-3 py-1">
              {t.vs.freshTag}
            </span>
            <div className="flex flex-col items-center">
              <motion.img
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                src={product}
                alt="FreshIQ"
                className="w-40 md:w-48 h-auto mb-4 drop-shadow-xl"
              />
              <h3 className="text-xl md:text-2xl font-bold text-freshiq-teal mb-2 text-center">{t.vs.freshTitle}</h3>
              <p className="text-sm md:text-base text-muted-foreground text-center max-w-sm">{t.vs.freshBody}</p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-border overflow-hidden bg-white"
        >
          <div className="grid grid-cols-3 bg-secondary/60 px-4 md:px-6 py-4 text-sm md:text-base font-semibold">
            <div className="text-foreground">{t.vs.table.featureHeader}</div>
            <div className="text-center text-freshiq-red">{t.vs.othersTag}</div>
            <div className="text-center text-freshiq-teal">{t.vs.freshTag}</div>
          </div>
          {t.vs.table.rows.map((r, i) => {
            const Icon = rowIcons[i];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="grid grid-cols-3 items-center px-4 md:px-6 py-4 border-t border-border text-sm md:text-base"
              >
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  {r.feature}
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <X className="w-4 h-4 text-freshiq-red" />
                  {r.others}
                </div>
                <div className="flex items-center justify-center gap-2 text-foreground">
                  <Check className="w-4 h-4 text-freshiq-teal" />
                  {r.fresh}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
