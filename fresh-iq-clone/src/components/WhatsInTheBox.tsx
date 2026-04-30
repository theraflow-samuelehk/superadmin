import { Box, Cable, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Translation } from '../i18n';
import productBlue from '../assets/product-blue.png';

const icons = [Box, Cable, BookOpen];

export default function WhatsInTheBox({ t }: { t: Translation }) {
  return (
    <section className="bg-secondary/40 py-20 md:py-24">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-xs font-bold tracking-wider mb-5">
            {t.box.badge}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">{t.box.title}</h2>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <motion.img
            initial={{ opacity: 0, scale: 0.85, rotate: -5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            src={productBlue}
            alt="FreshIQ package"
            className="w-full max-w-sm mx-auto"
          />
          <ul className="space-y-4">
            {t.box.items.map((item, i) => {
              const Icon = icons[i];
              return (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-border shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-base md:text-lg font-semibold text-foreground">{item}</span>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
