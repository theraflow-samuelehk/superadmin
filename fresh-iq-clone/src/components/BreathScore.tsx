import { BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Translation } from '../i18n';
import chart from '../assets/breath-score-chart.png';

const colorMap: Record<string, string> = {
  green: 'text-freshiq-green',
  yellow: 'text-freshiq-yellow',
  red: 'text-freshiq-red',
};

export default function BreathScore({ t }: { t: Translation }) {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent rounded-full px-4 py-1.5 text-xs font-bold tracking-wider mb-5">
            <BarChart3 className="w-3.5 h-3.5" />
            {t.score.badge}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 leading-tight text-foreground">{t.score.title}</h2>
          <p className="text-base md:text-lg text-muted-foreground mb-6">{t.score.body}</p>
          <div className="space-y-2 mb-6">
            {t.score.items.map((it, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
                className={`text-lg md:text-xl font-semibold ${colorMap[it.color]}`}
              >
                {it.range} → {it.label}
              </motion.div>
            ))}
          </div>
          <p className="text-base md:text-lg font-semibold text-foreground">{t.score.pointer}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex items-center justify-center"
        >
          <img src={chart} alt="Breath Score chart 1-10" className="w-full max-w-md rounded-2xl shadow-2xl" />
        </motion.div>
      </div>
    </section>
  );
}
