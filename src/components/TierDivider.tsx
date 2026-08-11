"use client";

import { useState } from "react";
import { styles } from "./styles";

const ROW_HEIGHT = 38; // approx rendered row height in px, used to translate drag distance into rows

interface TierDividerProps {
  pos: string;
  colSpan: number; // total column count of the board table (base columns + any zone columns)
  index: number;
  rank: number;
  lower: number;
  upper: number;
  breaks: number[];
  color: string;
  onChange: (pos: string, index: number, breaks: number[], newRank: number) => void;
  onRemove: (pos: string, rank: number) => void;
}

// The divider is rendered under whichever row currently sits at the boundary rank,
// so moving the boundary remounts this component under a different row mid-drag.
// The drag must therefore live on window listeners captured in the pointerdown
// closure — component-local pointermove handlers would die after the first step.
export function TierDivider({ pos, colSpan, index, rank, lower, upper, breaks, color, onChange, onRemove }: TierDividerProps) {
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
    const startY = e.clientY;
    const startRank = rank;
    let lastRank = rank;

    const onMove = (ev: PointerEvent) => {
      const deltaRows = Math.round((ev.clientY - startY) / ROW_HEIGHT);
      const newRank = Math.max(lower, Math.min(upper, startRank + deltaRows));
      if (newRank !== lastRank) {
        lastRank = newRank;
        onChange(pos, index, breaks, newRank);
      }
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: 0, border: "none", background: "transparent" }}>
        <div
          onPointerDown={onPointerDown}
          style={{
            ...styles.tierDivider,
            position: "relative",
            background: dragging ? color : `${color}55`,
            cursor: "ns-resize",
          }}
        >
          <span style={styles.tierDividerHandle}>
            ⋮⋮⋮ tier {index + 1} / {index + 2} boundary — drag ⋮⋮⋮
          </span>
          <button
            title="Remove this tier bar"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(pos, rank);
            }}
            style={{
              position: "absolute",
              right: 4,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              color: "#171A20",
              fontWeight: 700,
              fontSize: 11,
              cursor: "pointer",
              padding: "0 4px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
  );
}
