import { useState, useRef, useCallback, useEffect, createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, Move, RotateCcw, Lock, Undo2, Redo2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// ── Types ───────────────────────────────────────────────────

export type Offsets = Record<string, { x: number; y: number }>;
export type NodeBounds = Record<string, { cx: number; cy: number; w: number; h: number }>;
export type Side = "top" | "bottom" | "left" | "right";
export type AnchorOverrides = Record<string, { from?: Side; to?: Side }>;

export interface FlowConfig {
  version: number;
  send_confirmation?: boolean;
  channel_escalation: {
    sequence: string[];
    delays_min: Record<string, number>;
  };
  messages?: Record<string, string>;
  cases: Record<string, {
    min_hours: number;
    max_hours: number | null;
    label: string;
    nodes: {
      node_type: string;
      timing: string;
      offset_hours?: number;
      message_key?: string;
      message_variant?: string;
      is_admin?: boolean;
      only_if_confirmed?: boolean;
      only_if_no_response?: boolean;
    }[];
    timing_tables?: Record<string, Record<string, number>>;
  }>;
}

// ── Constants ───────────────────────────────────────────────

export const SNAP = 20;
export const STORAGE_KEY = "flow-diagram-offsets-v2";
export const ANCHOR_KEY = "flow-diagram-anchors-v1";
const MAX_HISTORY = 50;
export const MIN_ZOOM = 0.15;
export const MAX_ZOOM = 1.5;
export const ZOOM_STEP = 0.1;

// ── Colors ──────────────────────────────────────────────────

export const C = {
  primary: "hsl(210 80% 55%)",
  green: "hsl(142 70% 40%)",
  red: "hsl(0 70% 50%)",
  amber: "hsl(40 90% 48%)",
  orange: "hsl(25 85% 50%)",
  gray: "hsl(220 10% 55%)",
  sky: "hsl(200 70% 50%)",
  purple: "hsl(270 60% 55%)",
  muted: "hsl(220 10% 60%)",
  fg: "hsl(220 15% 20%)",
  mutedFg: "hsl(220 10% 45%)",
  selection: "hsl(210 80% 55%)",
};

// ── Contexts ────────────────────────────────────────────────

interface FlowEditCtx {
  editMode: boolean;
  offsets: Offsets;
  scale: number;
  selectedIds: Set<string>;
  selectedArrowId: string | null;
  hoveredInMarquee: Set<string>;
}

export const FlowEditContext = createContext<FlowEditCtx>({
  editMode: false, offsets: {}, scale: 1, selectedIds: new Set(),
  selectedArrowId: null, hoveredInMarquee: new Set(),
});

export const AnchorCycleContext = createContext<(arrowId: string, endpoint: "from" | "to") => void>(() => {});

// ── Drawing Primitives ──────────────────────────────────────

export function RBox({ x, y, w, h, color, filled, label, sub, bold, fontSize = 14 }: {
  x: number; y: number; w: number; h: number; color: string;
  filled?: boolean; label: string; sub?: string; bold?: boolean; fontSize?: number;
}) {
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={12}
        fill={color} opacity={filled ? 0.15 : 0.06}
        stroke={color} strokeWidth={filled ? 2.5 : 1.5} />
      <text x={x} y={sub ? y - 4 : y + 5} textAnchor="middle"
        fill={color} fontSize={bold ? fontSize + 1 : fontSize} fontWeight={bold ? 800 : 600}>
        {label}
      </text>
      {sub && (
        <text x={x} y={y + 18} textAnchor="middle" fill={color} fontSize={11} opacity={0.8}>
          {sub}
        </text>
      )}
    </g>
  );
}

export function Pill({ x, y, w, color, label, bold }: {
  x: number; y: number; w: number; color: string; label: string; bold?: boolean;
}) {
  return (
    <g>
      <rect x={x - w / 2} y={y - 20} width={w} height={40} rx={20}
        fill={color} opacity={0.15} stroke={color} strokeWidth={2} />
      <text x={x} y={y + 6} textAnchor="middle" fill={color} fontSize={14} fontWeight={bold ? 800 : 700}>
        {label}
      </text>
    </g>
  );
}

export function Diamond({ x, y, label, color, size = 30 }: {
  x: number; y: number; label: string; color: string; size?: number;
}) {
  return (
    <g>
      <polygon
        points={`${x},${y - size} ${x + size * 1.6},${y} ${x},${y + size} ${x - size * 1.6},${y}`}
        fill={color} opacity={0.08} stroke={color} strokeWidth={2} />
      <text x={x} y={y + 5} textAnchor="middle" fill={color} fontSize={12} fontWeight={700}>
        {label}
      </text>
    </g>
  );
}

