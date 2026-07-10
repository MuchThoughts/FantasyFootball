"use client";

import { DrafterTeam } from "@/lib/data/drafters";
import { POS_COLOR, POSITIONS } from "@/lib/draftLogic";
import { styles } from "./styles";

type DrafterRow = DrafterTeam & { team: string };

interface InsightsTabProps {
  rows: DrafterRow[];
}

export function InsightsTab({ rows }: InsightsTabProps) {
  const timings = rows.map((d) => d.spendTiming).filter((v) => v != null) as number[];
  const meanT = timings.reduce((s, v) => s + v, 0) / (timings.length || 1);
  const sdT = Math.sqrt(timings.reduce((s, v) => s + (v - meanT) ** 2, 0) / (timings.length || 1)) || 1;

  return (
    <div>
      <div style={styles.emptyState}>
        Based on {rows[0]?.years === 2 ? "2024–2025" : "2025"} auction data from your league — trends and
        tendencies, not a log of who they bought.
      </div>
      <div style={styles.list}>
        {rows.map((d) => (
          <InsightCard key={d.team} d={d} meanTiming={meanT} sdTiming={sdT} />
        ))}
      </div>
    </div>
  );
}

function InsightCard({ d, meanTiming, sdTiming }: { d: DrafterRow; meanTiming: number; sdTiming: number }) {
  const isSean = d.owner === "Sean";

  const z = d.spendTiming != null ? (d.spendTiming - meanTiming) / sdTiming : 0;
  let timingLabel: string;
  let timingColor: string;
  if (z <= -0.75) {
    timingLabel = "Front-loads spending — buys their stars early in the draft";
    timingColor = "#E8A33D";
  } else if (z >= 0.75) {
    timingLabel = "Patient — holds budget and buys later than most";
    timingColor = "#5B9BD5";
  } else {
    timingLabel = "Even pace — spends steadily through the draft";
    timingColor = "#8B92A0";
  }

  let splashLabel: string;
  if (d.top3Share >= 55) {
    splashLabel = `Stars & scrubs — ${d.top3Share}% of their budget goes to just 3 players`;
  } else if (d.top3Share <= 35) {
    splashLabel = `Patient value — spreads budget evenly, rarely makes a big splash`;
  } else {
    splashLabel = `Moderate mix — a couple of stars, then fills out the roster with value`;
  }

  const posOverpay = d.posOverpay || {};
  const premiums = Object.entries(posOverpay)
    .filter(([, v]) => v >= 20)
    .sort((a, b) => b[1] - a[1]);
  const bargains = Object.entries(posOverpay)
    .filter(([, v]) => v <= -20)
    .sort((a, b) => a[1] - b[1]);

  return (
    <div style={{ ...styles.playerCard, borderColor: isSean ? "#4CAF6B" : "#2A2F38" }}>
      <div style={styles.playerRowTop}>
        <div style={styles.playerInfo}>
          <div style={styles.playerName}>
            {d.team} {isSean && <span style={styles.mineTag}>YOU</span>}
          </div>
          <div style={styles.playerMeta}>
            {d.owner ? d.owner + " · " : ""}
            {d.nPicks} picks tracked
          </div>
        </div>
        <div style={styles.priceCol}>
          <div style={styles.targetPrice}>
            {d.avgOverpayPct > 0 ? "overpays" : "underpays"} {Math.abs(d.avgOverpayPct)}% on average
          </div>
        </div>
      </div>
      <div style={styles.expandPanel}>
        <div style={{ fontSize: 12, color: timingColor, fontWeight: 600 }}>{timingLabel}</div>
        <div style={{ fontSize: 12, color: "#8B92A0" }}>{splashLabel}</div>

        {premiums.length > 0 && (
          <div style={{ fontSize: 12, color: "#E1524B" }}>
            Pays up at: {premiums.map(([p, v]) => `${p} (+${Math.round(v)}%)`).join(", ")}
          </div>
        )}
        {bargains.length > 0 && (
          <div style={{ fontSize: 12, color: "#4CAF6B" }}>
            Finds value at: {bargains.map(([p, v]) => `${p} (${Math.round(v)}%)`).join(", ")}
          </div>
        )}

        <div style={styles.allocRow}>
          {POSITIONS.map((p) => (
            <div key={p} style={styles.allocChip}>
              <span style={{ color: POS_COLOR[p] }}>{p}</span> {d.posSpend[p]}%
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#8B92A0" }}>
          {d.keepers2025} keeper{d.keepers2025 === 1 ? "" : "s"} entering 2025 · biggest single buy was{" "}
          {d.biggestBuyShare}% of their total spend
        </div>
      </div>
    </div>
  );
}
