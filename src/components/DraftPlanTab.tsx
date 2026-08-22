"use client";

import { useMemo, useState } from "react";
import { Strategy } from "@/lib/data/strategies";
import {
  assignKeepersToSlots,
  availableByPos,
  Band,
  BAND_COLOR,
  BANDS,
  Board,
  BoardRow as BoardRowType,
  fmtMoney,
  POS_COLOR,
  POSITIONS,
  Pos,
  slotCandidates,
  slotShortlist,
  SlotLabel,
} from "@/lib/draftLogic";
import { DragHandle } from "./DragHandle";
import { PriceInput } from "./PriceInput";
import { dropEdgeStyle, useRowDrag } from "@/hooks/useRowDrag";
import { styles } from "./styles";

const MAX_PICKS = 5;

const BAND_LABEL: Record<Band, { label: string; note: string }> = {
  reach: { label: "REACH", note: "above your price — only at a discount" },
  target: { label: "TARGET", note: "your money buys these" },
  settle: { label: "SETTLE", note: "fallback if the room outbids you" },
};

interface Pick {
  id: string;
  label: string;
  pos: Pos;
  amount: number;
  // Set once a keeper or one of your own auction wins occupies this slot.
  filled?: BoardRowType;
  note?: string;
  // Everything on offer for this slot, by band, and the ones you've chosen.
  candidates: Record<Band, BoardRowType[]>;
  chosen: BoardRowType[];
  // True once you've made a choice; until then `chosen` is only a suggestion.
  picked: boolean;
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
  // Repricing a slot here edits the strategy itself, so the Targets tab moves too.
  onSlotAmount: (strategyId: string, slotId: string, value: string) => void;
  onSlotPicks: (strategyId: string, slotId: string, ids: string[]) => void;
}

// The whole draft on one page: every pick you plan to make, what you've budgeted
// for it, and who you want there. Collapsed to a scannable list; open one to
// choose your targets from the Reach/Target/Settle windows and rank them.
export function DraftPlanTab({
  board,
  strategy,
  budget,
  assignments,
  slotLabels,
  onMeta,
  onSlotAmount,
  onSlotPicks,
}: DraftPlanTabProps) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const myKeepers = useMemo(() => board.rows.filter((r) => r.isKeeper && r.mine), [board.rows]);
  const filled = useMemo(
    () => assignKeepersToSlots(strategy, [...myKeepers, ...board.myDrafted]),
    [strategy, myKeepers, board.myDrafted]
  );
  const availByPos = useMemo(() => availableByPos(board.rows), [board.rows]);
  const rowById = useMemo(() => new Map(board.rows.map((r) => [r.id, r])), [board.rows]);

  const picks = useMemo<Pick[]>(() => {
    if (!strategy) return [];
    // Grouped by position, then cheapest last — QB1, QB2, QB3, RB1, RB2…
    const order = (p: Pick) => POSITIONS.indexOf(p.pos) * 1000 - p.amount;
    const list = strategy.slots
      .map((sl) => {
        const done = filled.get(sl.id);
        const amount = done ? Number(done.keeperCost) || 0 : Number(sl.amount) || 0;
        const avail = availByPos[sl.pos as Pos] ?? [];
        const saved = strategy.slotPicks?.[sl.id];
        const pinned = new Set(
          Object.entries(assignments)
            .filter(([, slotId]) => slotId === sl.id)
            .map(([playerId]) => playerId)
        );
        // A chosen player who's since been drafted or kept drops out on his own.
        const chosen = (saved ?? [])
          .map((id) => rowById.get(id))
          .filter((r): r is BoardRowType => !!r && !r.isDrafted && !r.isKeeper);
        return {
          id: sl.id,
          label: slotLabels.get(sl.id)?.label ?? sl.id,
          pos: sl.pos as Pos,
          amount,
          filled: done,
          note: strategy.slotNotes?.[sl.id],
          candidates: done ? { reach: [], target: [], settle: [] } : slotCandidates(avail, amount),
          chosen: saved ? chosen : done ? [] : slotShortlist(avail, amount, pinned),
          picked: !!saved && chosen.length > 0,
        } as Pick;
      })
      .sort((a, b) => order(a) - order(b));

    // Only the *suggested* headline names claim down the list — adjacent prices
    // shop overlapping shelves, so the same RB would otherwise top RB3, RB4 and
    // RB5 at once. A pick you've chosen yourself is never overridden.
    const claimed = new Set<string>();
    for (const pick of list) {
      if (pick.filled) continue;
      if (pick.picked) {
        pick.ideal = pick.chosen[0];
      } else {
        pick.ideal = pick.chosen.find((r) => !claimed.has(r.id));
      }
      if (pick.ideal) claimed.add(pick.ideal.id);
    }
    return list;
  }, [strategy, filled, assignments, slotLabels, availByPos, rowById]);

  if (!strategy) return <div style={{ ...styles.panel, padding: 12, fontSize: 12 }}>No strategy selected.</div>;

  const planned = picks.reduce((s, p) => s + p.amount, 0);
  const openCount = picks.filter((p) => !p.filled).length;
  const chosenCount = picks.filter((p) => p.picked).length;

  return (
    <div>
      <div
        style={{
          ...styles.panel,
          padding: "8px 10px",
          marginBottom: 10,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "baseline",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: "#EDEEF0" }}>{strategy.name}</span>
        <span style={{ fontSize: 11, color: "#8B92A0" }}>
          {picks.length} picks · {openCount} still to buy · {chosenCount} with targets you picked
        </span>
        <span
          style={{
            marginLeft: "auto",
            ...styles.tdMono,
            fontSize: 13,
            fontWeight: 700,
            color: planned > budget ? "#E1524B" : "#EDEEF0",
          }}
        >
          {fmtMoney(planned)} / {fmtMoney(budget)}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {picks.map((pick) => (
          <PickSection
            key={pick.id}
            pick={pick}
            strategyId={strategy.id}
            open={!!open[pick.id]}
            onToggle={() => setOpen((o) => ({ ...o, [pick.id]: !o[pick.id] }))}
            onMeta={onMeta}
            onSlotAmount={onSlotAmount}
            onSlotPicks={onSlotPicks}
          />
        ))}
      </div>
    </div>
  );
}

