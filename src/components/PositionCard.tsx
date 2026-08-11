"use client";

import { useMemo, useRef, useState } from "react";
import { StrategySlot } from "@/lib/data/strategies";
import { BoardRow, fmtMoney, Interest, POS_COLOR, Pos, slotLabel } from "@/lib/draftLogic";
import { styles } from "./styles";

export interface CardSlot extends StrategySlot {
  keeper?: BoardRow; // set when a keeper fills this slot
  effective: number; // keeper cost when kept, else the planned amount
}

interface PositionCardProps {
  pos: Pos;
  slots: CardSlot[];
  budget: number;
  note: string | undefined; // user-edited narrative, if any
  onNote: (pos: Pos, text: string | null) => void; // null clears back to generated
  targetsFor: (pos: string, amount: number | string) => BoardRow[];
  posOptionsFor: (slotId: string) => Pos[] | null; // null = position is locked
  onSlotPos: (slotId: string, pos: string) => void;
  onSlotAmount: (slotId: string, value: string) => void;
  onRate: (row: BoardRow, value: Interest) => void;
  renderTarget: (row: BoardRow) => React.ReactNode;
}

// "QB5–QB9" for the tier a dollar amount buys, from the players nearest that price.
function describeTier(pos: string, comps: BoardRow[]): string | null {
  const ranks = comps.map((c) => c.effRank).filter((r): r is number => r != null);
  if (!ranks.length) return null;
  const lo = Math.min(...ranks);
  const hi = Math.max(...ranks);
  return lo === hi ? `${pos}${lo}` : `${pos}${lo}–${pos}${hi}`;
}

// Plain-language summary of how this position is being drafted, regenerated from
// the live slot amounts whenever the user hasn't written their own.
function generateNote(
  pos: Pos,
  slots: CardSlot[],
  budget: number,
  targetsFor: (pos: string, amount: number | string) => BoardRow[]
): string {
  if (slots.length === 0) return `No ${pos} slots in this strategy.`;
  const total = slots.reduce((s, sl) => s + sl.effective, 0);
  const pct = budget > 0 ? Math.round((100 * total) / budget) : 0;
  const n = slots.length;
  const sentences: string[] = [
    `Rostering ${n} ${pos}${n === 1 ? "" : "s"} for ${fmtMoney(total)} — ${pct}% of your ${fmtMoney(budget)} budget.`,
  ];

  const kept = slots.filter((sl) => sl.keeper);
  const open = [...slots].filter((sl) => !sl.keeper).sort((a, b) => b.amount - a.amount);

  if (kept.length) {
    sentences.push(
      `Already locked in: ${kept.map((k) => `${k.keeper!.name} at ${fmtMoney(k.effective)}`).join(", ")}.`
    );
  }

  if (open.length) {
    const top = open[0];
    const topTier = describeTier(pos, targetsFor(pos, top.amount));
    sentences.push(
      `Your top open ${pos} slot budgets ${fmtMoney(top.amount)}${topTier ? `, which buys around the ${topTier} range` : ""}.`
    );
    const rest = open.slice(1);
    if (rest.length) {
      const cheapest = rest[rest.length - 1];
      const restTier = describeTier(pos, targetsFor(pos, cheapest.amount));
      sentences.push(
        `Then ${rest.length} more at ${rest.map((r) => fmtMoney(r.amount)).join(", ")}` +
          `${restTier ? ` — depth down to about ${restTier}` : ""}.`
      );
    }
  } else if (!kept.length) {
    sentences.push("No budget allocated here yet.");
  }

  return sentences.join(" ");
}

// Slots sharing an identical price share a page (their targets are the same
// players); every other slot — and every keeper — gets its own page.
function groupSlots(slots: CardSlot[]): CardSlot[][] {
  const groups: CardSlot[][] = [];
  const index = new Map<string, number>();
  slots.forEach((sl) => {
    const key = sl.keeper ? `k:${sl.id}` : `a:${sl.amount}`;
    const at = index.get(key);
    if (at === undefined) {
      index.set(key, groups.length);
      groups.push([sl]);
    } else {
      groups[at].push(sl);
    }
  });
  return groups;
}

