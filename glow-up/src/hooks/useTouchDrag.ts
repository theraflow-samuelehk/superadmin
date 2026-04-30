import { useCallback, useRef, useState, useEffect } from "react";

const LONG_PRESS_MS = 400;
const SNAP_MINUTES = 5;
const MOUSE_DRAG_THRESHOLD = 10;
const MIN_COMMIT_DRAG_PX = 14;
const COL_SWITCH_DELAY_MS = 180;

interface TouchDragState {
  isDragging: boolean;
  draggedId: string | null;
  currentMinute: number;
  currentOpIndex: number;
  ghostTop: number;
  ghostLeft: number;
  ghostWidth: number;
  ghostHeight: number;
}

interface UseTouchDragOptions {
  slotHeight: number;
  gridStartMinutes: number;
  timeColWidth: number;
  operatorCount: number;
  gridRef: React.RefObject<HTMLDivElement | null>;
  headerHeight: number;
  onDrop: (appointmentId: string, newStartMinute: number, operatorIndex: number) => void;
}

export function useTouchDrag({
  slotHeight,
  gridStartMinutes,
  timeColWidth,
  operatorCount,
  gridRef,
  headerHeight,
  onDrop,
}: UseTouchDragOptions) {
  const [state, setState] = useState<TouchDragState>({
    isDragging: false,
    draggedId: null,
    currentMinute: 0,
    currentOpIndex: -1,
    ghostTop: 0,
    ghostLeft: 0,
    ghostWidth: 0,
    ghostHeight: 0,
  });
  const [wasDragged, setWasDragged] = useState(false);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSnapMinute = useRef<number>(-1);
  const lastSnapOpIndex = useRef<number>(-1);
  const pendingOpIndex = useRef<number>(-1);
  const colSwitchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPointerPos = useRef<{ x: number; y: number } | null>(null);

  const dragInfo = useRef<{
    id: string;
    startMinute: number;
    durationMinutes: number;
    opIndex: number;
    elementHeight: number;
    // Frozen at activation: the viewport Y where the event TOP sits
    eventViewportTop: number;
    // Frozen at activation: the cursor X/Y at grab
    grabCursorX: number;
    grabCursorY: number;
    // Frozen at activation: grid snapshot for minute/column calculations
    gridRectTop: number;
    gridScrollTop: number;
    gridScrollLeft: number;
    gridRectLeft: number;
    gridScrollWidth: number;
  } | null>(null);

  // Mouse drag state
  const mouseDownInfo = useRef<{
    id: string;
    startMinute: number;
    durationMinutes: number;
    opIndex: number;
    elementHeight: number;
    startX: number;
    startY: number;
    activated: boolean;
    eventTop: number; // viewport top of the event element
  } | null>(null);

  const triggerHaptic = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(10);
  }, []);

  // Compute operator column index from cursor X using frozen grid snapshot
  const getOpIndex = useCallback(
    (clientX: number, info: NonNullable<typeof dragInfo.current>) => {
      const relX = clientX - info.gridRectLeft + info.gridScrollLeft;
      const availableWidth = info.gridScrollWidth - timeColWidth;
      const colX = relX - timeColWidth;
      let opIdx = Math.floor((colX / availableWidth) * operatorCount);
      opIdx = Math.max(0, Math.min(operatorCount - 1, opIdx));

      const colWidth = availableWidth / operatorCount;
      const colCenter = (opIdx + 0.5) * colWidth;
      const distFromCenter = Math.abs(colX - colCenter);
      const nearCenter = distFromCenter < colWidth * 0.4;
      return nearCenter ? opIdx : -1;
    },
    [timeColWidth, operatorCount]
  );

  // From a viewport Y of the ghost top, derive the snapped minute
  const ghostTopToMinute = useCallback(
    (ghostViewportTop: number, info: NonNullable<typeof dragInfo.current>) => {
      const relativeTop = ghostViewportTop - info.gridRectTop - headerHeight + info.gridScrollTop + 3;
      const rawMinute = gridStartMinutes + (relativeTop / slotHeight) * 30;
      return Math.max(gridStartMinutes, Math.round(rawMinute / SNAP_MINUTES) * SNAP_MINUTES);
    },
    [gridStartMinutes, slotHeight, headerHeight]
  );

  // From a snapped minute, compute the ghost viewport top (inverse)
  const minuteToGhostTop = useCallback(
    (minute: number, info: NonNullable<typeof dragInfo.current>) => {
      return ((minute - gridStartMinutes) / 30) * slotHeight + headerHeight - info.gridScrollTop + info.gridRectTop - 3;
    },
    [gridStartMinutes, slotHeight, headerHeight]
  );

  const getGhostStyle = useCallback(() => {
    if (!state.isDragging || !dragInfo.current) return { top: 0, left: 0, width: 0, height: 0 };
    const info = dragInfo.current;
    const colWidth = (info.gridScrollWidth - timeColWidth) / operatorCount;

    const top = minuteToGhostTop(state.currentMinute, info);
    const left = timeColWidth + state.currentOpIndex * colWidth + 2 - info.gridScrollLeft + info.gridRectLeft;
    return { top, left, width: colWidth - 4, height: state.ghostHeight };
  }, [state.isDragging, state.currentMinute, state.currentOpIndex, state.ghostHeight, timeColWidth, operatorCount, minuteToGhostTop]);

  const processMove = useCallback(
    (clientX: number, clientY: number) => {
      const info = dragInfo.current;
      if (!info) return;

      lastPointerPos.current = { x: clientX, y: clientY };

      // Ghost follows cursor directly: new ghost top = eventViewportTop + (cursor - grabCursor)
      const rawGhostTop = info.eventViewportTop + (clientY - info.grabCursorY);
      // Snap to 5-minute grid
      const rawMinute = ghostTopToMinute(rawGhostTop, info);
      const clampedMinute = Math.max(gridStartMinutes, rawMinute);

      // Column with debounce
      const rawOpIndex = getOpIndex(clientX, info);
      const effectiveRawOp = rawOpIndex >= 0 ? rawOpIndex : lastSnapOpIndex.current;
      let effectiveOpIndex = lastSnapOpIndex.current;

      if (effectiveRawOp !== lastSnapOpIndex.current) {
        if (pendingOpIndex.current !== effectiveRawOp) {
          pendingOpIndex.current = effectiveRawOp;
          if (colSwitchTimer.current) clearTimeout(colSwitchTimer.current);
          colSwitchTimer.current = setTimeout(() => {
            if (pendingOpIndex.current >= 0 && dragInfo.current) {
              lastSnapOpIndex.current = pendingOpIndex.current;
              triggerHaptic();
              setState((s) => ({ ...s, currentOpIndex: pendingOpIndex.current }));
            }
          }, COL_SWITCH_DELAY_MS);
        }
      } else {
        if (colSwitchTimer.current) {
          clearTimeout(colSwitchTimer.current);
          colSwitchTimer.current = null;
        }
        pendingOpIndex.current = -1;
      }

      if (clampedMinute !== lastSnapMinute.current) {
        triggerHaptic();
        lastSnapMinute.current = clampedMinute;
      }

      setState({
        isDragging: true,
        draggedId: info.id,
        currentMinute: clampedMinute,
        currentOpIndex: effectiveOpIndex,
        ghostTop: 0,
        ghostLeft: 0,
        ghostWidth: 0,
        ghostHeight: info.elementHeight,
      });
    },
    [ghostTopToMinute, getOpIndex, triggerHaptic, gridStartMinutes]
  );

  const finishDrag = useCallback(() => {
    if (colSwitchTimer.current) {
      clearTimeout(colSwitchTimer.current);
      colSwitchTimer.current = null;
    }

    const didDrag = state.isDragging;
    if (dragInfo.current && didDrag) {
      const info = dragInfo.current;
      const finalMinute = lastSnapMinute.current;
      const finalOpIndex = lastSnapOpIndex.current;
      const dragDistance = lastPointerPos.current
        ? Math.hypot(lastPointerPos.current.x - info.grabCursorX, lastPointerPos.current.y - info.grabCursorY)
        : 0;
      const hasMeaningfulMovement = dragDistance >= MIN_COMMIT_DRAG_PX;

      if (hasMeaningfulMovement && (finalMinute !== info.startMinute || finalOpIndex !== info.opIndex)) {
        onDrop(info.id, finalMinute, finalOpIndex);
        triggerHaptic();
      }
    }

    dragInfo.current = null;
    lastPointerPos.current = null;
    pendingOpIndex.current = -1;
    setState({ isDragging: false, draggedId: null, currentMinute: 0, currentOpIndex: -1, ghostTop: 0, ghostLeft: 0, ghostWidth: 0, ghostHeight: 0 });

    if (didDrag) {
      setWasDragged(true);
      setTimeout(() => setWasDragged(false), 300);
    }
  }, [state.isDragging, onDrop, triggerHaptic]);

  /** Create dragInfo snapshot from current grid state */
  const activateDrag = useCallback(
    (
      id: string,
      startMinute: number,
      durationMinutes: number,
      opIndex: number,
      elementHeight: number,
      cursorX: number,
      cursorY: number,
      eventElementTop: number
    ) => {
      if (!gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      const info: NonNullable<typeof dragInfo.current> = {
        id,
        startMinute,
        durationMinutes,
        opIndex,
        elementHeight,
        eventViewportTop: eventElementTop,
        grabCursorX: cursorX,
        grabCursorY: cursorY,
        gridRectTop: rect.top,
        gridScrollTop: gridRef.current.scrollTop,
        gridScrollLeft: gridRef.current.scrollLeft,
        gridRectLeft: rect.left,
        gridScrollWidth: gridRef.current.scrollWidth,
      };
      dragInfo.current = info;
      lastPointerPos.current = { x: cursorX, y: cursorY };
      lastSnapMinute.current = startMinute;
      lastSnapOpIndex.current = opIndex;
      setState({
        isDragging: true,
        draggedId: id,
        currentMinute: startMinute,
        currentOpIndex: opIndex,
        ghostTop: 0,
        ghostLeft: 0,
        ghostWidth: 0,
        ghostHeight: elementHeight,
      });
    },
    [gridRef]
  );

  // ─── Touch handlers ─────────────────────────────────────────
  const handleTouchStart = useCallback(
    (e: React.TouchEvent, appointmentId: string, startMinute: number, durationMinutes: number, opIndex: number) => {
      const touch = e.touches[0];
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };

      const target = e.currentTarget as HTMLElement;
      const targetRect = target.getBoundingClientRect();

      longPressTimer.current = setTimeout(() => {
        triggerHaptic();
        activateDrag(appointmentId, startMinute, durationMinutes, opIndex, targetRect.height, touch.clientX, touch.clientY, targetRect.top);
      }, LONG_PRESS_MS);
    },
    [triggerHaptic, activateDrag]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragInfo.current) {
        if (longPressTimer.current) {
          const touch = e.touches[0];
          const dx = touch.clientX - touchStartPos.current.x;
          const dy = touch.clientY - touchStartPos.current.y;
          if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
        }
        return;
      }
      e.preventDefault();
      const touch = e.touches[0];
      processMove(touch.clientX, touch.clientY);
    },
    [processMove]
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    finishDrag();
  }, [finishDrag]);

  // ─── Mouse handlers ─────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, appointmentId: string, startMinute: number, durationMinutes: number, opIndex: number) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const target = e.currentTarget as HTMLElement;
      const targetRect = target.getBoundingClientRect();

      mouseDownInfo.current = {
        id: appointmentId,
        startMinute,
        durationMinutes,
        opIndex,
        elementHeight: targetRect.height,
        startX: e.clientX,
        startY: e.clientY,
        activated: false,
        eventTop: targetRect.top,
      };
    },
    []
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const mdi = mouseDownInfo.current;
      if (!mdi) return;

      if (!mdi.activated) {
        const dx = e.clientX - mdi.startX;
        const dy = e.clientY - mdi.startY;
        if (Math.abs(dx) < MOUSE_DRAG_THRESHOLD && Math.abs(dy) < MOUSE_DRAG_THRESHOLD) return;

        mdi.activated = true;
        activateDrag(mdi.id, mdi.startMinute, mdi.durationMinutes, mdi.opIndex, mdi.elementHeight, mdi.startX, mdi.startY, mdi.eventTop);
        return;
      }

      e.preventDefault();
      processMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      if (mouseDownInfo.current) {
        if (mouseDownInfo.current.activated) finishDrag();
        mouseDownInfo.current = null;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [activateDrag, processMove, finishDrag]);

  return {
    ...state,
    wasDragged,
    getGhostStyle,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
  };
}
