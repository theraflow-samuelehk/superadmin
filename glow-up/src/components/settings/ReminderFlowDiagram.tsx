import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import SimpleFlowDiagramComponent, { isSimpleTemplate } from "./SimpleFlowDiagram";
import {
  FlowConfig, NodeBounds,
  C, STORAGE_KEY, ANCHOR_KEY,
  useFlowLayout, DraggableG, SmartArr, ZoomPanContainer,
  FlowEditContext, AnchorCycleContext, EditorControls, MarqueeRect, GridGuides,
  RBox, Pill, Diamond, MsgBox, Arr, ElbowArr,
} from "./FlowEditorCore";

// ── Case Colors ─────────────────────────────────────────────

const CASE_COLORS: Record<string, string> = {
  A: C.primary, B: C.sky, C: C.amber, D: C.orange, E: C.gray,
};

// ── Helper ──────────────────────────────────────────────────
function fmtH(h: number) { return `${String(h).padStart(2, "0")}:00`; }

// ── Timing Tables ───────────────────────────────────────────

function TimingTables({ x, y, config }: { x: number; y: number; config: FlowConfig }) {
  const caseA = config.cases?.A;
  const caseB = config.cases?.B;
  const dayBefore = caseA?.timing_tables?.day_before || {};
  const noResponse = caseA?.timing_tables?.no_response || {};
  const adminPush = caseA?.timing_tables?.admin_push || {};
  const offsetHours = caseB?.timing_tables?.offset_hours || {};
  const bAdminPush = caseB?.timing_tables?.admin_push || {};

  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const colW = 62;
  const rowH = 32;
  const labelW = 310;
  const tableW = labelW + hours.length * colW + 20;

  const caseATableH = 4 * rowH + 60;
  const caseBTableY = y + caseATableH + 30;
  const caseBTableH = 3 * rowH + 60;
  const caseCDTableY = caseBTableY + caseBTableH + 30;
  const caseCDTableH = 3 * rowH + 60;

  const dividerCol = 7;

  return (
    <g>
      {/* ══ CASE A TABLE ══ */}
      <rect x={x} y={y} width={tableW} height={caseATableH} rx={12}
        fill={C.primary} opacity={0.04} stroke={C.primary} strokeWidth={1.5} />
      <text x={x + 18} y={y + 24} fill={C.primary} fontSize={15} fontWeight={800}>
        📋 Caso A (&gt;24h) — Tabella orari di invio
      </text>
      <text x={x + 18} y={y + 44} fill={C.mutedFg} fontSize={11}>
        Ore 8–14: tutti i messaggi vanno il giorno PRIMA | Ore 15–20: SMS1 giorno prima, SMS2 e Admin giorno STESSO
      </text>

      <text x={x + 18} y={y + 68} fill={C.mutedFg} fontSize={10} fontWeight={700}>
        Ora appuntamento →
      </text>
      {hours.map((h, i) => (
        <text key={i} x={x + labelW + i * colW + colW / 2} y={y + 68}
          textAnchor="middle" fill={C.fg} fontSize={10} fontWeight={700}>
          {fmtH(h)}
        </text>
      ))}

      <line x1={x + 12} y1={y + 76} x2={x + tableW - 12} y2={y + 76}
        stroke={C.muted} strokeWidth={0.5} strokeDasharray="3,2" />

      {[
        { label: "SMS1 — Primo contatto (giorno prima)", data: dayBefore, color: C.primary },
        { label: "SMS2 — Follow-up (stessi orari conf/no resp)", data: noResponse, color: C.red },
        { label: "ADMIN — Notifica al titolare", data: adminPush, color: C.orange },
      ].map((row, ri) => (
        <g key={ri}>
          <rect x={x + 8} y={y + 82 + ri * rowH} width={tableW - 16} height={rowH - 4} rx={5}
            fill={row.color} opacity={ri % 2 === 0 ? 0.06 : 0.1} />
          <text x={x + 18} y={y + 82 + ri * rowH + 19} fill={row.color} fontSize={11} fontWeight={700}>
            {row.label}
          </text>
          {hours.map((h, i) => {
            const val = row.data[String(h)];
            return (
              <text key={i} x={x + labelW + i * colW + colW / 2} y={y + 82 + ri * rowH + 19}
                textAnchor="middle" fill={row.color} fontSize={11} fontWeight={600}>
                {val !== undefined ? fmtH(val) : "–"}
              </text>
            );
          })}
        </g>
      ))}

      <line x1={x + labelW + dividerCol * colW - 2} y1={y + 78}
        x2={x + labelW + dividerCol * colW - 2} y2={y + 82 + 3 * rowH - 4}
        stroke={C.amber} strokeWidth={2} strokeDasharray="5,3" />
      <text x={x + labelW + dividerCol * colW + 4} y={y + 82 + 3 * rowH + 14}
        fill={C.amber} fontSize={9} fontWeight={700}>
        ← giorno prima | giorno stesso →
      </text>

      {/* ══ CASE B TABLE ══ */}
      <rect x={x} y={caseBTableY} width={tableW} height={caseBTableH} rx={12}
        fill={C.sky} opacity={0.04} stroke={C.sky} strokeWidth={1.5} />
      <text x={x + 18} y={caseBTableY + 24} fill={C.sky} fontSize={15} fontWeight={800}>
        📋 Caso B (12–24h) — Tabella orari di invio
      </text>

      <text x={x + 18} y={caseBTableY + 48} fill={C.mutedFg} fontSize={10} fontWeight={700}>
        Ora appuntamento →
      </text>
      {hours.map((h, i) => (
        <text key={i} x={x + labelW + i * colW + colW / 2} y={caseBTableY + 48}
          textAnchor="middle" fill={C.fg} fontSize={10} fontWeight={700}>
          {fmtH(h)}
        </text>
      ))}

      <line x1={x + 12} y1={caseBTableY + 56} x2={x + tableW - 12} y2={caseBTableY + 56}
        stroke={C.muted} strokeWidth={0.5} strokeDasharray="3,2" />

      {[
        {
          label: "SMS — Orario di invio",
          color: C.sky,
          getVal: (h: number) => {
            const offset = offsetHours[String(h)];
            return offset !== undefined ? fmtH(h - offset) : "–";
          },
        },
        {
          label: "ADMIN — Notifica al titolare",
          color: C.orange,
          getVal: (h: number) => {
            const val = bAdminPush[String(h)];
            return val !== undefined ? fmtH(val) : "–";
          },
        },
      ].map((row, ri) => (
        <g key={ri}>
          <rect x={x + 8} y={caseBTableY + 62 + ri * rowH} width={tableW - 16} height={rowH - 4} rx={5}
            fill={row.color} opacity={ri % 2 === 0 ? 0.08 : 0.12} />
          <text x={x + 18} y={caseBTableY + 62 + ri * rowH + 19} fill={row.color} fontSize={11} fontWeight={700}>
            {row.label}
          </text>
          {hours.map((h, i) => (
            <text key={i} x={x + labelW + i * colW + colW / 2} y={caseBTableY + 62 + ri * rowH + 19}
              textAnchor="middle" fill={row.color} fontSize={11} fontWeight={600}>
              {row.getVal(h)}
            </text>
          ))}
        </g>
      ))}

      {/* ══ CASE C & D TABLE ══ */}
      <rect x={x} y={caseCDTableY} width={tableW} height={caseCDTableH} rx={12}
        fill={C.amber} opacity={0.04} stroke={C.amber} strokeWidth={1.5} />
      <text x={x + 18} y={caseCDTableY + 24} fill={C.amber} fontSize={15} fontWeight={800}>
        📋 Caso C (4–12h) e Caso D (2–4h) — Tabella orari di invio
      </text>
      <text x={x + 18} y={caseCDTableY + 42} fill={C.mutedFg} fontSize={11}>
        Caso C: SMS 2h prima + Admin 1h prima | Caso D: SMS 1h prima, nessuna notifica admin
      </text>

      <text x={x + 18} y={caseCDTableY + 62} fill={C.mutedFg} fontSize={10} fontWeight={700}>
        Ora appuntamento →
      </text>
      {hours.map((h, i) => (
        <text key={i} x={x + labelW + i * colW + colW / 2} y={caseCDTableY + 62}
          textAnchor="middle" fill={C.fg} fontSize={10} fontWeight={700}>
          {fmtH(h)}
        </text>
      ))}

      <line x1={x + 12} y1={caseCDTableY + 70} x2={x + tableW - 12} y2={caseCDTableY + 70}
        stroke={C.muted} strokeWidth={0.5} strokeDasharray="3,2" />

      <g>
        <rect x={x + 8} y={caseCDTableY + 76} width={tableW - 16} height={rowH - 4} rx={5}
          fill={C.amber} opacity={0.08} />
        <text x={x + 18} y={caseCDTableY + 76 + 19} fill={C.amber} fontSize={11} fontWeight={700}>
          Caso C — SMS (2h prima) + Admin (1h prima)
        </text>
        {hours.map((h, i) => (
          <g key={i}>
            <text x={x + labelW + i * colW + colW / 2} y={caseCDTableY + 76 + 12}
              textAnchor="middle" fill={C.amber} fontSize={10} fontWeight={600}>
              SMS {fmtH(h - 2)}
            </text>
            <text x={x + labelW + i * colW + colW / 2} y={caseCDTableY + 76 + 25}
              textAnchor="middle" fill={C.orange} fontSize={10} fontWeight={600}>
              Adm {fmtH(h - 1)}
            </text>
          </g>
        ))}
      </g>

      <g>
        <rect x={x + 8} y={caseCDTableY + 76 + rowH} width={tableW - 16} height={rowH - 4} rx={5}
          fill={C.orange} opacity={0.08} />
        <text x={x + 18} y={caseCDTableY + 76 + rowH + 19} fill={C.orange} fontSize={11} fontWeight={700}>
          Caso D — SMS (1h prima) · Nessun admin
        </text>
        {hours.map((h, i) => (
          <text key={i} x={x + labelW + i * colW + colW / 2} y={caseCDTableY + 76 + rowH + 19}
            textAnchor="middle" fill={C.orange} fontSize={11} fontWeight={600}>
            {fmtH(h - 1)}
          </text>
        ))}
      </g>
    </g>
  );
}

