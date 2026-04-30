import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FlowConfig, NodeBounds,
  C, useFlowLayout, DraggableG, SmartArr, ZoomPanContainer,
  FlowEditContext, AnchorCycleContext, EditorControls, MarqueeRect, GridGuides,
  RBox, Pill, Diamond, MsgBox, Arr, ElbowArr, EscalationLegend,
} from "./FlowEditorCore";

// ── Template-specific Components ────────────────────────────

function DecisionBlock({ x, y, showReset = true }: { x: number; y: number; showReset?: boolean }) {
  return (
    <g>
      <Diamond x={x} y={y} label="Azione?" color={C.green} size={32} />
      <ElbowArr x1={x + 52} y1={y} x2={x + 220} y2={y}
        color={C.green} label="Conferma" midY={y - 20} />
      <Pill x={x + 220} y={y} w={120} color={C.green} label="Confermato" />
      <ElbowArr x1={x - 52} y1={y} x2={x - 220} y2={y}
        color={C.red} label="Annulla" midY={y - 20} />
      <Pill x={x - 220} y={y} w={120} color={C.red} label="Fine" />
      {showReset && (
        <>
          <ElbowArr x1={x - 52} y1={y + 18} x2={x - 220} y2={y + 65}
            color={C.amber} label="Sposta" midY={y + 50} />
          <Pill x={x - 220} y={y + 65} w={140} color={C.amber} label="Reset flow" />
        </>
      )}
    </g>
  );
}

// ── Template Type Detection ─────────────────────────────────

type TemplateType = "solo_conferma" | "solo_reminder" | "conferma_reminder" | "complex";

function detectTemplateType(config: FlowConfig): TemplateType {
  const cases = Object.values(config.cases);
  const allNodes = cases.flatMap(c => c.nodes);
  const hasTimingTables = cases.some(c => c.timing_tables && Object.keys(c.timing_tables).length > 0);
  const hasAdminNode = allNodes.some(n => n.node_type === "admin_escalation");
  const hasMidTreatment = allNodes.some(n => n.node_type === "mid_treatment_link");
  const hasNoResponse = allNodes.some(n => n.node_type === "no_response_followup");
  if (hasTimingTables || hasAdminNode || hasMidTreatment || hasNoResponse) return "complex";
  const sendConfirmation = config.send_confirmation !== false;
  const totalNodes = allNodes.length;
  if (sendConfirmation && totalNodes === 0) return "solo_conferma";
  if (!sendConfirmation && totalNodes > 0) return "solo_reminder";
  if (sendConfirmation && totalNodes > 0) return "conferma_reminder";
  return "complex";
}

export function isSimpleTemplate(config: FlowConfig | null | undefined): boolean {
  if (!config?.cases) return false;
  return detectTemplateType(config) !== "complex";
}

// ══════════════════════════════════════════════════════════════
// ── TEMPLATE 1: Solo Conferma ───────────────────────────────
// ══════════════════════════════════════════════════════════════

function SoloConfermaContent({ waDelay, smsDelay, dg, bounds }: {
  waDelay: number; smsDelay: number;
  dg: { updateOffset: any; updateOffsetMulti: any; commitHistory: any };
  bounds: NodeBounds;
}) {
  const cx = 900;
  return (
    <>
      <DraggableG id="sc-start" {...dg} bounds={bounds["sc-start"]}>
        <Pill x={cx} y={60} w={440} color={C.primary} label="Nuovo Appuntamento Salvato" bold />
      </DraggableG>

      <DraggableG id="sc-step0" {...dg} bounds={bounds["sc-step0"]}>
        <RBox x={cx} y={170} w={480} h={65} color={C.green} filled bold
          label="Conferma immediata"
          sub="Inviato automaticamente alla creazione dell'appuntamento" />
        <MsgBox x={cx + 500} y={170} w={380} lines={[
          "{{salon_name}}:",
          "Appuntamento confermato",
          "{{short_data}} {{ora}}",
          "",
          "Se vuoi annullarlo o spostarlo",
          "clicca qui: {{link}}",
        ]} color={C.green} />
      </DraggableG>

      <DraggableG id="sc-decision" {...dg} bounds={bounds["sc-decision"]}>
        <DecisionBlock x={cx} y={310} />
      </DraggableG>

      <DraggableG id="sc-noaction" {...dg} bounds={bounds["sc-noaction"]}>
        <RBox x={cx} y={440} w={360} h={50} color={C.gray}
          label="Nessun altro messaggio" sub="Solo la conferma iniziale viene inviata" />
      </DraggableG>

      <DraggableG id="sc-escalation" {...dg} bounds={bounds["sc-escalation"]}>
        <EscalationLegend x={300} y={560} waDelay={waDelay} smsDelay={smsDelay} />
      </DraggableG>
    </>
  );
}

