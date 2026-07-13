"use client";

import { BoardRow as BoardRowType, Interest, POS_COLOR, tierColor } from "@/lib/draftLogic";
import { LAST_DRAFT } from "@/lib/data/lastDraft";
import { usePlayerRating } from "@/hooks/usePlayerRating";
import { DragHandle } from "./DragHandle";
import { styles } from "./styles";

interface BoardRowProps {
  row: BoardRowType;
  tierBreak: boolean;
  isTarget: boolean;
  // Row drag-and-drop (rank pinning); absent when the board isn't sorted by rank.
  dragEnabled: boolean;
  dragging: boolean; // this row is being dragged
  dropEdge: React.CSSProperties; // insertion edge when this row is the drop target
  onDragStart: (e: React.PointerEvent) => void;
  // Strategy target-zone bracket columns (Plan), rendered pinned between Rank
  // and Player when a single position filter is active.
  zoneCells?: React.ReactNode;
  // How far right the Player column's sticky offset must sit to clear the Rank
  // column plus however many Plan zone columns precede it (0 when there are none).
  playerStickyLeft: number;
  onPaid: (row: BoardRowType, value: string) => void;
  onMeta: (id: string, field: "max", value: string) => void;
  onRate: (row: BoardRowType, value: Interest) => void;
}