// ── Case A detailed column ──────────────────────────────────

function CaseAColumn({ x, y }: { x: number; y: number }) {
  const vGap = 160;
  let cy = y;
  const sms1Y = cy; cy += vGap;
  const dec1Y = cy; cy += vGap + 40;
  const sms2Y = cy; cy += vGap;
  const dec2Y = cy; cy += vGap;
  const adminY = cy;
  const confX = x + 900;
  const leftPillX = x - 380;
  const confRemY = sms2Y;
  const confDecY = dec2Y;
  const midY = adminY + vGap;

  return (
    <g>
      <RBox x={x} y={sms1Y} w={380} h={62} color={C.primary} filled bold
        label="SMS1 — Primo contatto" sub="Giorno prima (orario da tabella)" />
      <MsgBox x={x + 480} y={sms1Y} w={370} lines={[
        "{{salon_name}}:", "Promemoria domani alle {{ora}}", "",
        "Conferma, sposta o annulla clicca qui:", "{{link}}",
      ]} color={C.primary} />
      <Arr x1={x} y1={sms1Y + 32} x2={x} y2={dec1Y - 36} color={C.muted} />
      <Diamond x={x} y={dec1Y} label="Azione cliente?" color={C.green} size={36} />
      <ElbowArr x1={x - 58} y1={dec1Y} x2={leftPillX} y2={dec1Y - 65}
        color={C.amber} label="Sposta" midY={dec1Y - 50} dashed />
      <Pill x={leftPillX} y={dec1Y - 65} w={160} color={C.amber} label="Reset flow" />
      <ElbowArr x1={x - 58} y1={dec1Y + 18} x2={leftPillX} y2={dec1Y + 65}
        color={C.red} label="Annulla" midY={dec1Y + 50} />
      <Pill x={leftPillX} y={dec1Y + 65} w={160} color={C.red} label="Fine flusso" />
      <ElbowArr x1={x + 58} y1={dec1Y} x2={confX} y2={confRemY - 36}
        color={C.green} label="Conferma" midY={dec1Y + 60} />
      <Arr x1={x} y1={dec1Y + 36} x2={x} y2={sms2Y - 36} color={C.red}
        label="Non risponde" labelSide="left" dashed />
      <RBox x={x} y={sms2Y} w={380} h={62} color={C.red} filled bold
        label="SMS2 — Follow-up" sub="Orario da tabella (stessi tempi)" />
      <MsgBox x={x - 460} y={sms2Y} w={360} lines={[
        "{{salon_name}}:", "Conferma il tuo appuntamento",
        "{{short_data}} {{ora}}", "", "Clicca qui:", "{{link}}",
      ]} color={C.red} />
      <Arr x1={x} y1={sms2Y + 32} x2={x} y2={dec2Y - 36} color={C.muted} />
      <Diamond x={x} y={dec2Y} label="Azione?" color={C.green} size={32} />
      <ElbowArr x1={x + 52} y1={dec2Y} x2={x + 300} y2={midY - 30}
        color={C.green} label="Conferma" midY={dec2Y + 50} />
      <ElbowArr x1={x - 52} y1={dec2Y} x2={leftPillX} y2={dec2Y}
        color={C.red} label="Annulla" midY={dec2Y - 24} />
      <Pill x={leftPillX} y={dec2Y} w={130} color={C.red} label="Fine" />
      <ElbowArr x1={x - 52} y1={dec2Y + 18} x2={leftPillX} y2={dec2Y + 65}
        color={C.amber} label="Sposta" midY={dec2Y + 50} />
      <Pill x={leftPillX} y={dec2Y + 65} w={130} color={C.amber} label="Reset" />
      <Arr x1={x} y1={dec2Y + 32} x2={x} y2={adminY - 36} color={C.red}
        label="Non risponde" labelSide="left" dashed />
      <RBox x={x} y={adminY} w={380} h={70} color={C.orange} filled bold
        label="ADMIN — Notifica al titolare" sub="Orario da tabella · Default: tenere appuntamento" />
      <MsgBox x={x - 460} y={adminY} w={340} lines={[
        "Push al titolare del salone:", "\"Cliente X non ha confermato\"",
        "Badge in tabella ricontatti", "Admin decide: mantenere o annullare",
      ]} color={C.orange} />
      <ElbowArr x1={x + 190} y1={adminY} x2={x + 300} y2={midY - 30}
        color={C.purple} label="Mantenuto" midY={adminY + 60} dashed />
      <RBox x={confX} y={confRemY} w={400} h={62} color={C.green} filled bold
        label="Reminder conferma" sub="Giorno stesso ore 09:00" />
      <MsgBox x={confX + 480} y={confRemY} w={370} lines={[
        "{{salon_name}}:", "Oggi alle {{ora}}", "",
        "Se vuoi modificare clicca qui:", "{{link}}",
      ]} color={C.green} />
      <Arr x1={confX} y1={confRemY + 32} x2={confX} y2={confDecY - 36} color={C.muted} />
      <Diamond x={confX} y={confDecY} label="Azione?" color={C.green} size={32} />
      <Arr x1={confX} y1={confDecY + 32} x2={confX} y2={midY - 30} color={C.green}
        label="Nessuna azione = Confermato" labelSide="right" />
      <ElbowArr x1={confX + 52} y1={confDecY} x2={confX + 340} y2={confDecY - 45}
        color={C.red} label="Annulla" midY={confDecY - 32} />
      <Pill x={confX + 340} y={confDecY - 45} w={120} color={C.red} label="Fine" />
      <ElbowArr x1={confX + 52} y1={confDecY + 18} x2={confX + 340} y2={confDecY + 45}
        color={C.amber} label="Sposta" midY={confDecY + 32} />
      <Pill x={confX + 340} y={confDecY + 45} w={130} color={C.amber} label="Reset" />
      <RBox x={x + 300} y={midY} w={420} h={62} color={C.purple} filled bold
        label="Link metà trattamento" sub="A metà durata servizio · Escalation Push/WA/SMS" />
      <MsgBox x={x + 300 + 500} y={midY} w={340} label="LINK METÀ TRATTAMENTO" lines={[
        "{{salon_name}}: Scarica la nostra app!", "glow-up.it",
      ]} color={C.purple} />
    </g>
  );
}