export function MsgBox({ x, y, w, lines, color, label = "MESSAGGIO" }: {
  x: number; y: number; w: number; lines: string[]; color: string; label?: string;
}) {
  const lineH = 18;
  const h = lines.length * lineH + 22;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={8}
        fill={color} opacity={0.06} stroke={color} strokeWidth={1} strokeDasharray="5,3" />
      <text x={x - w / 2 + 12} y={y - h / 2 + 16} fill={color} fontSize={9} fontWeight={700} opacity={0.5}>
        {label}
      </text>
      {lines.map((line, i) => (
        <text key={i} x={x} y={y - h / 2 + 32 + i * lineH} textAnchor="middle"
          fill={color} fontSize={11} fontWeight={500} fontStyle="italic">
          {line}
        </text>
      ))}
    </g>
  );
}

export function Arr({ x1, y1, x2, y2, color, label, dashed, labelSide }: {
  x1: number; y1: number; x2: number; y2: number; color: string;
  label?: string; dashed?: boolean; labelSide?: "left" | "right";
}) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ratio = Math.max(0, (len - 12)) / len;
  const ex = x1 + dx * ratio;
  const ey = y1 + dy * ratio;
  return (
    <g>
      <line x1={x1} y1={y1} x2={ex} y2={ey}
        stroke={color} strokeWidth={1.8}
        strokeDasharray={dashed ? "6,3" : undefined}
        markerEnd="url(#arrow)" />
      {label && (
        <text x={mx + (labelSide === "left" ? -16 : 14)} y={my - 6}
          textAnchor={labelSide === "left" ? "end" : "start"}
          fill={color} fontSize={11} fontWeight={600}>{label}</text>
      )}
    </g>
  );
}

export function ElbowArr({ x1, y1, x2, y2, color, label, dashed, midY }: {
  x1: number; y1: number; x2: number; y2: number; color: string;
  label?: string; dashed?: boolean; midY?: number;
}) {
  const my = midY ?? (y1 + y2) / 2;
  const path = `M ${x1} ${y1} L ${x1} ${my} L ${x2} ${my} L ${x2} ${y2}`;
  return (
    <g>
      <path d={path} fill="none" stroke={color} strokeWidth={1.5}
        strokeDasharray={dashed ? "6,3" : undefined}
        markerEnd="url(#arrow)" />
      {label && (
        <text x={(x1 + x2) / 2} y={my - 6} textAnchor="middle"
          fill={color} fontSize={11} fontWeight={600}>{label}</text>
      )}
    </g>
  );
}

// ── Escalation Legend ───────────────────────────────────────

export function EscalationLegend({ x, y, waDelay, smsDelay }: { x: number; y: number; waDelay: number; smsDelay: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={0} y={0} width={1200} height={200} rx={16}
        fill={C.primary} opacity={0.03} stroke={C.primary} strokeWidth={1.5} />
      <text x={24} y={32} fill={C.fg} fontSize={16} fontWeight={800}>
        Logica di escalation canali per ogni nodo
      </text>
      <g transform="translate(24, 52)">
        <rect x={0} y={0} width={200} height={40} rx={10}
          fill={C.green} opacity={0.15} stroke={C.green} strokeWidth={2} />
        <text x={100} y={25} textAnchor="middle" fill={C.green} fontSize={13} fontWeight={700}>
          Glowup (subito)
        </text>
        <line x1={200} y1={20} x2={260} y2={20} stroke={C.muted} strokeWidth={1.5} markerEnd="url(#arrow)" />
        <text x={230} y={14} textAnchor="middle" fill={C.mutedFg} fontSize={9} fontWeight={600}>+{waDelay}min</text>
        <rect x={260} y={0} width={200} height={40} rx={10}
          fill={C.green} opacity={0.15} stroke={C.green} strokeWidth={2} />
        <text x={360} y={25} textAnchor="middle" fill={C.green} fontSize={13} fontWeight={700}>
          WhatsApp (+{waDelay}min)
        </text>
        <line x1={460} y1={20} x2={520} y2={20} stroke={C.muted} strokeWidth={1.5} markerEnd="url(#arrow)" />
        <text x={490} y={14} textAnchor="middle" fill={C.mutedFg} fontSize={9} fontWeight={600}>+{smsDelay}min</text>
        <rect x={520} y={0} width={200} height={40} rx={10}
          fill={C.green} opacity={0.15} stroke={C.green} strokeWidth={2} />
        <text x={620} y={25} textAnchor="middle" fill={C.green} fontSize={13} fontWeight={700}>
          SMS (+{smsDelay}min)
        </text>
      </g>
      <g transform="translate(24, 110)">
        {[
          { icon: "OK", title: "Consegna su Glowup", desc: "WhatsApp e SMS di quel nodo NON vengono inviati", color: C.green },
          { icon: "OK", title: "Azione su WhatsApp", desc: "Solo l'SMS di quel nodo NON viene inviato", color: C.sky },
          { icon: "...", title: "Nessuna azione", desc: "Escalation completa: Glowup > WhatsApp > SMS", color: C.orange },
        ].map((rule, i) => (
          <g key={i} transform={`translate(0, ${i * 30})`}>
            <rect x={0} y={0} width={1150} height={26} rx={6}
              fill={rule.color} opacity={0.06} />
            <text x={14} y={18} fill={rule.color} fontSize={12} fontWeight={700}>
              {rule.icon} {rule.title}
            </text>
            <text x={280} y={18} fill={C.mutedFg} fontSize={11} fontWeight={500}>
              {rule.desc}
            </text>
          </g>
        ))}
      </g>
    </g>
  );
}

