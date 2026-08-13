"use client";

import { useMemo, useState } from "react";
import { Strategy } from "@/lib/data/strategies";
import {
  assignKeepersToSlots,
  Board,
  BoardRow as BoardRowType,
  FIXED_SLOT_POS,
  fmtMoney,
  fmtPct,
  Interest,
  MarketRead,
  POS_COLOR,
  POSITIONS,
  Pos,
  SlotLabel,
} from "@/lib/draftLogic";
import { rawCostAt } from "@/lib/data/rawDraftCosts";
import { BoardRow } from "./BoardRow";
import { CardPage, PositionCard } from "./PositionCard";
import { SlotMenu, SlotMenuState } from "./SlotMenu";
import { styles, chipActive } from "./styles";

// Slide-in used when a position card changes page.
const cardPageAnim = `@keyframes cardPageIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: none; } }`;

// Reach/Target/Settle are fixed 5-player windows on the availability ladder, so
// disliking or losing a player slides the next-closest one in.
const BAND_HI = 1.15; // where "your money buys him" starts (× cluster ceiling)
const BAND_SIZE = 5;

interface OpenSlot {
  id: string;
  label: string;
  pos: Pos;
  amount: number;
  fixed: boolean;
}

interface Cluster {
  key: string;
  pos: Pos;
  slots: OpenSlot[];
  lo: number;
  hi: number;
  plan: number;
  reach: BoardRowType[];
  target: BoardRowType[];
  settle: BoardRowType[];
}

interface PlanSlot {
  id: string;
  label: string;
  amount: number;
  filled?: BoardRowType; // keeper or already-drafted player occupying this slot
}

// "RB5–RB9" — the tier a dollar amount actually buys, from the players priced
// nearest it on the live board.
function describeTier(pos: Pos, amount: number, avail: BoardRowType[]): string | null {
  if (!avail.length || amount <= 0) return null;
  const ranks = [...avail]
    .sort((a, b) => Math.abs((a.target as number) - amount) - Math.abs((b.target as number) - amount))
    .slice(0, 5)
    .map((r) => r.effRank)
    .filter((r): r is number => r != null);
  if (!ranks.length) return null;
  const lo = Math.min(...ranks);
  const hi = Math.max(...ranks);
  return lo === hi ? `${pos}${lo}` : `${pos}${lo}–${pos}${hi}`;
}

// Plain-language plan for a position, regenerated from the live slot prices
// whenever the user hasn't written their own.
function generateNote(pos: Pos, slots: PlanSlot[], budget: number, avail: BoardRowType[]): string {
  if (slots.length === 0) return `No ${pos} slots in this strategy.`;
  const total = slots.reduce((s, sl) => s + sl.amount, 0);
  const pct = budget > 0 ? Math.round((100 * total) / budget) : 0;
  const out = [
    `Rostering ${slots.length} ${pos}${slots.length === 1 ? "" : "s"} for ${fmtMoney(total)} — ${pct}% of your ${fmtMoney(budget)} budget.`,
  ];

  const done = slots.filter((sl) => sl.filled);
  const open = slots.filter((sl) => !sl.filled);
  if (done.length) {
    out.push(
      `Already locked in: ${done.map((d) => `${d.filled!.name} at ${fmtMoney(d.amount)}`).join(", ")}.`
    );
  }
  if (open.length) {
    const top = open[0];
    const tier = describeTier(pos, top.amount, avail);
    out.push(`Your top open slot (${top.label}) budgets ${fmtMoney(top.amount)}${tier ? `, which buys around the ${tier} range` : ""}.`);
    const rest = open.slice(1);
    if (rest.length) {
      const last = describeTier(pos, rest[rest.length - 1].amount, avail);
      out.push(
        `Then ${rest.length} more at ${rest.map((r) => fmtMoney(r.amount)).join(", ")}` +
          `${last ? ` — depth down to about ${last}` : ""}.`
      );
    }
  } else if (!done.length) {
    out.push("No budget allocated here yet.");
  }
  return out.join(" ");
}

