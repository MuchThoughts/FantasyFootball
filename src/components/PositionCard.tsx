"use client";

import { useRef, useState } from "react";
import { fmtMoney, POS_COLOR, Pos } from "@/lib/draftLogic";
import { styles } from "./styles";

export interface CardPage {
  key: string;
  node: React.ReactNode;
}

interface PositionCardProps {
  pos: Pos;
  total: number; // planned/committed dollars at this position
  pct: number; // share of the whole budget
  picks: number; // how many players at this position
  overview: React.ReactNode; // page 1
  pages: CardPage[]; // one per slot group, in order
}

/*
 * One position's plan as a swipeable card: page 1 is the narrative + budget
 * breakdown, the rest are that position's slot groups with their shopping lists.
 *
 * Swiping works across the whole card, including over the player rows, so paging
 * never depends on finding empty space. Once a gesture reads as horizontal we
 * cancel the press on whatever it started over (so a long swipe can't trip the
 * press-and-hold slot menu) and swallow the click that follows. Text inputs are
 * left alone so selection and editing still work.
 */
export function PositionCard({ pos, total, pct, picks, overview, pages }: PositionCardProps) {
  const [page, setPage] = useState(0);
  const drag = useRef<{ x: number; y: number; target: EventTarget | null; swiping: boolean } | null>(null);
  const suppressClick = useRef(false);
  // Set while we dispatch our own pointercancel, so the card's cancel handler
  // (which the synthetic event bubbles into) doesn't tear down the live drag.
  const ignoreCancel = useRef(false);

  const pageCount = pages.length + 1;
  const current = Math.min(page, pageCount - 1);
  const go = (delta: number) => setPage(Math.max(0, Math.min(pageCount - 1, current + delta)));

  const SWIPE_MIN = 45;
  const onPointerDown = (e: React.PointerEvent) => {
    // A swipe often ends without the browser firing a click at all, so clear any
    // leftover suppression here rather than waiting for a click that never comes.
    suppressClick.current = false;
    if ((e.target as HTMLElement).closest("input, textarea, select")) return;
    drag.current = { x: e.clientX, y: e.clientY, target: e.target, swiping: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.swiping) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(e.clientY - d.y)) {
      d.swiping = true;
      ignoreCancel.current = true; // dispatch is synchronous, so this brackets it
      (d.target as HTMLElement | null)?.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true }));
      ignoreCancel.current = false;
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.swiping && Math.abs(e.clientX - d.x) > SWIPE_MIN) {
      suppressClick.current = true;
      go(e.clientX - d.x < 0 ? 1 : -1);
    }
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      data-poscard={pos}
      style={{
        ...styles.panel,
        padding: 10,
        borderTop: `2px solid ${POS_COLOR[pos]}`,
        marginBottom: 12,
        touchAction: "pan-y",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        if (!ignoreCancel.current) drag.current = null;
      }}
      onClickCapture={onClickCapture}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ ...styles.posTagSm, background: POS_COLOR[pos] }}>{pos}</span>
        <span style={{ fontSize: 13, fontWeight: 700, ...styles.tdMono }}>{fmtMoney(total)}</span>
        <span style={{ fontSize: 11, color: "#8B92A0" }}>
          {pct}% · {picks} pick{picks === 1 ? "" : "s"}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#8B92A0" }}>
          {current === 0 ? "Plan" : `${current} / ${pages.length}`}
        </span>
      </div>

      <div key={current} style={{ animation: "cardPageIn 0.18s ease" }}>
        {current === 0 ? overview : pages[current - 1].node}
      </div>

      {pageCount > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <button
            style={{ ...styles.smallBtn, opacity: current === 0 ? 0.35 : 1 }}
            onClick={() => go(-1)}
            disabled={current === 0}
            aria-label={`Previous ${pos} page`}
          >
            ‹
          </button>
          <div style={{ display: "flex", gap: 5, flex: 1, justifyContent: "center", flexWrap: "wrap" }}>
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                aria-label={`${pos} page ${i + 1}`}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  padding: 0,
                  border: "none",
                  cursor: "pointer",
                  background: i === current ? POS_COLOR[pos] : "#3A3F4A",
                }}
              />
            ))}
          </div>
          <button
            style={{ ...styles.smallBtn, opacity: current === pageCount - 1 ? 0.35 : 1 }}
            onClick={() => go(1)}
            disabled={current === pageCount - 1}
            aria-label={`Next ${pos} page`}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