// ── useFlowLayout Hook ──────────────────────────────────────

export function useFlowLayout(modelId?: string) {
  const [offsets, setOffsets] = useState<Offsets>({});
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
  const [hoveredInMarquee, setHoveredInMarquee] = useState<Set<string>>(new Set());
  const [dbLayoutLoaded, setDbLayoutLoaded] = useState(false);
  const [anchorOverrides, setAnchorOverrides] = useState<AnchorOverrides>({});

  useEffect(() => {
    if (!modelId) return;
    setDbLayoutLoaded(false);
    (async () => {
      const { data } = await supabase
        .from("reminder_flow_layouts")
        .select("layout_data, anchor_data")
        .eq("model_id", modelId)
        .maybeSingle();
      if (data) {
        const ld = (data.layout_data as Offsets) || {};
        const ad = (data.anchor_data as AnchorOverrides) || {};
        setOffsets(ld);
        setAnchorOverrides(ad);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ld));
        localStorage.setItem(ANCHOR_KEY, JSON.stringify(ad));
      } else {
        try { const s = localStorage.getItem(STORAGE_KEY); if (s) setOffsets(JSON.parse(s)); } catch {}
        try { const s = localStorage.getItem(ANCHOR_KEY); if (s) setAnchorOverrides(JSON.parse(s)); } catch {}
      }
      setDbLayoutLoaded(true);
    })();
  }, [modelId]);

  const historyRef = useRef<Offsets[]>([]);
  const historyIndexRef = useRef(-1);
  const isUndoRedoRef = useRef(false);

  const pushHistory = useCallback((state: Offsets) => {
    if (isUndoRedoRef.current) { isUndoRedoRef.current = false; return; }
    const idx = historyIndexRef.current;
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push(JSON.parse(JSON.stringify(state)));
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  useEffect(() => {
    if (historyRef.current.length === 0) {
      historyRef.current.push(JSON.parse(JSON.stringify(offsets)));
      historyIndexRef.current = 0;
    }
  }, []); // eslint-disable-line

  const undo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx <= 0) return;
    historyIndexRef.current = idx - 1;
    isUndoRedoRef.current = true;
    const prev = historyRef.current[idx - 1];
    setOffsets(prev);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prev));
  }, []);

  const redo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx >= historyRef.current.length - 1) return;
    historyIndexRef.current = idx + 1;
    isUndoRedoRef.current = true;
    const next = historyRef.current[idx + 1];
    setOffsets(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const updateOffset = useCallback((id: string, dx: number, dy: number) => {
    setOffsets(prev => {
      const cur = prev[id] || { x: 0, y: 0 };
      const next = {
        ...prev,
        [id]: {
          x: Math.round((cur.x + dx) / SNAP) * SNAP,
          y: Math.round((cur.y + dy) / SNAP) * SNAP,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const commitHistory = useCallback(() => {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    pushHistory(current);
  }, [pushHistory]);

  const updateOffsetMulti = useCallback((ids: string[], dx: number, dy: number) => {
    setOffsets(prev => {
      const next = { ...prev };
      for (const id of ids) {
        const cur = next[id] || { x: 0, y: 0 };
        next[id] = {
          x: Math.round((cur.x + dx) / SNAP) * SNAP,
          y: Math.round((cur.y + dy) / SNAP) * SNAP,
        };
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetOffsets = useCallback(() => {
    setOffsets({});
    localStorage.removeItem(STORAGE_KEY);
    pushHistory({});
  }, [pushHistory]);

  const toggleSelect = useCallback((id: string, additive: boolean) => {
    setSelectedIds(prev => {
      if (!additive && prev.size === 1 && prev.has(id)) return new Set();
      const next = new Set(additive ? prev : []);
      if (prev.has(id) && additive) next.delete(id);
      else next.add(id);
      return next;
    });
    setSelectedArrowId(null);
  }, []);

  const selectByRect = useCallback((rect: { x1: number; y1: number; x2: number; y2: number }, bounds: NodeBounds, additive: boolean) => {
    const rx1 = Math.min(rect.x1, rect.x2);
    const ry1 = Math.min(rect.y1, rect.y2);
    const rx2 = Math.max(rect.x1, rect.x2);
    const ry2 = Math.max(rect.y1, rect.y2);
    const intersects = (b: { cx: number; cy: number; w: number; h: number }, off: { x: number; y: number }) => {
      const bx1 = b.cx - b.w / 2 + off.x;
      const by1 = b.cy - b.h / 2 + off.y;
      const bx2 = b.cx + b.w / 2 + off.x;
      const by2 = b.cy + b.h / 2 + off.y;
      return !(bx2 < rx1 || bx1 > rx2 || by2 < ry1 || by1 > ry2);
    };
    setSelectedIds(prev => {
      const next = new Set(additive ? prev : []);
      for (const [id, b] of Object.entries(bounds)) {
        const off = offsets[id] || { x: 0, y: 0 };
        if (intersects(b, off)) next.add(id);
      }
      return next;
    });
    setSelectedArrowId(null);
  }, [offsets]);

  const previewMarquee = useCallback((rect: { x1: number; y1: number; x2: number; y2: number } | null, bounds: NodeBounds) => {
    if (!rect) { setHoveredInMarquee(new Set()); return; }
    const rx1 = Math.min(rect.x1, rect.x2);
    const ry1 = Math.min(rect.y1, rect.y2);
    const rx2 = Math.max(rect.x1, rect.x2);
    const ry2 = Math.max(rect.y1, rect.y2);
    const intersects = (b: { cx: number; cy: number; w: number; h: number }, off: { x: number; y: number }) => {
      const bx1 = b.cx - b.w / 2 + off.x;
      const by1 = b.cy - b.h / 2 + off.y;
      const bx2 = b.cx + b.w / 2 + off.x;
      const by2 = b.cy + b.h / 2 + off.y;
      return !(bx2 < rx1 || bx1 > rx2 || by2 < ry1 || by1 > ry2);
    };
    const found = new Set<string>();
    for (const [id, b] of Object.entries(bounds)) {
      const off = offsets[id] || { x: 0, y: 0 };
      if (intersects(b, off)) found.add(id);
    }
    setHoveredInMarquee(found);
  }, [offsets]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectedArrowId(null);
  }, []);

  const cycleArrowAnchor = useCallback((arrowId: string, endpoint: "from" | "to") => {
    const sides: Side[] = ["top", "bottom", "left", "right"];
    setAnchorOverrides(prev => {
      const cur = prev[arrowId] || {};
      const currentSide = cur[endpoint] || "bottom";
      const idx = sides.indexOf(currentSide);
      const nextSide = sides[(idx + 1) % sides.length];
      const next = { ...prev, [arrowId]: { ...cur, [endpoint]: nextSide } };
      localStorage.setItem(ANCHOR_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const o = useCallback((id: string) => offsets[id] || { x: 0, y: 0 }, [offsets]);

  return {
    offsets, editMode, setEditMode, updateOffset, updateOffsetMulti,
    resetOffsets, o, selectedIds, toggleSelect, selectByRect, clearSelection,
    undo, redo, canUndo, canRedo, commitHistory,
    selectedArrowId, setSelectedArrowId,
    anchorOverrides, cycleArrowAnchor,
    hoveredInMarquee, previewMarquee,
    dbLayoutLoaded, modelId,
  };
}

// ── DraggableG ──────────────────────────────────────────────

export function DraggableG({ id, children, updateOffset, updateOffsetMulti, commitHistory, bounds }: {
  id: string; children: React.ReactNode;
  updateOffset: (id: string, dx: number, dy: number) => void;
  updateOffsetMulti: (ids: string[], dx: number, dy: number) => void;
  commitHistory: () => void;
  bounds?: { w: number; h: number; cx: number; cy: number };
}) {
  const { editMode, offsets, scale, selectedIds, hoveredInMarquee } = useContext(FlowEditContext);
  const off = offsets[id] || { x: 0, y: 0 };
  const isSelected = selectedIds.has(id);
  const isMarqueeHovered = hoveredInMarquee.has(id);
  const dragRef = useRef<{ sx: number; sy: number; moved: boolean } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!editMode) return;
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = { sx: e.clientX, sy: e.clientY, moved: false };
    (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
  }, [editMode]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || !editMode) return;
    e.stopPropagation();
    const dx = (e.clientX - dragRef.current.sx) / scale;
    const dy = (e.clientY - dragRef.current.sy) / scale;
    if (Math.abs(dx) >= SNAP || Math.abs(dy) >= SNAP) {
      const snapDx = Math.round(dx / SNAP) * SNAP;
      const snapDy = Math.round(dy / SNAP) * SNAP;
      if (snapDx !== 0 || snapDy !== 0) {
        dragRef.current.moved = true;
        if (isSelected && selectedIds.size > 1) {
          updateOffsetMulti(Array.from(selectedIds), snapDx, snapDy);
        } else {
          updateOffset(id, snapDx, snapDy);
        }
        dragRef.current.sx += snapDx * scale;
        dragRef.current.sy += snapDy * scale;
      }
    }
  }, [editMode, scale, id, updateOffset, updateOffsetMulti, isSelected, selectedIds]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    if (dragRef.current.moved) commitHistory();
    if (!dragRef.current.moved && editMode) {
      const evt = new CustomEvent("flow-node-click", {
        detail: { id, shiftKey: e.shiftKey || e.ctrlKey || e.metaKey },
        bubbles: true,
      });
      (e.currentTarget as SVGGElement).dispatchEvent(evt);
    }
    dragRef.current = null;
  }, [editMode, id, commitHistory]);

  const bx = bounds ? bounds.cx - bounds.w / 2 : -100;
  const by = bounds ? bounds.cy - bounds.h / 2 : -100;
  const bw = bounds ? bounds.w : 200;
  const bh = bounds ? bounds.h : 200;

  return (
    <g
      transform={`translate(${off.x}, ${off.y})`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => { dragRef.current = null; }}
      style={{ cursor: editMode ? "move" : "default" }}
      data-node-id={id}
    >
      {editMode && (isSelected || isMarqueeHovered) && bounds && (
        <g pointerEvents="none">
          <rect
            x={bx - 12} y={by - 12} width={bw + 24} height={bh + 24}
            rx={14}
            fill={C.selection}
            opacity={isSelected ? 0.08 : 0.05}
            stroke={C.selection}
            strokeWidth={isSelected ? 2.5 : 1.5}
            strokeDasharray={isMarqueeHovered && !isSelected ? "6,3" : undefined}
          />
          {isSelected && (
            <>
              {[[bx - 12, by - 12], [bx + bw + 12, by - 12], [bx - 12, by + bh + 12], [bx + bw + 12, by + bh + 12]].map(([hx, hy], i) => (
                <rect key={i} x={hx - 4} y={hy - 4} width={8} height={8} rx={2}
                  fill="white" stroke={C.selection} strokeWidth={2} />
              ))}
            </>
          )}
        </g>
      )}
      {children}
    </g>
  );
}

// ── Smart Arrow Helpers ─────────────────────────────────────

type Anchor = { x: number; y: number };

function getAnchor(b: { cx: number; cy: number; w: number; h: number }, side: Side): Anchor {
  switch (side) {
    case "top": return { x: b.cx, y: b.cy - b.h / 2 };
    case "bottom": return { x: b.cx, y: b.cy + b.h / 2 };
    case "left": return { x: b.cx - b.w / 2, y: b.cy };
    case "right": return { x: b.cx + b.w / 2, y: b.cy };
  }
}

function getAnchors(b: { cx: number; cy: number; w: number; h: number }): Record<Side, Anchor> {
  return {
    top: getAnchor(b, "top"),
    bottom: getAnchor(b, "bottom"),
    left: getAnchor(b, "left"),
    right: getAnchor(b, "right"),
  };
}

function offsetBounds(b: { cx: number; cy: number; w: number; h: number }, off: { x: number; y: number }) {
  return { cx: b.cx + off.x, cy: b.cy + off.y, w: b.w, h: b.h };
}

function bestSides(
  from: { cx: number; cy: number; w: number; h: number },
  to: { cx: number; cy: number; w: number; h: number },
): { side1: Side; side2: Side } {
  const fromAnchors = getAnchors(from);
  const toAnchors = getAnchors(to);
  const sides: Side[] = ["top", "bottom", "left", "right"];
  let best: { side1: Side; side2: Side; dist: number } | null = null;
  for (const side1 of sides) {
    for (const side2 of sides) {
      const p1 = fromAnchors[side1];
      const p2 = toAnchors[side2];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      if (!best || dist < best.dist) best = { side1, side2, dist };
    }
  }
  return best ? { side1: best.side1, side2: best.side2 } : { side1: "bottom", side2: "top" };
}

function AnchorDot({ x, y, side, arrowId, endpoint, overridden }: {
  x: number; y: number; side: Side; arrowId: string; endpoint: "from" | "to";
  overridden: boolean;
}) {
  const cycleAnchor = useContext(AnchorCycleContext);
  const sideLabel: Record<Side, string> = { top: "T", bottom: "B", left: "L", right: "R" };
  return (
    <g data-anchor-dot="true" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); cycleAnchor(arrowId, endpoint); }} style={{ cursor: "pointer" }}>
      <circle cx={x} cy={y} r={12} fill="white" stroke={overridden ? C.amber : C.selection}
        strokeWidth={2.5} opacity={0.95} />
      <text x={x} y={y + 4} textAnchor="middle" fill={overridden ? C.amber : C.selection}
        fontSize={9} fontWeight={800}>
        {sideLabel[side]}
      </text>
    </g>
  );
}

export function SmartArr({ arrowId, from, to, color, label, bounds, o, elbow, labelSide, dashed, anchorOverrides, onArrowClick, isSelected }: {
  arrowId: string;
  from: string; to: string; color: string; label?: string;
  bounds: NodeBounds; o: (id: string) => { x: number; y: number };
  elbow?: boolean; labelSide?: "left" | "right"; dashed?: boolean;
  anchorOverrides: AnchorOverrides;
  onArrowClick?: (arrowId: string) => void;
  isSelected?: boolean;
}) {
  const { editMode } = useContext(FlowEditContext);
  const fb = bounds[from];
  const tb = bounds[to];
  if (!fb || !tb) return null;

  const fAdj = offsetBounds(fb, o(from));
  const tAdj = offsetBounds(tb, o(to));
  const override = anchorOverrides[arrowId];
  const auto = bestSides(fAdj, tAdj);
  const side1 = override?.from || auto.side1;
  const side2 = override?.to || auto.side2;
  const p1 = getAnchor(fAdj, side1);
  const p2 = getAnchor(tAdj, side2);
  const needsElbow = elbow || (Math.abs(p1.x - p2.x) > 20 && Math.abs(p1.y - p2.y) > 20);
  const hitWidth = 16;

  return (
    <g
      data-arrow-id={arrowId}
      onPointerDown={(e) => { if (editMode) e.stopPropagation(); }}
      onClick={(e) => { if (editMode) { e.stopPropagation(); onArrowClick?.(arrowId); } }}
      style={{ cursor: editMode ? "pointer" : "default" }}
    >
      {isSelected && editMode && (
        <g pointerEvents="none">
          {needsElbow ? (
            <path
              d={`M ${p1.x} ${p1.y} L ${p1.x} ${(p1.y + p2.y) * 0.4 + p1.y * 0.2} L ${p2.x} ${(p1.y + p2.y) * 0.4 + p1.y * 0.2} L ${p2.x} ${p2.y}`}
              fill="none" stroke={C.selection} strokeWidth={6} opacity={0.3} />
          ) : (
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={C.selection} strokeWidth={6} opacity={0.3} />
          )}
        </g>
      )}
      {editMode && (
        needsElbow ? (
          <path
            d={`M ${p1.x} ${p1.y} L ${p1.x} ${(p1.y + p2.y) * 0.4 + p1.y * 0.2} L ${p2.x} ${(p1.y + p2.y) * 0.4 + p1.y * 0.2} L ${p2.x} ${p2.y}`}
            fill="none" stroke={C.selection} strokeOpacity={0.001} strokeWidth={hitWidth} pointerEvents="stroke"
          />
        ) : (
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={C.selection} strokeOpacity={0.001} strokeWidth={hitWidth} pointerEvents="stroke"
          />
        )
      )}
      {needsElbow ? (
        <ElbowArr x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
          color={isSelected ? C.selection : color} label={label} dashed={dashed}
          midY={p1.y + (p2.y - p1.y) * 0.4} />
      ) : (
        <Arr x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
          color={isSelected ? C.selection : color} label={label} labelSide={labelSide} dashed={dashed} />
      )}
      {isSelected && editMode && (
        <>
          <AnchorDot x={p1.x} y={p1.y} side={side1} arrowId={arrowId} endpoint="from" overridden={!!override?.from} />
          <AnchorDot x={p2.x} y={p2.y} side={side2} arrowId={arrowId} endpoint="to" overridden={!!override?.to} />
        </>
      )}
    </g>
  );
}

// ── ZoomPanContainer ────────────────────────────────────────

export function ZoomPanContainer({ width, height, children, editMode, scaleRef }: {
  width: number; height: number; children: React.ReactNode;
  editMode: boolean; scaleRef: React.MutableRefObject<number>;
}) {
  const [scale, setScale] = useState(0.25);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const spaceHeldRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });
  const translateRef = useRef(translate);

  useEffect(() => { scaleRef.current = scale; }, [scale, scaleRef]);
  useEffect(() => { spaceHeldRef.current = spaceHeld; }, [spaceHeld]);
  useEffect(() => { translateRef.current = translate; }, [translate]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMM = (e: MouseEvent) => { lastMousePos.current = { x: e.clientX, y: e.clientY }; };
    el.addEventListener("mousemove", onMM);
    return () => el.removeEventListener("mousemove", onMM);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!el.getAttribute("tabindex")) el.setAttribute("tabindex", "0");
    const onEnter = () => el.focus({ preventScroll: true });
    el.addEventListener("mouseenter", onEnter);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        e.stopPropagation();
        setSpaceHeld(true);
        panStart.current = { x: lastMousePos.current.x, y: lastMousePos.current.y, tx: translateRef.current.x, ty: translateRef.current.y };
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();
        setSpaceHeld(false);
        setIsPanning(false);
      }
    };
    el.addEventListener("keydown", onKeyDown, { capture: true });
    el.addEventListener("keyup", onKeyUp, { capture: true });
    const preventScroll = (e: KeyboardEvent) => {
      if (e.code === "Space" && el.contains(document.activeElement)) e.preventDefault();
    };
    window.addEventListener("keydown", preventScroll, { capture: true });
    return () => {
      el.removeEventListener("keydown", onKeyDown, { capture: true });
      el.removeEventListener("keyup", onKeyUp, { capture: true });
      el.removeEventListener("mouseenter", onEnter);
      window.removeEventListener("keydown", preventScroll, { capture: true });
    };
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      // Use actual deltaY for smooth trackpad pinch; clamp to avoid huge jumps
      const rawDelta = -e.deltaY * 0.005;
      const delta = Math.max(-0.08, Math.min(0.08, rawDelta));
      setScale(s => {
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, s + delta));
        setTranslate(prev => {
          if (!containerRef.current) return prev;
          const rect = containerRef.current.getBoundingClientRect();
          const minX = Math.min(0, rect.width - width * next);
          const minY = Math.min(0, rect.height - height * next);
          return { x: Math.max(minX, Math.min(0, prev.x)), y: Math.max(minY, Math.min(0, prev.y)) };
        });
        return next;
      });
    }
  }, [width, height]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const clampTranslate = useCallback((tx: number, ty: number, s: number) => {
    if (!containerRef.current) return { x: tx, y: ty };
    const rect = containerRef.current.getBoundingClientRect();
    const minX = Math.min(0, rect.width - width * s);
    const minY = Math.min(0, rect.height - height * s);
    return { x: Math.max(minX, Math.min(0, tx)), y: Math.max(minY, Math.min(0, ty)) };
  }, [width, height]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const canPanNow = !editMode || spaceHeldRef.current;
    if (!canPanNow) return;
    e.stopPropagation();
    e.preventDefault();
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [translate, editMode]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (spaceHeldRef.current || isPanning) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setTranslate(clampTranslate(panStart.current.tx + dx, panStart.current.ty + dy, scale));
    }
  }, [isPanning, clampTranslate, scale]);

  const onPointerUp = useCallback(() => setIsPanning(false), []);

  const zoomIn = () => setScale(s => Math.min(MAX_ZOOM, s + ZOOM_STEP));
  const zoomOut = () => setScale(s => Math.max(MIN_ZOOM, s - ZOOM_STEP));
  const fitToView = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const fitScale = Math.min(rect.width / width, rect.height / height) * 0.95;
    setScale(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fitScale)));
    setTranslate({ x: 0, y: 0 });
  };

  const cursorStyle = spaceHeld
    ? (isPanning ? "grabbing" : "grab")
    : editMode ? "default" : (isPanning ? "grabbing" : "grab");

  return (
    <div className="relative w-full h-full" style={{ minHeight: "75vh" }}>
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm border rounded-lg p-1 shadow-sm">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut} title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs font-medium text-muted-foreground w-12 text-center select-none">
          {Math.round(scale * 100)}%
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn} title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <div className="w-px h-5 bg-border" />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fitToView} title="Adatta alla vista">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute bottom-3 left-3 z-10 text-[10px] text-muted-foreground/60 select-none pointer-events-none">
        {editMode
          ? "Spazio+trascina per navigare · Ctrl/⌘+Z annulla · Ctrl/⌘+Y ripristina · Clicca frecce per cambiare aggancio"
          : "Trascina per spostare · Ctrl+Scroll per zoom"}
      </div>

      {editMode && spaceHeld && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 text-[10px] text-primary-foreground bg-primary/80 backdrop-blur-sm px-3 py-1 rounded-full font-semibold shadow-sm pointer-events-none">
          ✋ Navigazione
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full overflow-hidden"
        style={{ height: "75vh", cursor: cursorStyle }}
        onPointerDownCapture={onPointerDown}
        onPointerMoveCapture={onPointerMove}
        onPointerUpCapture={onPointerUp}
        onPointerCancelCapture={onPointerUp}
      >
        <div
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            width, height,
            willChange: "transform",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Editor Controls ─────────────────────────────────────────

export function EditorControls({
  editMode, setEditMode, canUndo, canRedo, undo, redo,
  selectedIds, selectedArrowId, hoveredInMarquee, marqueeActive,
  resetOffsets, modelId,
}: {
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  selectedIds: Set<string>;
  selectedArrowId: string | null;
  hoveredInMarquee: Set<string>;
  marqueeActive: boolean;
  resetOffsets: () => void;
  modelId?: string;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const clearSel = () => {
    setEditMode(!editMode);
  };

  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
      <Button
        variant={editMode ? "default" : "outline"}
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={clearSel}
      >
        {editMode ? <Lock className="h-3.5 w-3.5" /> : <Move className="h-3.5 w-3.5" />}
        {editMode ? "Blocca layout" : "Modifica layout"}
      </Button>

      {editMode && (
        <>
          <div className="flex items-center bg-background/90 backdrop-blur-sm border rounded-lg overflow-hidden">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none"
              onClick={undo} disabled={!canUndo} title="Annulla (Ctrl+Z / ⌘+Z)">
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <div className="w-px h-5 bg-border" />
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none"
              onClick={redo} disabled={!canRedo} title="Ripristina (Ctrl+Y / ⌘+Shift+Z)">
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {selectedIds.size > 0 && (
            <span className="text-[10px] text-primary-foreground bg-primary px-2.5 py-1 rounded-full font-semibold shadow-sm">
              {selectedIds.size} selezionat{selectedIds.size === 1 ? "o" : "i"}
            </span>
          )}

          {marqueeActive && hoveredInMarquee.size > 0 && (
            <span className="text-[10px] text-primary-foreground bg-primary px-2.5 py-1 rounded-full font-semibold shadow-sm">
              {hoveredInMarquee.size} {t("reminderFlow.inMarquee", "nel riquadro")}
            </span>
          )}

          {selectedArrowId && (
            <span className="text-[10px] text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
              Freccia selezionata · Clicca T/B/L/R per cambiare aggancio
            </span>
          )}

          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-destructive" onClick={resetOffsets}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
            onClick={async () => {
              if (!user?.id || !modelId) {
                toast.success("Layout salvato localmente!");
                return;
              }
              try {
                const layoutData = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
                const anchorData = JSON.parse(localStorage.getItem(ANCHOR_KEY) || "{}");
                const { error } = await supabase
                  .from("reminder_flow_layouts")
                  .upsert({
                    user_id: user.id,
                    model_id: modelId,
                    layout_data: layoutData,
                    anchor_data: anchorData,
                    updated_at: new Date().toISOString(),
                  }, { onConflict: "user_id,model_id" });
                if (error) throw error;
                toast.success(t("reminderFlow.layoutSaved", "Layout salvato con successo!"));
              } catch (e) {
                console.error("Failed to save layout:", e);
                toast.error(t("reminderFlow.layoutSaveError", "Errore nel salvataggio del layout"));
              }
            }}
          >
            <Save className="h-3.5 w-3.5" />
            Salva layout
          </Button>
        </>
      )}
    </div>
  );
}

// ── Marquee Selection Rect ──────────────────────────────────

export function MarqueeRect({ marquee, editMode, hoveredInMarquee }: {
  marquee: { x1: number; y1: number; x2: number; y2: number } | null;
  editMode: boolean;
  hoveredInMarquee: Set<string>;
}) {
  if (!editMode || !marquee) return null;
  const mx = Math.min(marquee.x1, marquee.x2);
  const my = Math.min(marquee.y1, marquee.y2);
  const mw = Math.abs(marquee.x2 - marquee.x1);
  const mh = Math.abs(marquee.y2 - marquee.y1);
  return (
    <g pointerEvents="none">
      <rect x={mx} y={my} width={mw} height={mh}
        fill={C.selection} opacity={0.06}
        stroke={C.selection} strokeWidth={2}
        strokeDasharray="8,4" />
      {hoveredInMarquee.size > 0 && (
        <g>
          <rect x={marquee.x2 + 8} y={marquee.y2 - 14}
            width={hoveredInMarquee.size > 9 ? 40 : 28} height={28} rx={14}
            fill={C.selection} opacity={0.9} />
          <text x={marquee.x2 + 8 + (hoveredInMarquee.size > 9 ? 20 : 14)}
            y={marquee.y2 + 5}
            textAnchor="middle" fill="white" fontSize={13} fontWeight={800}>
            {hoveredInMarquee.size}
          </text>
        </g>
      )}
    </g>
  );
}

// ── Grid Guides ─────────────────────────────────────────────

export function GridGuides({ W, H, editMode }: { W: number; H: number; editMode: boolean }) {
  if (!editMode) return null;
  return (
    <g opacity={0.08}>
      {Array.from({ length: Math.ceil(W / 100) }, (_, i) => (
        <line key={`vg${i}`} x1={i * 100} y1={0} x2={i * 100} y2={H} stroke={C.muted} strokeWidth={0.5} />
      ))}
      {Array.from({ length: Math.ceil(H / 100) }, (_, i) => (
        <line key={`hg${i}`} x1={0} y1={i * 100} x2={W} y2={i * 100} stroke={C.muted} strokeWidth={0.5} />
      ))}
    </g>
  );
}