// ── Case B/C column ─────────────────────────────────────────

function CaseWithAdminColumn({ x, y, color, timingLabel }: {
  x: number; y: number; color: string; timingLabel: string;
}) {
  const vGap = 160;
  let cy = y;
  const remY = cy; cy += vGap;
  const decY = cy; cy += vGap + 40;
  const adminY = cy; cy += vGap;
  const midY = cy;

  return (
    <g>
      <RBox x={x} y={remY} w={340} h={60} color={color} filled bold
        label="SMS — Reminder" sub={timingLabel} />
      <MsgBox x={x} y={remY + 84} w={300} lines={[
        "{{salon_name}}:", "Promemoria alle {{ora}}", "",
        "Conferma, sposta o annulla clicca qui:", "{{link}}",
      ]} color={color} />
      <Arr x1={x} y1={remY + 134} x2={x} y2={decY - 36} color={C.muted} />
      <Diamond x={x} y={decY} label="Azione?" color={C.green} size={32} />
      <Arr x1={x + 52} y1={decY} x2={x + 200} y2={decY} color={C.green} label="Conferma" />
      <ElbowArr x1={x + 200} y1={decY} x2={x + 200} y2={midY - 28}
        color={C.green} midY={decY + 50} />
      <Arr x1={x} y1={decY + 32} x2={x} y2={adminY - 36} color={C.red}
        label="Non risponde" labelSide="left" dashed />
      <ElbowArr x1={x - 52} y1={decY} x2={x - 200} y2={decY}
        color={C.red} label="Annulla" midY={decY - 22} />
      <Pill x={x - 200} y={decY} w={120} color={C.red} label="Fine" />
      <ElbowArr x1={x - 52} y1={decY + 18} x2={x - 200} y2={decY + 65}
        color={C.amber} label="Sposta" midY={decY + 50} />
      <Pill x={x - 200} y={decY + 65} w={130} color={C.amber} label="Reset" />
      <RBox x={x} y={adminY} w={340} h={60} color={C.orange} filled bold
        label="ADMIN — Notifica al titolare" sub="Default: tenere appuntamento" />
      <Arr x1={x} y1={adminY + 30} x2={x} y2={midY - 28} color={C.purple} dashed />
      <RBox x={x} y={midY} w={340} h={56} color={C.purple} filled bold
        label="Link metà trattamento" sub="Escalation Push/WA/SMS" />
    </g>
  );
}

