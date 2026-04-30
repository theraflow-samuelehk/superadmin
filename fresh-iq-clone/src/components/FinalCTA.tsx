import { Sparkles, Truck, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Translation } from '../i18n';
import { buyNow } from '../lib/shopify';

export default function FinalCTA({ t }: { t: Translation }) {
  return (
    <section className="cta-gradient text-white py-20 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/5" />
      <div className="max-w-4xl mx-auto px-4 md:px-8 text-center relative">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
        >
          {t.finalCta.title}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-base md:text-lg text-white/90 mb-6"
        >
          {t.finalCta.subtitle}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-end justify-center gap-3 mb-6"
        >
          <span className="text-3xl md:text-4xl font-bold">{t.hero.price}</span>
          <span className="text-lg text-white/70 line-through">{t.hero.oldPrice}</span>
          <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">{t.hero.discount}</span>
        </motion.div>
        <motion.button
          onClick={() => buyNow()}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.45 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="relative bg-white text-primary hover:bg-white/95 font-bold text-base md:text-lg rounded-full px-8 md:px-12 py-4 md:py-5 shadow-2xl inline-flex items-center gap-2 overflow-hidden"
        >
          <motion.span
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
          />
          <span className="relative z-10 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {t.finalCta.cta}
            <span className="ml-1">›</span>
          </span>
        </motion.button>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm text-white/80"
        >
          <span className="flex items-center gap-1.5">
            <Truck className="w-4 h-4" />
            {t.hero.shipping}
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            {t.hero.guarantee}
          </span>
        </motion.div>
      </div>
    </section>
  );
}