export function PositionCard({
  pos,
  slots,
  budget,
  note,
  onNote,
  targetsFor,
  posOptionsFor,
  onSlotPos,
  onSlotAmount,
  renderTarget,
}: PositionCardProps) {
  const [page, setPage] = useState(0);
  const drag = useRef<{ x: number; y: number; target: EventTarget | null; swiping: boolean } | null>(null);
  const suppressClick = useRef(false);
  // Set while we dispatch our own pointercancel, so the card's cancel handler
  // (which the synthetic event bubbles into) doesn't tear down the live drag.
  const ignoreCancel = useRef(false);

  const groups = useMemo(() => groupSlots(slots), [slots]);
  const pageCount = groups.length + 1; // page 0 is the overview
  const current = Math.min(page, pageCount - 1);
  const total = slots.reduce((s, sl) => s + sl.effective, 0);
  const pct = budget > 0 ? Math.round((100 * total) / budget) : 0;
  const generated = useMemo(() => generateNote(pos, slots, budget, targetsFor), [pos, slots, budget, targetsFor]);

  const go = (delta: number) => setPage(Math.max(0, Math.min(pageCount - 1, current + delta)));

  /*
   * Swipe works anywhere on the card, including over the target players, so
   * paging never depends on finding empty space. Text-entry controls are left
   * alone. Once a gesture reads as horizontal we cancel the press on whatever
   * it started over (so a long swipe can't trip the press-and-hold Dislike) and
   * swallow the click that follows (so it can't register as a Like).
   */
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
    const dx = e.clientX - d.x;
    if (d.swiping && Math.abs(dx) > SWIPE_MIN) {
      suppressClick.current = true;
      go(dx < 0 ? 1 : -1);
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
      style={{ ...styles.panel, borderTop: `2px solid ${POS_COLOR[pos]}`, marginBottom: 12, touchAction: "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        if (!ignoreCancel.current) drag.current = null;
      }}
      onClickCapture={onClickCapture}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ ...styles.posTagSm, background: POS_COLOR[pos] }}>{pos}</span>
        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>
          {fmtMoney(total)} <span style={{ color: "#8B92A0", fontWeight: 400 }}>({pct}%)</span>
        </span>
        <span style={{ fontSize: 11, color: "#8B92A0" }}>
          {current === 0 ? "Overview" : `${current} / ${groups.length}`}
        </span>
      </div>

      <div key={current} style={{ animation: "cardPageIn 0.18s ease" }}>
        {current === 0 ? (
          <div>
            <textarea
              style={{
                ...styles.input,
                width: "100%",
                minHeight: 96,
                resize: "vertical",
                fontFamily: "inherit",
                fontSize: 12.5,
                lineHeight: 1.55,
                color: note === undefined ? "#A7ADBA" : "#EDEEF0",
              }}
              value={note ?? generated}
              onChange={(e) => onNote(pos, e.target.value)}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: "#4A5160", flex: 1 }}>
                {note === undefined ? "Auto-summary — edit to make it yours." : "Your notes."}
              </span>
              {note !== undefined && (
                <button style={styles.smallBtn} onClick={() => onNote(pos, null)}>
                  Reset
                </button>
              )}
            </div>

            <div style={styles.panelTitle}>Slots &amp; budgets</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {slots.map((sl) => (
                <div
                  key={sl.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 8px",
                    background: "#14171C",
                    border: "1px solid #2A2F38",
                    borderRadius: 6,
                  }}
                >
                  <span style={{ fontSize: 12, flex: 1 }}>
                    {slotLabel(sl.id)}
                    {sl.keeper && <span style={{ color: "#4CAF6B", fontSize: 11 }}> 🔒 {sl.keeper.name}</span>}
                  </span>
                  <span style={{ ...styles.tdMono, fontSize: 12, color: sl.keeper ? "#8FCB9E" : "#EDEEF0" }}>
                    {fmtMoney(sl.effective)}
                  </span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  fontSize: 12,
                  fontWeight: 600,
                  borderTop: "1px solid #2A2F38",
                  marginTop: 2,
                }}
              >
                <span>Total {pos}</span>
                <span style={styles.tdMono}>{fmtMoney(total)}</span>
              </div>
            </div>
          </div>
        ) : (
          (() => {
            const group = groups[current - 1];
            const keeper = group[0].keeper;
            const comps = keeper ? [] : targetsFor(pos, group[0].amount);
            return (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {group.map((sl) => slotLabel(sl.id)).join(" · ")}
                  </span>
                  {group.length > 1 && (
                    <span style={{ fontSize: 10, color: "#8B92A0" }}>same price — same targets</span>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                  {group.map((sl) => {
                    const options = posOptionsFor(sl.id);
                    return (
                      <div key={sl.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: "#8B92A0", minWidth: 58 }}>{slotLabel(sl.id)}</span>
                        {options && (
                          <select
                            style={{ ...styles.statusSelect, width: 60 }}
                            value={sl.pos}
                            onChange={(e) => onSlotPos(sl.id, e.target.value)}
                          >
                            {options.map((p) => (
                              <option key={p} value={p} style={{ background: "#1C2128", color: "#EDEEF0" }}>
                                {p}
                              </option>
                            ))}
                          </select>
                        )}
                        {sl.keeper ? (
                          <span style={{ ...styles.tdMono, fontSize: 12, color: "#8FCB9E" }}>
                            {fmtMoney(sl.effective)}
                          </span>
                        ) : (
                          <input
                            style={styles.cellInput}
                            type="number"
                            value={sl.amount}
                            onChange={(e) => onSlotAmount(sl.id, e.target.value)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {keeper ? (
                  <div style={{ fontSize: 12, color: "#4CAF6B" }}>🔒 Keeper: {keeper.name}</div>
                ) : (
                  <>
                    <div style={styles.panelTitle}>Targets</div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {comps.map((c) => renderTarget(c))}
                      {comps.length === 0 && <span style={{ fontSize: 11, color: "#4A5160" }}>—</span>}
                    </div>
                  </>
                )}
              </div>
            );
          })()
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
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
    </div>
  );
}