// ── Case D column ───────────────────────────────────────────

function CaseDColumn({ x, y }: { x: number; y: number }) {
  const color = C.orange;
  const vGap = 150;
  let cy = y;
  const remY = cy; cy += vGap;
  const decY = cy; cy += vGap + 40;
  const midY = cy;

  return (
    <g>
      <RBox x={x} y={remY} w={320} h={60} color={color} filled bold
        label="SMS — Reminder" sub="1h prima dell'appuntamento" />
      <MsgBox x={x} y={remY + 84} w={290} lines={[
        "{{salon_name}}:", "Promemoria alle {{ora}}", "",
        "Conferma, sposta o annulla clicca qui:", "{{link}}",
      ]} color={color} />
      <Arr x1={x} y1={remY + 134} x2={x} y2={decY - 36} color={C.muted} />
      <Diamond x={x} y={decY} label="Azione?" color={C.green} size={32} />
      <Arr x1={x + 52} y1={decY} x2={x + 180} y2={decY} color={C.green} label="Conferma" />
      <ElbowArr x1={x + 180} y1={decY} x2={x + 180} y2={midY - 28}
        color={C.green} midY={decY + 50} />
      <Arr x1={x} y1={decY + 32} x2={x} y2={midY - 28} color={C.red}
        label="Non risponde" labelSide="left" dashed />
      <ElbowArr x1={x - 52} y1={decY} x2={x - 190} y2={decY}
        color={C.red} label="Annulla" midY={decY - 22} />
      <Pill x={x - 190} y={decY} w={120} color={C.red} label="Fine" />
      <ElbowArr x1={x - 52} y1={decY + 18} x2={x - 190} y2={decY + 65}
        color={C.amber} label="Sposta" midY={decY + 50} />
      <Pill x={x - 190} y={decY + 65} w={130} color={C.amber} label="Reset" />
      <RBox x={x} y={midY} w={320} h={56} color={C.purple} filled bold
        label="Link metà trattamento" sub="Escalation Push/WA/SMS" />
    </g>
  );
}