function PickSection({
  pick,
  strategyId,
  open,
  onToggle,
  onMeta,
  onSlotAmount,
  onSlotPicks,
}: {
  pick: Pick;
  strategyId: string;
  open: boolean;
  onToggle: () => void;
  onMeta: (id: string, field: "max", value: string) => void;
  onSlotAmount: (strategyId: string, slotId: string, value: string) => void;
  onSlotPicks: (strategyId: string, slotId: string, ids: string[]) => void;
}) {
  // Choosing is the default view until you've committed a list.
  const [choosing, setChoosing] = useState(false);
  const ideal = pick.filled ?? pick.ideal;
  const expandable = !pick.filled;
  const showPicker = choosing || !pick.picked;

  const chosenIds = pick.chosen.map((r) => r.id);
  const commit = (ids: string[]) => onSlotPicks(strategyId, pick.id, ids);

  const toggleCandidate = (id: string) => {
    // The first tap starts a fresh list rather than inheriting the suggestion —
    // and latches the picker open, so choosing one player doesn't close the list
    // you're still picking the other four from.
    const base = pick.picked ? chosenIds : [];
    setChoosing(true);
    if (base.includes(id)) commit(base.filter((x) => x !== id));
    else if (base.length < MAX_PICKS) commit([...base, id]);
  };

  // Drag to reorder your priority; the list is your ranking, not a price ladder.
  const drag = useRowDrag((dragId, overId, after) => {
    const next = chosenIds.filter((x) => x !== dragId);
    let at = next.indexOf(overId);
    if (at === -1) return;
    if (after) at += 1;
    next.splice(at, 0, dragId);
    commit(next);
  });

  return (
    <div style={{ ...styles.panel, padding: 0, overflow: "hidden" }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => expandable && onToggle()}
        onKeyDown={(e) => {
          if (expandable && (e.key === "Enter" || e.key === " ")) onToggle();
        }}
        title={expandable ? `${pick.label} — ${open ? "hide" : "show"} targets` : `${pick.label} is already filled`}
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
        <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: "#EDEEF0", minWidth: 62 }}>
          {pick.label}
        </span>
        <span
          style={{
            ...styles.tdMono,
            flexShrink: 0,
            fontSize: 12,
            fontWeight: 700,
            color: "#4CAF6B",
            minWidth: 34,
            textAlign: "right",
          }}
        >
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
        {!pick.filled && (
          <span
            title={pick.picked ? "You picked these targets" : "Suggested — open to pick your own"}
            style={{ flexShrink: 0, fontSize: 9, color: pick.picked ? "#4CAF6B" : "#4A5160" }}
          >
            {pick.picked ? `✓ ${pick.chosen.length}` : "auto"}
          </span>
        )}
      </div>

      {open && expandable && (
        <div style={{ borderTop: "1px solid #20242C", padding: "6px 9px 8px" }}>
          {pick.note && (
            <div style={{ fontSize: 10.5, color: "#A7ADBA", marginBottom: 6, lineHeight: 1.4 }}>
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4, color: "#5B6270" }}>NOTE </span>
              {pick.note}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: "#8B92A0" }}>Budget for this pick</span>
            <PriceInput value={pick.amount} onCommit={(v) => onSlotAmount(strategyId, pick.id, v)} />
            <span style={{ fontSize: 9.5, color: "#4A5160" }}>also updates the Targets tab</span>
          </div>

          {pick.picked && (
            <ChosenList
              pick={pick}
              drag={drag}
              onMeta={onMeta}
              onRemove={(id) => commit(chosenIds.filter((x) => x !== id))}
            />
          )}

          {pick.picked && (
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button style={styles.smallBtn} onClick={() => setChoosing((c) => !c)}>
                {choosing ? "Done choosing" : "Change targets"}
              </button>
              <button style={styles.smallBtn} onClick={() => commit([])}>
                Reset to suggested
              </button>
            </div>
          )}

          {showPicker && (
            <CandidatePicker
              pick={pick}
              chosenIds={pick.picked ? chosenIds : []}
              onToggle={toggleCandidate}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Your ranked targets: drag to reorder, × to drop one, Max to set a walk-away.
function ChosenList({
  pick,
  drag,
  onMeta,
  onRemove,
}: {
  pick: Pick;
  drag: ReturnType<typeof useRowDrag>;
  onMeta: (id: string, field: "max", value: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th} title="Drag to reorder — this is your priority, not a price order" />
            <th style={styles.th}>#</th>
            <th style={{ ...styles.th, textAlign: "left" }}>Target</th>
            <th style={styles.th} title="What this league has actually paid for this rank (2023-25 average)">
              Tgt $
            </th>
            <th style={styles.th} title="Your walk-away number — shared with the Targets tab">
              Max $
            </th>
            <th style={styles.th} />
          </tr>
        </thead>
        <tbody>
          {pick.chosen.map((r, i) => (
            <tr key={r.id} data-dragid={r.id} style={dropEdgeStyle(drag.drag, r.id)}>
              <td style={{ ...styles.td, padding: 0, width: 26 }}>
                <DragHandle onPointerDown={drag.startDrag(r.id)} dragging={drag.drag?.id === r.id} />
              </td>
              <td style={{ ...styles.td, ...styles.tdMono, fontSize: 11, fontWeight: 700, color: "#4CAF6B" }}>
                {i + 1}
              </td>
              <td style={{ ...styles.td, fontSize: 11.5, textAlign: "left", width: "100%" }}>
                {r.name}
                <span style={{ fontSize: 9.5, color: "#5B6270" }}>
                  {" "}
                  {r.pos}
                  {r.effRank}
                </span>
              </td>
              <td style={{ ...styles.td, ...styles.tdMono, color: "#8B92A0" }}>{r.act != null ? `$${r.act}` : "—"}</td>
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
              <td style={{ ...styles.td, padding: 0, width: 24 }}>
                <button
                  title={`Drop ${r.name} from this pick`}
                  onClick={() => onRemove(r.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#5B6270",
                    cursor: "pointer",
                    fontSize: 12,
                    padding: "4px 6px",
                  }}
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// The Reach / Target / Settle windows for this slot — tap to add, tap to drop.
function CandidatePicker({
  pick,
  chosenIds,
  onToggle,
}: {
  pick: Pick;
  chosenIds: string[];
  onToggle: (id: string) => void;
}) {
  const total = BANDS.reduce((n, b) => n + pick.candidates[b].length, 0);
  const full = chosenIds.length >= MAX_PICKS;

  if (total === 0) {
    return <div style={{ fontSize: 11, color: "#5B6270", padding: "6px 0" }}>Nobody left on the board at this price.</div>;
  }

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: 10, color: "#8B92A0", marginBottom: 5 }}>
        {pick.picked ? "Tap to add or drop" : `Pick up to ${MAX_PICKS} targets for ${pick.label}`}
        <span style={{ color: full ? "#E8A33D" : "#5B6270" }}>
          {" "}
          · {chosenIds.length}/{MAX_PICKS} chosen{full ? " — drop one to swap" : ""}
        </span>
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <tbody>
            {BANDS.flatMap((band) => {
              const rows = pick.candidates[band];
              if (rows.length === 0) return [];
              const meta = BAND_LABEL[band];
              return [
                <tr key={band}>
                  <td colSpan={4} style={{ padding: 0, background: "#141821", borderBottom: "1px solid #20242C" }}>
                    <div style={{ padding: "4px 8px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, color: BAND_COLOR[band] }}>
                        {meta.label}
                      </span>{" "}
                      <span style={{ fontSize: 10, color: "#5B6270" }}>· {meta.note}</span>
                    </div>
                  </td>
                </tr>,
                ...rows.map((r) => {
                  const on = chosenIds.includes(r.id);
                  const order = chosenIds.indexOf(r.id) + 1;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => onToggle(r.id)}
                      title={on ? `Drop ${r.name}` : full ? "Drop one first" : `Add ${r.name}`}
                      style={{
                        cursor: on || !full ? "pointer" : "default",
                        background: on ? "rgba(76,175,107,0.12)" : undefined,
                        opacity: !on && full ? 0.45 : 1,
                      }}
                    >
                      <td style={{ ...styles.td, width: 26, color: on ? "#4CAF6B" : "#3A3F4A", fontSize: 12 }}>
                        {on ? `✓${order}` : "＋"}
                      </td>
                      <td style={{ ...styles.td, ...styles.tdMono, fontSize: 10.5, color: "#8B92A0", width: 44 }}>
                        {r.pos}
                        {r.effRank}
                      </td>
                      <td style={{ ...styles.td, fontSize: 11.5, textAlign: "left", width: "100%" }}>
                        {r.name}
                        <span style={{ fontSize: 9.5, color: "#5B6270" }}> {r.team}</span>
                      </td>
                      <td style={{ ...styles.td, ...styles.tdMono, color: "#8B92A0" }}>
                        {r.act != null ? `$${r.act}` : "—"}
                      </td>
                    </tr>
                  );
                }),
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
