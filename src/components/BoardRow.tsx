"use client";

import { BoardRow as BoardRowType, Interest, POS_COLOR, STATUS_OPTIONS, tierColor } from "@/lib/draftLogic";
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
  // Extra cells appended after the base columns — the strategy target-zone
  // bracket columns when a single position filter is active.
  zoneCells?: React.ReactNode;
  onPaid: (row: BoardRowType, value: string) => void;
  onMeta: (id: string, field: "max", value: string) => void;
  onStatus: (row: BoardRowType, value: string) => void;
  onRate: (row: BoardRowType, value: Interest) => void;
  onKeeperCost: (row: BoardRowType, value: string) => void;
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
  onPaid,
  onMeta,
  onStatus,
  onRate,
  onKeeperCost,
}: BoardRowProps) {
  const { pressing, handlers } = usePlayerRating(row.interest, (v) => onRate(row, v));
  const nameClickable = !row.isKeeper && !row.isDrafted && !row.mine;
  const statusValue = row.isKeeper
    ? row.mine
      ? "keeper-mine"
      : "keeper"
    : row.mine
    ? "mine"
    : row.interest === "love" || row.interest === "like" || row.interest === "dislike"
    ? row.interest
    : "";
  const statusOpt = STATUS_OPTIONS.find((o) => o.value === statusValue) || STATUS_OPTIONS[0];
  const dimmed = row.isDrafted || row.isKeeper || row.interest === "dislike";
  // Drop-target edge wins over a tier break line while a drag is in flight.
  const tBreakStyle = { ...(tierBreak ? { borderTop: `2px solid ${tierColor(row.tier)}` } : {}), ...dropEdge };
  const targetGlow = isTarget && !dimmed ? { boxShadow: "inset 3px 0 0 #4CAF6B" } : {};
  const rowTint =
    row.interest === "love" ? "rgba(76, 175, 107, 0.38)" : row.interest === "like" ? "rgba(76, 175, 107, 0.14)" : null;
  const bgStyle = rowTint ? { background: rowTint } : {};

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
  const dragCol2 = dragEnabled ? styles.stickyDragCol2 : {};

  return (
    <tr data-dragid={row.id} style={{ opacity: dragging ? 0.35 : dimmed ? 0.4 : 1 }}>
      <td style={{ ...styles.td, ...styles.tdSticky, ...dragCol1, ...tBreakStyle, ...bgStyle, ...targetGlow }}>
        <span style={{ display: "inline-flex", alignItems: "center" }}>
          {dragEnabled && <DragHandle onPointerDown={onDragStart} dragging={dragging} />}
          <span style={{ ...styles.tdMono, fontSize: 11 }}>
            {row.pos}
            {row.effRank ?? "–"}
          </span>
        </span>
      </td>
      <td style={{ ...styles.td, ...styles.tdSticky2, ...dragCol2, ...tBreakStyle, ...bgStyle }}>
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
            </div>
          </div>
        ) : (
          <>
            <div style={styles.tdPlayerName}>{row.name}</div>
            <div style={styles.tdPlayerMeta}>
              {row.team ? row.team + " · " : ""}ADP {row.adp}
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
      <td style={{ ...styles.td, ...tBreakStyle, ...bgStyle }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <select
            style={{ ...styles.cellSelect, width: 78, background: statusOpt.color, color: statusOpt.text }}
            value={statusValue}
            onChange={(e) => onStatus(row, e.target.value)}
            title={statusOpt.label}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} style={{ background: "#1C2128", color: "#EDEEF0" }}>
                {o.label}
              </option>
            ))}
          </select>
          {row.isKeeper && (
            <input
              style={{ ...styles.cellInput, width: 32 }}
              type="number"
              placeholder="$"
              value={row.keeperCost}
              onChange={(e) => onKeeperCost(row, e.target.value)}
            />
          )}
        </div>
      </td>
      {zoneCells}
    </tr>
  );
}
