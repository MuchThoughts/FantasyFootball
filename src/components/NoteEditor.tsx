"use client";

import { useEffect, useRef } from "react";
import { POS_COLOR } from "@/lib/draftLogic";

export interface NoteEditorState {
  playerId: string;
  playerName: string;
  pos: string;
  rect: { top: number; bottom: number; left: number };
}

interface NoteEditorProps {
  note: NoteEditorState;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

// Anchored scratchpad for one player's scouting notes. Saves as you type
// (straight into the profile's persisted state) — no explicit save button.
export function NoteEditor({ note, value, onChange, onClose }: NoteEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      // Escape closes; Cmd/Ctrl+Enter closes too (a "done" affordance while typing).
      if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const width = 260;
  const left = Math.max(8, Math.min(note.rect.left, window.innerWidth - width - 8));
  const openUp = note.rect.bottom + 220 > window.innerHeight && note.rect.top > 220;
  const top = openUp ? undefined : note.rect.bottom + 4;
  const bottom = openUp ? window.innerHeight - note.rect.top + 4 : undefined;

  return (
    <>
      <div onPointerDown={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "transparent" }} />
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
        }}
      >
        <div
          style={{
            padding: "8px 10px",
            borderBottom: "1px solid #2A2F38",
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#EDEEF0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {note.playerName}
            </div>
            <div style={{ fontSize: 10, color: "#8B92A0" }}>
              <span style={{ color: POS_COLOR[note.pos as keyof typeof POS_COLOR] ?? "#8B92A0" }}>{note.pos}</span> · notes
              save as you type
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#8B92A0", cursor: "pointer", fontSize: 14, padding: 0 }}
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Injury news, target share, handcuff, gut read…"
          style={{
            width: "100%",
            minHeight: 130,
            resize: "vertical",
            background: "#171A20",
            border: "none",
            color: "#EDEEF0",
            padding: "8px 10px",
            fontSize: 12.5,
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.5,
            outline: "none",
            boxSizing: "border-box",
            display: "block",
          }}
        />
      </div>
    </>
  );
}
