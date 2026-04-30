import { motion } from 'framer-motion';
import type { Translation } from '../i18n';
import lifestyleMan from '../assets/lifestyle-man.png';

export default function SolutionSection({ t }: { t: Translation }) {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-accent/10 text-accent rounded-full px-4 py-1.5 text-xs font-bold tracking-wider mb-5"
          >
            {t.solution.badge}
          </motion.div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-foreground">
            {t.solution.title}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mb-4">{t.solution.body}</p>
          <p className="text-base md:text-lg font-semibold text-foreground">{t.solution.end}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 60, rotate: 3 }}
          whileInView={{ opacity: 1, x: 0, rotate: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="rounded-3xl overflow-hidden shadow-2xl"
        >
          <img src={lifestyleMan} alt="Man using FreshIQ discreetly" className="w-full h-auto" />
        </motion.div>
      </div>
    </section>
  );
}
