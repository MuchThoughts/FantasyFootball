"use client";

import { useMemo } from "react";
import { Strategy } from "@/lib/data/strategies";
import { BoardRow, FIXED_SLOT_POS, fmtMoney, POS_COLOR, POSITIONS, Pos, slotLabel } from "@/lib/draftLogic";
import { styles, chipActive } from "./styles";

interface StrategyTabProps {
  strategies: Strategy[];
  activeStrategyId: string;
  setActiveStrategyId: (id: string) => void;
  budget: number;
  boardRows: BoardRow[];
  onSlotPos: (strategyId: string, slotId: string, pos: string) => void;
  onSlotAmount: (strategyId: string, slotId: string, value: string) => void;
  onName: (strategyId: string, name: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

const STARTER_IDS = new Set(["qb1", "qb2", "rb1", "rb2", "wr1", "wr2", "te", "def"]);
const FLEX_IDS = new Set(["flex1", "flex2"]);

export function StrategyTab({
  strategies,
  activeStrategyId,
  setActiveStrategyId,
  budget,
  boardRows,
  onSlotPos,
  onSlotAmount,
  onName,
  onAdd,
  onDelete,
}: StrategyTabProps) {
  const active = strategies.find((s) => s.id === activeStrategyId) || strategies[0];

  const total = active.slots.reduce((s, sl) => s + (Number(sl.amount) || 0), 0);
  const starterTotal = active.slots
    .filter((sl) => STARTER_IDS.has(sl.id) || FLEX_IDS.has(sl.id))
    .reduce((s, sl) => s + (Number(sl.amount) || 0), 0);
  const benchTotal = total - starterTotal;
  const posTotals: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0, DEF: 0 };
  active.slots.forEach((sl) => {
    posTotals[sl.pos] = (posTotals[sl.pos] || 0) + (Number(sl.amount) || 0);
  });

  const byPos = useMemo(() => {
    const m: Record<string, BoardRow[]> = {};
    POSITIONS.forEach((p) => {
      m[p] = boardRows.filter((r) => r.pos === p && r.target != null).sort((a, b) => (a.target as number) - (b.target as number));
    });
    return m;
  }, [boardRows]);

  const closestPlayers = (pos: string, amount: number | string) => {
    const list = byPos[pos] || [];
    const amt = Number(amount);
    if (!list.length || !amt) return [];
    return [...list].sort((a, b) => Math.abs((a.target as number) - amt) - Math.abs((b.target as number) - amt)).slice(0, 5);
  };

  const budgetColor = total === budget ? "#4CAF6B" : total > budget ? "#E1524B" : "#E8A33D";
  const budgetPct = budget ? Math.min(100, Math.round((100 * total) / budget)) : 0;

  const starterGroup = active.slots.filter((sl) => STARTER_IDS.has(sl.id));
  const flexGroup = active.slots.filter((sl) => FLEX_IDS.has(sl.id));
  const benchGroup = active.slots.filter((sl) => sl.id.startsWith("bench"));

  const renderSlot = (sl: Strategy["slots"][number]) => {
    const fixed = !!FIXED_SLOT_POS[sl.id];
    const options: Pos[] = sl.id.startsWith("flex") ? (["RB", "WR", "TE"] as Pos[]) : POSITIONS;
    const comps = closestPlayers(sl.pos, sl.amount);
    return (
      <div key={sl.id} style={styles.slotRow}>
        <span style={styles.slotRowLabel}>{slotLabel(sl.id)}</span>
        {fixed ? (
          <span style={{ ...styles.posTagSm, background: POS_COLOR[sl.pos] }}>{sl.pos}</span>
        ) : (
          <select
            style={{ ...styles.statusSelect, width: 60 }}
            value={sl.pos}
            onChange={(e) => onSlotPos(active.id, sl.id, e.target.value)}
          >
            {options.map((p) => (
              <option key={p} value={p} style={{ background: "#1C2128", color: "#EDEEF0" }}>
                {p}
              </option>
            ))}
          </select>
        )}
        <input
          style={{ ...styles.cellInput, marginLeft: "auto" }}
          type="number"
          value={sl.amount}
          onChange={(e) => onSlotAmount(active.id, sl.id, e.target.value)}
        />
        {comps.length > 0 && (
          <div style={{ ...styles.slotRowComp, flexBasis: "100%" }}>
            <span style={styles.compLabel}>≈ ${sl.amount} gets you:</span>{" "}
            {comps.map((c, i) => (
              <span key={c.id}>
                {c.name}
                <span style={styles.compPrice}> (${c.target})</span>
                {i < comps.length - 1 ? ", " : ""}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={styles.chipRow}>
        {strategies.map((s) => (
          <button
            key={s.id}
            style={s.id === activeStrategyId ? { ...styles.chip, ...chipActive("ALL") } : styles.chip}
            onClick={() => setActiveStrategyId(s.id)}
          >
            {s.name}
          </button>
        ))}
        <button style={styles.smallBtn} onClick={onAdd}>
          + New
        </button>
      </div>

      <div style={styles.panel}>
        <div style={styles.row}>
          <input style={{ ...styles.input, flex: 1 }} value={active.name} onChange={(e) => onName(active.id, e.target.value)} />
          <button style={styles.dangerBtn} onClick={() => onDelete(active.id)}>
            Delete
          </button>
        </div>

        <div style={styles.budgetSummary}>
          <div style={styles.budgetSummaryTop}>
            <span style={styles.budgetSummaryLabel}>Total allocated</span>
            <span style={{ ...styles.budgetSummaryValue, color: budgetColor }}>
              {fmtMoney(total)} <span style={{ color: "#8B92A0", fontWeight: 400, fontSize: 13 }}>/ {fmtMoney(budget)}</span>
            </span>
          </div>
          <div style={styles.barTrack}>
            <div style={{ ...styles.barFill, width: `${budgetPct}%`, background: budgetColor }} />
          </div>
          <div style={styles.barCaption}>
            {total === budget
              ? "Exactly on budget"
              : total > budget
              ? `${fmtMoney(total - budget)} over budget`
              : `${fmtMoney(budget - total)} unallocated`}
          </div>
        </div>

        <div style={styles.subPanel}>
          <div style={styles.panelTitle}>By position</div>
          <div style={styles.barTrack}>
            {POSITIONS.map((p) =>
              posTotals[p] > 0 ? (
                <div
                  key={p}
                  style={{ ...styles.barFill, width: `${total ? (100 * posTotals[p]) / total : 0}%`, background: POS_COLOR[p] }}
                />
              ) : null
            )}
          </div>
          <div style={styles.legendRow}>
            {POSITIONS.map((p) => (
              <span key={p} style={styles.legendItem}>
                <span style={{ ...styles.legendDot, background: POS_COLOR[p] }} />
                {p} {fmtMoney(posTotals[p])} <span style={{ color: "#8B92A0" }}>({total ? Math.round((100 * posTotals[p]) / total) : 0}%)</span>
              </span>
            ))}
          </div>
        </div>

        <div style={styles.subPanel}>
          <div style={styles.panelTitle}>Starters vs. bench</div>
          <div style={styles.barTrack}>
            <div style={{ ...styles.barFill, width: `${total ? (100 * starterTotal) / total : 0}%`, background: "#5B9BD5" }} />
            <div style={{ ...styles.barFill, width: `${total ? (100 * benchTotal) / total : 0}%`, background: "#8B92A0" }} />
          </div>
          <div style={styles.legendRow}>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: "#5B9BD5" }} />
              Starters {fmtMoney(starterTotal)} <span style={{ color: "#8B92A0" }}>({total ? Math.round((100 * starterTotal) / total) : 0}%)</span>
            </span>
            <span style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: "#8B92A0" }} />
              Bench {fmtMoney(benchTotal)} <span style={{ color: "#8B92A0" }}>({total ? Math.round((100 * benchTotal) / total) : 0}%)</span>
            </span>
          </div>
        </div>

        <div style={styles.slotSection}>
          <div style={styles.slotSectionTitle}>Starters</div>
          {starterGroup.map(renderSlot)}
        </div>

        <div style={styles.slotSection}>
          <div style={styles.slotSectionTitle}>Flex</div>
          {flexGroup.map(renderSlot)}
        </div>

        <div style={styles.slotSection}>
          <div style={styles.slotSectionTitle}>Bench</div>
          {benchGroup.map(renderSlot)}
        </div>

        <div style={{ fontSize: 11, color: "#8B92A0", marginTop: 16 }}>
          Whichever strategy is active highlights its target players (the cheapest-to-priciest available players
          needed to fill these slots) on the Board tab.
        </div>
      </div>
    </div>
  );
}
