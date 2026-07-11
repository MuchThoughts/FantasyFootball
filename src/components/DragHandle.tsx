"use client";

interface DragHandleProps {
  onPointerDown: (e: React.PointerEvent) => void;
  dragging: boolean;
}

// The grab target for row drag-and-drop. touchAction: none keeps the browser
// from hijacking the gesture to scroll on touch devices.
export function DragHandle({ onPointerDown, dragging }: DragHandleProps) {
  return (
    <span
      onPointerDown={onPointerDown}
      title="Drag to move this player up or down your ranking"
      style={{
        cursor: dragging ? "grabbing" : "grab",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        color: "#4A5160",
        fontSize: 14,
        lineHeight: 1,
        padding: "6px 4px",
        display: "inline-block",
      }}
    >
      ⠿
    </span>
  );
}
