"use client";

import { useRef, useState } from "react";
import { styles } from "./styles";

const ROW_HEIGHT = 38; // approx rendered row height in px, used to translate drag distance into rows

interface TierDividerProps {
  pos: string;
  index: number;
  rank: number;
  lower: number;
  upper: number;
  breaks: number[];
  color: string;
  onChange: (pos: string, index: number, breaks: number[], newRank: number) => void;
}

export function TierDivider({ pos, index, rank, lower, upper, breaks, color, onChange }: TierDividerProps) {
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const startRank = useRef(rank);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(true);
    startY.current = e.clientY;
    startRank.current = rank;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const deltaY = e.clientY - startY.current;
    const deltaRows = Math.round(deltaY / ROW_HEIGHT);
    let newRank = startRank.current + deltaRows;
    newRank = Math.max(lower, Math.min(upper, newRank));
    if (newRank !== rank) onChange(pos, index, breaks, newRank);
  };
  const onPointerUp = () => setDragging(false);

  return (
    <tr>
      <td colSpan={9} style={{ padding: 0, border: "none", background: "transparent" }}>
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            ...styles.tierDivider,
            background: dragging ? color : `${color}55`,
            cursor: "ns-resize",
          }}
        >
          <span style={styles.tierDividerHandle}>
            ⋮⋮⋮ tier {index + 1} / {index + 2} boundary — drag ⋮⋮⋮
          </span>
        </div>
      </td>
    </tr>
  );
}
