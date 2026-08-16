"use client";

import { styles } from "./styles";

interface NotesTabProps {
  value: string;
  onChange: (text: string) => void;
}

// A plain scratchpad for the profile. It rides on the same debounced Supabase
// save as everything else, so there's no save button — the footer's Saving…/
// Synced indicator covers it.
export function NotesTab({ value, onChange }: NotesTabProps) {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div style={{ ...styles.panel, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, color: "#8B92A0" }}>NOTES</span>
        <span style={{ fontSize: 11, color: "#5B6270", flex: 1 }}>
          Saved to this profile automatically.
        </span>
        {words > 0 && (
          <span style={{ ...styles.tdMono, fontSize: 10, color: "#4A5160" }}>
            {words} word{words === 1 ? "" : "s"}
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Anything you want to remember — nomination order, who's cash-poor, trade ideas, players to avoid…"
        spellCheck
        style={{
          ...styles.input,
          width: "100%",
          minHeight: "60vh",
          resize: "vertical",
          fontFamily: "inherit",
          fontSize: 13.5,
          lineHeight: 1.6,
        }}
      />
    </div>
  );
}