interface TargetsTabProps {
  board: Board;
  marketRead: MarketRead;
  strategies: Strategy[];
  activeStrategyId: string;
  budget: number;
  // player uid -> slot id (active strategy), and the position-ordinal slot labels.
  assignments: Record<string, string>;
  slotLabels: Map<string, SlotLabel>;
  setActiveStrategyId: (id: string) => void;
  onSlotPos: (strategyId: string, slotId: string, pos: string) => void;
  onSlotAmount: (strategyId: string, slotId: string, value: string) => void;
  onName: (strategyId: string, name: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onReset: (id: string) => void;
  onMeta: (id: string, field: "max", value: string) => void;
  onRate: (row: BoardRowType, value: Interest) => void;
  onAssign: (playerId: string, slotId: string | null) => void;
  onDislike: (playerId: string, value: Interest) => void;
  // Editable per-position narrative on each card; null resets to the auto-summary.
  onPositionNote: (strategyId: string, pos: Pos, text: string | null) => void;
}

export function TargetsTab({
  board,
  marketRead,
  strategies,
  activeStrategyId,
  budget,
  assignments,
  slotLabels,
  setActiveStrategyId,
  onSlotPos,
  onSlotAmount,
  onName,
  onAdd,
  onDelete,
  onReset,
  onMeta,
  onRate,
  onAssign,
  onDislike,
  onPositionNote,
}: TargetsTabProps) {
  const strategy = strategies.find((s) => s.id === activeStrategyId) || strategies[0];

  const [menu, setMenu] = useState<SlotMenuState | null>(null);
  const assignedLabelFor = (id: string) => (assignments[id] ? slotLabels.get(assignments[id])?.label ?? null : null);
  const openMenu = (row: BoardRowType, rect: SlotMenuState["rect"]) =>
    setMenu({
      playerId: row.id,
      playerName: row.name,
      pos: row.pos,
      disliked: row.interest === "dislike",
      assignedSlotId: assignments[row.id] ?? null,
      rect,
    });

  const myKeepers = useMemo(() => board.rows.filter((r) => r.isKeeper && r.mine), [board.rows]);

  // Keeper/drafted-filled slots are done; only open slots generate shopping lists.
  const filled = useMemo(
    () => assignKeepersToSlots(strategy, [...myKeepers, ...board.myDrafted]),
    [strategy, myKeepers, board.myDrafted]
  );
  const slotAmount = (sl: { id: string; amount: number }) => {
    const k = filled.get(sl.id);
    return k ? Number(k.keeperCost) || 0 : Number(sl.amount) || 0;
  };

  const openSlots = useMemo<OpenSlot[]>(() => {
    if (!strategy) return [];
    return strategy.slots
      .filter((sl) => !filled.has(sl.id))
      .map((sl) => ({
        id: sl.id,
        label: slotLabels.get(sl.id)?.label ?? sl.id,
        pos: sl.pos,
        amount: Number(sl.amount) || 0,
        fixed: !!FIXED_SLOT_POS[sl.id],
      }));
  }, [strategy, filled, slotLabels]);

  const availByPos = useMemo(() => {
    const m: Partial<Record<Pos, BoardRowType[]>> = {};
    POSITIONS.forEach((pos) => {
      m[pos] = board.rows
        .filter((r) => r.pos === pos && r.target != null && !r.isDrafted && !r.isKeeper && r.interest !== "dislike")
        .sort((a, b) => (b.target as number) - (a.target as number));
    });
    return m;
  }, [board.rows]);

  // Slots priced >= $2 get their own shopping list. Only slots at the *same*
  // price share one — different prices shop different shelves, so they stay
  // apart. ($1 fliers are handled by the compact strip below.)
  const clusters = useMemo<Cluster[]>(() => {
    const out: Cluster[] = [];
    POSITIONS.forEach((pos) => {
      const amounts = openSlots.filter((s) => s.pos === pos && s.amount >= 2).sort((a, b) => b.amount - a.amount);
      const groups: OpenSlot[][] = [];
      for (const slot of amounts) {
        const cur = groups[groups.length - 1];
        if (cur && slot.amount === cur[cur.length - 1].amount) cur.push(slot);
        else groups.push([slot]);
      }
      for (const slots of groups) {
        const hi = slots[0].amount;
        const lo = slots[slots.length - 1].amount;
        const plan = slots.reduce((s, sl) => s + sl.amount, 0);
        const avail = availByPos[pos] ?? []; // market price desc

        let start = avail.findIndex((r) => (r.target as number) <= hi * BAND_HI);
        if (start === -1) start = avail.length;
        const reach = avail.slice(Math.max(0, start - BAND_SIZE), start);
        const target = avail.slice(start, start + BAND_SIZE);
        const settle = avail.slice(start + BAND_SIZE, start + 2 * BAND_SIZE);

        // Force-include players you've assigned to this cluster's slots, dropped
        // into whichever band their price falls in, then re-sort each band.
        const clusterSlotIds = new Set(slots.map((s) => s.id));
        const present = new Set([...reach, ...target, ...settle].map((r) => r.id));
        for (const r of avail) {
          const a = assignments[r.id];
          if (!a || !clusterSlotIds.has(a) || present.has(r.id)) continue;
          const t = r.target as number;
          if (t > hi * BAND_HI) reach.push(r);
          else if (t < lo * 0.8) settle.push(r);
          else target.push(r);
        }
        const bySort = (a: BoardRowType, b: BoardRowType) => (b.target as number) - (a.target as number);
        reach.sort(bySort);
        target.sort(bySort);
        settle.sort(bySort);

        if (reach.length + target.length + settle.length > 0)
          out.push({ key: slots[0].id, pos, slots, lo, hi, plan, reach, target, settle });
      }
    });
    return out;
  }, [openSlots, availByPos, assignments]);

  // $1 endgame slots. Each gets a shortlist: anyone you've pinned to it first,
  // then players you've Loved/Liked who are actually gettable at this price,
  // then the highest-ranked players left in that price range.
  const fliers = useMemo(() => openSlots.filter((s) => s.amount < 2), [openSlots]);
  const assignedByFlier = useMemo(() => {
    const m: Record<string, BoardRowType[]> = {};
    for (const f of fliers) {
      const avail = availByPos[f.pos] ?? []; // price desc
      const pinned = avail.filter((r) => assignments[r.id] === f.id);
      const taken = new Set(pinned.map((r) => r.id));

      const cap = Math.max(f.amount + 1, 2);
      const inRange = avail.filter((r) => !taken.has(r.id) && (r.target as number) <= cap);
      // Nothing that cheap on the board yet — fall back to the cheapest players.
      const pool = inRange.length > 0 ? inRange : avail.filter((r) => !taken.has(r.id)).slice(-BAND_SIZE);

      const byRank = (a: BoardRowType, b: BoardRowType) => (a.effRank ?? Infinity) - (b.effRank ?? Infinity);
      const liked = pool.filter((r) => r.interest === "love" || r.interest === "like").sort(byRank);
      const rest = pool.filter((r) => r.interest !== "love" && r.interest !== "like").sort(byRank);

      m[f.id] = [...pinned, ...liked, ...rest].slice(0, BAND_SIZE);
    }
    return m;
  }, [fliers, availByPos, assignments]);

  // ── Status bar + allocation figures ─────────────────────────────────────────
  const posPicks: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0, DEF: 0 };
  const posTotals: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0, DEF: 0 };
  strategy?.slots.forEach((sl) => {
    posPicks[sl.pos] = (posPicks[sl.pos] || 0) + 1;
    posTotals[sl.pos] = (posTotals[sl.pos] || 0) + slotAmount(sl);
  });
  const totalPlanned = strategy ? strategy.slots.reduce((s, sl) => s + slotAmount(sl), 0) : 0;
  const starterIds = new Set(["qb1", "qb2", "rb1", "rb2", "wr1", "wr2", "te", "def", "flex1", "flex2"]);
  const starterTotal = strategy
    ? strategy.slots.filter((sl) => starterIds.has(sl.id)).reduce((s, sl) => s + slotAmount(sl), 0)
    : 0;
  const benchTotal = totalPlanned - starterTotal;

  // ── Global budget flex ──────────────────────────────────────────────────────
  const openPlanned = openSlots.reduce((s, sl) => s + sl.amount, 0);
  const slack = board.myBudgetRemaining - openPlanned;

  const upgrades = useMemo(() => {
    const list: { slot: OpenSlot; row: BoardRowType; extra: number }[] = [];
    for (const slot of openSlots) {
      if (slot.amount < 2) continue;
      const avail = availByPos[slot.pos] ?? [];
      const above = avail.filter((r) => (r.live ?? Infinity) > slot.amount);
      if (above.length === 0) continue;
      const row = above[above.length - 1];
      const extra = (row.live as number) - slot.amount;
      if (extra <= 25) list.push({ slot, row, extra });
    }
    return list.sort((a, b) => a.extra - b.extra).slice(0, 4);
  }, [openSlots, availByPos]);

  const cuts = useMemo(() => {
    const list: { slot: OpenSlot; row: BoardRowType; savings: number; drop: number }[] = [];
    for (const slot of openSlots) {
      if (slot.amount < 4) continue;
      const avail = availByPos[slot.pos] ?? [];
      const bestNow = avail.find((r) => (r.live ?? Infinity) <= slot.amount);
      const down = avail.find((r) => (r.live ?? Infinity) <= slot.amount - 3);
      if (!down) continue;
      const savings = slot.amount - (down.live as number);
      const drop = bestNow ? (bestNow.target as number) - (down.target as number) : 0;
      list.push({ slot, row: down, savings, drop });
    }
    return list.sort((a, b) => a.drop - b.drop || b.savings - a.savings).slice(0, 4);
  }, [openSlots, availByPos]);

  // Every slot at a position — filled ones included — for the card's plan page.
  const planByPos = useMemo(() => {
    const m: Partial<Record<Pos, PlanSlot[]>> = {};
    POSITIONS.forEach((pos) => {
      m[pos] = (strategy?.slots ?? [])
        .filter((sl) => sl.pos === pos)
        .map((sl) => {
          const hit = filled.get(sl.id);
          return {
            id: sl.id,
            label: slotLabels.get(sl.id)?.label ?? sl.id,
            amount: hit ? Number(hit.keeperCost) || 0 : Number(sl.amount) || 0,
            filled: hit,
          };
        })
        .sort((a, b) => b.amount - a.amount);
    });
    return m;
  }, [strategy, filled, slotLabels]);

  // $1 fliers also only share a page when they're the same price.
  const flierGroupsByPos = useMemo(() => {
    const m: Partial<Record<Pos, OpenSlot[][]>> = {};
    POSITIONS.forEach((pos) => {
      const groups: OpenSlot[][] = [];
      fliers
        .filter((f) => f.pos === pos)
        .sort((a, b) => b.amount - a.amount)
        .forEach((s) => {
          const cur = groups[groups.length - 1];
          if (cur && s.amount === cur[cur.length - 1].amount) cur.push(s);
          else groups.push([s]);
        });
      m[pos] = groups;
    });
    return m;
  }, [fliers]);

  if (!strategy) return <div style={styles.emptyState}>No active strategy.</div>;

  const slotEditor = (sl: OpenSlot) => (
    <SlotEditor key={sl.id} slot={sl} strategyId={strategy.id} onSlotPos={onSlotPos} onSlotAmount={onSlotAmount} />
  );

  return (
    <div>
      <style>{cardPageAnim}</style>
      <StatusBar posPicks={posPicks} picks={strategy.slots.length} total={totalPlanned} budget={budget} />

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

      <input
        style={{ ...styles.input, width: "100%", marginBottom: 8, fontWeight: 600 }}
        value={strategy.name}
        onChange={(e) => onName(strategy.id, e.target.value)}
      />

      {strategy.description && (
        <div
          style={{
            fontSize: 12,
            color: "#A7ADBA",
            lineHeight: 1.5,
            background: "rgba(91, 155, 213, 0.07)",
            border: "1px solid rgba(91, 155, 213, 0.2)",
            borderRadius: 6,
            padding: "8px 10px",
            marginBottom: 10,
          }}
        >
          {strategy.description}
        </div>
      )}

      {myKeepers.length > 0 && (
        <div style={{ ...styles.panel, padding: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.4, color: "#8B92A0", marginBottom: 5 }}>
            MY KEEPERS <span style={{ color: "#5B6270", fontWeight: 400 }}>· set on Insights</span>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {myKeepers.map((k) => (
              <span key={k.id} style={{ fontSize: 12, color: "#EDEEF0" }}>
                <span style={{ color: POS_COLOR[k.pos] }}>{k.pos}</span> {k.name}{" "}
                <span style={{ ...styles.tdMono, color: "#8FCB9E" }}>${Number(k.keeperCost) || 0}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
        {POSITIONS.map((p) => (
          <span key={p} style={styles.allocChip}>
            <span style={{ color: POS_COLOR[p] }}>{p}</span> {fmtMoney(posTotals[p])}{" "}
            <span style={styles.allocDollar}>({totalPlanned ? Math.round((100 * posTotals[p]) / totalPlanned) : 0}%)</span>
          </span>
        ))}
        <span style={{ ...styles.allocChip, marginLeft: "auto" }}>
          Starters {fmtMoney(starterTotal)} · Bench {fmtMoney(benchTotal)}
        </span>
      </div>

      <BudgetFlex slack={slack} budgetLeft={board.myBudgetRemaining} openPlanned={openPlanned} upgrades={upgrades} cuts={cuts} />

      <div style={{ fontSize: 11, color: "#8B92A0", margin: "4px 0 10px" }}>
        Edit a slot&apos;s position or dollar target below and its shopping list refreshes. <b>Reach</b> = the five
        above your price (bid only at a discount), <b>Target</b> = what your money buys, <b>Settle</b> = the fallback
        five. Press-and-hold a name to dislike it or pin it to a slot — pinned players show first in that slot&apos;s
        section.
      </div>

      {POSITIONS.map((pos) => {
        const plan = planByPos[pos] ?? [];
        if (plan.length === 0) return null;
        const posClusters = clusters.filter((c) => c.pos === pos);
        const flierGroups = flierGroupsByPos[pos] ?? [];
        const avail = availByPos[pos] ?? [];
        const note = strategy.positionNotes?.[pos];
        const posTotal = posTotals[pos];

        const pages: CardPage[] = [
          ...posClusters.map((c) => ({
            key: c.key,
            node: (
              <ClusterBlock
                cluster={c}
                marketRead={marketRead}
                slotEditor={slotEditor}
                assignedLabelFor={assignedLabelFor}
                onOpenMenu={openMenu}
                onMeta={onMeta}
                onRate={onRate}
              />
            ),
          })),
          ...flierGroups.map((group) => ({
            key: group[0].id,
            node: (
              <FlierBlock
                slots={group}
                assignedByFlier={assignedByFlier}
                slotEditor={slotEditor}
                assignedLabelFor={assignedLabelFor}
                onOpenMenu={openMenu}
                onMeta={onMeta}
                onRate={onRate}
              />
            ),
          })),
        ];

        return (
          <PositionCard
            key={pos}
            pos={pos}
            total={posTotal}
            pct={budget ? Math.round((100 * posTotal) / budget) : 0}
            picks={plan.length}
            pages={pages}
            overview={
              <div>
                <textarea
                  style={{
                    ...styles.input,
                    width: "100%",
                    minHeight: 92,
                    resize: "vertical",
                    fontFamily: "inherit",
                    fontSize: 12.5,
                    lineHeight: 1.55,
                    color: note === undefined ? "#A7ADBA" : "#EDEEF0",
                  }}
                  value={note ?? generateNote(pos, plan, budget, avail)}
                  onChange={(e) => onPositionNote(strategy.id, pos, e.target.value)}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: "#4A5160", flex: 1 }}>
                    {note === undefined ? "Auto-summary — edit to make it yours." : "Your notes."}
                  </span>
                  {note !== undefined && (
                    <button style={styles.smallBtn} onClick={() => onPositionNote(strategy.id, pos, null)}>
                      Reset
                    </button>
                  )}
                </div>

                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.4, color: "#8B92A0", marginBottom: 5 }}>
                  SLOTS &amp; BUDGETS
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {plan.map((sl) => (
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
                        {sl.label}
                        {sl.filled && (
                          <span style={{ color: "#4CAF6B", fontSize: 11 }}>
                            {" "}
                            {sl.filled.isKeeper ? "🔒" : "✓"} {sl.filled.name}
                          </span>
                        )}
                      </span>
                      <span style={{ ...styles.tdMono, fontSize: 12, color: sl.filled ? "#8FCB9E" : "#EDEEF0" }}>
                        {fmtMoney(sl.amount)}
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
                    <span style={styles.tdMono}>{fmtMoney(posTotal)}</span>
                  </div>
                </div>
              </div>
            }
          />
        );
      })}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 10 }}>
        <button
          style={{ ...styles.smallBtn, width: "auto" }}
          title="Restore this strategy's slot prices to the defaults — likes/dislikes and keepers are kept"
          onClick={() => onReset(strategy.id)}
        >
          Reset prices
        </button>
        <button style={{ ...styles.dangerBtn, width: "auto" }} onClick={() => onDelete(strategy.id)}>
          Delete strategy
        </button>
      </div>

      {menu && (
        <SlotMenu
          menu={menu}
          slots={[...slotLabels.values()].filter((s) => s.pos === menu.pos).sort((a, b) => b.amount - a.amount)}
          onDislike={() => {
            onDislike(menu.playerId, menu.disliked ? "neutral" : "dislike");
            setMenu(null);
          }}
          onAssign={(slotId) => {
            onAssign(menu.playerId, slotId);
            setMenu(null);
          }}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}

// ── Sticky top status bar ──────────────────────────────────────────────────────
function StatusBar({
  posPicks,
  picks,
  total,
  budget,
}: {
  posPicks: Record<string, number>;
  picks: number;
  total: number;
  budget: number;
}) {
  const budgetColor = total === budget ? "#4CAF6B" : total > budget ? "#E1524B" : "#E8A33D";
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "#12151B",
        borderBottom: "1px solid #2A2F38",
        padding: "6px 8px",
        marginBottom: 10,
        display: "flex",
        gap: 12,
        flexWrap: "nowrap",
        overflowX: "auto",
        alignItems: "center",
        fontSize: 11,
        whiteSpace: "nowrap",
      }}
    >
      {POSITIONS.map((p) => (
        <span key={p} style={{ color: "#C6CAD2" }}>
          <span style={{ color: POS_COLOR[p], fontWeight: 600 }}>{p}</span> {posPicks[p] || 0}
        </span>
      ))}
      <span style={{ color: "#5B6270" }}>· {picks} picks</span>
      <span style={{ marginLeft: "auto", ...styles.tdMono, fontSize: 11, fontWeight: 700, color: budgetColor }}>
        {fmtMoney(total)} / {fmtMoney(budget)}
      </span>
    </div>
  );
}

// ── One editable slot control (position + dollar target) ───────────────────────
function SlotEditor({
  slot,
  strategyId,
  onSlotPos,
  onSlotAmount,
}: {
  slot: OpenSlot;
  strategyId: string;
  onSlotPos: (strategyId: string, slotId: string, pos: string) => void;
  onSlotAmount: (strategyId: string, slotId: string, value: string) => void;
}) {
  const options: Pos[] = slot.id.startsWith("flex") ? (["RB", "WR", "TE"] as Pos[]) : POSITIONS;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "#1C2128",
        border: "1px solid #2A2F38",
        borderRadius: 6,
        padding: "3px 6px",
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, color: "#C6CAD2" }}>{slot.label}</span>
      {slot.fixed ? (
        <span style={{ ...styles.posTagSm, background: POS_COLOR[slot.pos] }}>{slot.pos}</span>
      ) : (
        <select
          style={{ ...styles.statusSelect, width: 52 }}
          value={slot.pos}
          onChange={(e) => onSlotPos(strategyId, slot.id, e.target.value)}
        >
          {options.map((p) => (
            <option key={p} value={p} style={{ background: "#1C2128", color: "#EDEEF0" }}>
              {p}
            </option>
          ))}
        </select>
      )}
      <span style={{ fontSize: 11, color: "#5B6270" }}>$</span>
      <PriceInput value={slot.amount} onCommit={(v) => onSlotAmount(strategyId, slot.id, v)} />
    </div>
  );
}

