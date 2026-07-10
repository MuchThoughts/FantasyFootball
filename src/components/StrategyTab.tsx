"use client";

import { useMemo, Fragment } from "react";
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
  const starterIds = new Set(["qb1", "qb2", "rb1", "rb2", "wr1", "wr2", "te", "def", "flex1", "flex2"]);
  const starterTotal = active.slots
    .filter((sl) => starterIds.has(sl.id))
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

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Slot</th>
                <th style={styles.th}>Pos</th>
                <th style={styles.th}>$</th>
              </tr>
            </thead>
            <tbody>
              {active.slots.map((sl) => {
                const fixed = !!FIXED_SLOT_POS[sl.id];
                const options: Pos[] = sl.id.startsWith("flex") ? (["RB", "WR", "TE"] as Pos[]) : POSITIONS;
                const comps = closestPlayers(sl.pos, sl.amount);
                return (
                  <Fragment key={sl.id}>
                    <tr>
                      <td style={styles.td}>
                        <span style={{ fontSize: 12 }}>{slotLabel(sl.id)}</span>
                      </td>
                      <td style={styles.td}>
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
                      </td>
                      <td style={styles.td}>
                        <input
                          style={styles.cellInput}
                          type="number"
                          value={sl.amount}
                          onChange={(e) => onSlotAmount(active.id, sl.id, e.target.value)}
                        />
                      </td>
                    </tr>
                    {comps.length > 0 && (
                      <tr>
                        <td colSpan={3} style={styles.compRow}>
                          <span style={styles.compLabel}>≈ ${sl.amount} gets you:</span>{" "}
                          {comps.map((c, i) => (
                            <span key={c.id}>
                              {c.name}
                              <span style={styles.compPrice}> (${c.target})</span>
                              {i < comps.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              fontWeight: 600,
              color: total === budget ? "#4CAF6B" : total > budget ? "#E1524B" : "#E8A33D",
            }}
          >
            <span>Total allocated</span>
            <span>
              {fmtMoney(total)} / {fmtMoney(budget)}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#8B92A0", marginTop: 2 }}>
            {total === budget
              ? "Exactly on budget"
              : total > budget
              ? `${fmtMoney(total - budget)} over budget`
              : `${fmtMoney(budget - total)} unallocated`}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={styles.panelTitle}>Starters vs. bench</div>
          <div style={styles.allocRow}>
            <div style={styles.allocChip}>
              Starters {fmtMoney(starterTotal)}{" "}
              <span style={styles.allocDollar}>({total ? Math.round((100 * starterTotal) / total) : 0}%)</span>
            </div>
            <div style={styles.allocChip}>
              Bench {fmtMoney(benchTotal)}{" "}
              <span style={styles.allocDollar}>({total ? Math.round((100 * benchTotal) / total) : 0}%)</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={styles.panelTitle}>By position</div>
          <div style={styles.allocRow}>
            {POSITIONS.map((p) => (
              <div key={p} style={styles.allocChip}>
                <span style={{ color: POS_COLOR[p] }}>{p}</span> {fmtMoney(posTotals[p])}{" "}
                <span style={styles.allocDollar}>({total ? Math.round((100 * posTotals[p]) / total) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 11, color: "#8B92A0", marginTop: 12 }}>
          Whichever strategy is active highlights its target players (the cheapest-to-priciest available players
          needed to fill these slots) on the Board tab.
        </div>
      </div>
    </div>
  );
}
