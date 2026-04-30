import { buildAppointmentActionUrl, decodeUrlEncodedChunks } from "./reminderUtils";

// Use a realistic short_code link (10 chars) for accurate char counting
const SAMPLE_LINK = buildAppointmentActionUrl("Ab3kX9mZqR");

export const SMS_SAMPLE_VALUES: Record<string, string> = {
  "{{salon_name}}": "BeautyPro Studio Milano",
  "{{short_data}}": "Gio, 19 Mar",
  "{{date}}": "giovedì 19 marzo",
  "{{time}}": "12:00",
  "{{link}}": SAMPLE_LINK,
  "{{service_name}}": "Epilazione Laser",
  "{{client_name}}": "Pinuccia",
  "{{day_label}}": "oggi",
  "{{duration}}": "45",
};

export function resolveSmsTemplate(text: string): string {
  let resolved = text;
  for (const [key, val] of Object.entries(SMS_SAMPLE_VALUES)) {
    resolved = resolved.split(key).join(val);
  }
  resolved = decodeUrlEncodedChunks(resolved);
  resolved = resolved.replace(/\\n/g, "\n");
  resolved = resolved.replace(/\n{3,}/g, "\n\n");
  return resolved;
}

/** Renders SMS text with clickable-looking links */
function RenderSmsText({ text, className }: { text: string; className?: string }) {
  const linkRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(linkRegex);
  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (/^https?:\/\//.test(part)) {
          return (
            <span key={i} className="underline decoration-1 underline-offset-2 cursor-default" style={{ color: "#007AFF" }}>
              {part}
            </span>
          );
        }
        return part;
      })}
    </p>
  );
}

interface Props {
  text: string;
}

export default function SmsTemplatePreview({ text }: Props) {
  const resolved = resolveSmsTemplate(text);

  return (
    <div className="rounded-xl border bg-muted/20 overflow-hidden">
      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-2">Anteprima SMS</p>

      {/* iPhone frame */}
      <div
        className="relative rounded-[16px] overflow-hidden mx-auto my-2 border border-white/10 w-full max-w-[280px] flex flex-col"
        style={{ aspectRatio: "280 / 380", background: "#000" }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-3 pt-1.5 pb-1" style={{ background: "#1C1C1E" }}>
          <span className="text-[8px] text-white/70 font-medium">9:41</span>
          <div className="flex items-center gap-1">
            <svg className="h-2 w-2.5" viewBox="0 0 16 12" fill="none">
              <rect x="0" y="8" width="3" height="4" rx="0.5" fill="white" fillOpacity="0.5" />
              <rect x="4.5" y="5" width="3" height="7" rx="0.5" fill="white" fillOpacity="0.7" />
              <rect x="9" y="2" width="3" height="10" rx="0.5" fill="white" fillOpacity="0.9" />
            </svg>
            <div className="w-4 h-2 border border-white/40 rounded-[2px] relative">
              <div className="absolute inset-[1px] rounded-[1px] bg-white/70" style={{ width: "60%" }} />
            </div>
          </div>
        </div>

        {/* Messages header */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 shrink-0" style={{ background: "#1C1C1E" }}>
          <svg className="h-3 w-3 text-[#007AFF] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <div className="flex-1 text-center">
            <p className="text-[9px] font-semibold text-white">BeautyPro Studio</p>
            <p className="text-[6px] text-white/50">SMS</p>
          </div>
          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#30D158" }}>
            <span className="text-[8px] font-bold text-white">B</span>
          </div>
        </div>

        {/* Chat area */}
        <div
          className="flex-1 overflow-y-auto px-2 py-2 flex flex-col justify-end"
          style={{ background: "#000" }}
        >
          {/* SMS bubble */}
          <div className="max-w-[85%] self-start">
            <div
              className="rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm relative"
              style={{ background: "#262628" }}
            >
              <RenderSmsText text={resolved} className="text-[9px] text-white whitespace-pre-wrap leading-relaxed" />
              <div className="flex items-center justify-end gap-0.5 mt-1">
                <span className="text-[7px] text-white/40">19:16</span>
              </div>
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="shrink-0 flex items-center gap-1.5 px-2 py-1.5" style={{ background: "#1C1C1E" }}>
          <svg className="h-3.5 w-3.5 text-[#007AFF] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          <div className="flex-1 rounded-full border border-white/20 px-2.5 py-1" style={{ background: "#2C2C2E" }}>
            <span className="text-[8px] text-white/30">Messaggio di testo</span>
          </div>
          <svg className="h-3.5 w-3.5 text-[#007AFF] shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </div>
      </div>

      <p className="text-[8px] text-muted-foreground text-center italic pb-2">
        Si aggiorna in tempo reale mentre scrivi
      </p>
    </div>
  );
}