// ── Case E column ───────────────────────────────────────────

function CaseEColumn({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <RBox x={x} y={y} w={280} h={56} color={C.gray} filled
        label="Nessun reminder" sub="Meno di 2h all'appuntamento" />
      <Arr x1={x} y1={y + 28} x2={x} y2={y + 120} color={C.purple} />
      <RBox x={x} y={y + 148} w={280} h={56} color={C.purple} filled bold
        label="Link metà trattamento" sub="Escalation Push/WA/SMS" />
    </g>
  );
}

// ── Main Component ──────────────────────────────────────────

interface Props {
  flowConfig?: FlowConfig | null;
  modelId?: string;
  readOnly?: boolean;
}

export default function ReminderFlowDiagram({ flowConfig: propConfig, modelId, readOnly = false }: Props = {}) {
  const { t } = useTranslation();
  const {
    offsets, editMode, setEditMode, updateOffset, updateOffsetMulti,
    resetOffsets, o, selectedIds, toggleSelect, selectByRect, clearSelection,
    undo, redo, canUndo, canRedo, commitHistory,
    selectedArrowId, setSelectedArrowId,
    anchorOverrides, cycleArrowAnchor,
    hoveredInMarquee, previewMarquee,
  } = useFlowLayout(modelId);
  const scaleRef = useRef(0.25);

  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const marqueeStart = useRef<{ sx: number; sy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!editMode) return;
    const handler = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (e.key === "z" && e.shiftKey) { e.preventDefault(); redo(); }
      else if (e.key === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editMode, undo, redo]);

  const { data: dbModel, isLoading } = useQuery({
    queryKey: ["reminder-flow-active-model-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminder_flow_models")
        .select("flow_config")
        .eq("is_active", true)
        .limit(1)
        .single();
      if (error) throw error;
      return data?.flow_config as unknown as FlowConfig | null;
    },
    enabled: !propConfig,
  });

  const onNodeClick = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail) toggleSelect(detail.id, detail.shiftKey);
  }, [toggleSelect]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener("flow-node-click", onNodeClick);
    return () => svg.removeEventListener("flow-node-click", onNodeClick);
  }, [onNodeClick]);

  const config = propConfig || dbModel;

  // Delegate to SimpleFlowDiagram for simple templates
  if (config && isSimpleTemplate(config)) {
    return <SimpleFlowDiagramComponent flowConfig={config} modelId={modelId} readOnly={readOnly} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!config || !config.cases) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {t("reminderFlow.noConfig", "Nessuna configurazione di flusso trovata.")}
      </div>
    );
  }

  const waDelay = config.channel_escalation?.delays_min?.whatsapp ?? 10;
  const smsDelay = config.channel_escalation?.delays_min?.sms ?? 20;

  const caseAX = 600;
  const caseBX = 2500;
  const caseCX = 3300;
  const caseDX = 4000;
  const caseEX = 4600;
  const timingTableY = 40;
  const startY = 660;
  const step0Y = 770;
  const step0DecY = 870;
  const diamondY = 970;
  const casesStartY = 1140;
  const W = 5000;
  const H = 3500;

  const bounds: NodeBounds = {
    timing: { cx: 600, cy: timingTableY + 250, w: 1160, h: 500 },
    legend: { cx: W - 625, cy: timingTableY + 50, w: 950, h: 80 },
    start: { cx: caseAX, cy: startY, w: 440, h: 40 },
    step0: { cx: caseAX, cy: step0Y, w: 500, h: 80 },
    step0dec: { cx: caseAX, cy: step0DecY + 10, w: 120, h: 80 },
    diamond: { cx: caseAX, cy: diamondY, w: 130, h: 76 },
    caseA: { cx: caseAX, cy: casesStartY + 19, w: 170, h: 70 },
    caseB: { cx: caseBX, cy: casesStartY + 19, w: 170, h: 70 },
    caseC: { cx: caseCX, cy: casesStartY + 19, w: 170, h: 70 },
    caseD: { cx: caseDX, cy: casesStartY + 19, w: 170, h: 70 },
    caseE: { cx: caseEX, cy: casesStartY + 19, w: 170, h: 70 },
    "bottom-legend": { cx: W / 2, cy: H - 350, w: 1600, h: 60 },
    escalation: { cx: 660, cy: H - 155, w: 1200, h: 270 },
  };

  const dg = { updateOffset, updateOffsetMulti, commitHistory };

  const onArrowClick = (arrowId: string) => {
    setSelectedArrowId(prev => prev === arrowId ? null : arrowId);
  };

  const sa = (arrowId: string, from: string, to: string, color: string, opts?: {
    label?: string; elbow?: boolean; labelSide?: "left" | "right"; dashed?: boolean;
  }) => (
    <SmartArr
      key={arrowId}
      arrowId={arrowId}
      from={from} to={to} color={color}
      bounds={bounds} o={o}
      anchorOverrides={anchorOverrides}
      onArrowClick={onArrowClick}
      isSelected={selectedArrowId === arrowId}
      {...opts}
    />
  );

  const svgPointFromEvent = (e: React.PointerEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const onSvgPointerDown = (e: React.PointerEvent) => {
    if (!editMode) return;
    const target = e.target as SVGElement;
    if (target.closest("[data-node-id],[data-arrow-id],[data-anchor-dot]")) return;
    const pt = svgPointFromEvent(e);
    marqueeStart.current = { sx: pt.x, sy: pt.y };
    setMarquee({ x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y });
    (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
  };

  const onSvgPointerMove = (e: React.PointerEvent) => {
    if (!marqueeStart.current || !editMode) return;
    const pt = svgPointFromEvent(e);
    const newMarquee = { x1: marqueeStart.current.sx, y1: marqueeStart.current.sy, x2: pt.x, y2: pt.y };
    setMarquee(newMarquee);
    previewMarquee(newMarquee, bounds);
  };

  const onSvgPointerUp = (e: React.PointerEvent) => {
    if (!marqueeStart.current) return;
    if (marquee) {
      const dx = Math.abs(marquee.x2 - marquee.x1);
      const dy = Math.abs(marquee.y2 - marquee.y1);
      if (dx > 20 || dy > 20) {
        selectByRect(marquee, bounds, e.shiftKey || e.ctrlKey || e.metaKey);
      } else {
        clearSelection();
      }
    }
    marqueeStart.current = null;
    setMarquee(null);
    previewMarquee(null, bounds);
  };

  return (
    <div className="w-full border rounded-lg bg-card/50 overflow-hidden relative" style={{ maxHeight: "85vh" }}>
      {!readOnly && (
        <EditorControls
          editMode={editMode}
          setEditMode={(v) => { setEditMode(v); clearSelection(); }}
          canUndo={canUndo} canRedo={canRedo} undo={undo} redo={redo}
          selectedIds={selectedIds} selectedArrowId={selectedArrowId}
          hoveredInMarquee={hoveredInMarquee} marqueeActive={!!marquee}
          resetOffsets={resetOffsets} modelId={modelId}
        />
      )}

      <AnchorCycleContext.Provider value={cycleArrowAnchor}>
        <FlowEditContext.Provider value={{
          editMode, offsets, scale: scaleRef.current, selectedIds,
          selectedArrowId, hoveredInMarquee,
        }}>
          <ZoomPanContainer width={W} height={H} editMode={editMode} scaleRef={scaleRef}>
            <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width={W} height={H}
              onPointerDown={onSvgPointerDown}
              onPointerMove={onSvgPointerMove}
              onPointerUp={onSvgPointerUp}
            >
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill={C.muted} />
                </marker>
              </defs>

              <GridGuides W={W} H={H} editMode={editMode} />

              {/* ════════ TIMING TABLES ════════ */}
              <DraggableG id="timing" {...dg} bounds={bounds.timing}>
                <TimingTables x={40} y={timingTableY} config={config} />
              </DraggableG>

              {/* ════════ LEGEND ════════ */}
              <DraggableG id="legend" {...dg} bounds={bounds.legend}>
                <g transform={`translate(${W - 1100}, ${timingTableY + 10})`}>
                  <text fill={C.fg} fontSize={14} fontWeight={800}>Legenda canali:</text>
                  <g transform="translate(0, 24)">
                    <text fill={C.mutedFg} fontSize={12}>
                      Ogni messaggio: Escalation Push → WhatsApp (+{waDelay}min) → SMS (+{smsDelay}min)
                    </text>
                  </g>
                  <g transform="translate(0, 56)">
                    {[
                      { l: "Messaggio cliente", c: C.primary },
                      { l: "Conferma", c: C.green },
                      { l: "Non risponde", c: C.red },
                      { l: "Sposta", c: C.amber },
                      { l: "Metà trattamento", c: C.purple },
                    ].map((it, i) => (
                      <g key={i} transform={`translate(${i * 190}, 0)`}>
                        <rect width={16} height={16} rx={4} fill={it.c} opacity={0.25} stroke={it.c} strokeWidth={1.5} />
                        <text x={22} y={13} fill={C.mutedFg} fontSize={11} fontWeight={600}>{it.l}</text>
                      </g>
                    ))}
                  </g>
                </g>
              </DraggableG>

              {/* ════════ START ════════ */}
              <DraggableG id="start" {...dg} bounds={bounds.start}>
                <Pill x={caseAX} y={startY} w={440} color={C.primary}
                  label="Nuovo Appuntamento Salvato" bold />
              </DraggableG>

              {sa("start-step0", "start", "step0", C.muted)}

              {/* ════════ STEP 0 ════════ */}
              <DraggableG id="step0" {...dg} bounds={bounds.step0}>
                <RBox x={caseAX} y={step0Y} w={480} h={65} color={C.green} filled bold
                  label="Step 0: Messaggio immediato"
                  sub="Inviato automaticamente per ogni nuovo evento salvato" />
                <MsgBox x={caseAX + 530} y={step0Y} w={380} lines={[
                  "{{salon_name}}:", "Appuntamento confermato",
                  "{{short_data}} {{ora}}", "",
                  "Se vuoi annullarlo o spostarlo clicca qui:", "{{link}}",
                ]} color={C.green} />
              </DraggableG>

              {sa("step0-step0dec", "step0", "step0dec", C.muted)}

              {/* ════════ STEP 0 DECISION ════════ */}
              <DraggableG id="step0dec" {...dg} bounds={bounds.step0dec}>
                <Diamond x={caseAX} y={step0DecY} label="Azione?" color={C.green} size={30} />
                <ElbowArr x1={caseAX - 48} y1={step0DecY} x2={caseAX - 380} y2={step0DecY}
                  color={C.red} label="Annulla" midY={step0DecY - 20} />
                <Pill x={caseAX - 380} y={step0DecY} w={170} color={C.red} label="Fine flusso" />
                <ElbowArr x1={caseAX - 48} y1={step0DecY + 16} x2={caseAX - 380} y2={step0DecY + 65}
                  color={C.amber} label="Sposta" midY={step0DecY + 50} />
                <Pill x={caseAX - 380} y={step0DecY + 65} w={170} color={C.amber} label="Reset flow" />
              </DraggableG>

              {sa("step0dec-diamond", "step0dec", "diamond", C.muted, { label: "Nessuna azione", labelSide: "right" })}

              {/* ════════ DIAMOND ════════ */}
              <DraggableG id="diamond" {...dg} bounds={bounds.diamond}>
                <Diamond x={caseAX} y={diamondY} label="Ore mancanti?" color={C.primary} size={38} />
                <text x={caseAX + 70} y={diamondY + 50} fill={C.mutedFg} fontSize={12} fontWeight={600}>
                  * I Casi B, C, D, E si attivano in base alle ore mancanti all'appuntamento
                </text>
              </DraggableG>

              {sa("diamond-caseA", "diamond", "caseA", C.primary, { label: "> 24h", elbow: true })}

              {/* ════════ CASES ════════ */}
              {[
                { id: "caseA", x: caseAX, key: "A", label: "> 24h", color: C.primary },
                { id: "caseB", x: caseBX, key: "B", label: "12–24h", color: C.sky },
                { id: "caseC", x: caseCX, key: "C", label: "4–12h", color: C.amber },
                { id: "caseD", x: caseDX, key: "D", label: "2–4h", color: C.orange },
                { id: "caseE", x: caseEX, key: "E", label: "< 2h", color: C.gray },
              ].map(({ id, x, key, label, color }) => {
                const col = CASE_COLORS[key] || C.gray;
                return (
                  <DraggableG key={key} id={id} {...dg} bounds={bounds[id]}>
                    <rect x={x - 75} y={casesStartY - 8} width={150} height={54} rx={12}
                      fill={col} opacity={0.2} stroke={col} strokeWidth={2.5} />
                    {key !== "A" && (
                      <text x={x + 80} y={casesStartY + 4} fill={col} fontSize={22} fontWeight={800}>*</text>
                    )}
                    <text x={x} y={casesStartY + 20} textAnchor="middle" fill={C.fg}
                      fontSize={18} fontWeight={800}>CASO {key}</text>
                    <text x={x} y={casesStartY + 38} textAnchor="middle" fill={col}
                      fontSize={13} fontWeight={600}>{label}</text>
                    <Arr x1={x} y1={casesStartY + 46} x2={x} y2={casesStartY + 90} color={color} />
                    {key === "A" && <CaseAColumn x={x} y={casesStartY + 120} />}
                    {key === "B" && <CaseWithAdminColumn x={x} y={casesStartY + 120} color={C.sky} timingLabel="Orario da tabella (vedi sopra)" />}
                    {key === "C" && <CaseWithAdminColumn x={x} y={casesStartY + 120} color={C.amber} timingLabel="2h prima dell'appuntamento" />}
                    {key === "D" && <CaseDColumn x={x} y={casesStartY + 120} />}
                    {key === "E" && <CaseEColumn x={x} y={casesStartY + 120} />}
                  </DraggableG>
                );
              })}

              {/* ════════ BOTTOM LEGEND ════════ */}
              <DraggableG id="bottom-legend" {...dg} bounds={bounds["bottom-legend"]}>
                <line x1={60} y1={H - 380} x2={1700} y2={H - 380}
                  stroke={C.muted} strokeWidth={0.5} strokeDasharray="8,4" />
                <g transform={`translate(${W / 2 - 800}, ${H - 350})`}>
                  {[
                    { l: "Conferma", c: C.green, d: "Caso A: flow → reminder conferma. B/C/D/E: link metà trattamento" },
                    { l: "Annulla", c: C.red, d: "Flow chiuso (anche da Step 0), appuntamento cancellato" },
                    { l: "Sposta", c: C.amber, d: "Flow cancellato e ricreato da Step 0 con nuovi orari" },
                    { l: "Nessuna azione", c: C.orange, d: "A/B/C: Admin notificato (default: tenere)" },
                  ].map((opt, i) => (
                    <g key={i} transform={`translate(${i * 400}, 0)`}>
                      <rect x={0} y={0} width={380} height={34} rx={8} fill={opt.c} opacity={0.1}
                        stroke={opt.c} strokeWidth={1} />
                      <text x={14} y={22} fill={opt.c} fontSize={13} fontWeight={700}>{opt.l}</text>
                      <text x={120} y={22} fill={C.mutedFg} fontSize={10}>{opt.d}</text>
                    </g>
                  ))}
                </g>
              </DraggableG>

              {/* ════════ ESCALATION RULES ════════ */}
              <DraggableG id="escalation" {...dg} bounds={bounds.escalation}>
                <g transform={`translate(60, ${H - 290})`}>
                  <rect x={0} y={0} width={1200} height={270} rx={16}
                    fill={C.primary} opacity={0.03} stroke={C.primary} strokeWidth={1.5} />
                  <text x={24} y={32} fill={C.fg} fontSize={16} fontWeight={800}>
                    📡 Logica di escalation canali per ogni nodo
                  </text>
                  <g transform="translate(24, 52)">
                    <rect x={0} y={0} width={200} height={40} rx={10}
                      fill={C.green} opacity={0.15} stroke={C.green} strokeWidth={2} />
                    <text x={100} y={25} textAnchor="middle" fill={C.green} fontSize={13} fontWeight={700}>
                      Glowup (subito)
                    </text>
                    <line x1={200} y1={20} x2={260} y2={20} stroke={C.muted} strokeWidth={1.5} markerEnd="url(#arrow)" />
                    <text x={230} y={14} textAnchor="middle" fill={C.mutedFg} fontSize={9} fontWeight={600}>+10min</text>
                    <rect x={260} y={0} width={200} height={40} rx={10}
                      fill={C.green} opacity={0.15} stroke={C.green} strokeWidth={2} />
                    <text x={360} y={25} textAnchor="middle" fill={C.green} fontSize={13} fontWeight={700}>
                      WhatsApp (+10min)
                    </text>
                    <line x1={460} y1={20} x2={520} y2={20} stroke={C.muted} strokeWidth={1.5} markerEnd="url(#arrow)" />
                    <text x={490} y={14} textAnchor="middle" fill={C.mutedFg} fontSize={9} fontWeight={600}>+20min</text>
                    <rect x={520} y={0} width={200} height={40} rx={10}
                      fill={C.green} opacity={0.15} stroke={C.green} strokeWidth={2} />
                    <text x={620} y={25} textAnchor="middle" fill={C.green} fontSize={13} fontWeight={700}>
                      SMS (+20min)
                    </text>
                  </g>
                  <g transform="translate(24, 110)">
                    {[
                      { icon: "✅", title: "Consegna su Glowup", desc: "→ WhatsApp e SMS di quel nodo NON vengono inviati. Il flusso prosegue normalmente per i nodi successivi.", color: C.green },
                      { icon: "✅", title: "Azione su WhatsApp", desc: "→ Solo l'SMS di quel nodo NON viene inviato. Il flusso prosegue normalmente per i nodi successivi.", color: C.sky },
                      { icon: "⏳", title: "Nessuna azione", desc: "→ Il flusso percorre tutti e tre i canali (Glowup → WhatsApp → SMS) rispettando i tempi indicati.", color: C.orange },
                      { icon: "🔄", title: "Appuntamento spostato", desc: "→ Il flusso salvato viene CANCELLATO e SOSTITUITO con uno nuovo calcolato sui nuovi orari (riparte da Step 0).", color: C.amber },
                    ].map((rule, i) => (
                      <g key={i} transform={`translate(0, ${i * 38})`}>
                        <rect x={0} y={0} width={1150} height={32} rx={8}
                          fill={rule.color} opacity={0.06} />
                        <text x={14} y={22} fill={rule.color} fontSize={13} fontWeight={700}>
                          {rule.icon} {rule.title}
                        </text>
                        <text x={280} y={22} fill={C.mutedFg} fontSize={12} fontWeight={500}>
                          {rule.desc}
                        </text>
                      </g>
                    ))}
                  </g>
                </g>
              </DraggableG>

              <MarqueeRect marquee={marquee} editMode={editMode} hoveredInMarquee={hoveredInMarquee} />
            </svg>
          </ZoomPanContainer>
        </FlowEditContext.Provider>
      </AnchorCycleContext.Provider>
    </div>
  );
}
