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
  PositionBudget,
  resolvePositionBudget,
  SlotFlex,
  SlotLabel,
} from "@/lib/draftLogic";
import { rawCostAt } from "@/lib/data/rawDraftCosts";
import { FINISH_2025 } from "@/lib/data/finish2025";
import { points2025ForFinish } from "@/lib/data/points2025";
import { BoardRow } from "./BoardRow";
import { PriceInput } from "./PriceInput";
import { SlotMenuState } from "./SlotMenu";
import { styles, chipActive } from "./styles";

// One colour per pick within a position, in price order. Distinct enough to tell
// apart as a row background at low alpha and as a star at full strength.
const PICK_COLORS = ["#5B9BD5", "#E8A33D", "#C77DD2", "#4CAF6B", "#D2695B", "#7E8CE0", "#59B3B0", "#B48A4A"];

// How far either side of a pick's price its shading reaches, counted in players
// you've rated — 4 dearer, anyone at the price, 4 cheaper.
const WINDOW = 4;

const FLEX_META: Record<SlotFlex, { icon: string; label: string; title: string }> = {
  fixed: { icon: "=", label: "fixed", title: "Never moves, whatever the rest of the position does" },
  up: { icon: "▲", label: "flex up", title: "Soaks up money freed elsewhere in this position" },
  down: { icon: "▼", label: "flex down", title: "Gives money back when another pick here goes over" },
};
const FLEX_CYCLE: SlotFlex[] = ["fixed", "up", "down"];

interface PickView {
  id: string;
  label: string;
  color: string;
  price: number;
  nominal: number;
  flex: SlotFlex;
  filled: boolean;
  spent: number;
  player: BoardRowType | null;
}

interface LiveDraftTabProps {
  board: Board;
  strategy: Strategy | undefined;
  bandByPlayer: Map<string, Band>;
  assignments: Record<string, string>;
  slotLabels: Map<string, SlotLabel>;
  onOpenMenu: (row: BoardRowType, rect: SlotMenuState["rect"]) => void;
  onPaid: (row: BoardRowType, value: string) => void;
  onMine: (row: BoardRowType, value: boolean) => void;
  onDrafted: (row: BoardRowType, value: boolean) => void;
  onMeta: (id: string, field: "max", value: string) => void;
  onRate: (row: BoardRowType, value: Interest) => void;
  onPositionBudget: (strategyId: string, pos: Pos, value: string) => void;
  onSlotAmounts: (strategyId: string, updates: Record<string, number>) => void;
  onSlotFlex: (strategyId: string, slotId: string, flex: SlotFlex) => void;
}

