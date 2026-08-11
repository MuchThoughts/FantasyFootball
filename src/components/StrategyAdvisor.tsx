"use client";

import { useState } from "react";
import { StrategyEval, StrategyNote, StrategyRecommendation } from "@/lib/draftLogic";
import { styles } from "./styles";

interface StrategyAdvisorProps {
  recommendation: StrategyRecommendation | null;
  activeStrategyId: string;
  activeStrategyName: string;
  budget: number;
  // The last recommendation the user rejected; suppressed until the engine
  // recommends a different strategy.
  dismissedId: string | null;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
}

// A switch is only suggested when the recommended strategy beats the active one by at
// least this much (in fraction-of-budget units) — below that the difference is noise.
const SWITCH_MARGIN = 0.02;

const NOTE_COLOR: Record<StrategyNote["kind"], string> = {
  hot: "#E1524B",
  cheap: "#4CAF6B",
  depleted: "#E8A33D",
};

function EvalBlock({ name, ev, highlight }: { name: string; ev: StrategyEval | undefined; highlight: boolean }) {
  if (!ev) return null;
  const overPlan = ev.extraCost > 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: highlight ? "#4CAF6B" : "#EDEEF0", marginBottom: 3 }}>
        {name}{" "}
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 400,
            fontSize: 11,
            color: ev.extraCost === 0 ? "#8B92A0" : overPlan ? "#E1524B" : "#4CAF6B",
          }}
        >
          {ev.extraCost === 0
            ? "on plan at today's prices"
            : `projects ${overPlan ? "" : "−"}$${Math.abs(ev.extraCost)} ${overPlan ? "over" : "under"} plan`}
        </span>
      </div>
      {ev.notes.map((n) => (
        <div key={n.text} style={{ fontSize: 11, color: "#C6CAD2", display: "flex", gap: 6, marginBottom: 2 }}>
          <span style={{ color: NOTE_COLOR[n.kind], flexShrink: 0 }}>▸</span>
          <span>{n.text}</span>
        </div>
      ))}
      {ev.notes.length === 0 && (
        <div style={{ fontSize: 11, color: "#8B92A0" }}>No price shocks or depleted tiers in this plan&apos;s ranges.</div>
      )}
    </div>
  );
}

// The live strategy recommendation: a compact pill next to the strategy selector
// that expands into the full rationale with accept/reject actions.
export function StrategyAdvisor({
  recommendation,
  activeStrategyId,
  activeStrategyName,
  budget,
  dismissedId,
  onAccept,
  onDismiss,
}: StrategyAdvisorProps) {
  const [open, setOpen] = useState(false);

  const rec = recommendation;
  const show = rec != null && rec.bestId !== activeStrategyId && rec.margin >= SWITCH_MARGIN && rec.bestId !== dismissedId;
  if (!show) return null;

  const dollars = Math.max(Math.round(rec.margin * budget), 1);

  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="How the draft is trending vs. your plan — tap for the full rationale"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          background: "rgba(232, 163, 61, 0.10)",
          border: "1px solid #E8A33D",
          borderRadius: open ? "10px 10px 0 0" : 10,
          color: "#EDEEF0",
          padding: "8px 12px",
          fontSize: 12,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span>
          💡 Market suggests <strong>{rec.bestName}</strong>
          <span style={{ color: "#8B92A0" }}> — ≈ ${dollars} edge over {activeStrategyName}</span>
        </span>
        <span style={{ color: "#E8A33D", flexShrink: 0 }}>{open ? "▴" : "▾ why?"}</span>
      </button>

      {open && (
        <div
          style={{
            border: "1px solid #E8A33D",
            borderTop: "none",
            borderRadius: "0 0 10px 10px",
            background: "#1C2128",
            padding: "10px 12px",
          }}
        >
          {rec.reasons.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {rec.reasons.map((reason) => {
                const overpaying = reason.includes("+");
                return (
                  <span
                    key={reason}
                    style={{
                      ...styles.allocChip,
                      color: overpaying ? "#E1524B" : "#4CAF6B",
                      borderColor: overpaying ? "#5A2A27" : "#2A4A34",
                    }}
                  >
                    {reason}
                  </span>
                );
              })}
            </div>
          )}

          <EvalBlock name={`${activeStrategyName} (current)`} ev={rec.evals[activeStrategyId]} highlight={false} />
          <EvalBlock name={`${rec.bestName} (suggested)`} ev={rec.evals[rec.bestId]} highlight />

          {rec.hint && <div style={{ fontSize: 11, color: "#E8A33D", marginBottom: 10 }}>{rec.hint}</div>}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              style={styles.primaryBtn}
              onClick={() => {
                setOpen(false);
                onAccept(rec.bestId);
              }}
            >
              Switch to {rec.bestName}
            </button>
            <button
              style={styles.smallBtn}
              onClick={() => {
                setOpen(false);
                onDismiss(rec.bestId);
              }}
            >
              Keep {activeStrategyName}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
