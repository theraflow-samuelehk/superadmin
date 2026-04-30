import { Shield, Smartphone, Target, Gauge, Zap, Battery } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Translation } from '../i18n';

const icons = [Shield, Smartphone, Target, Gauge, Zap, Battery];

export default function WhyLove({ t }: { t: Translation }) {
  return (
    <section className="bg-secondary/40 py-20 md:py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-xs font-bold tracking-wider mb-5">
            {t.love.badge}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">{t.love.title}</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-5">
          {t.love.cards.map((c, i) => {
            const Icon = icons[i];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-border"
              >
                <motion.div
                  initial={{ rotate: 0 }}
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Icon className="w-7 h-7 mb-4 text-primary" />
                </motion.div>
                <h3 className="font-bold text-base md:text-lg mb-2 text-foreground">{c.title}</h3>
                <p className="text-sm text-muted-foreground">{c.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
