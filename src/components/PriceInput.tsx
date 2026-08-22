"use client";

import { useState } from "react";
import { styles } from "./styles";

/*
 * Committing a price on every keystroke re-grouped the slot pages mid-type, so
 * typing "28" repriced on the "2" and shuffled the card underneath you. The
 * value is now held locally while you type and only committed on OK, Enter, or
 * blur; Escape abandons the edit.
 */
export function PriceInput({ value, onCommit }: { value: number; onCommit: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    const v = draft;
    setDraft(null);
    if (v === null) return;
    const trimmed = v.trim();
    if (trimmed !== "" && Number(trimmed) !== value) onCommit(trimmed);
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      <input
        style={{ ...styles.cellInput, width: 46, fontWeight: 700 }}
        type="number"
        min={0}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => {
          setFocused(true);
          const el = e.target as HTMLInputElement;
          requestAnimationFrame(() => el.select());
        }}
        onBlur={() => {
          setFocused(false);
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          else if (e.key === "Escape") {
            setDraft(null);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      {focused && (
        <button
          // Keep focus off the button so blur (and its commit) doesn't fire
          // before the click lands.
          onPointerDown={(e) => e.preventDefault()}
          onClick={commit}
          style={{
            background: "#2E7D46",
            border: "none",
            borderRadius: 4,
            color: "#EDEEF0",
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 7px",
            cursor: "pointer",
          }}
        >
          OK
        </button>
      )}
    </span>
  );
}
