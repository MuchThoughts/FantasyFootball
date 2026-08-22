"use client";

import { useMemo, useState } from "react";
import { Strategy } from "@/lib/data/strategies";
import {
  assignKeepersToSlots,
  availableByPos,
  Board,
  BoardRow as BoardRowType,
  fmtMoney,
  POS_COLOR,
  POSITIONS,
  Pos,
  slotShortlist,
  SlotLabel,
} from "@/lib/draftLogic";
import { styles } from "./styles";

interface Pick {
  id: string;
  label: string;
  pos: Pos;
  amount: number;
  // Set once a keeper or one of your own auction wins occupies this slot.
  filled?: BoardRowType;
  note?: string;
  shortlist: BoardRowType[];
  // Best name on the shortlist that no earlier pick has already claimed.
  ideal?: BoardRowType;
}

interface DraftPlanTabProps {
  board: Board;
  strategy: Strategy | undefined;
  budget: number;
  assignments: Record<string, string>;
  slotLabels: Map<string, SlotLabel>;
  // Shared with the Targets tab, so a max you set in one shows in the other.
  onMeta: (id: string, field: "max", value: string) => void;
}

// The whole draft on one page: every pick you plan to make, what you've budgeted
// for it, and who you'd say it for. Collapsed to a scannable list of rows; open
// one to see its shortlist and set your walk-away number on each name.
export function DraftPlanTab({ board, strategy, budget, assignments, slotLabels, onMeta }: DraftPlanTabProps) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const myKeepers = useMemo(() => board.rows.filter((r) => r.isKeeper && r.mine), [board.rows]);
  const filled = useMemo(
    () => assignKeepersToSlots(strategy, [...myKeepers, ...board.myDrafted]),
    [strategy, myKeepers, board.myDrafted]
  );
  const availByPos = useMemo(() => availableByPos(board.rows), [board.rows]);

  const picks = useMemo<Pick[]>(() => {
    if (!strategy) return [];
    // Grouped by position, then cheapest last — QB1, QB2, QB3, RB1, RB2…
    const order = (p: Pick) => POSITIONS.indexOf(p.pos) * 1000 - p.amount;
    const list = strategy.slots
      .map((sl) => {
        const done = filled.get(sl.id);
        const amount = done ? Number(done.keeperCost) || 0 : Number(sl.amount) || 0;
        const pinned = new Set(
          Object.entries(assignments)
            .filter(([, slotId]) => slotId === sl.id)
            .map(([playerId]) => playerId)
        );
        return {
          id: sl.id,
          label: slotLabels.get(sl.id)?.label ?? sl.id,
          pos: sl.pos as Pos,
          amount,
          filled: done,
          note: strategy.slotNotes?.[sl.id],
          shortlist: done ? [] : slotShortlist(availByPos[sl.pos as Pos] ?? [], amount, pinned),
        } as Pick;
      })
      .sort((a, b) => order(a) - order(b));

    // Adjacent prices shop overlapping shelves, so the same name tops the
    // shortlist for RB3, RB4 and RB5 — and you can't draft him three times.
    // Walking the picks in draft order and claiming each ideal means the
    // headline names read as a roster you could actually end up with. The
    // shortlists themselves stay untouched: those are the Targets tab's, and
    // any of the five is a fine outcome for whichever slot you win him in.
    const claimed = new Set<string>();
    for (const pick of list) {
      if (pick.filled) continue;
      pick.ideal = pick.shortlist.find((r) => !claimed.has(r.id));
      if (pick.ideal) claimed.add(pick.ideal.id);
    }
    return list;
  }, [strategy, filled, assignments, slotLabels, availByPos]);

  if (!strategy) return <div style={{ ...styles.panel, padding: 12, fontSize: 12 }}>No strategy selected.</div>;

  const planned = picks.reduce((s, p) => s + p.amount, 0);
  const openCount = picks.filter((p) => !p.filled).length;

  return (
    <div>
      <div style={{ ...styles.panel, padding: "8px 10px", marginBottom: 10, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "baseline" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#EDEEF0" }}>{strategy.name}</span>
        <span style={{ fontSize: 11, color: "#8B92A0" }}>
          {picks.length} picks · {openCount} still to buy
        </span>
        <span style={{ marginLeft: "auto", ...styles.tdMono, fontSize: 13, fontWeight: 700, color: planned > budget ? "#E1524B" : "#EDEEF0" }}>
          {fmtMoney(planned)} / {fmtMoney(budget)}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {picks.map((pick) => (
          <PickSection
            key={pick.id}
            pick={pick}
            open={!!open[pick.id]}
            onToggle={() => setOpen((o) => ({ ...o, [pick.id]: !o[pick.id] }))}
            onMeta={onMeta}
          />
        ))}
      </div>
    </div>
  );
}

function PickSection({
  pick,
  open,
  onToggle,
  onMeta,
}: {
  pick: Pick;
  open: boolean;
  onToggle: () => void;
  onMeta: (id: string, field: "max", value: string) => void;
}) {
  const ideal = pick.filled ?? pick.ideal;
  const expandable = !pick.filled && pick.shortlist.length > 0;

  return (
    <div style={{ ...styles.panel, padding: 0, overflow: "hidden" }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => expandable && onToggle()}
        onKeyDown={(e) => {
          if (expandable && (e.key === "Enter" || e.key === " ")) onToggle();
        }}
        title={expandable ? `${pick.label} — ${open ? "hide" : "show"} shortlist` : `${pick.label} is already filled`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 9px",
          cursor: expandable ? "pointer" : "default",
        }}
      >
        <span style={{ flexShrink: 0, width: 10, fontSize: 9, color: "#5B6270" }}>
          {expandable ? (open ? "▾" : "▸") : ""}
        </span>
        <span style={{ ...styles.posTagSm, background: POS_COLOR[pick.pos], flexShrink: 0 }}>{pick.pos}</span>
        <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: "#EDEEF0", minWidth: 62 }}>{pick.label}</span>
        <span style={{ ...styles.tdMono, flexShrink: 0, fontSize: 12, fontWeight: 700, color: "#4CAF6B", minWidth: 34, textAlign: "right" }}>
          {fmtMoney(pick.amount)}
        </span>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: 11.5,
            color: pick.filled ? "#E8A33D" : ideal ? "#C6CAD2" : "#4A5160",
          }}
        >
          {pick.filled ? `🔒 ${pick.filled.name}` : ideal ? ideal.name : "nobody left at this price"}
        </span>
      </div>

      {open && expandable && (
        <div style={{ borderTop: "1px solid #20242C", padding: "6px 9px 8px" }}>
          {pick.note && (
            <div style={{ fontSize: 10.5, color: "#A7ADBA", marginBottom: 6, lineHeight: 1.4 }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, color: "#5B6270" }}>NOTE </span>
              {pick.note}
            </div>
          )}
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, ...styles.thSticky }}>Rk</th>
                  <th style={{ ...styles.th, ...styles.thSticky2, left: 38 }}>Target</th>
                  <th style={styles.th} title="What this league has actually paid for this rank (2023-25 average)">
                    Tgt $
                  </th>
                  <th style={styles.th} title="Your walk-away number — shared with the Targets tab">
                    Max $
                  </th>
                </tr>
              </thead>
              <tbody>
                {pick.shortlist.map((r) => (
                  <tr key={r.id}>
                    <td style={{ ...styles.td, ...styles.tdSticky, ...styles.tdMono, fontSize: 10.5, color: "#8B92A0" }}>
                      {r.pos}
                      {r.effRank}
                    </td>
                    <td style={{ ...styles.td, ...styles.tdSticky2, left: 38, fontSize: 11.5 }}>
                      {r.name}
                      <span style={{ fontSize: 9.5, color: "#5B6270" }}> {r.team}</span>
                    </td>
                    <td style={{ ...styles.td, ...styles.tdMono, color: "#8B92A0" }}>
                      {r.act != null ? `$${r.act}` : "—"}
                    </td>
                    <td style={styles.td}>
                      <input
                        style={styles.cellInput}
                        type="number"
                        value={r.max}
                        onChange={(e) => onMeta(r.id, "max", e.target.value)}
                        onFocus={(e) => {
                          // Start from what the league pays for him rather than 0.
                          const el = e.target as HTMLInputElement;
                          if (r.max === "" && r.act != null) onMeta(r.id, "max", String(r.act));
                          requestAnimationFrame(() => el.select());
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