function getSoloConfermaBounds(): NodeBounds {
  const cx = 900;
  return {
    "sc-start": { cx, cy: 60, w: 440, h: 40 },
    "sc-step0": { cx: cx + 100, cy: 170, w: 900, h: 65 },
    "sc-decision": { cx, cy: 310, w: 600, h: 140 },
    "sc-noaction": { cx, cy: 430, w: 360, h: 80 },
    "sc-escalation": { cx: 900, cy: 660, w: 1200, h: 200 },
  };
}

// ══════════════════════════════════════════════════════════════
// ── TEMPLATE 2: Solo Reminder ───────────────────────────────
// (Identical to Conferma + Reminder, minus Step 0)
// ══════════════════════════════════════════════════════════════

function SoloReminderContent({ waDelay, smsDelay, dg, bounds }: {
  waDelay: number; smsDelay: number;
  dg: { updateOffset: any; updateOffsetMulti: any; commitHistory: any };
  bounds: NodeBounds;
}) {
  const startX = 1800;
  const caseAX = 600;
  const caseBX = 1800;
  const caseCX = 3000;

  return (
    <>
      <DraggableG id="sr-start" {...dg} bounds={bounds["sr-start"]}>
        <Pill x={startX} y={60} w={440} color={C.primary} label="Nuovo Appuntamento Salvato" bold />
      </DraggableG>

      <DraggableG id="sr-noconf" {...dg} bounds={bounds["sr-noconf"]}>
        <RBox x={startX} y={170} w={400} h={50} color={C.gray}
          label="Nessuna conferma immediata" sub="Il cliente non riceve messaggio alla creazione" />
      </DraggableG>

      <DraggableG id="sr-diamond" {...dg} bounds={bounds["sr-diamond"]}>
        <Diamond x={startX} y={420} label="Ore mancanti?" color={C.primary} size={38} />
      </DraggableG>

      {/* Case A: 2 reminders with conditional R2 (identical to CR) */}
      <DraggableG id="sr-caseA" {...dg} bounds={bounds["sr-caseA"]}>
        <rect x={caseAX - 80} y={530} width={160} height={50} rx={12}
          fill={C.primary} opacity={0.2} stroke={C.primary} strokeWidth={2.5} />
        <text x={caseAX} y={550} textAnchor="middle" fill={C.fg} fontSize={16} fontWeight={800}>CASO A</text>
        <text x={caseAX} y={570} textAnchor="middle" fill={C.primary} fontSize={12} fontWeight={600}>&gt; 24h</text>
        <Arr x1={caseAX} y1={580} x2={caseAX} y2={620} color={C.primary} />

        {/* Reminder 1 */}
        <RBox x={caseAX} y={650} w={380} h={62} color={C.primary} filled bold
          label="Reminder 1" sub="Giorno prima, stessa ora appuntamento" />
        <MsgBox x={caseAX + 440} y={650} w={380} lines={[
          "Azione richiesta! {{salon_name}}:",
          "Domani ore {{ora}}",
          "",
          "Conferma o annulla appuntamento",
          "cliccando qui: {{link}}",
        ]} color={C.primary} />
        <Arr x1={caseAX} y1={682} x2={caseAX} y2={770} color={C.muted} />
        <DecisionBlock x={caseAX} y={800} />

        {/* After Decision: conditional diamond for Reminder 2 */}
        <Arr x1={caseAX} y1={832} x2={caseAX} y2={910} color={C.muted}
          label="Nessuna azione / Confermato" labelSide="right" />

        {/* Diamond: Was R1 confirmed? */}
        <Diamond x={caseAX} y={940} label="Confermato R1?" color={C.sky} size={34} />

        {/* LEFT branch: NOT confirmed → solicitation message */}
        <ElbowArr x1={caseAX - 54} y1={940} x2={caseAX - 380} y2={940}
          color={C.amber} label="Non confermato" midY={920} />

        <RBox x={caseAX - 380} y={1020} w={360} h={62} color={C.amber} filled bold
          label="Reminder 2 (sollecito)" sub="2h prima – richiede conferma" />
        <MsgBox x={caseAX - 380} y={1095} w={380} lines={[
          "Azione Richiesta! {{salon_name}}:",
          "Oggi, ore {{ora}}",
          "",
          "Conferma o annulla appuntamento",
          "qui: {{link}}",
        ]} color={C.amber} />
        <Arr x1={caseAX - 380} y1={1052} x2={caseAX - 380} y2={1210} color={C.muted} />
        <DecisionBlock x={caseAX - 380} y={1240} />

        {/* RIGHT branch: Confirmed → friendly reminder */}
        <ElbowArr x1={caseAX + 54} y1={940} x2={caseAX + 380} y2={940}
          color={C.green} label="Confermato" midY={920} />

        <RBox x={caseAX + 380} y={1020} w={360} h={62} color={C.green} filled bold
          label="Reminder 2 (ci vediamo)" sub="2h prima – promemoria gentile" />
        <MsgBox x={caseAX + 380 + 420} y={1020} w={380} lines={[
          "{{salon_name}}:",
          "Ci vediamo oggi alle {{ora}}!",
          "",
          "Se hai bisogno di modificare",
          "clicca qui: {{link}}",
        ]} color={C.green} />
        <Arr x1={caseAX + 380} y1={1052} x2={caseAX + 380} y2={1140} color={C.muted} />
        <DecisionBlock x={caseAX + 380} y={1170} showReset={false} />
      </DraggableG>

      {/* Case B */}
      <DraggableG id="sr-caseB" {...dg} bounds={bounds["sr-caseB"]}>
        <rect x={caseBX - 80} y={530} width={160} height={50} rx={12}
          fill={C.sky} opacity={0.2} stroke={C.sky} strokeWidth={2.5} />
        <text x={caseBX} y={550} textAnchor="middle" fill={C.fg} fontSize={16} fontWeight={800}>CASO B</text>
        <text x={caseBX} y={570} textAnchor="middle" fill={C.sky} fontSize={12} fontWeight={600}>2 – 24h</text>
        <Arr x1={caseBX} y1={580} x2={caseBX} y2={620} color={C.sky} />
        <RBox x={caseBX} y={650} w={360} h={62} color={C.sky} filled bold
          label="Reminder" sub="2h prima dell'appuntamento" />
        <MsgBox x={caseBX + 420} y={650} w={380} lines={[
          "Azione Richiesta! {{salon_name}}:",
          "Oggi, ore {{ora}}",
          "",
          "Conferma o annulla appuntamento",
          "qui: {{link}}",
        ]} color={C.sky} />
        <Arr x1={caseBX} y1={682} x2={caseBX} y2={770} color={C.muted} />
        <DecisionBlock x={caseBX} y={800} />
      </DraggableG>

      {/* Case C */}
      <DraggableG id="sr-caseC" {...dg} bounds={bounds["sr-caseC"]}>
        <rect x={caseCX - 80} y={530} width={160} height={50} rx={12}
          fill={C.gray} opacity={0.2} stroke={C.gray} strokeWidth={2.5} />
        <text x={caseCX} y={550} textAnchor="middle" fill={C.fg} fontSize={16} fontWeight={800}>CASO C</text>
        <text x={caseCX} y={570} textAnchor="middle" fill={C.gray} fontSize={12} fontWeight={600}>&lt; 2h</text>
        <Arr x1={caseCX} y1={580} x2={caseCX} y2={620} color={C.gray} />
        <RBox x={caseCX} y={650} w={320} h={56} color={C.gray} filled
          label="Nessun reminder" sub="Troppo vicino all'appuntamento" />
      </DraggableG>

      <DraggableG id="sr-escalation" {...dg} bounds={bounds["sr-escalation"]}>
        <EscalationLegend x={1200} y={1380} waDelay={waDelay} smsDelay={smsDelay} />
      </DraggableG>
    </>
  );
}

