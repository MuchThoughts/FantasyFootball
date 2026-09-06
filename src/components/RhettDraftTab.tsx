"use client";

import { useMemo, useState } from "react";
import { Board, BoardRow as BoardRowType, fmtMoney, POS_COLOR, POSITIONS, Pos } from "@/lib/draftLogic";
import { styles, chipActive } from "./styles";

interface RhettDraftTabProps {
  board: Board;
  onDrafted: (row: BoardRowType, value: boolean) => void;
}

// A strike-off sheet, nothing more: every player in board order, tap one to say
// he's gone. It exists to keep up with names being called out, so a tap is a
// single tap with no confirmation — which is exactly why undo is a first-class
// control rather than something buried.
export function RhettDraftTab({ board, onDrafted }: RhettDraftTabProps) {
  const [pos, setPos] = useState<Pos | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [showGone, setShowGone] = useState(false);
  // Only what you struck from this tab, newest last — keepers and prices typed
  // elsewhere aren't yours to undo from here.
  const [struck, setStruck] = useState<string[]>([]);

  // The board's own order: ascending rank in the active ranking source, which is
  // what the Board tab sorts by before you touch its column headers.
  const ordered = useMemo(() => [...board.rows].sort((a, b) => a.adp - b.adp), [board.rows]);

  const gone = (r: BoardRowType) => r.isDrafted || r.isKeeper;

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    return ordered.filter((r) => {
      if (!showGone && gone(r)) return false;
      if (pos !== "ALL" && r.pos !== pos) return false;
      if (s && !r.name.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [ordered, pos, search, showGone]);

  const goneCount = ordered.filter(gone).length;
  const leftCount = ordered.length - goneCount;

  const strike = (r: BoardRowType) => {
    if (r.isKeeper) return; // never in the auction to begin with
    if (r.isDrafted) {
      onDrafted(r, false);
      setStruck((prev) => prev.filter((id) => id !== r.id));
      return;
    }
    onDrafted(r, true);
    setStruck((prev) => [...prev.filter((id) => id !== r.id), r.id]);
  };

  const undoLast = () => {
    const id = struck[struck.length - 1];
    const row = ordered.find((r) => r.id === id);
    if (row) onDrafted(row, false);
    setStruck((prev) => prev.slice(0, -1));
  };

  const lastName = struck.length > 0 ? ordered.find((r) => r.id === struck[struck.length - 1])?.name : null;

  return (
    <div>
      <div style={{ ...styles.panel, padding: "8px 10px", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "baseline", flexWrap: "wrap" }}>
          <Stat value={String(leftCount)} label="still on the board" />
          <Stat value={String(goneCount)} label="gone" />
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            {lastName && (
              <button
                style={{ ...styles.smallBtn, borderColor: "#E8A33D", color: "#E8A33D" }}
                onClick={undoLast}
                title={`Put ${lastName} back on the board`}
              >
                ↩ Undo {lastName}
              </button>
            )}
            <button
              style={showGone ? { ...styles.smallBtn, borderColor: "#4CAF6B", color: "#8FCB9E" } : styles.smallBtn}
              onClick={() => setShowGone((v) => !v)}
              title="Show the players already off the board so you can put one back"
            >
              {showGone ? "✓ Showing gone" : "Show gone"}
            </button>
          </div>
        </div>
      </div>

      <input
        style={{ ...styles.input, marginBottom: 8 }}
        placeholder="Search a name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div style={styles.chipRow}>
        {(["ALL", ...POSITIONS] as (Pos | "ALL")[]).map((p) => (
          <button
            key={p}
            style={pos === p ? { ...styles.chip, ...chipActive(p) } : styles.chip}
            onClick={() => setPos(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 10.5, color: "#5B6270", marginBottom: 8 }}>
        Board order. <b style={{ color: "#8B92A0" }}>Tap a player</b> to strike him off as drafted — he disappears
        from the list. Undo the last one above, or turn on <b style={{ color: "#8B92A0" }}>Show gone</b> to tap anyone
        back on.
      </div>

      {rows.length === 0 ? (
        <div style={styles.emptyState}>
          {search.trim() ? "Nobody matches that name." : "Everyone here is off the board."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {rows.map((r) => {
            const isGone = gone(r);
            return (
              <button
                key={r.id}
                onClick={() => strike(r)}
                disabled={r.isKeeper}
                title={
                  r.isKeeper
                    ? `${r.name} is a keeper — he was never in the auction`
                    : isGone
                    ? `Put ${r.name} back on the board`
                    : `Strike ${r.name} off as drafted`
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  textAlign: "left",
                  background: isGone ? "#171A20" : "#1C2128",
                  border: `1px solid ${isGone ? "#22262E" : "#2A2F38"}`,
                  borderRadius: 8,
                  padding: "9px 10px",
                  cursor: r.isKeeper ? "default" : "pointer",
                  opacity: isGone ? 0.5 : 1,
                  color: "#EDEEF0",
                }}
              >
                <span style={{ ...styles.tdMono, fontSize: 11, color: "#5B6270", width: 30, flexShrink: 0 }}>
                  {r.adp}
                </span>
                <span style={{ ...styles.posTagSm, background: POS_COLOR[r.pos], flexShrink: 0 }}>{r.pos}</span>
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    textDecoration: isGone ? "line-through" : "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.name}
                </span>
                <span style={{ fontSize: 10, color: "#5B6270", flexShrink: 0 }}>{r.team}</span>
                {r.isKeeper && (
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: "#E8A33D", flexShrink: 0 }}>KEEPER</span>
                )}
                <span
                  style={{ ...styles.tdMono, fontSize: 11.5, color: "#8B92A0", marginLeft: "auto", flexShrink: 0 }}
                  title="What this positional rank has actually cost in your league"
                >
                  {r.act != null ? fmtMoney(r.act) : "—"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div style={{ ...styles.tdMono, fontSize: 15, fontWeight: 700, color: "#EDEEF0" }}>{value}</div>
      <div style={{ fontSize: 9, color: "#5B6270", letterSpacing: 0.3 }}>{label}</div>
    </div>
  );
}
