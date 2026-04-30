import { Coffee, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Translation } from '../i18n';

const icons = [Coffee, ShieldCheck, AlertTriangle];

export default function Science({ t }: { t: Translation }) {
  return (
    <section className="bg-freshiq-navy text-white py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
      <div className="max-w-6xl mx-auto px-4 md:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-bold tracking-wider mb-5 text-white/80">
            {t.science.badge}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">{t.science.title}</h2>
          <p className="text-base md:text-lg text-white/80 max-w-3xl mx-auto mb-4">{t.science.intro1}</p>
          <p className="text-sm md:text-base text-white/60 max-w-3xl mx-auto mb-3">{t.science.intro2}</p>
          <p className="text-sm md:text-base text-white/60 max-w-3xl mx-auto">{t.science.intro3}</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-5">
          {t.science.cards.map((c, i) => {
            const Icon = icons[i];
            const mutedStyle = i === 2 ? 'bg-white/[0.03] border-white/5' : 'bg-white/5 border-white/10';
            const textMuted = i === 2 ? 'text-white/50' : 'text-white/70';
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`rounded-2xl p-6 border ${mutedStyle}`}
              >
                <Icon className="w-6 h-6 mb-4 text-accent" />
                <h3 className="font-bold text-base md:text-lg mb-3 text-white">{c.title}</h3>
                <p className={`text-sm ${textMuted} leading-relaxed`}>{c.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
