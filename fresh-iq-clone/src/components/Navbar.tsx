import { motion } from 'framer-motion';
import type { Lang, Translation } from '../i18n';
import { buyNow } from '../lib/shopify';

type Props = { t: Translation; lang: Lang; setLang: (l: Lang) => void };

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export default function Navbar({ t, lang, setLang }: Props) {
  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl shadow-lg border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16 md:h-20">
        <a href="#" className="text-xl md:text-2xl font-bold tracking-tight">
          <span className="text-gradient">Fresh</span>
          <span className="text-foreground">IQ</span>
        </a>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-border bg-secondary/80 backdrop-blur-sm p-0.5">
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                lang === 'en'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('it')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                lang === 'it'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              IT
            </button>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <button
              onClick={() => buyNow()}
              className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full px-5 shadow-lg shadow-primary/20 text-sm transition-colors"
            >
              {t.nav.buyNow}
            </button>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
}
