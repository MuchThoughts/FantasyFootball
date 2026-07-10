"use client";

import { MarketRead, StrategyRecommendation, MIN_MARKET_SAMPLES } from "@/lib/draftLogic";
import { styles } from "./styles";

interface MarketReadPanelProps {
  read: MarketRead;
  recommendation: StrategyRecommendation | null;
  activeStrategyId: string;
  activeStrategyName: string;
  onSwitch: (id: string) => void;
}

// A switch is only suggested when the recommended strategy beats the active one by at
// least this much (in fraction-of-budget units) — below that the difference is noise.
const SWITCH_MARGIN = 0.02;

export function MarketReadPanel({ read, recommendation, activeStrategyId, activeStrategyName, onSwitch }: MarketReadPanelProps) {
  if (read.samples < MIN_MARKET_SAMPLES) return null;

  const rec = recommendation;
  const suggestSwitch = rec != null && rec.bestId !== activeStrategyId && rec.margin >= SWITCH_MARGIN;

  return (
    <div style={{ ...styles.panel, padding: "10px 12px" }}>
      <div style={{ ...styles.panelTitle, marginBottom: 6 }}>Market read · {read.samples} picks</div>

      {rec && rec.reasons.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
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
      ) : (
        <div style={{ fontSize: 11, color: "#8B92A0", marginBottom: 8 }}>
          Prices are tracking close to target so far — no strong signal.
        </div>
      )}

      {rec?.hint && <div style={{ fontSize: 11, color: "#E8A33D", marginBottom: 6 }}>{rec.hint}</div>}

      {suggestSwitch ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#EDEEF0" }}>
            Market favors <strong>{rec.bestName}</strong> over {activeStrategyName} (≈
            {Math.round(rec.margin * 100)}% of budget).
          </span>
          <button style={styles.primaryBtn} onClick={() => onSwitch(rec.bestId)}>
            Switch to {rec.bestName}
          </button>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: "#8B92A0" }}>
          {activeStrategyName} still fits this market — no switch recommended.
        </div>
      )}
    </div>
  );
}
