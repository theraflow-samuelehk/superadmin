import { motion } from 'framer-motion';
import type { Translation } from '../i18n';

export default function LaunchBanner({ t }: { t: Translation }) {
  return (
    <motion.div
      initial={{ y: -40 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="launch-banner-gradient text-primary-foreground text-center py-2.5 px-4 text-xs md:text-sm font-bold tracking-wide relative overflow-hidden z-50 mt-16 md:mt-20"
    >
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'linear' }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent"
      />
      <span className="relative z-10">{t.launchBanner}</span>
    </motion.div>
  );
}
