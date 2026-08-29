"use client";

import { useMemo, useState } from "react";
import { Strategy } from "@/lib/data/strategies";
import {
  Band,
  Board,
  BoardRow as BoardRowType,
  fmtMoney,
  Interest,
  POS_COLOR,
  POSITIONS,
  Pos,
  SlotLabel,
} from "@/lib/draftLogic";
import { rawCostAt } from "@/lib/data/rawDraftCosts";
import { FINISH_2025 } from "@/lib/data/finish2025";
import { points2025ForFinish } from "@/lib/data/points2025";
import { BoardRow } from "./BoardRow";
import { PriceInput } from "./PriceInput";
import { SlotMenuState } from "./SlotMenu";
import { styles, chipActive } from "./styles";

interface LiveDraftTabProps {
  board: Board;
  strategy: Strategy | undefined;
  bandByPlayer: Map<string, Band>;
  assignments: Record<string, string>;
  slotLabels: Map<string, SlotLabel>;
  onOpenMenu: (row: BoardRowType, rect: SlotMenuState["rect"]) => void;
  onPaid: (row: BoardRowType, value: string) => void;
  onMine: (row: BoardRowType, value: boolean) => void;
  onMeta: (id: string, field: "max", value: string) => void;
  onRate: (row: BoardRowType, value: Interest) => void;
  onPositionBudget: (strategyId: string, pos: Pos, value: string) => void;
}

