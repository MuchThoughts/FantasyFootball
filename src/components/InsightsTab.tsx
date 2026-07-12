"use client";

import { LEAGUE_AVG, OWNER_INSIGHTS, OwnerInsight } from "@/lib/data/drafters";
import { POS_COLOR, POSITIONS } from "@/lib/draftLogic";
import { styles } from "./styles";

export function InsightsTab() {
  return (
    <div>
      <div style={styles.emptyState}>
        Built from your league&apos;s 2023–2025 auction results and the official keeper sheet. Keeper costs shown
        are 2026 prices (last salary + $5, undrafted = $10); a player can only be kept two years running. Keeper
        values are judged against current 2026 rankings — &ldquo;market&rdquo; is your league&apos;s 3-yr price at
        the player&apos;s 2026 positional rank, so trades, injuries, and role changes are priced in.
      </div>
      <LeagueBaseline />
      <div style={styles.list}>
        {OWNER_INSIGHTS.map((d) => (
          <InsightCard key={d.owner} d={d} />
        ))}
      </div>
    </div>
  );
}

function LeagueBaseline() {
  return (
    <div style={{ ...styles.playerCard, marginBottom: 6 }}>
      <div style={{ fontSize: 11, color: "#8B92A0", marginBottom: 6, fontWeight: 600, letterSpacing: 0.4 }}>
        LEAGUE BASELINE (3-YR AVG)
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "#EDEEF0" }}>
        <span>
          Picks to $120: <b>{LEAGUE_AVG.picksTo120}</b>
        </span>
        <span>
          $1 fliers/yr: <b>{LEAGUE_AVG.onesPerYear}</b>
        </span>
        <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {POSITIONS.map((p) => (
            <span key={p}>
              <span style={{ color: POS_COLOR[p] }}>{p}</span> {LEAGUE_AVG.posShare[p]}%
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ minWidth: 86 }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 600, color: "#EDEEF0" }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: "#8B92A0" }}>{label}</div>
      {hint && <div style={{ fontSize: 10, color: "#5B6270" }}>{hint}</div>}
    </div>
  );
}

function InsightCard({ d }: { d: OwnerInsight }) {
  const isSean = d.owner === "Sean";
  const likely = d.keeperOptions.filter((k) => k.likely);
  const others = d.keeperOptions.filter((k) => !k.likely);

  return (
    <div style={{ ...styles.playerCard, borderColor: isSean ? "#4CAF6B" : "#2A2F38" }}>
      <div style={styles.playerRowTop}>
        <div style={styles.playerInfo}>
          <div style={styles.playerName}>
            {d.owner} {isSean && <span style={styles.mineTag}>YOU</span>}
          </div>
          <div style={styles.playerMeta}>
            {d.team}
            {d.teamHistory ? ` · ${d.teamHistory}` : ""}
          </div>
        </div>
        <div style={styles.priceCol}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#E8A33D" }}>{d.archetype}</div>
          <div style={{ fontSize: 10, color: "#8B92A0" }}>
            max ever: {d.maxEver.player} ${d.maxEver.price} (&rsquo;{String(d.maxEver.year).slice(2)})
          </div>
        </div>
      </div>

      <div style={styles.expandPanel}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <StatTile
            label="picks to $120"
            value={d.picksTo120.toFixed(1)}
            hint={d.picksTo120 <= 3.2 ? "top-heavy" : d.picksTo120 >= 3.9 ? "spreads it" : "typical"}
          />
          <StatTile label="$1 fliers / yr" value={d.onesPerYear.toFixed(1)} hint={`league ${LEAGUE_AVG.onesPerYear}`} />
          <StatTile label="top-3 budget share" value={`${d.top3Share}%`} />
          <StatTile label="spent by nom. rd 4" value={`${d.earlyShare}%`} />
        </div>

        <div style={styles.allocRow}>
          {POSITIONS.map((p) => {
            const delta = d.posDelta[p] ?? 0;
            const big = Math.abs(delta) >= 3;
            const deltaColor = !big ? "#5B6270" : delta > 0 ? "#E1524B" : "#4CAF6B";
            return (
              <div key={p} style={styles.allocChip}>
                <span style={{ color: POS_COLOR[p] }}>{p}</span> {d.posShare[p]}%{" "}
                <span style={{ color: deltaColor, fontSize: 10 }}>
                  {delta > 0 ? "+" : ""}
                  {delta}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 10, color: "#5B6270" }}>
          Share of budget by position · red = pays over league average, green = leaves the position cheap
        </div>

        <div>
          {d.reads.map((r, i) => (
            <div key={i} style={{ fontSize: 12, color: "#C6CAD2", marginBottom: 4, display: "flex", gap: 6 }}>
              <span style={{ color: "#E8A33D", flexShrink: 0 }}>▸</span>
              <span>{r}</span>
            </div>
          ))}
        </div>

        {d.loyalty.length > 0 && (
          <div style={{ fontSize: 11, color: "#8B92A0" }}>
            Comes back to: <span style={{ color: "#C6CAD2" }}>{d.loyalty.join(", ")}</span>
          </div>
        )}

        <div style={{ borderTop: "1px solid #2A2F38", paddingTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#5B9BD5", marginBottom: 5 }}>
            2026 KEEPER WATCH <span style={{ color: "#5B6270", fontWeight: 400 }}>· kept {d.keeperHistory}</span>
          </div>
          {likely.map((k) => (
            <div key={k.player} style={{ fontSize: 12, color: "#EDEEF0", marginBottom: 3 }}>
              ★ {k.player}{" "}
              <span style={{ color: (POS_COLOR as Record<string, string>)[k.pos] ?? "#8B92A0" }}>{k.pos}</span>{" "}
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>${k.cost}</span>
              <span style={{ color: "#8B92A0" }}> — {k.note}</span>
            </div>
          ))}
          {others.length > 0 && (
            <div style={{ fontSize: 11, color: "#8B92A0", marginTop: 4 }}>
              Also holds:{" "}
              {others.map((k, i) => (
                <span key={k.player} title={k.note}>
                  {i > 0 ? " · " : ""}
                  {k.player} <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>${k.cost}</span>
                </span>
              ))}
            </div>
          )}
          <div style={{ fontSize: 11, color: "#C6CAD2", marginTop: 6, fontStyle: "italic" }}>{d.keeperOutlook}</div>
        </div>
      </div>
    </div>
  );
}
