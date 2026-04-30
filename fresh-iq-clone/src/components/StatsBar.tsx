import { Users, Award, Trophy, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Translation } from '../i18n';

const icons = [Users, Award, Trophy, TrendingUp];

export default function StatsBar({ t }: { t: Translation }) {
  return (
    <section className="bg-freshiq-navy text-white py-8 md:py-10 border-t border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {t.stats.map((s, i) => {
          const Icon = icons[i];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex flex-col items-center text-center"
            >
              <Icon className="w-5 h-5 mb-2 text-white/70" />
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1">{s.value}</div>
              <div className="text-[10px] md:text-xs tracking-widest text-white/60 uppercase font-semibold">
                {s.label}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