function getSoloReminderBounds(): NodeBounds {
  const startX = 1800;
  const caseAX = 600;
  const caseBX = 1800;
  const caseCX = 3000;
  return {
    "sr-start": { cx: startX, cy: 60, w: 440, h: 40 },
    "sr-noconf": { cx: startX, cy: 170, w: 400, h: 50 },
    "sr-diamond": { cx: startX, cy: 400, w: 200, h: 140 },
    "sr-caseA": { cx: caseAX + 100, cy: 900, w: 1800, h: 900 },
    "sr-caseB": { cx: caseBX + 100, cy: 700, w: 900, h: 400 },
    "sr-caseC": { cx: caseCX, cy: 610, w: 320, h: 200 },
    "sr-escalation": { cx: 1800, cy: 1400, w: 1200, h: 200 },
  };
}

// ══════════════════════════════════════════════════════════════
// ── TEMPLATE 3: Conferma + Reminder ─────────────────────────
// ══════════════════════════════════════════════════════════════

function ConfermaReminderContent({ waDelay, smsDelay, dg, bounds }: {
  waDelay: number; smsDelay: number;
  dg: { updateOffset: any; updateOffsetMulti: any; commitHistory: any };
  bounds: NodeBounds;
}) {
  const startX = 1800;
  const caseAX = 600;
  const caseBX = 1800;
  const caseCX = 3000;

  return (
    <>
      <DraggableG id="cr-start" {...dg} bounds={bounds["cr-start"]}>
        <Pill x={startX} y={60} w={440} color={C.primary} label="Nuovo Appuntamento Salvato" bold />
      </DraggableG>

      <DraggableG id="cr-step0" {...dg} bounds={bounds["cr-step0"]}>
        <RBox x={startX} y={165} w={480} h={65} color={C.green} filled bold
          label="Step 0: Conferma immediata"
          sub="Inviato automaticamente alla creazione dell'appuntamento" />
        <MsgBox x={startX + 510} y={165} w={380} lines={[
          "{{salon_name}}:",
          "Appuntamento confermato",
          "{{short_data}} {{ora}}",
          "",
          "Se vuoi annullarlo o spostarlo",
          "clicca qui: {{link}}",
        ]} color={C.green} />
      </DraggableG>

      <DraggableG id="cr-step0dec" {...dg} bounds={bounds["cr-step0dec"]}>
        <Diamond x={startX} y={290} label="Azione?" color={C.green} size={30} />
        <ElbowArr x1={startX - 48} y1={290} x2={startX - 300} y2={290}
          color={C.red} label="Annulla" midY={270} />
        <Pill x={startX - 300} y={290} w={140} color={C.red} label="Fine flusso" />
        <ElbowArr x1={startX - 48} y1={306} x2={startX - 300} y2={356}
          color={C.amber} label="Sposta" midY={340} />
        <Pill x={startX - 300} y={356} w={140} color={C.amber} label="Reset flow" />
      </DraggableG>

      <DraggableG id="cr-diamond" {...dg} bounds={bounds["cr-diamond"]}>
        <Diamond x={startX} y={420} label="Ore mancanti?" color={C.primary} size={38} />
      </DraggableG>

      {/* Case A: 2 reminders with conditional R2 */}
      <DraggableG id="cr-caseA" {...dg} bounds={bounds["cr-caseA"]}>
        <rect x={caseAX - 80} y={530} width={160} height={50} rx={12}
          fill={C.primary} opacity={0.2} stroke={C.primary} strokeWidth={2.5} />
        <text x={caseAX} y={550} textAnchor="middle" fill={C.fg} fontSize={16} fontWeight={800}>CASO A</text>
        <text x={caseAX} y={570} textAnchor="middle" fill={C.primary} fontSize={12} fontWeight={600}>&gt; 24h</text>
        <Arr x1={caseAX} y1={580} x2={caseAX} y2={620} color={C.primary} />

        {/* Reminder 1 */}
        <RBox x={caseAX} y={650} w={380} h={62} color={C.primary} filled bold
          label="Reminder 1" sub="Giorno prima, stessa ora appuntamento" />
        <MsgBox x={caseAX + 440} y={650} w={380} lines={[
          "Azione richiesta! {{salon_name}}:",
          "Domani ore {{ora}}",
          "",
          "Conferma o annulla appuntamento",
          "cliccando qui: {{link}}",
        ]} color={C.primary} />
        <Arr x1={caseAX} y1={682} x2={caseAX} y2={770} color={C.muted} />
        <DecisionBlock x={caseAX} y={800} />

        {/* After Decision: conditional diamond for Reminder 2 */}
        <Arr x1={caseAX} y1={832} x2={caseAX} y2={910} color={C.muted}
          label="Nessuna azione / Confermato" labelSide="right" />

        {/* Diamond: Was R1 confirmed? */}
        <Diamond x={caseAX} y={940} label="Confermato R1?" color={C.sky} size={34} />

        {/* LEFT branch: NOT confirmed → solicitation message */}
        <ElbowArr x1={caseAX - 54} y1={940} x2={caseAX - 380} y2={940}
          color={C.amber} label="Non confermato" midY={920} />

        <RBox x={caseAX - 380} y={1020} w={360} h={62} color={C.amber} filled bold
          label="Reminder 2 (sollecito)" sub="2h prima – richiede conferma" />
        <MsgBox x={caseAX - 380} y={1095} w={380} lines={[
          "Azione Richiesta! {{salon_name}}:",
          "Oggi, ore {{ora}}",
          "",
          "Conferma o annulla appuntamento",
          "qui: {{link}}",
        ]} color={C.amber} />
        <Arr x1={caseAX - 380} y1={1052} x2={caseAX - 380} y2={1210} color={C.muted} />
        <DecisionBlock x={caseAX - 380} y={1240} />

        {/* RIGHT branch: Confirmed → friendly reminder */}
        <ElbowArr x1={caseAX + 54} y1={940} x2={caseAX + 380} y2={940}
          color={C.green} label="Confermato" midY={920} />

        <RBox x={caseAX + 380} y={1020} w={360} h={62} color={C.green} filled bold
          label="Reminder 2 (ci vediamo)" sub="2h prima – promemoria gentile" />
        <MsgBox x={caseAX + 380 + 420} y={1020} w={380} lines={[
          "{{salon_name}}:",
          "Ci vediamo oggi alle {{ora}}!",
          "",
          "Se hai bisogno di modificare",
          "clicca qui: {{link}}",
        ]} color={C.green} />
        <Arr x1={caseAX + 380} y1={1052} x2={caseAX + 380} y2={1140} color={C.muted} />
        <DecisionBlock x={caseAX + 380} y={1170} showReset={false} />
      </DraggableG>

      {/* Case B */}
      <DraggableG id="cr-caseB" {...dg} bounds={bounds["cr-caseB"]}>
        <rect x={caseBX - 80} y={530} width={160} height={50} rx={12}
          fill={C.sky} opacity={0.2} stroke={C.sky} strokeWidth={2.5} />
        <text x={caseBX} y={550} textAnchor="middle" fill={C.fg} fontSize={16} fontWeight={800}>CASO B</text>
        <text x={caseBX} y={570} textAnchor="middle" fill={C.sky} fontSize={12} fontWeight={600}>2 – 24h</text>
        <Arr x1={caseBX} y1={580} x2={caseBX} y2={620} color={C.sky} />
        <RBox x={caseBX} y={650} w={360} h={62} color={C.sky} filled bold
          label="Reminder" sub="2h prima dell'appuntamento" />
        <MsgBox x={caseBX + 420} y={650} w={380} lines={[
          "Azione Richiesta! {{salon_name}}:",
          "Oggi, ore {{ora}}",
          "",
          "Conferma o annulla appuntamento",
          "qui: {{link}}",
        ]} color={C.sky} />
        <Arr x1={caseBX} y1={682} x2={caseBX} y2={770} color={C.muted} />
        <DecisionBlock x={caseBX} y={800} />
      </DraggableG>

      {/* Case C */}
      <DraggableG id="cr-caseC" {...dg} bounds={bounds["cr-caseC"]}>
        <rect x={caseCX - 80} y={530} width={160} height={50} rx={12}
          fill={C.gray} opacity={0.2} stroke={C.gray} strokeWidth={2.5} />
        <text x={caseCX} y={550} textAnchor="middle" fill={C.fg} fontSize={16} fontWeight={800}>CASO C</text>
        <text x={caseCX} y={570} textAnchor="middle" fill={C.gray} fontSize={12} fontWeight={600}>&lt; 2h</text>
        <Arr x1={caseCX} y1={580} x2={caseCX} y2={620} color={C.gray} />
        <RBox x={caseCX} y={650} w={320} h={56} color={C.gray} filled
          label="Solo conferma iniziale" sub="Nessun reminder aggiuntivo" />
      </DraggableG>

      <DraggableG id="cr-escalation" {...dg} bounds={bounds["cr-escalation"]}>
        <EscalationLegend x={1200} y={1380} waDelay={waDelay} smsDelay={smsDelay} />
      </DraggableG>
    </>
  );
}

