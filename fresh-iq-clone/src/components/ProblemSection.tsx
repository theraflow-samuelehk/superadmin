import { motion } from 'framer-motion';
import type { Translation } from '../i18n';

export default function ProblemSection({ t }: { t: Translation }) {
  return (
    <section className="bg-freshiq-navy text-white py-20 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
      <div className="max-w-4xl mx-auto px-4 md:px-8 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-bold tracking-wider mb-6 text-white/80"
        >
          {t.problem.badge}
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 leading-tight"
        >
          {t.problem.title}
        </motion.h2>
        <div className="space-y-3 text-base md:text-lg text-white/70 max-w-2xl mx-auto">
          {t.problem.lines.map((l, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
            >
              {l}
            </motion.p>
          ))}
        </div>
        <motion.p
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 text-lg md:text-xl font-semibold text-accent"
        >
          {t.problem.pointer}
        </motion.p>
      </div>
    </section>
  );
}
