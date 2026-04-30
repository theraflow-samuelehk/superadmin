import { motion } from "framer-motion";
import { OrbitalDecoration } from "./OrbitalDecoration";
import { cn } from "../../lib/utils";

interface PageHeroProps {
  index: string;
  title: React.ReactNode;
  description: React.ReactNode;
  action?: React.ReactNode;
  stats?: { label: string; value: string | number }[];
  className?: string;
}

export function PageHero({ index, title, description, action, stats, className }: PageHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative rounded-3xl overflow-hidden mb-10 panel-dark",
        className
      )}
      style={{
        backgroundImage:
          "radial-gradient(at 0% 0%, rgba(6, 182, 212, 0.4) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(59, 130, 246, 0.35) 0px, transparent 55%), radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.25) 0px, transparent 55%), radial-gradient(at 0% 100%, rgba(56, 189, 248, 0.3) 0px, transparent 50%), linear-gradient(180deg, #0a1628 0%, #0e1d3a 50%, #0a1838 100%)",
      }}
    >
      <div className="absolute inset-0 dot-pattern-dark opacity-50" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] blob blob-cyan opacity-25" />
      <div className="absolute bottom-0 left-1/4 w-[320px] h-[320px] blob blob-indigo opacity-20" style={{ animationDelay: "-6s" }} />

      <OrbitalDecoration
        variant="dark"
        className="absolute -right-20 -top-24 w-[500px] h-[500px] pointer-events-none opacity-80 hidden md:block"
      />

      <div className="relative p-6 md:p-10">
        <div className="flex items-center gap-3 mb-7 flex-wrap">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] text-white border border-white/20"
            style={{ background: "linear-gradient(135deg, rgba(6, 182, 212, 0.45), rgba(99, 102, 241, 0.45))", backdropFilter: "blur(8px)" }}
          >
            {index}
          </span>
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8 items-end">
          {/* Left column */}
          <div>
            <h1
              className="display font-black text-white leading-[0.92] break-words"
              style={{ fontSize: "clamp(36px, 5.5vw, 76px)" }}
            >
              {title}
            </h1>
            <div className="mt-5 text-[14.5px] text-white/70 leading-relaxed max-w-lg">
              {description}
            </div>
            {action && <div className="mt-6">{action}</div>}

            {/* Mobile-only stats: compact horizontal grid */}
            {stats && (
              <div className="lg:hidden mt-6 grid grid-cols-3 gap-2.5">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="p-3 rounded-2xl border border-white/10 bg-white/5 text-center"
                  >
                    <div
                      className="font-black text-white tabular-nums leading-none"
                      style={{ fontSize: "28px" }}
                    >
                      {s.value}
                    </div>
                    <div className="text-[10px] text-white/55 font-bold uppercase tracking-wider mt-1.5 truncate">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop-only stats: right column stacked */}
          {stats && (
            <div className="hidden lg:block space-y-2.5">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur"
                >
                  <span className="text-[12px] text-white/70 font-bold uppercase tracking-wider shrink-0">
                    {s.label}
                  </span>
                  <span className="num-display text-white truncate text-right" style={{ fontSize: "44px" }}>
                    {s.value}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
