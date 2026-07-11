"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/*
 * Pointer-based row drag-and-drop for the player tables (works with mouse and
 * touch — the handle sets touchAction: none). The dragged row is tracked by id;
 * the row under the pointer is found via elementFromPoint against rows tagged
 * with data-dragid, and the drop half (above/below the row's midpoint) decides
 * whether the player lands before or after it. Dragging near the viewport's
 * top/bottom edge auto-scrolls the page so long moves are possible.
 */

export interface RowDragState {
  id: string; // dragged row
  overId: string | null; // row currently under the pointer
  after: boolean; // drop below (true) or above (false) the over row
}

// Convert a drop position into the dragged player's new overall rank: the
// target row's rank (or one past it for "after"), corrected for the dragged
// player vacating his old slot above the insertion point.
export function dropRank(draggedRank: number, targetRank: number, after: boolean): number {
  let rank = after ? targetRank + 1 : targetRank;
  if (draggedRank < rank) rank -= 1;
  return Math.max(1, rank);
}

const EDGE_MARGIN = 90; // px from viewport edge that starts auto-scroll
const SCROLL_STEP = 14; // px per tick while auto-scrolling

export function useRowDrag(onDrop: (dragId: string, overId: string, after: boolean) => void) {
  const [drag, setDrag] = useState<RowDragState | null>(null);
  const stateRef = useRef<RowDragState | null>(null);
  const pointRef = useRef({ x: 0, y: 0 });
  const scrollDir = useRef(0);
  const scrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const setBoth = useCallback((s: RowDragState | null) => {
    stateRef.current = s;
    setDrag(s);
  }, []);

  const hitTest = useCallback(() => {
    const cur = stateRef.current;
    if (!cur) return;
    const { x, y } = pointRef.current;
    const rowEl = document.elementFromPoint(x, y)?.closest("[data-dragid]") as HTMLElement | null;
    if (!rowEl) return; // between rows / off the table — keep the last target
    const overId = rowEl.getAttribute("data-dragid");
    if (!overId) return;
    const rect = rowEl.getBoundingClientRect();
    const after = y > rect.top + rect.height / 2;
    if (cur.overId !== overId || cur.after !== after) setBoth({ ...cur, overId, after });
  }, [setBoth]);

  const startDrag = useCallback(
    (id: string) => (e: React.PointerEvent) => {
      e.preventDefault();
      pointRef.current = { x: e.clientX, y: e.clientY };
      setBoth({ id, overId: null, after: false });

      scrollDir.current = 0;
      scrollTimer.current = setInterval(() => {
        if (scrollDir.current === 0) return;
        window.scrollBy(0, scrollDir.current * SCROLL_STEP);
        hitTest();
      }, 24);

      const onMove = (ev: PointerEvent) => {
        pointRef.current = { x: ev.clientX, y: ev.clientY };
        scrollDir.current = ev.clientY < EDGE_MARGIN ? -1 : ev.clientY > window.innerHeight - EDGE_MARGIN ? 1 : 0;
        hitTest();
      };
      const finish = (commit: boolean) => () => {
        cleanupRef.current?.();
        const cur = stateRef.current;
        setBoth(null);
        if (commit && cur && cur.overId && cur.overId !== cur.id) onDrop(cur.id, cur.overId, cur.after);
      };
      const onUp = finish(true);
      const onCancel = finish(false);

      cleanupRef.current = () => {
        if (scrollTimer.current) clearInterval(scrollTimer.current);
        scrollTimer.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
        cleanupRef.current = null;
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
    },
    [hitTest, onDrop, setBoth]
  );

  // If the component unmounts mid-drag, drop the window listeners and timer.
  useEffect(() => () => cleanupRef.current?.(), []);

  return { drag, startDrag };
}

// Style for a row's cells while a drag is in flight: a 2px insertion edge on
// the drop target (border, not box-shadow — reliable inside collapsed tables).
export function dropEdgeStyle(drag: RowDragState | null, id: string): React.CSSProperties {
  if (!drag || drag.overId !== id || drag.id === id) return {};
  return drag.after ? { borderBottom: "2px solid #5B9BD5" } : { borderTop: "2px solid #5B9BD5" };
}