// Draft night: one position at a time. The position's money is split across its
// picks, each pick owns a colour, and the players you've rated are shaded by the
// pick whose price they sit nearest — so a glance tells you which pick a name is
// for. Buy someone and the remaining picks re-solve around what you actually paid.
export function LiveDraftTab({
  board,
  strategy,
  bandByPlayer,
  assignments,
  slotLabels,
  onOpenMenu,
  onPaid,
  onMine,
  onDrafted,
  onMeta,
  onRate,
  onPositionBudget,
  onSlotAmounts,
  onSlotFlex,
}: LiveDraftTabProps) {
  const [pos, setPos] = useState<Pos>("QB");
  const [showNeutral, setShowNeutral] = useState(false);
  const [showDisliked, setShowDisliked] = useState(false);
  // Drafted players fall off the list; the toggle brings them back.
  const [showDrafted, setShowDrafted] = useState(false);
  // Paid/Mine only appear for the row you right-clicked — the table stays a
  // reading surface until you actually need to record something.
  const [revealed, setRevealed] = useState<string | null>(null);

  const budgets = useMemo(() => {
    const out = {} as Record<Pos, PositionBudget & { picks: PickView[] }>;
    const mine = board.rows.filter((r) => r.mine && (r.isDrafted || r.isKeeper));

    for (const p of POSITIONS) {
      const slots = (strategy?.slots ?? []).filter((s) => s.pos === p);
      const slotSum = slots.reduce((n, s) => n + (Number(s.amount) || 0), 0);
      const target = strategy?.positionBudgets?.[p] ?? slotSum;

      // Which of your players fills which pick. An explicit target you set by
      // right-clicking wins; anyone else you own falls to their closest-priced
      // open pick.
      const owned = mine.filter((r) => r.pos === p);
      const bySlot = new Map<string, BoardRowType>();
      const claimed = new Set<string>();
      for (const r of owned) {
        const a = assignments[r.id];
        if (a && slots.some((s) => s.id === a) && !bySlot.has(a)) {
          bySlot.set(a, r);
          claimed.add(r.id);
        }
      }
      for (const r of owned) {
        if (claimed.has(r.id)) continue;
        const cost = Number(r.isKeeper ? r.keeperCost : r.paid) || 0;
        const free = slots.filter((s) => !bySlot.has(s.id));
        if (free.length === 0) break;
        const best = free.reduce((a, b) =>
          Math.abs((Number(b.amount) || 0) - cost) < Math.abs((Number(a.amount) || 0) - cost) ? b : a
        );
        bySlot.set(best.id, r);
      }

      const resolved = resolvePositionBudget(
        target,
        slots.map((s) => ({
          id: s.id,
          nominal: Number(s.amount) || 0,
          flex: strategy?.slotFlex?.[s.id] ?? "fixed",
          player: bySlot.get(s.id) ?? null,
        }))
      );

      const picks: PickView[] = resolved.slots
        .map((r) => ({
          id: r.id,
          label: slotLabels.get(r.id)?.label ?? r.id,
          color: "",
          price: r.effective,
          nominal: r.nominal,
          flex: r.flex,
          filled: r.filled,
          spent: r.spent,
          player: r.player,
        }))
        .sort((a, b) => b.nominal - a.nominal || a.id.localeCompare(b.id))
        .map((v, i) => ({ ...v, color: PICK_COLORS[i % PICK_COLORS.length] }));

      out[p] = { ...resolved, picks };
    }
    return out;
  }, [strategy, board.rows, assignments, slotLabels]);

  const cur = budgets[pos];

  // Players you've rated, priced high to low — the ladder the pick windows are
  // cut from. Shading only ever lands on names you've said you want.
  const ratedLadder = useMemo(
    () =>
      board.rows
        .filter(
          (r) => r.pos === pos && !r.isDrafted && !r.isKeeper && (r.interest === "love" || r.interest === "like")
        )
        .sort((a, b) => (b.act ?? 0) - (a.act ?? 0)),
    [board.rows, pos]
  );

  // playerId -> the pick whose window he sits in. Windows overlap where picks
  // are close in price, so the nearest pick wins and ties go to the dearer one.
  const pickByPlayer = useMemo(() => {
    const out = new Map<string, PickView>();
    const best = new Map<string, number>();
    for (const pick of cur.picks) {
      if (pick.filled) continue;
      const price = pick.price;
      const dearer = ratedLadder.filter((r) => (r.act ?? 0) > price).slice(-WINDOW);
      const exact = ratedLadder.filter((r) => (r.act ?? 0) === price);
      const cheaper = ratedLadder.filter((r) => (r.act ?? 0) < price).slice(0, WINDOW);
      for (const r of [...dearer, ...exact, ...cheaper]) {
        const d = Math.abs((r.act ?? 0) - price);
        const prior = best.get(r.id);
        if (prior === undefined || d < prior) {
          best.set(r.id, d);
          out.set(r.id, pick);
        }
      }
    }
    return out;
  }, [cur.picks, ratedLadder]);

  const rows = useMemo(() => {
    const all = board.rows.filter((r) => r.pos === pos);
    return all.filter((r) => {
      if (r.mine) return true;
      // The row you're working on stays put: typing what a player went for
      // marks him drafted, and he'd otherwise vanish before you could claim him.
      if (r.id === revealed) return true;
      if ((r.isDrafted || r.isKeeper) && !showDrafted) return false;
      if (r.interest === "love" || r.interest === "like") return true;
      if (r.interest === "dislike") return showDisliked;
      return showNeutral;
    });
  }, [board.rows, pos, showNeutral, showDisliked, showDrafted, revealed]);

  const hiddenCount = useMemo(() => {
    const all = board.rows.filter((r) => r.pos === pos && !r.mine);
    return {
      neutral: all.filter((r) => r.interest === "neutral" && !r.isDrafted && !r.isKeeper).length,
      disliked: all.filter((r) => r.interest === "dislike" && !r.isDrafted && !r.isKeeper).length,
      drafted: all.filter((r) => r.isDrafted || r.isKeeper).length,
    };
  }, [board.rows, pos]);

  // Repricing a pick keeps the position whole: whatever you add to one pick is
  // taken off a flex-up pick in the same position, and vice versa. With no
  // flex-up pick to balance against, the position simply ends up with money
  // unallocated — which the panel then shows in red.
  const repricePick = (pk: PickView, typed: string) => {
    if (!strategy) return;
    const next = Math.max(0, Math.round(Number(typed) || 0));
    const delta = next - pk.price;
    if (delta === 0) return;
    const updates: Record<string, number> = { [pk.id]: Math.max(0, pk.nominal + delta) };
    const donor = cur.picks.find((x) => x.id !== pk.id && !x.filled && x.flex === "up");
    if (donor) updates[donor.id] = Math.max(1, donor.nominal - delta);
    onSlotAmounts(strategy.id, updates);
  };

  const overall = board.myBudgetRemaining;
  const left = cur.target - cur.spent;

  return (
    <div>
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
              const v = budgets[p];
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

      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        {POSITIONS.map((p) => {
          const v = budgets[p];
          const on = pos === p;
          const done = v.slots.filter((s) => s.filled).length;
          return (
            <button
              key={p}
              onClick={() => setPos(p)}
              title={`${p}: ${fmtMoney(v.target)} across ${v.slots.length} pick${v.slots.length === 1 ? "" : "s"}`}
              style={{
                flex: "1 1 96px",
                background: on ? `${POS_COLOR[p]}22` : "#1C2128",
                border: `1px solid ${on ? POS_COLOR[p] : "#2A2F38"}`,
                borderRadius: 8,
                padding: "7px 8px",
                cursor: "pointer",
                textAlign: "center",
                lineHeight: 1.25,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: on ? POS_COLOR[p] : "#C6CAD2", letterSpacing: 0.5 }}>{p}</div>
              <div style={{ ...styles.tdMono, fontSize: 12, fontWeight: 700, color: on ? "#EDEEF0" : "#8B92A0" }}>
                {fmtMoney(v.target)}
              </div>
              <div style={{ fontSize: 9, color: "#5B6270" }}>
                {done}/{v.slots.length} picks
              </div>
            </button>
          );
        })}
      </div>

      {/* The position's money, and how it splits across the picks */}
      <div style={{ ...styles.panel, padding: "8px 10px", marginBottom: 8 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 8 }}>
          <span style={{ ...styles.posTagSm, background: POS_COLOR[pos] }}>{pos}</span>
          <span style={{ fontSize: 10, color: "#8B92A0" }}>position target</span>
          <PriceInput value={cur.target} onCommit={(v) => strategy && onPositionBudget(strategy.id, pos, v)} />
          {strategy?.positionBudgets?.[pos] != null && (
            <button
              style={{ ...styles.smallBtn, padding: "1px 7px", fontSize: 10 }}
              title="Back to the sum of this position's picks"
              onClick={() => onPositionBudget(strategy.id, pos, "")}
            >
              reset
            </button>
          )}
          <Stat label="spent" value={fmtMoney(cur.spent)} />
          <Stat label="left" value={fmtMoney(left)} tone={left < 0 ? "bad" : "good"} big />
          {cur.unallocated !== 0 && (
            <span
              style={{ ...styles.tdMono, fontSize: 12, fontWeight: 700, color: "#E1524B" }}
              title={
                cur.unallocated > 0
                  ? "This much of the position budget isn't on any pick. Raise a pick, or set one to flex up so it lands somewhere."
                  : "The picks here add up to more than the position budget."
              }
            >
              {cur.unallocated > 0
                ? `${fmtMoney(cur.unallocated)} unallocated`
                : `${fmtMoney(-cur.unallocated)} over budget`}
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {cur.picks.map((pk) => (
            <div
              key={pk.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: pk.filled ? "rgba(76,175,107,0.10)" : "#1C2128",
                border: `1px solid ${pk.filled ? "#2E7D46" : pk.color}`,
                borderRadius: 6,
                padding: "3px 7px",
                opacity: pk.filled ? 0.75 : 1,
              }}
            >
              <span style={{ color: pk.color, fontSize: 11 }}>★</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#C6CAD2" }}>{pk.label}</span>
              {pk.filled ? (
                <span style={{ ...styles.tdMono, fontSize: 11, color: "#8FCB9E" }}>
                  {pk.player?.name.split(" ").slice(-1)[0]} {fmtMoney(pk.spent)}
                </span>
              ) : (
                <>
                  <span style={{ fontSize: 11, color: "#5B6270" }}>$</span>
                  <PriceInput value={pk.price} onCommit={(v) => repricePick(pk, v)} />
                  {pk.price !== pk.nominal && (
                    <span
                      style={{ ...styles.tdMono, fontSize: 9.5, color: pk.price > pk.nominal ? "#4CAF6B" : "#E1524B" }}
                      title={`Planned ${fmtMoney(pk.nominal)}, flexed to ${fmtMoney(pk.price)}`}
                    >
                      {pk.price > pk.nominal ? "+" : ""}
                      {pk.price - pk.nominal}
                    </span>
                  )}
                  <button
                    onClick={() =>
                      strategy &&
                      onSlotFlex(strategy.id, pk.id, FLEX_CYCLE[(FLEX_CYCLE.indexOf(pk.flex) + 1) % FLEX_CYCLE.length])
                    }
                    title={FLEX_META[pk.flex].title + " — click to change"}
                    style={{
                      background: "transparent",
                      border: "1px solid #3A3F4A",
                      borderRadius: 4,
                      color: pk.flex === "up" ? "#4CAF6B" : pk.flex === "down" ? "#E8A33D" : "#5B6270",
                      fontSize: 9,
                      padding: "1px 5px",
                      cursor: "pointer",
                    }}
                  >
                    {FLEX_META[pk.flex].icon} {FLEX_META[pk.flex].label}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...styles.chipRow, marginBottom: 6 }}>
        <button style={showNeutral ? { ...styles.chip, ...chipActive("ALL") } : styles.chip} onClick={() => setShowNeutral((v) => !v)}>
          {showNeutral ? "✓" : "+"} Neutral <span style={{ fontSize: 9, color: "#5B6270" }}>{hiddenCount.neutral}</span>
        </button>
        <button style={showDisliked ? { ...styles.chip, ...chipActive("ALL") } : styles.chip} onClick={() => setShowDisliked((v) => !v)}>
          {showDisliked ? "✓" : "+"} Disliked <span style={{ fontSize: 9, color: "#5B6270" }}>{hiddenCount.disliked}</span>
        </button>
        <button style={showDrafted ? { ...styles.chip, ...chipActive("ALL") } : styles.chip} onClick={() => setShowDrafted((v) => !v)}>
          {showDrafted ? "✓" : "+"} Drafted <span style={{ fontSize: 9, color: "#5B6270" }}>{hiddenCount.drafted}</span>
        </button>
      </div>

      <div style={{ fontSize: 10.5, color: "#5B6270", marginBottom: 8 }}>
        Rows are shaded by the pick they&apos;re priced for — darker for Loved than Liked.{" "}
        <b style={{ color: "#8B92A0" }}>Press and hold 3s</b> to strike a player off as drafted.{" "}
        <b style={{ color: "#8B92A0" }}>Right-click</b> for the menu, which also opens that row&apos;s Paid and Mine boxes
        — type what he went for, hit ME if you won him, and the other picks re-solve around it.
      </div>

      {rows.length === 0 ? (
        <div style={{ ...styles.panel, padding: 12, fontSize: 11.5, color: "#8B92A0" }}>
          No {pos}s to show. Turn on Neutral above to see the rest.
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, ...styles.thSticky }}>Rk</th>
                <th style={{ ...styles.th, ...styles.thSticky2, left: 38 }}>Player</th>
                <th style={styles.th} title="Last season's positional finish">
                  2025
                </th>
                <th style={styles.th} title="2025 season fantasy point total">
                  Pts
                </th>
                <th style={styles.th}>Tier</th>
                <th style={styles.th} title="What this positional rank actually cost in your league">
                  Act
                </th>
                <th style={styles.th} title="The most you're willing to pay">
                  Max
                </th>
                {revealed && (
                  <>
                    <th style={styles.th} title="What he actually went for tonight">
                      Paid
                    </th>
                    <th style={styles.th} title="Did you win him?">
                      Mine
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const pick = pickByPlayer.get(row.id);
                const assignedPick = cur.picks.find((p) => p.id === assignments[row.id]);
                return (
                  <BoardRow
                    key={row.id}
                    row={row}
                    tierBreak={false}
                    isTarget={false}
                    dragEnabled={false}
                    dragging={false}
                    dropEdge={{}}
                    onDragStart={noop}
                    band={bandByPlayer.get(row.id) ?? null}
                    playerStickyLeft={38}
                    showPos={false}
                    showTgt={false}
                    showLive={false}
                    showPaid={revealed === row.id}
                    showMine={revealed === row.id}
                    holdMs={3000}
                    onHoldAction={(r) => onDrafted(r, !r.isDrafted)}
                    pickTint={pick ? tintFor(pick.color, row.interest) : null}
                    starColor={assignedPick?.color ?? null}
                    actCost={rawCostAt(row.pos, row.effRank)}
                    finish2025={FINISH_2025[row.id] ?? null}
                    pts2025={points2025ForFinish(FINISH_2025[row.id])}
                    assignedLabel={assignments[row.id] ? slotLabels.get(assignments[row.id])?.label ?? null : null}
                    onOpenMenu={(r, rect) => {
                      setRevealed(r.id);
                      onOpenMenu(r, rect);
                    }}
                    onPaid={onPaid}
                    onMine={onMine}
                    onMeta={onMeta}
                    onRate={onRate}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const noop = () => {};

// The pick's colour at love/like strength — same hue, darker for the players you
// actually want.
function tintFor(hex: string, interest: Interest): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return `rgba(${r}, ${g}, ${b}, ${interest === "love" ? 0.34 : 0.14})`;
}

function Stat({ label, value, tone, big }: { label: string; value: string; tone?: "good" | "bad" | "warn"; big?: boolean }) {
  const color = tone === "bad" ? "#E1524B" : tone === "warn" ? "#E8A33D" : tone === "good" ? "#4CAF6B" : "#EDEEF0";
  return (
    <div>
      <div style={{ ...styles.tdMono, fontSize: big ? 15 : 12.5, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 9, color: "#5B6270", letterSpacing: 0.3 }}>{label}</div>
    </div>
  );
}
