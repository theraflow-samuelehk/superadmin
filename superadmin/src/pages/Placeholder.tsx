import { Sparkles } from "lucide-react";
import { Card } from "../components/ui/Card";

export function Placeholder({ title, index }: { title: string; index: string }) {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1600px] mx-auto">
      <div className="mb-8 pt-2">
        <div className="flex items-center gap-3 mb-5">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white"
            style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)" }}
          >
            {index} — {title}
          </span>
        </div>
        <h1
          className="font-display font-bold text-slate-900 tracking-monster leading-[1]"
          style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
        >
          {title}
        </h1>
      </div>

      <Card className="p-12 flex flex-col items-center justify-center text-center bg-gradient-to-br from-violet-50 via-white to-pink-50">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-glow"
          style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)" }}
        >
          <Sparkles size={22} className="text-white" />
        </div>
        <h2 className="font-display text-[24px] text-slate-900 font-bold tracking-ultra-tight mb-2">
          Modulo in arrivo
        </h2>
        <p className="text-[13.5px] text-slate-600 max-w-md leading-relaxed">
          Questa sezione fa parte della roadmap. Verrà costruita dopo l'approvazione della demo grafica attuale.
        </p>
      </Card>
    </div>
  );
}
