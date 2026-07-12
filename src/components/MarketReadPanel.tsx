"use client";

import { MarketRead, StrategyRecommendation, MIN_MARKET_SAMPLES } from "@/lib/draftLogic";
import { styles } from "./styles";

interface MarketReadPanelProps {
  read: MarketRead;
  recommendation: StrategyRecommendation | null;
}

// The raw market signals: how the room is paying vs. this league's historical
// targets. Strategy switch suggestions live in StrategyAdvisor, above this panel.
export function MarketReadPanel({ read, recommendation }: MarketReadPanelProps) {
  if (read.samples < MIN_MARKET_SAMPLES) return null;

  const rec = recommendation;

  return (
    <div style={{ ...styles.panel, padding: "10px 12px" }}>
      <div style={{ ...styles.panelTitle, marginBottom: 6 }}>Market read · {read.samples} picks</div>

      {rec && rec.reasons.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
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
        <div style={{ fontSize: 11, color: "#8B92A0" }}>
          Prices are tracking close to target so far — no strong signal.
        </div>
      )}

      {rec?.hint && <div style={{ fontSize: 11, color: "#E8A33D", marginTop: 6 }}>{rec.hint}</div>}
    </div>
  );
}
