import { Sparkles } from "lucide-react";
import { Card } from "../components/ui/Card";

export function Placeholder({ title, index }: { title: string; index: string }) {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1600px] mx-auto">
      <div className="mb-8 pt-4">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[10px] uppercase tracking-[0.22em] text-accent font-semibold">
            {index} — {title}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-paper-300 to-transparent" />
        </div>
        <h1
          className="font-display font-light text-ink-900 tracking-monster leading-[0.95]"
          style={{ fontSize: "clamp(40px, 5vw, 60px)", fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
        >
          {title}
        </h1>
      </div>

      <Card className="p-12 flex flex-col items-center justify-center text-center grid-bg">
        <div className="w-12 h-12 rounded-md hairline-strong bg-paper-50 flex items-center justify-center mb-4">
          <Sparkles size={18} className="text-accent" />
        </div>
        <h2
          className="font-display text-2xl text-ink-900 font-normal tracking-ultra-tight mb-2"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30" }}
        >
          Modulo in arrivo (Ondata 2)
        </h2>
        <p className="text-[13.5px] text-ink-200 max-w-md leading-relaxed">
          Questa sezione fa parte della roadmap. Verrà costruita dopo l'approvazione della demo grafica attuale.
        </p>
      </Card>
    </div>
  );
}