// The draft-night view: one position at a time, your money for that position at
// the top, and every player at it underneath. Ratings do the filtering — the
// players you've said nothing about are out of the way until you want them.
export function LiveDraftTab({
  board,
  strategy,
  bandByPlayer,
  assignments,
  slotLabels,
  onOpenMenu,
  onPaid,
  onMine,
  onMeta,
  onRate,
  onPositionBudget,
}: LiveDraftTabProps) {
  const [pos, setPos] = useState<Pos>("QB");
  const [showNeutral, setShowNeutral] = useState(false);
  const [showDisliked, setShowDisliked] = useState(false);
  const [hideGone, setHideGone] = useState(false);

  // Planned, spent and left for every position, so the subtabs can carry their
  // own numbers without recomputing per tab.
  const perPos = useMemo(() => {
    const out = {} as Record<Pos, { target: number; spent: number; bought: number; isOverride: boolean }>;
    for (const p of POSITIONS) {
      const slotSum = (strategy?.slots ?? []).filter((s) => s.pos === p).reduce((n, s) => n + (Number(s.amount) || 0), 0);
      const override = strategy?.positionBudgets?.[p];
      const mine = board.rows.filter((r) => r.pos === p && r.mine && (r.isDrafted || r.isKeeper));
      out[p] = {
        target: override ?? slotSum,
        // Keepers are already paid for out of the same budget, so they count.
        spent: mine.reduce((n, r) => n + (Number(r.isKeeper ? r.keeperCost : r.paid) || 0), 0),
        bought: mine.length,
        isOverride: override != null,
      };
    }
    return out;
  }, [strategy, board.rows]);

  const rows = useMemo(() => {
    const all = board.rows.filter((r) => r.pos === pos);
    return all.filter((r) => {
      // Your own roster is always visible — you need to see what you've built.
      if (r.mine) return true;
      if (hideGone && (r.isDrafted || r.isKeeper)) return false;
      // Everyone else is filtered by rating alone, including keepers and players
      // already bought tonight: an unrated player you don't care about shouldn't
      // reappear just because someone else took him. Flip Neutral on to record a
      // price for one.
      if (r.interest === "love" || r.interest === "like") return true;
      if (r.interest === "dislike") return showDisliked;
      return showNeutral;
    });
  }, [board.rows, pos, showNeutral, showDisliked, hideGone]);

  const hiddenCount = useMemo(() => {
    const all = board.rows.filter((r) => r.pos === pos);
    return {
      neutral: all.filter((r) => !r.mine && r.interest === "neutral").length,
      disliked: all.filter((r) => !r.mine && r.interest === "dislike").length,
    };
  }, [board.rows, pos]);

  const noop = () => {};
  const cur = perPos[pos];
  const left = cur.target - cur.spent;
  const overall = board.myBudgetRemaining;

  return (
    <div>
      {/* Running totals: your whole budget, then this position's slice. */}
      <div style={{ ...styles.panel, padding: "8px 10px", marginBottom: 8 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "baseline" }}>
          <Stat label="budget left" value={fmtMoney(overall)} tone={overall < 0 ? "bad" : "good"} big />
          <Stat label="spent" value={fmtMoney(board.myBudgetUsed)} />
          <Stat label="roster" value={`${board.myRosterCount}/${board.myRosterCount + board.mySlotsRemaining}`} />
          <Stat
            label="max bid"
            value={fmtMoney(Math.max(overall - Math.max(board.mySlotsRemaining - 1, 0), 0))}
            tone="warn"
          />
          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            {POSITIONS.map((p) => {
              const v = perPos[p];
              return (
                <div key={p} style={{ textAlign: "right", fontSize: 9.5, color: "#5B6270" }}>
                  <span style={{ color: POS_COLOR[p], fontWeight: 700 }}>{p}</span>{" "}
                  <span style={{ ...styles.tdMono, color: v.spent > v.target ? "#E1524B" : "#8B92A0" }}>
                    {v.spent}/{v.target}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Position subtabs */}
      <div style={styles.chipRow}>
        {POSITIONS.map((p) => (
          <button
            key={p}
            style={pos === p ? { ...styles.chip, ...chipActive(p) } : styles.chip}
            onClick={() => setPos(p)}
          >
            {p}
            <span style={{ fontSize: 9, color: "#5B6270" }}> {perPos[p].bought}</span>
          </button>
        ))}
      </div>

      {/* This position's money */}
      <div
        style={{
          ...styles.panel,
          padding: "8px 10px",
          marginBottom: 8,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
        <span style={{ ...styles.posTagSm, background: POS_COLOR[pos] }}>{pos}</span>
        <span style={{ fontSize: 10, color: "#8B92A0" }}>target</span>
        <PriceInput value={cur.target} onCommit={(v) => strategy && onPositionBudget(strategy.id, pos, v)} />
        {cur.isOverride && strategy && (
          <button
            style={{ ...styles.smallBtn, padding: "1px 7px", fontSize: 10 }}
            title="Go back to the sum of this position's slot prices"
            onClick={() => onPositionBudget(strategy.id, pos, "")}
          >
            reset
          </button>
        )}
        <Stat label="spent" value={fmtMoney(cur.spent)} />
        <Stat label="left" value={fmtMoney(left)} tone={left < 0 ? "bad" : "good"} big />
        <Stat label="bought" value={String(cur.bought)} />
      </div>

      {/* Who's showing */}
      <div style={{ ...styles.chipRow, marginBottom: 6 }}>
        <button
          style={showNeutral ? { ...styles.chip, ...chipActive("ALL") } : styles.chip}
          onClick={() => setShowNeutral((v) => !v)}
        >
          {showNeutral ? "✓" : "+"} Neutral <span style={{ fontSize: 9, color: "#5B6270" }}>{hiddenCount.neutral}</span>
        </button>
        <button
          style={showDisliked ? { ...styles.chip, ...chipActive("ALL") } : styles.chip}
          onClick={() => setShowDisliked((v) => !v)}
        >
          {showDisliked ? "✓" : "+"} Disliked{" "}
          <span style={{ fontSize: 9, color: "#5B6270" }}>{hiddenCount.disliked}</span>
        </button>
        <button
          style={hideGone ? { ...styles.chip, ...chipActive("ALL") } : styles.chip}
          onClick={() => setHideGone((v) => !v)}
        >
          {hideGone ? "✓" : "+"} Hide gone
        </button>
      </div>

      <div style={{ fontSize: 10.5, color: "#5B6270", marginBottom: 8 }}>
        Showing Loved and Liked {pos}s plus anyone on your roster. Type what a player went for in{" "}
        <b style={{ color: "#8B92A0" }}>Paid</b>; hit <b style={{ color: "#8B92A0" }}>ME</b> when you win one so it
        counts against your budget. Press and hold a name to dislike or assign it.
      </div>

      {rows.length === 0 ? (
        <div style={{ ...styles.panel, padding: 12, fontSize: 11.5, color: "#8B92A0" }}>
          No {pos}s to show. You haven&apos;t Loved or Liked any — turn on Neutral above to see the rest.
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, ...styles.thSticky }}>Rk</th>
                <th style={{ ...styles.th, ...styles.thSticky2, left: 38 }}>Player</th>
                <th style={styles.th} title="Last season's positional finish (e.g. RB5 = finished as the RB5)">
                  2025
                </th>
                <th style={styles.th} title="2025 season fantasy point total">
                  Pts
                </th>
                <th style={styles.th}>Tier</th>
                <th style={styles.th} title="What this positional rank actually cost in your league (weighted 3-yr price)">
                  Act
                </th>
                <th style={styles.th} title="The most you're willing to pay for this player">
                  Max
                </th>
                <th style={styles.th} title="What he actually went for tonight">
                  Paid
                </th>
                <th style={styles.th} title="Did you win him?">
                  Mine
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <BoardRow
                  key={row.id}
                  row={row}
                  tierBreak={false}
                  isTarget={false}
                  // Reordering belongs on the Board and Rankings tabs, not here.
                  dragEnabled={false}
                  dragging={false}
                  dropEdge={{}}
                  onDragStart={noop}
                  band={bandByPlayer.get(row.id) ?? null}
                  playerStickyLeft={38}
                  showPos={false}
                  showTgt={false}
                  showLive={false}
                  showPaid
                  showMine
                  actCost={rawCostAt(row.pos, row.effRank)}
                  finish2025={FINISH_2025[row.id] ?? null}
                  pts2025={points2025ForFinish(FINISH_2025[row.id])}
                  assignedLabel={assignments[row.id] ? slotLabels.get(assignments[row.id])?.label ?? null : null}
                  onOpenMenu={onOpenMenu}
                  onPaid={onPaid}
                  onMine={onMine}
                  onMeta={onMeta}
                  onRate={onRate}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  big,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "warn";
  big?: boolean;
}) {
  const color = tone === "bad" ? "#E1524B" : tone === "warn" ? "#E8A33D" : tone === "good" ? "#4CAF6B" : "#EDEEF0";
  return (
    <div>
      <div style={{ ...styles.tdMono, fontSize: big ? 15 : 12.5, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 9, color: "#5B6270", letterSpacing: 0.3 }}>{label}</div>
    </div>
  );
}
