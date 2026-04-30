import { MessageSquare, ArrowLeft } from "lucide-react";
import { buildAppointmentActionUrl, decodeUrlEncodedChunks } from "./reminderUtils";

const SAMPLE_VALUES: Record<string, string> = {
  "{{salon_name}}": "BeautyPro Studio Milano",
  "{{short_data}}": "Gio, 19 Mar",
  "{{date}}": "giovedì 19 marzo",
  "{{time}}": "12:00",
  "{{link}}": buildAppointmentActionUrl("Ab3kX9mZqR"),
  "{{service_name}}": "Epilazione Laser",
  "{{client_name}}": "Pinuccia",
  "{{day_label}}": "oggi",
  "{{duration}}": "45",
};

function resolveConditionals(text: string): string {
  return text.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_match, field, content) => {
    const key = `{{${field}}}`;
    const hasValue = key in SAMPLE_VALUES && SAMPLE_VALUES[key].trim() !== "";
    return hasValue ? content : "";
  });
}

function resolveTemplate(text: string): string {
  let resolved = resolveConditionals(text);
  for (const [key, val] of Object.entries(SAMPLE_VALUES)) {
    resolved = resolved.split(key).join(val);
  }
  resolved = decodeUrlEncodedChunks(resolved);
  resolved = resolved.replace(/\\n/g, "\n");
  resolved = resolved.replace(/\n{3,}/g, "\n\n");
  return resolved;
}

/** Renders WhatsApp-style formatting: *bold*, _italic_, ~strikethrough~, and links */
function RenderWAText({ text, className }: { text: string; className?: string }) {
  const tokenRegex = /(https?:\/\/[^\s]+|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;
  const parts = text.split(tokenRegex);
  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (/^https?:\/\//.test(part)) {
          return <span key={i} className="underline decoration-1 underline-offset-2 cursor-default" style={{ color: "hsl(210 100% 55%)" }}>{part}</span>;
        }
        if (/^\*[^*]+\*$/.test(part)) {
          return <strong key={i}>{part.slice(1, -1)}</strong>;
        }
        if (/^_[^_]+_$/.test(part)) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        if (/^~[^~]+~$/.test(part)) {
          return <span key={i} className="line-through">{part.slice(1, -1)}</span>;
        }
        return part;
      })}
    </p>
  );
}

const WA_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fillRule="evenodd" />
  </svg>
);

interface Props {
  text: string;
}

export default function ReminderTemplatePreview({ text }: Props) {
  const resolved = resolveTemplate(text);

  return (
    <div className="rounded-xl border bg-muted/20 overflow-hidden">
      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-2">Anteprima WhatsApp</p>

      {/* Phone frame - directly showing WA chat */}
      <div
        className="relative rounded-[16px] overflow-hidden mx-auto my-2 border border-white/10 w-full max-w-[280px] flex flex-col"
        style={{ aspectRatio: "280 / 380", background: "linear-gradient(160deg, hsl(220 15% 18%), hsl(220 12% 10%))" }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-end px-3 pt-1 pb-0.5" style={{ background: "hsl(142 50% 28%)" }}>
          <div className="flex items-center gap-1">
            <svg className="h-2 w-2.5" viewBox="0 0 16 12" fill="none">
              <rect x="0" y="8" width="3" height="4" rx="0.5" fill="white" fillOpacity="0.5" />
              <rect x="4.5" y="5" width="3" height="7" rx="0.5" fill="white" fillOpacity="0.5" />
              <rect x="9" y="2" width="3" height="10" rx="0.5" fill="white" fillOpacity="0.5" />
            </svg>
            <div className="w-3.5 h-2 border border-white/40 rounded-[2px] relative">
              <div className="absolute inset-[1px] rounded-[1px]" style={{ width: "45%", background: "hsl(120 60% 50%)" }} />
            </div>
          </div>
        </div>

        {/* WA header */}
        <div className="flex items-center gap-1.5 px-2 py-1 shrink-0" style={{ background: "hsl(142 50% 30%)" }}>
          <div className="flex items-center gap-0.5 shrink-0">
            <ArrowLeft className="h-3 w-3 text-white/70" />
          </div>
          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "hsl(142 30% 50%)" }}>
            <span className="text-[8px] font-bold text-white">B</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[8px] font-bold text-white truncate">BeautyPro Studio</p>
            <p className="text-[6px] text-white/60">online</p>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="h-3 w-3 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94" /><path d="M1 1l22 22" /><path d="M11 6a3 3 0 0 1 3 3" /></svg>
            <svg className="h-3 w-3 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
          </div>
        </div>

        {/* Chat area */}
        <div
          className="flex-1 overflow-y-auto px-2 py-2 flex flex-col justify-end"
          style={{
            background: "hsl(30 25% 92%)",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M30 30c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10-10-4.5-10-10zM10 10c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10S10 15.5 10 10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
          }}
        >
          {/* Received WA bubble */}
          <div className="max-w-[90%] self-start">
            <div className="rounded-lg rounded-tl-sm px-2.5 py-1.5 shadow-sm bg-white relative">
              {/* Triangle tail */}
              <div className="absolute -left-1.5 top-0 w-0 h-0" style={{ borderTop: "6px solid white", borderRight: "6px solid transparent" }} />
              <p className="text-[8px] font-bold mb-0.5" style={{ color: "hsl(142 60% 35%)" }}>BeautyPro Studio Milano</p>
              <RenderWAText text={resolved} className="text-[9px] text-gray-900 whitespace-pre-wrap leading-relaxed" />
              <div className="flex items-center justify-end gap-0.5 mt-0.5">
                <span className="text-[7px] text-gray-400">19:16</span>
              </div>
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="shrink-0 flex items-center gap-1.5 px-2 py-1.5 bg-white/90 border-t border-gray-200">
          <svg className="h-3.5 w-3.5 text-gray-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
          <div className="flex-1 rounded-full bg-white border border-gray-200 px-2.5 py-1">
            <span className="text-[8px] text-gray-400">Messaggio</span>
          </div>
          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "hsl(142 50% 40%)" }}>
            <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 15c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v7c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
        </div>
      </div>

      <p className="text-[8px] text-muted-foreground text-center italic pb-2">
        Si aggiorna in tempo reale mentre scrivi
      </p>
    </div>
  );
}
