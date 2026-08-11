"use client";

import { useMemo, useState } from "react";
import { Strategy } from "@/lib/data/strategies";
import { BoardRow, FIXED_SLOT_POS, fmtMoney, Interest, POS_COLOR, POSITIONS, Pos } from "@/lib/draftLogic";
import { usePlayerRating } from "@/hooks/usePlayerRating";
import { CardSlot, PositionCard } from "./PositionCard";
import { styles, chipActive } from "./styles";

// Slide-in used when a position card changes page.
const cardPageAnim = `@keyframes cardPageIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: none; } }`;

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
  onRate: (row: BoardRow, value: Interest) => void;
  // Per-position narrative on the front of each card; null resets to the auto-summary.
  onPositionNote: (strategyId: string, pos: Pos, text: string | null) => void;
  // Keeper management reuses the app's global keeper machinery (same as the
  // Board's status dropdown), so keepers set here also show on the Board.
  onStatus: (row: BoardRow, value: string) => void;
  onKeeperCost: (row: BoardRow, value: string) => void;
}

// A single clickable player name: click = Like, double-click = Love, press-and-hold =
// Dislike (each toggles). Disliking drops the player out of the candidate pool the
// parent draws from, so the next-closest player backfills automatically.
function CompPlayerItem({ row, onRate }: { row: BoardRow; onRate: (row: BoardRow, value: Interest) => void }) {
  const { pressing, handlers } = usePlayerRating(row.interest, (v) => onRate(row, v));
  const textColor = row.interest === "love" ? "#4CAF6B" : row.interest === "like" ? "#8FCB9E" : "#C9CCD2";

  return (
    <button
      {...handlers}
      title="Click = Like, double-click = Love, press and hold = Dislike (click again to undo)"
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: pressing ? "rgba(168, 58, 52, 0.35)" : "transparent",
        border: "none",
        borderRadius: 4,
        padding: "2px 4px",
        cursor: "pointer",
        fontSize: 11,
        lineHeight: 1.6,
        color: textColor,
        transition: "background 0.1s ease",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "manipulation",
      }}
    >
      {row.name} <span style={styles.compPrice}>(${row.target})</span>
    </button>
  );
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
  onRate,
  onPositionNote,
  onStatus,
  onKeeperCost,
}: StrategyTabProps) {
  const active = strategies.find((s) => s.id === activeStrategyId) || strategies[0];

  const [keeperName, setKeeperName] = useState("");
  const [keeperCostInput, setKeeperCostInput] = useState("");
  const [keeperError, setKeeperError] = useState<string | null>(null);

  // The user's keepers (global to the profile), and any undrafted, un-kept
  // player they can still designate as one.
  const myKeepers = useMemo(() => boardRows.filter((r) => r.isKeeper && r.mine), [boardRows]);
  const eligibleKeepers = useMemo(() => boardRows.filter((r) => !r.isDrafted && !r.isKeeper), [boardRows]);

  // Assign each keeper to the slot at its position whose planned target price is
  // closest to the keeper's cost — so a keeper priced like an RB2/RB3 fills that
  // slot rather than always landing in RB1. Ties favor the higher (earlier) slot.
  const slotKeeper = useMemo(() => {
    const map = new Map<string, BoardRow>();

    const slotsByPos: Record<string, { id: string; amount: number }[]> = {};
    active.slots.forEach((sl) => {
      (slotsByPos[sl.pos] = slotsByPos[sl.pos] || []).push({ id: sl.id, amount: Number(sl.amount) || 0 });
    });
    const keepersByPos: Record<string, BoardRow[]> = {};
    myKeepers.forEach((k) => {
      (keepersByPos[k.pos] = keepersByPos[k.pos] || []).push(k);
    });

    Object.entries(keepersByPos).forEach(([pos, keepers]) => {
      const slots = slotsByPos[pos] || [];
      // Every keeper/slot pairing, ranked by how close the keeper's cost is to
      // the slot's target price; greedily take the closest pair first so each
      // keeper lands in its best-fitting open slot.
      const pairs: { ki: number; si: number; diff: number }[] = [];
      keepers.forEach((k, ki) => {
        const cost = Number(k.keeperCost) || 0;
        slots.forEach((s, si) => pairs.push({ ki, si, diff: Math.abs(s.amount - cost) }));
      });
      pairs.sort((a, b) => a.diff - b.diff);
      const usedK = new Set<number>();
      const usedS = new Set<number>();
      pairs.forEach(({ ki, si }) => {
        if (usedK.has(ki) || usedS.has(si)) return;
        usedK.add(ki);
        usedS.add(si);
        map.set(slots[si].id, keepers[ki]);
      });
    });
    return map;
  }, [myKeepers, active.slots]);

  // A keeper-filled slot contributes the keeper's actual cost (not the planned
  // amount) to the budget totals.
  const slotAmount = (sl: { id: string; amount: number }) => {
    const k = slotKeeper.get(sl.id);
    return k ? Number(k.keeperCost) || 0 : Number(sl.amount) || 0;
  };

  const addKeeper = () => {
    const name = keeperName.trim().toLowerCase();
    if (!name) return;
    const row = boardRows.find((r) => r.name.toLowerCase() === name && !r.isDrafted);
    if (!row) {
      setKeeperError("No matching player found on the board.");
      return;
    }
    onStatus(row, "keeper-mine");
    if (keeperCostInput.trim() !== "") onKeeperCost(row, keeperCostInput.trim());
    setKeeperName("");
    setKeeperCostInput("");
    setKeeperError(null);
  };

  const total = active.slots.reduce((s, sl) => s + slotAmount(sl), 0);
  const starterIds = new Set(["qb1", "qb2", "rb1", "rb2", "wr1", "wr2", "te", "def", "flex1", "flex2"]);
  const starterTotal = active.slots.filter((sl) => starterIds.has(sl.id)).reduce((s, sl) => s + slotAmount(sl), 0);
  const benchTotal = total - starterTotal;
  const posTotals: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0, DEF: 0 };
  active.slots.forEach((sl) => {
    posTotals[sl.pos] = (posTotals[sl.pos] || 0) + slotAmount(sl);
  });

  // Excludes drafted/kept/disliked players so the list always shows live, real
  // candidates — disliking one here removes it and lets the next-closest backfill.
  const byPos = useMemo(() => {
    const m: Record<string, BoardRow[]> = {};
    POSITIONS.forEach((p) => {
      m[p] = boardRows
        .filter((r) => r.pos === p && r.target != null && !r.isDrafted && !r.isKeeper && r.interest !== "dislike")
        .sort((a, b) => (a.target as number) - (b.target as number));
    });
    return m;
  }, [boardRows]);

  const closestPlayers = (pos: string, amount: number | string) => {
    const list = byPos[pos] || [];
    const amt = Number(amount);
    if (!list.length || !amt) return [];
    // Pick the 5 players nearest the slot's dollar amount, then list them
    // most expensive to least expensive.
    return [...list]
      .sort((a, b) => Math.abs((a.target as number) - amt) - Math.abs((b.target as number) - amt))
      .slice(0, 5)
      .sort((a, b) => (b.target as number) - (a.target as number));
  };

  return (
    <div>
      <style>{cardPageAnim}</style>
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
        <input
          style={{ ...styles.input, width: "100%", marginBottom: 10 }}
          value={active.name}
          onChange={(e) => onName(active.id, e.target.value)}
        />

        {active.description && (
          <div
            style={{
              fontSize: 12,
              color: "#A7ADBA",
              lineHeight: 1.55,
              background: "rgba(91, 155, 213, 0.07)",
              border: "1px solid rgba(91, 155, 213, 0.2)",
              borderRadius: 6,
              padding: "8px 10px",
              marginBottom: 10,
            }}
          >
            {active.description}
          </div>
        )}

        <div style={styles.panelTitle}>My keepers</div>
        <div style={{ fontSize: 11, color: "#8B92A0", marginBottom: 8 }}>
          Add the players you&apos;re keeping and their cost. Each one fills the slot at its position whose budget is
          closest to that cost — hiding that slot&apos;s targets and counting its cost toward your budget.
        </div>
        {myKeepers.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
            {myKeepers.map((k) => (
              <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ ...styles.posTagSm, background: POS_COLOR[k.pos] }}>{k.pos}</span>
                <span style={{ flex: 1, fontSize: 12.5 }}>{k.name}</span>
                <span style={{ fontSize: 11, color: "#8B92A0" }}>$</span>
                <input
                  style={{ ...styles.cellInput, width: 50 }}
                  type="number"
                  placeholder="cost"
                  value={k.keeperCost}
                  onChange={(e) => onKeeperCost(k, e.target.value)}
                />
                <button style={styles.removeBtn} title="Remove keeper" onClick={() => onStatus(k, "")}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={styles.row}>
          <input
            list="keeper-players"
            style={{ ...styles.input, flex: 1 }}
            placeholder="Player name"
            value={keeperName}
            onChange={(e) => {
              setKeeperName(e.target.value);
              setKeeperError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") addKeeper();
            }}
          />
          <datalist id="keeper-players">
            {eligibleKeepers.map((r) => (
              <option key={r.id} value={r.name} />
            ))}
          </datalist>
          <input
            style={{ ...styles.input, width: 64 }}
            type="number"
            placeholder="$"
            value={keeperCostInput}
            onChange={(e) => setKeeperCostInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addKeeper();
            }}
          />
          <button style={styles.primaryBtn} onClick={addKeeper}>
            Add
          </button>
        </div>
        {keeperError && <div style={{ fontSize: 11, color: "#E1524B", marginTop: 6 }}>{keeperError}</div>}

        <div style={{ fontSize: 11, color: "#8B92A0", margin: "14px 0 10px" }}>
          Swipe a card sideways (or use ‹ ›) to go from the position plan to each slot&apos;s targets. Click a
          target to mark Like, double-click for Love, press and hold to Dislike (swaps in the next closest player).
        </div>

        {POSITIONS.map((p) => {
          const cardSlots: CardSlot[] = active.slots
            .filter((sl) => sl.pos === p)
            .map((sl) => ({ ...sl, keeper: slotKeeper.get(sl.id), effective: slotAmount(sl) }));
          if (cardSlots.length === 0) return null;
          return (
            <PositionCard
              key={p}
              pos={p}
              slots={cardSlots}
              budget={budget}
              note={active.positionNotes?.[p]}
              onNote={(cardPos, text) => onPositionNote(active.id, cardPos, text)}
              targetsFor={closestPlayers}
              posOptionsFor={(slotId) =>
                FIXED_SLOT_POS[slotId] ? null : slotId.startsWith("flex") ? (["RB", "WR", "TE"] as Pos[]) : POSITIONS
              }
              onSlotPos={(slotId, newPos) => onSlotPos(active.id, slotId, newPos)}
              onSlotAmount={(slotId, value) => onSlotAmount(active.id, slotId, value)}
              onRate={onRate}
              renderTarget={(row) => <CompPlayerItem key={row.id} row={row} onRate={onRate} />}
            />
          );
        })}

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
          needed to fill these slots) on the Board tab, and its slot amounts set where each position&apos;s tier
          bars sit.
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button style={{ ...styles.dangerBtn, width: "auto" }} onClick={() => onDelete(active.id)}>
            Delete strategy
          </button>
        </div>
      </div>
    </div>
  );
}
