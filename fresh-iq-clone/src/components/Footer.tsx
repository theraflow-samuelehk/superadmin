import { motion } from 'framer-motion';
import type { Translation } from '../i18n';

export default function Footer({ t }: { t: Translation }) {
  return (
    <footer className="bg-freshiq-navy text-white py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-xl md:text-2xl font-bold mb-3">
              <span className="text-gradient">Fresh</span>
              <span className="text-white">IQ</span>
            </div>
            <p className="text-sm text-white/60 max-w-xs">{t.footer.tagline}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="font-semibold text-white mb-3">{t.footer.quickLinks}</h4>
            <ul className="space-y-2 text-sm text-white/70">
              {t.footer.links.map((l) => (
                <li key={l}>
                  <a href="#" className="hover:text-white transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="font-semibold text-white mb-3">{t.footer.followUs}</h4>
            <div className="flex gap-4 text-sm text-white/70">
              {t.footer.social.map((s) => (
                <a key={s} href="#" className="hover:text-white transition-colors">{s}</a>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="border-t border-white/10 pt-6 text-center text-xs text-white/50">
          <p className="mb-2">{t.footer.disclaimer}</p>
          <p>{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
