"use client";

import { useState } from "react";
import { Profile } from "@/hooks/useProfiles";
import { styles } from "./styles";

interface ProfileBarProps {
  profiles: Profile[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => Promise<Profile>;
}

export function ProfileBar({ profiles, currentId, onSelect, onCreate }: ProfileBarProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const p = await onCreate(trimmed);
    setName("");
    setCreating(false);
    onSelect(p.id);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
      <select
        style={{ ...styles.select, flex: "1 1 auto", minWidth: 120 }}
        value={currentId ?? ""}
        onChange={(e) => onSelect(e.target.value)}
      >
        {profiles.map((p) => (
          <option key={p.id} value={p.id} style={{ background: "#1C2128", color: "#EDEEF0" }}>
            {p.name}
          </option>
        ))}
      </select>
      {creating ? (
        <>
          <input
            style={{ ...styles.input, width: 140 }}
            placeholder="Profile name"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button style={styles.primaryBtn} onClick={handleCreate}>
            Save
          </button>
          <button style={styles.smallBtn} onClick={() => setCreating(false)}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <button style={styles.smallBtn} onClick={() => setCreating(true)}>
            + Profile
          </button>
          <button style={styles.smallBtn} onClick={handleShare}>
            {copied ? "Copied!" : "Share link"}
          </button>
        </>
      )}
    </div>
  );
}
