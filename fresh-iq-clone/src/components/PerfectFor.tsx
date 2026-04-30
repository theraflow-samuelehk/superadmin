import { Heart, Briefcase, Coffee, Moon, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Translation } from '../i18n';

const icons = [Heart, Briefcase, Coffee, Moon, HelpCircle];

export default function PerfectFor({ t }: { t: Translation }) {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="max-w-5xl mx-auto px-4 md:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent rounded-full px-4 py-1.5 text-xs font-bold tracking-wider mb-5">
            {t.perfect.badge}
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-10 max-w-3xl mx-auto leading-tight text-foreground">
            {t.perfect.title}
          </h2>
        </motion.div>
        <div className="flex flex-wrap justify-center gap-3">
          {t.perfect.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.08, type: 'spring', stiffness: 200 }}
                whileHover={{ scale: 1.05, y: -3 }}
                className="inline-flex items-center gap-2 bg-secondary/80 hover:bg-secondary text-foreground rounded-full px-5 py-2.5 text-sm md:text-base font-medium border border-border cursor-pointer"
              >
                <Icon className="w-4 h-4 text-primary" />
                {item}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