export function BoardRow({
  row,
  tierBreak,
  isTarget,
  dragEnabled,
  dragging,
  dropEdge,
  onDragStart,
  zoneCells,
  playerStickyLeft,
  onPaid,
  onMeta,
  onRate,
}: BoardRowProps) {
  const { pressing, handlers } = usePlayerRating(row.interest, (v) => onRate(row, v));
  const nameClickable = !row.isKeeper && !row.isDrafted && !row.mine;
  const dimmed = row.isDrafted || row.isKeeper || row.interest === "dislike";
  // Drop-target edge wins over a tier break line while a drag is in flight.
  const tBreakStyle = { ...(tierBreak ? { borderTop: `2px solid ${tierColor(row.tier)}` } : {}), ...dropEdge };
  const targetGlow = isTarget && !dimmed ? { boxShadow: "inset 3px 0 0 #4CAF6B" } : {};
  // Pale orange = this player is checked as a keeper on the Insights tab, so
  // they're out of the auction pool. Keeper rows also dim like drafted ones;
  // the tint + tag say who has them.
  const likelyKeeper = row.likelyKeeper;
  const rowTint = likelyKeeper
    ? "rgba(232, 163, 61, 0.16)"
    : row.interest === "love"
    ? "rgba(76, 175, 107, 0.38)"
    : row.interest === "like"
    ? "rgba(76, 175, 107, 0.14)"
    : null;
  const bgStyle = rowTint ? { background: rowTint } : {};
  // Rank and Player are sticky, so scrolling cells slide under them. Their tint
  // must be opaque or the text below bleeds through — composite the same
  // translucent tint over the solid row background instead of letting it show
  // through. (#171A20 matches styles.td / tdSticky.)
  const stickyBg = rowTint ? { background: `linear-gradient(${rowTint}, ${rowTint}), #171A20` } : {};
  const keeperTag = likelyKeeper && (
    <span
      style={{ color: "#E8A33D" }}
      title={`2026 keeper for ${likelyKeeper.owner} ($${likelyKeeper.cost}) — out of the auction pool. Change on the Insights tab.`}
    >
      {" · K: "}
      {likelyKeeper.owner === "Sean" ? "you" : likelyKeeper.owner} ${likelyKeeper.cost}
    </span>
  );
  // Subtle gray note: who rostered this player in 2025 and what keeping him
  // would cost them (2025 salary + $5). Hidden when the orange keeper tag is
  // showing — that already names the same owner and price.
  const last = !likelyKeeper ? LAST_DRAFT[row.id] : undefined;
  const lastDraftTag = last && (
    <span
      style={{ color: "#5B6270" }}
      title={`${last.wasKeeper ? "Kept" : "Drafted"} by ${last.owner} for $${last.paid} in 2025 — keeper price $${last.keeperPrice}`}
    >
      {" · '25: "}
      {last.owner === "Sean" ? "you" : last.owner} ${last.keeperPrice}
    </span>
  );

  let liveAlertColor: string | null = null;
  let liveAlertLabel = "";
  if (!row.isKeeper && !row.isDrafted && row.live != null) {
    const hasMax = row.max !== "" && row.max != null;
    if (hasMax && row.live > Number(row.max)) {
      liveAlertColor = "#E1524B";
      liveAlertLabel = `Live $${row.live} is above your max $${row.max}`;
    } else if (hasMax) {
      liveAlertColor = "#4CAF6B";
      liveAlertLabel = "Live price is within your max";
    }
  }

  const dragCol1 = dragEnabled ? styles.stickyDragCol1 : {};

  return (
    <tr data-dragid={row.id} style={{ opacity: dragging ? 0.35 : dimmed ? 0.4 : 1 }}>
      <td style={{ ...styles.td, ...styles.tdSticky, ...dragCol1, ...tBreakStyle, ...stickyBg, ...targetGlow }}>
        <span style={{ display: "inline-flex", alignItems: "center" }}>
          {dragEnabled && <DragHandle onPointerDown={onDragStart} dragging={dragging} />}
          <span style={{ ...styles.tdMono, fontSize: 11 }}>
            {row.pos}
            {row.effRank ?? "–"}
          </span>
        </span>
      </td>
      {zoneCells}
      <td style={{ ...styles.td, ...styles.tdSticky2, ...tBreakStyle, ...stickyBg, left: playerStickyLeft }}>
        {nameClickable ? (
          <div
            {...handlers}
            title="Click = Like, double-click = Love, press and hold = Dislike (click again to undo)"
            style={{
              cursor: "pointer",
              borderRadius: 4,
              padding: "1px 3px",
              margin: "-1px -3px",
              background: pressing ? "rgba(168, 58, 52, 0.35)" : "transparent",
              transition: "background 0.1s ease",
              userSelect: "none",
              WebkitUserSelect: "none",
              touchAction: "manipulation",
            }}
          >
            <div style={styles.tdPlayerName}>{row.name}</div>
            <div style={styles.tdPlayerMeta}>
              {row.team ? row.team + " · " : ""}ADP {row.adp}
              {keeperTag}
              {lastDraftTag}
            </div>
          </div>
        ) : (
          <>
            <div style={styles.tdPlayerName}>{row.name}</div>
            <div style={styles.tdPlayerMeta}>
              {row.team ? row.team + " · " : ""}ADP {row.adp}
              {keeperTag}
              {lastDraftTag}
            </div>
          </>
        )}
      </td>
      <td style={{ ...styles.td, ...tBreakStyle, ...bgStyle }}>
        <span style={{ ...styles.posTagSm, background: POS_COLOR[row.pos] }}>{row.pos}</span>
      </td>
      <td style={{ ...styles.td, ...styles.tdMono, ...tBreakStyle, ...bgStyle }}>
        {row.tier ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ ...styles.tierDot, background: tierColor(row.tier) }} />T{row.tier}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td style={{ ...styles.td, ...styles.tdMono, ...tBreakStyle, ...bgStyle }}>{row.isKeeper ? "—" : row.target}</td>
      <td
        style={{
          ...styles.td,
          ...styles.tdMono,
          ...tBreakStyle,
          ...bgStyle,
          fontWeight: liveAlertColor ? 700 : 400,
          color: dimmed ? "#4A5160" : liveAlertColor || "#8B92A0",
        }}
        title={liveAlertLabel}
      >
        {row.isKeeper || row.isDrafted ? "—" : row.live}
      </td>
      <td style={{ ...styles.td, ...tBreakStyle, ...bgStyle }}>
        <input
          style={styles.cellInput}
          type="number"
          value={row.max}
          onChange={(e) => onMeta(row.id, "max", e.target.value)}
        />
      </td>
      <td style={{ ...styles.td, ...tBreakStyle, ...bgStyle }}>
        {row.isKeeper ? (
          <span style={{ fontSize: 10, color: "#8B92A0" }}>—</span>
        ) : (
          <input
            style={{ ...styles.cellInput, fontWeight: 700, color: row.isDrafted ? "#EDEEF0" : "#8B92A0" }}
            type="number"
            value={row.paid}
            placeholder="—"
            onChange={(e) => onPaid(row, e.target.value)}
          />
        )}
      </td>
    </tr>
  );
}
