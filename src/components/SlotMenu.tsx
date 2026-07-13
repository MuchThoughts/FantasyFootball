"use client";

import { useEffect } from "react";
import { fmtMoney, POS_COLOR, SlotLabel } from "@/lib/draftLogic";
import { styles } from "./styles";

export interface SlotMenuState {
  playerId: string;
  playerName: string;
  pos: string;
  disliked: boolean;
  assignedSlotId: string | null;
  rect: { top: number; bottom: number; left: number };
}

interface SlotMenuProps {
  menu: SlotMenuState;
  // Slots at the player's position (fixed slots by pos, flex/bench by current pos).
  slots: SlotLabel[];
  onDislike: () => void;
  onAssign: (slotId: string | null) => void;
  onClose: () => void;
}

// Press-and-hold popup: dislike the player, or pin him to one of your draft
// slots so he leads that slot's Targets list. Anchored to the tapped name.
export function SlotMenu({ menu, slots, onDislike, onAssign, onClose }: SlotMenuProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Keep the menu on-screen: open below the name, or above if it would overflow.
  const width = 230;
  const left = Math.max(8, Math.min(menu.rect.left, window.innerWidth - width - 8));
  const openUp = menu.rect.bottom + 300 > window.innerHeight && menu.rect.top > 300;
  const top = openUp ? undefined : menu.rect.bottom + 4;
  const bottom = openUp ? window.innerHeight - menu.rect.top + 4 : undefined;

  return (
    <>
      <div
        onPointerDown={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 100, background: "transparent" }}
      />
      <div
        style={{
          position: "fixed",
          top,
          bottom,
          left,
          width,
          zIndex: 101,
          background: "#1C2128",
          border: "1px solid #3A3F4A",
          borderRadius: 10,
          boxShadow: "0 8px 28px rgba(0,0,0,0.55)",
          overflow: "hidden",
          maxHeight: 320,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "8px 10px", borderBottom: "1px solid #2A2F38" }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#EDEEF0" }}>{menu.playerName}</div>
          <div style={{ fontSize: 10, color: "#8B92A0" }}>
            <span style={{ color: POS_COLOR[menu.pos as keyof typeof POS_COLOR] ?? "#8B92A0" }}>{menu.pos}</span> · assign
            to a slot
          </div>
        </div>

        <button style={menuItem(false)} onClick={onDislike}>
          <span style={{ color: menu.disliked ? "#8FCB9E" : "#E1524B" }}>
            {menu.disliked ? "↩ Un-dislike" : "✕ Dislike"}
          </span>
        </button>

        {menu.assignedSlotId && (
          <button style={menuItem(false)} onClick={() => onAssign(null)}>
            <span style={{ color: "#E8A33D" }}>Unassign from slot</span>
          </button>
        )}

        <div style={{ overflowY: "auto" }}>
          {slots.length === 0 && (
            <div style={{ fontSize: 11, color: "#5B6270", padding: "8px 10px" }}>No {menu.pos} slots in this strategy.</div>
          )}
          {slots.map((s) => {
            const active = s.slotId === menu.assignedSlotId;
            return (
              <button key={s.slotId} style={menuItem(active)} onClick={() => onAssign(s.slotId)}>
                <span style={{ color: active ? "#4CAF6B" : "#C6CAD2", fontWeight: active ? 600 : 400 }}>
                  {active ? "✓ " : ""}
                  {s.label}
                </span>
                <span style={{ ...styles.tdMono, fontSize: 11, color: "#8B92A0" }}>{fmtMoney(s.amount)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function menuItem(active: boolean): React.CSSProperties {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    textAlign: "left",
    background: active ? "rgba(76,175,107,0.12)" : "transparent",
    border: "none",
    borderBottom: "1px solid #20242C",
    padding: "8px 10px",
    cursor: "pointer",
    fontSize: 12,
  };
}
