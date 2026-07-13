"use client";

import { useMemo } from "react";
import { Strategy } from "@/lib/data/strategies";
import {
  assignKeepersToSlots,
  Board,
  BoardRow as BoardRowType,
  Interest,
  POS_COLOR,
  POSITIONS,
  Pos,
  fmtMoney,
  slotLabel,
} from "@/lib/draftLogic";
import { BoardRow } from "./BoardRow";
import { styles } from "./styles";

// Shopping bands around a cluster of similarly-priced slots:
//   Reach  = the 5 cheapest players above your price — grab only at a discount
//   Target = the best 5 your plan money buys
//   Settle = the next 5 below, if the room outbids you
// Fixed windows on the availability ladder (not price filters), so disliking or
// losing a player always slides the next-closest one in — each band stays 5 deep
// as long as the position has players left.
const BAND_HI = 1.15; // where "your money buys him" starts (× cluster hi)
const BAND_SIZE = 5;

interface OpenSlot {
  id: string;
  label: string;
  pos: Pos;
  amount: number;
}

interface Cluster {
  pos: Pos;
  slots: OpenSlot[];
  lo: number;
  hi: number;
  reach: BoardRowType[];
  target: BoardRowType[];
  settle: BoardRowType[];
}

interface TargetsTabProps {
  board: Board;
  strategy: Strategy | undefined;
  onPaid: (row: BoardRowType, value: string) => void;
  onMeta: (id: string, field: "max", value: string) => void;
  onRate: (row: BoardRowType, value: Interest) => void;
}