/*
 * Committing a price on every keystroke re-grouped the slot pages mid-type, so
 * typing "28" repriced on the "2" and shuffled the card underneath you. The
 * value is now held locally while you type and only committed on OK, Enter, or
 * blur; Escape abandons the edit.
 */
function PriceInput({ value, onCommit }: { value: number; onCommit: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    const v = draft;
    setDraft(null);
    if (v === null) return;
    const trimmed = v.trim();
    if (trimmed !== "" && Number(trimmed) !== value) onCommit(trimmed);
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      <input
        style={{ ...styles.cellInput, width: 46, fontWeight: 700 }}
        type="number"
        min={0}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => {
          setFocused(true);
          const el = e.target as HTMLInputElement;
          requestAnimationFrame(() => el.select());
        }}
        onBlur={() => {
          setFocused(false);
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          else if (e.key === "Escape") {
            setDraft(null);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      {focused && (
        <button
          // Keep focus off the button so blur (and its commit) doesn't fire
          // before the click lands.
          onPointerDown={(e) => e.preventDefault()}
          onClick={commit}
          style={{
            background: "#2E7D46",
            border: "none",
            borderRadius: 4,
            color: "#EDEEF0",
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 7px",
            cursor: "pointer",
          }}
        >
          OK
        </button>
      )}
    </span>
  );
}

// ── Per-section budget recommendation, from how the position is actually selling ─
function sectionRec(pos: Pos, plan: number, marketRead: MarketRead) {
  const pi = marketRead.posInflation[pos];
  if (!pi || pi.n < 2) return { text: "no market read yet", tone: "neutral" as const };
  const r = pi.ratio;
  if (r >= 1.1) {
    const add = Math.max(1, Math.round((r - 1) * plan));
    return { text: `running hot ${fmtPct(r - 1)} — add ~${fmtMoney(add)}`, tone: "hot" as const };
  }
  if (r <= 0.9) {
    const bank = Math.max(1, Math.round((1 - r) * plan));
    return { text: `going cheap ${fmtPct(r - 1)} — bank ~${fmtMoney(bank)}`, tone: "cheap" as const };
  }
  return { text: `on plan (market ${fmtPct(r - 1)})`, tone: "neutral" as const };
}

const REC_COLOR = { hot: "#E1524B", cheap: "#4CAF6B", neutral: "#8B92A0" } as const;

const GROUP_META: { key: "reach" | "target" | "settle"; label: string; color: string; note: string }[] = [
  { key: "reach", label: "REACH", color: "#5B9BD5", note: "above your price — only at a discount" },
  { key: "target", label: "TARGET", color: "#4CAF6B", note: "your money buys these — go get one" },
  { key: "settle", label: "SETTLE", color: "#E8A33D", note: "fallback if the room outbids you" },
];

function ClusterBlock({
  cluster,
  marketRead,
  slotEditor,
  assignedLabelFor,
  onOpenMenu,
  onMeta,
  onRate,
}: {
  cluster: Cluster;
  marketRead: MarketRead;
  slotEditor: (sl: OpenSlot) => React.ReactNode;
  assignedLabelFor: (id: string) => string | null;
  onOpenMenu: (row: BoardRowType, rect: SlotMenuState["rect"]) => void;
  onMeta: (id: string, field: "max", value: string) => void;
  onRate: (row: BoardRowType, value: Interest) => void;
}) {
  const label = cluster.slots.map((s) => s.label).join(" + ");
  const rec = sectionRec(cluster.pos, cluster.plan, marketRead);
  const noop = () => {};

  return (
    <div style={{ ...styles.panel, padding: 8, marginBottom: 10 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 8 }}>
        {cluster.slots.map(slotEditor)}
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ ...styles.tdMono, fontSize: 13, fontWeight: 700, color: "#EDEEF0" }}>
            {fmtMoney(cluster.plan)}
          </div>
          <div style={{ fontSize: 10, color: REC_COLOR[rec.tone] }} title="Recommendation from how this position is actually selling">
            {rec.text}
          </div>
        </div>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, ...styles.thSticky }}>Rk</th>
              <th style={{ ...styles.th, ...styles.thSticky2, left: 38 }}>{label}</th>
              <th style={styles.th}>Tier</th>
              <th style={styles.th} title="Actual league draft cost for this rank">
                Act
              </th>
              <th style={styles.th}>Tgt</th>
              <th style={styles.th}>Live</th>
              <th style={styles.th}>Max</th>
            </tr>
          </thead>
          <tbody>
            {GROUP_META.map((g) => {
              const rows = cluster[g.key];
              if (rows.length === 0) return null;
              return [
                <tr key={g.key}>
                  <td colSpan={7} style={{ padding: 0, background: "#141821", borderBottom: "1px solid #20242C" }}>
                    {/* Sticky-left so the band name stays put when scrolling right. */}
                    <div style={{ position: "sticky", left: 0, display: "inline-block", padding: "4px 8px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: g.color }}>{g.label}</span>{" "}
                      <span style={{ fontSize: 10, color: "#5B6270" }}>· {g.note}</span>
                    </div>
                  </td>
                </tr>,
                ...rows.map((row) => (
                  <BoardRow
                    key={row.id}
                    row={row}
                    tierBreak={false}
                    isTarget={false}
                    dragEnabled={false}
                    dragging={false}
                    dropEdge={{}}
                    onDragStart={noop}
                    playerStickyLeft={38}
                    showPos={false}
                    showPaid={false}
                    actCost={rawCostAt(row.pos, row.effRank)}
                    assignedLabel={assignedLabelFor(row.id)}
                    onOpenMenu={onOpenMenu}
                    onPaid={noop}
                    onMeta={onMeta}
                    onRate={onRate}
                  />
                )),
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// $1 endgame slots: editable, plus whatever darts you've pinned to them.
function FlierBlock({
  slots,
  assignedByFlier,
  slotEditor,
  assignedLabelFor,
  onOpenMenu,
  onMeta,
  onRate,
}: {
  slots: OpenSlot[];
  assignedByFlier: Record<string, BoardRowType[]>;
  slotEditor: (sl: OpenSlot) => React.ReactNode;
  assignedLabelFor: (id: string) => string | null;
  onOpenMenu: (row: BoardRowType, rect: SlotMenuState["rect"]) => void;
  onMeta: (id: string, field: "max", value: string) => void;
  onRate: (row: BoardRowType, value: Interest) => void;
}) {
  const noop = () => {};
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.4, color: "#8B92A0", marginBottom: 6 }}>
        {slots.map((s) => s.label).join(" + ")}{" "}
        <span style={{ color: "#5B6270", fontWeight: 400 }}>
          · your Loved/Liked darts at this price first, then the best left in range
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {slots.map((f) => (
          <div key={f.id}>
            <div style={{ marginBottom: assignedByFlier[f.id]?.length ? 4 : 0 }}>{slotEditor(f)}</div>
            {assignedByFlier[f.id]?.length > 0 && (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <tbody>
                    {assignedByFlier[f.id].map((row) => (
                      <BoardRow
                        key={row.id}
                        row={row}
                        tierBreak={false}
                        isTarget={false}
                        dragEnabled={false}
                        dragging={false}
                        dropEdge={{}}
                        onDragStart={noop}
                        playerStickyLeft={38}
                        showPos={false}
                        showPaid={false}
                        actCost={rawCostAt(row.pos, row.effRank)}
                        assignedLabel={assignedLabelFor(row.id)}
                        onOpenMenu={onOpenMenu}
                        onPaid={noop}
                        onMeta={onMeta}
                        onRate={onRate}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetFlex({
  slack,
  budgetLeft,
  openPlanned,
  upgrades,
  cuts,
}: {
  slack: number;
  budgetLeft: number;
  openPlanned: number;
  upgrades: { slot: OpenSlot; row: BoardRowType; extra: number }[];
  cuts: { slot: OpenSlot; row: BoardRowType; savings: number; drop: number }[];
}) {
  const state = slack > 0 ? "under" : slack < 0 ? "over" : "even";
  const headColor = state === "under" ? "#4CAF6B" : state === "over" ? "#E1524B" : "#8B92A0";
  return (
    <div style={{ ...styles.panel, padding: 12, marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, color: "#8B92A0", marginBottom: 4 }}>
        BUDGET FLEX
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: headColor, marginBottom: 8 }}>
        {fmtMoney(budgetLeft)} left · open slots plan {fmtMoney(openPlanned)} —{" "}
        {state === "even"
          ? "right on plan"
          : state === "under"
          ? `${fmtMoney(slack)} banked to deploy`
          : `${fmtMoney(-slack)} must come out of the plan`}
      </div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 240px" }}>
          <div style={{ fontSize: 10, color: "#4CAF6B", fontWeight: 600, marginBottom: 3 }}>
            IF YOU&apos;RE AHEAD, SPEND IT ON
          </div>
          {upgrades.length === 0 && <div style={{ fontSize: 11, color: "#5B6270" }}>No affordable step up right now.</div>}
          {upgrades.map((u) => (
            <div key={u.slot.id} style={{ fontSize: 11.5, color: "#C6CAD2", marginBottom: 2 }}>
              <span style={{ color: "#EDEEF0", fontWeight: 600 }}>{u.slot.label}</span> +{fmtMoney(u.extra)} →{" "}
              {u.row.name} <span style={{ color: "#8B92A0" }}>(live ${u.row.live})</span>
            </div>
          ))}
        </div>
        <div style={{ flex: "1 1 240px" }}>
          <div style={{ fontSize: 10, color: "#E8A33D", fontWeight: 600, marginBottom: 3 }}>
            IF YOU&apos;RE OVER, TAKE IT FROM
          </div>
          {cuts.length === 0 && <div style={{ fontSize: 11, color: "#5B6270" }}>No painless cuts available.</div>}
          {cuts.map((c) => (
            <div key={c.slot.id} style={{ fontSize: 11.5, color: "#C6CAD2", marginBottom: 2 }}>
              <span style={{ color: "#EDEEF0", fontWeight: 600 }}>{c.slot.label}</span> −{fmtMoney(c.savings)} → still{" "}
              {c.row.name} <span style={{ color: "#8B92A0" }}>(live ${c.row.live})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