function getConfermaReminderBounds(): NodeBounds {
  const startX = 1800;
  const caseAX = 600;
  const caseBX = 1800;
  const caseCX = 3000;
  return {
    "cr-start": { cx: startX, cy: 60, w: 440, h: 40 },
    "cr-step0": { cx: startX + 100, cy: 165, w: 900, h: 65 },
    "cr-step0dec": { cx: startX - 50, cy: 310, w: 700, h: 120 },
    "cr-diamond": { cx: startX, cy: 400, w: 200, h: 140 },
    "cr-caseA": { cx: caseAX + 100, cy: 900, w: 1800, h: 900 },
    "cr-caseB": { cx: caseBX + 100, cy: 700, w: 900, h: 400 },
    "cr-caseC": { cx: caseCX, cy: 610, w: 320, h: 200 },
    "cr-escalation": { cx: 1800, cy: 1400, w: 1200, h: 200 },
  };
}

// ══════════════════════════════════════════════════════════════
// ── Main Component with Full Editor ─────────────────────────
// ══════════════════════════════════════════════════════════════

interface SimpleFlowDiagramProps {
  flowConfig: FlowConfig;
  modelId?: string;
  readOnly?: boolean;
}

export default function SimpleFlowDiagram({ flowConfig, modelId, readOnly = false }: SimpleFlowDiagramProps) {
  const { t } = useTranslation();
  const templateType = detectTemplateType(flowConfig);
  const waDelay = flowConfig.channel_escalation?.delays_min?.whatsapp ?? 10;
  const smsDelay = flowConfig.channel_escalation?.delays_min?.sms ?? 20;

  const {
    offsets, editMode, setEditMode, updateOffset, updateOffsetMulti,
    resetOffsets, o, selectedIds, toggleSelect, selectByRect, clearSelection,
    undo, redo, canUndo, canRedo, commitHistory,
    selectedArrowId, setSelectedArrowId,
    anchorOverrides, cycleArrowAnchor,
    hoveredInMarquee, previewMarquee,
  } = useFlowLayout(modelId);
  const scaleRef = useRef(0.25);

  // Marquee state
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const marqueeStart = useRef<{ sx: number; sy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Keyboard shortcuts
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

  // Node click handler
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

  // Dimensions per template
  let W: number, H: number, bounds: NodeBounds;
  switch (templateType) {
    case "solo_conferma":
      W = 1800; H = 900; bounds = getSoloConfermaBounds();
      break;
    case "solo_reminder":
      W = 3600; H = 1600; bounds = getSoloReminderBounds();
      break;
    case "conferma_reminder":
      W = 3600; H = 1700; bounds = getConfermaReminderBounds();
      break;
    default:
      return null;
  }

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

  // Marquee handlers
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

              {templateType === "solo_conferma" && (
                <>
                  <SoloConfermaContent waDelay={waDelay} smsDelay={smsDelay} dg={dg} bounds={bounds} />
                  {sa("sc-start-step0", "sc-start", "sc-step0", C.muted)}
                  {sa("sc-step0-decision", "sc-step0", "sc-decision", C.muted)}
                  {sa("sc-decision-noaction", "sc-decision", "sc-noaction", C.muted, { label: "Nessuna azione", labelSide: "right" })}
                </>
              )}
              {templateType === "solo_reminder" && (
                <>
                  <SoloReminderContent waDelay={waDelay} smsDelay={smsDelay} dg={dg} bounds={bounds} />
                  {sa("sr-start-noconf", "sr-start", "sr-noconf", C.muted)}
                  {sa("sr-noconf-diamond", "sr-noconf", "sr-diamond", C.muted)}
                  {sa("sr-diamond-caseA", "sr-diamond", "sr-caseA", C.primary, { label: "> 24h", elbow: true })}
                  {sa("sr-diamond-caseB", "sr-diamond", "sr-caseB", C.sky, { label: "2–24h", elbow: true })}
                  {sa("sr-diamond-caseC", "sr-diamond", "sr-caseC", C.gray, { label: "< 2h", elbow: true })}
                </>
              )}
              {templateType === "conferma_reminder" && (
                <>
                  <ConfermaReminderContent waDelay={waDelay} smsDelay={smsDelay} dg={dg} bounds={bounds} />
                  {sa("cr-start-step0", "cr-start", "cr-step0", C.muted)}
                  {sa("cr-step0-step0dec", "cr-step0", "cr-step0dec", C.muted)}
                  {sa("cr-step0dec-diamond", "cr-step0dec", "cr-diamond", C.muted, { label: "Nessuna azione", labelSide: "right" })}
                  {sa("cr-diamond-caseA", "cr-diamond", "cr-caseA", C.primary, { label: "> 24h", elbow: true })}
                  {sa("cr-diamond-caseB", "cr-diamond", "cr-caseB", C.sky, { label: "2–24h", elbow: true })}
                  {sa("cr-diamond-caseC", "cr-diamond", "cr-caseC", C.gray, { label: "< 2h", elbow: true })}
                </>
              )}

              <MarqueeRect marquee={marquee} editMode={editMode} hoveredInMarquee={hoveredInMarquee} />
            </svg>
          </ZoomPanContainer>
        </FlowEditContext.Provider>
      </AnchorCycleContext.Provider>
    </div>
  );
}
