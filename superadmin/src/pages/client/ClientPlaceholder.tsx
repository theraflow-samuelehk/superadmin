import { Card } from "../../components/ui/Card";
import { Clock } from "lucide-react";

interface ClientPlaceholderProps {
  title: string;
  description: string;
  features: string[];
}

export function ClientPlaceholder({ title, description, features }: ClientPlaceholderProps) {
  return (
    <div className="px-4 md:px-6 lg:px-12 py-6 md:py-8 max-w-[1200px] mx-auto">
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 text-[11px] bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full font-semibold mb-4">
          <Clock size={11} /> In sviluppo
        </span>
        <h1 className="display font-black text-slate-900" style={{ fontSize: "clamp(32px, 5vw, 56px)" }}>
          {title}
        </h1>
        <p className="text-[15px] text-slate-600 mt-4 max-w-2xl leading-relaxed">{description}</p>
      </div>

      <Card className="p-8 md:p-10 bg-gradient-to-br from-cyan-50/60 via-white to-blue-50/40">
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-4">
          Cosa potrai fare
        </div>
        <ul className="space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-[14px] text-slate-700">
              <span className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5 text-white font-bold text-[10px]">
                ✓
              </span>
              {f}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