export function TargetsTab({ board, strategy, onPaid, onMeta, onRate }: TargetsTabProps) {
  // Slots already filled by my keepers or my drafted players are done — their
  // money is spent and they generate no shopping list.
  const filled = useMemo(
    () => assignKeepersToSlots(strategy, [...board.myKeepers, ...board.myDrafted]),
    [strategy, board.myKeepers, board.myDrafted]
  );

  const openSlots = useMemo<OpenSlot[]>(() => {
    if (!strategy) return [];
    return strategy.slots
      .filter((sl) => !filled.has(sl.id))
      .map((sl) => ({ id: sl.id, label: slotLabel(sl.id), pos: sl.pos, amount: Number(sl.amount) || 0 }));
  }, [strategy, filled]);

  const availByPos = useMemo(() => {
    const m: Partial<Record<Pos, BoardRowType[]>> = {};
    POSITIONS.forEach((pos) => {
      m[pos] = board.rows
        .filter((r) => r.pos === pos && r.target != null && !r.isDrafted && !r.isKeeper && r.interest !== "dislike")
        .sort((a, b) => (b.target as number) - (a.target as number));
    });
    return m;
  }, [board.rows]);

  // Group each position's open slots into price clusters (adjacent amounts
  // within 60% of each other shop the same shelf), then band the available
  // players around each cluster. $1 slots are endgame fliers, not targets.
  const clusters = useMemo<Cluster[]>(() => {
    const out: Cluster[] = [];
    POSITIONS.forEach((pos) => {
      const amounts = openSlots.filter((s) => s.pos === pos && s.amount >= 2).sort((a, b) => b.amount - a.amount);
      const groups: OpenSlot[][] = [];
      for (const slot of amounts) {
        const cur = groups[groups.length - 1];
        if (cur && slot.amount >= 0.6 * cur[cur.length - 1].amount) cur.push(slot);
        else groups.push([slot]);
      }
      for (const slots of groups) {
        const hi = slots[0].amount;
        const lo = slots[slots.length - 1].amount;
        const avail = availByPos[pos] ?? []; // sorted by market price, best first

        // Anchor at the first player your ceiling affords; Target is the 5 from
        // there down, Reach the 5 just above, Settle the 5 below Target.
        let start = avail.findIndex((r) => (r.target as number) <= hi * BAND_HI);
        if (start === -1) start = avail.length;
        const reach = avail.slice(Math.max(0, start - BAND_SIZE), start);
        const target = avail.slice(start, start + BAND_SIZE);
        const settle = avail.slice(start + BAND_SIZE, start + 2 * BAND_SIZE);

        if (reach.length + target.length + settle.length > 0) out.push({ pos, slots, lo, hi, reach, target, settle });
      }
    });
    return out;
  }, [openSlots, availByPos]);

  // ── Budget flex ────────────────────────────────────────────────────────────
  // Slack = money I actually have left minus what the plan says the open slots
  // need. Overpaying a slot (or a keeper coming in cheap) moves it in real time.
  const openPlanned = openSlots.reduce((s, sl) => s + sl.amount, 0);
  const slack = board.myBudgetRemaining - openPlanned;

  // Where extra money buys the biggest step up: for each open slot, the
  // cheapest available player priced ABOVE the slot — sorted by how little
  // extra he costs.
  const upgrades = useMemo(() => {
    const list: { slot: OpenSlot; row: BoardRowType; extra: number }[] = [];
    for (const slot of openSlots) {
      if (slot.amount < 2) continue;
      const avail = availByPos[slot.pos] ?? [];
      const above = avail.filter((r) => (r.live ?? Infinity) > slot.amount);
      if (above.length === 0) continue;
      const row = above[above.length - 1]; // cheapest player above the slot price
      const extra = (row.live as number) - slot.amount;
      if (extra <= 25) list.push({ slot, row, extra });
    }
    return list.sort((a, b) => a.extra - b.extra).slice(0, 4);
  }, [openSlots, availByPos]);

  // Where cuts hurt least: for each open slot, the best player still available
  // at a real discount — sorted by smallest quality drop, then biggest savings.
  const cuts = useMemo(() => {
    const list: { slot: OpenSlot; row: BoardRowType; savings: number; drop: number }[] = [];
    for (const slot of openSlots) {
      if (slot.amount < 4) continue; // nothing meaningful to cut from cheap slots
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

  if (!strategy) return <div style={styles.emptyState}>No active strategy.</div>;

  return (
    <div>
      <div style={styles.emptyState}>
        Shopping lists for <b>{strategy.name}</b>, built from who&apos;s actually available. <b>Reach</b> = the five
        just above your price — bid only if one falls to you at a discount. <b>Target</b> = the best five your plan
        money buys — go get one. <b>Settle</b> = the next five down if the room outbids you. Each band stays five
        deep: dislike a player (press and hold his name) or lose him to another team and the next-closest slides in.
        Rate, set max, and enter prices right here — it&apos;s the same rows as the Board.
      </div>

      <BudgetFlex slack={slack} budgetLeft={board.myBudgetRemaining} openPlanned={openPlanned} upgrades={upgrades} cuts={cuts} />

      {POSITIONS.filter((pos) => clusters.some((c) => c.pos === pos)).map((pos) => (
        <div key={pos} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 6px" }}>
            <span style={{ ...styles.posTagSm, background: POS_COLOR[pos] }}>{pos}</span>
          </div>
          {clusters
            .filter((c) => c.pos === pos)
            .map((c) => (
              <ClusterTable key={c.slots[0].id} cluster={c} onPaid={onPaid} onMeta={onMeta} onRate={onRate} />
            ))}
        </div>
      ))}
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
      <div style={{ fontSize: 10, color: "#5B6270", marginTop: 6 }}>
        Updates live as you enter Paid prices — overpay a slot and the shortfall shows up here with the cheapest
        places to absorb it; land a discount and it shows where the savings buy the biggest upgrade.
      </div>
    </div>
  );
}

const GROUP_META: { key: "reach" | "target" | "settle"; label: string; color: string; note: string }[] = [
  { key: "reach", label: "REACH", color: "#5B9BD5", note: "above your price — only at a discount" },
  { key: "target", label: "TARGET", color: "#4CAF6B", note: "your money buys these — go get one" },
  { key: "settle", label: "SETTLE", color: "#E8A33D", note: "fallback if the room outbids you" },
];

function ClusterTable({
  cluster,
  onPaid,
  onMeta,
  onRate,
}: {
  cluster: Cluster;
  onPaid: (row: BoardRowType, value: string) => void;
  onMeta: (id: string, field: "max", value: string) => void;
  onRate: (row: BoardRowType, value: Interest) => void;
}) {
  const label = cluster.slots.map((s) => s.label).join(" + ");
  const money = cluster.lo === cluster.hi ? `$${cluster.hi}` : `$${cluster.lo}–$${cluster.hi}`;
  const noop = () => {};

  return (
    <div style={{ ...styles.tableWrap, marginBottom: 10 }}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, ...styles.thSticky }}>Rk</th>
            <th style={{ ...styles.th, ...styles.thSticky2, left: 38 }}>
              {label} · {money}
            </th>
            <th style={styles.th}>Pos</th>
            <th style={styles.th}>Tier</th>
            <th style={styles.th}>Tgt</th>
            <th style={styles.th}>Live</th>
            <th style={styles.th}>Max</th>
            <th style={styles.th}>Paid</th>
          </tr>
        </thead>
        <tbody>
          {GROUP_META.map((g) => {
            const rows = cluster[g.key];
            if (rows.length === 0) return null;
            return [
              <tr key={g.key}>
                <td colSpan={8} style={{ padding: "4px 8px", background: "#141821", borderBottom: "1px solid #20242C" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: g.color }}>{g.label}</span>{" "}
                  <span style={{ fontSize: 10, color: "#5B6270" }}>· {g.note}</span>
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
                  onPaid={onPaid}
                  onMeta={onMeta}
                  onRate={onRate}
                />
              )),
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
