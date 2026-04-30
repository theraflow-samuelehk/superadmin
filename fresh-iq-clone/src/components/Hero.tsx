import { Flame, Star, Check, Truck, Shield, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Translation } from '../i18n';
import productBlue from '../assets/product-blue.png';
import productMint from '../assets/product-mint.png';
import productPink from '../assets/product-pink.png';
import productOrange from '../assets/product-orange.png';
import { useEffect, useState } from 'react';
import { buyNow, type VariantKey } from '../lib/shopify';

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const VARIANT_KEYS: VariantKey[] = ['blue', 'mint', 'pink', 'orange'];

export default function Hero({ t }: { t: Translation }) {
  const [tickerIdx, setTickerIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTickerIdx((i) => (i + 1) % t.hero.ticker.length);
    }, 4000);
    return () => clearInterval(id);
  }, [t]);

  const colors = [
    { name: t.hero.colors.blue, hex: '#1d3a6e', ring: 'ring-primary', image: productBlue },
    { name: t.hero.colors.mint, hex: '#7ecfc4', ring: 'ring-teal-400', image: productMint },
    { name: t.hero.colors.pink, hex: '#f7a6bd', ring: 'ring-pink-300', image: productPink },
    { name: t.hero.colors.orange, hex: '#e89561', ring: 'ring-orange-300', image: productOrange },
  ];

  return (
    <section className="relative overflow-hidden min-h-[auto] lg:min-h-[85vh] hero-bg">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [0.8, 0.95, 0.8], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full bg-primary/[0.05] blur-[120px]"
        />
        <motion.div
          animate={{ scale: [0.8, 0.95, 0.8], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 6, delay: 0.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/[0.05] blur-[120px]"
        />
        <motion.div
          animate={{ scale: [0.8, 0.95, 0.8], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 6, delay: 1, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 left-0 w-[300px] h-[300px] rounded-full bg-primary/[0.03] blur-[80px]"
        />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 pt-8 md:pt-12 lg:pt-16 pb-4 md:pb-8 lg:pb-16 relative z-10">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-4 lg:gap-12 xl:gap-20 items-center">
          {/* LEFT column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="order-2 lg:order-1 lg:py-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: EASE }}
              className="inline-flex items-center gap-2 bg-accent/10 text-accent rounded-full px-4 py-1.5 text-xs font-bold tracking-wider mb-4 lg:mb-5"
            >
              <Flame className="w-3.5 h-3.5" />
              {t.hero.badge}
              <Flame className="w-3.5 h-3.5" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: EASE }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-[3.75rem] 2xl:text-[4.25rem] font-bold leading-[1.05] tracking-tight mb-3 md:mb-5 lg:mb-6"
            >
              <span className="block">
                <span className="text-gradient">{t.hero.title1}</span>
              </span>
              <span className="block">{t.hero.title2}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6, ease: EASE }}
              className="text-base md:text-lg lg:text-xl text-muted-foreground mb-4 md:mb-6 max-w-xl"
            >
              {t.hero.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: EASE }}
              className="flex flex-wrap items-center gap-3 mb-5"
            >
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0, rotate: -20 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: 0.4 + i * 0.08, duration: 0.4, type: 'spring', stiffness: 200 }}
                  >
                    <Star className="w-4 h-4 fill-freshiq-yellow text-freshiq-yellow" />
                  </motion.span>
                ))}
                <span className="text-sm font-semibold ml-1.5">{t.hero.reviews}</span>
              </div>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm font-medium text-muted-foreground">{t.hero.unitsSold}</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6, ease: EASE }}
              className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-6 lg:mb-8"
            >
              {t.hero.features.map((f, i) => (
                <motion.div
                  key={f}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-xs md:text-sm lg:text-[0.9rem] font-medium text-foreground">{f}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: EASE }}
              className="mb-4 lg:mb-5"
            >
              <div className="flex items-end gap-3 mb-4">
                <span className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">{t.hero.price}</span>
                <span className="text-lg lg:text-xl text-muted-foreground line-through">{t.hero.oldPrice}</span>
                <motion.span
                  initial={{ opacity: 0, scale: 0, rotate: -20 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
                  className="bg-accent/10 text-accent text-xs lg:text-sm font-bold px-2.5 py-1 rounded-full"
                >
                  {t.hero.discount}
                </motion.span>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6, ease: EASE }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-block"
              >
                <button
                  onClick={() => buyNow(VARIANT_KEYS[selectedColor])}
                  className="relative bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base md:text-lg lg:text-xl rounded-full px-8 md:px-12 lg:px-14 py-4 md:py-5 lg:py-6 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35 transition-shadow w-full sm:w-auto overflow-hidden group inline-flex items-center justify-center gap-2">
                  <motion.span
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/15 to-transparent"
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    {t.hero.cta}
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.6 }}
              className="flex flex-wrap items-center gap-4 text-xs lg:text-sm text-muted-foreground mb-3"
            >
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4" />
                {t.hero.shipping}
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                {t.hero.guarantee}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {t.hero.ships}
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="flex items-center gap-2 text-xs lg:text-sm font-medium text-destructive mb-4"
            >
              <Sparkles className="w-4 h-4" />
              {t.hero.stock}
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={tickerIdx}
                initial={{ opacity: 0, scale: 0.7, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -20 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="bg-white/70 backdrop-blur-sm border border-border rounded-full px-4 py-2 text-xs md:text-sm inline-flex items-center gap-2 shadow-sm"
              >
                <span>{t.hero.ticker[tickerIdx]}</span>
                <span className="text-muted-foreground">— {t.hero.tickerSuffix}</span>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* RIGHT column */}
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
            className="order-1 lg:order-2 flex flex-col items-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-full max-w-[560px] aspect-square"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedColor}
                  src={colors[selectedColor].image}
                  alt={`FreshIQ breath checker ${colors[selectedColor].name}`}
                  initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.92, rotateY: 15 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl"
                />
              </AnimatePresence>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex items-center gap-3 mt-4"
            >
              {colors.map((c, i) => (
                <motion.button
                  key={c.hex}
                  onClick={() => setSelectedColor(i)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.65 + i * 0.08, type: 'spring', stiffness: 200, damping: 15 }}
                  aria-label={c.name}
                  className={`w-8 h-8 rounded-full transition-all ring-offset-2 ring-offset-white ${
                    selectedColor === i ? `ring-2 ${c.ring}` : 'ring-0'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.4 }}
              className="text-xs md:text-sm font-medium text-muted-foreground mt-2"
            >
              {colors[selectedColor].name}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
