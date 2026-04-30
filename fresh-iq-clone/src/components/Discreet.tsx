import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Translation } from '../i18n';
import discreetHand from '../assets/discreet-hand.png';

export default function Discreet({ t }: { t: Translation }) {
  return (
    <section className="bg-freshiq-navy text-white py-20 md:py-24">
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-bold tracking-wider mb-5 text-white/80">
            <Lock className="w-3.5 h-3.5" />
            {t.discreet.badge}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">{t.discreet.title}</h2>
          <p className="text-base md:text-lg text-white/80 mb-3">{t.discreet.line1}</p>
          <p className="text-base md:text-lg text-white/60">{t.discreet.line2}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 50, rotate: 5 }}
          whileInView={{ opacity: 1, x: 0, rotate: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="rounded-3xl overflow-hidden shadow-2xl"
        >
          <img src={discreetHand} alt="FreshIQ in hand" className="w-full h-auto" />
        </motion.div>
      </div>
    </section>
  );
}
