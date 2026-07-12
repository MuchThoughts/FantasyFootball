"use client";

import { LEAGUE_AVG, OWNER_INSIGHTS, OwnerInsight } from "@/lib/data/drafters";
import { isExpectedKeeper, POS_COLOR, POSITIONS, uid } from "@/lib/draftLogic";
import { styles } from "./styles";

interface InsightsTabProps {
  // Per-player override map: uid -> expected-keeper boolean. Absent = use default.
  keeperPicks: Record<string, boolean>;
  // Auction target price per player uid, from the board (drives EV = target − cost).
  targetByUid: Map<string, number>;
  onToggleKeeper: (playerUid: string, next: boolean) => void;
}

export function InsightsTab({ keeperPicks, targetByUid, onToggleKeeper }: InsightsTabProps) {
  return (
    <div>
      <div style={styles.emptyState}>
        Built from your league&apos;s 2023–2025 auction results and the official keeper sheet. Keeper costs shown
        are 2026 prices (last salary + $5, undrafted = $10); a player can only be kept two years running. Keeper
        values are judged against current 2026 rankings — target is your league&apos;s 3-yr price at the
        player&apos;s 2026 positional rank, so trades, injuries, and role changes are priced in. Check the two you
        think each owner will keep to drive the pale-orange &ldquo;likely gone&rdquo; highlight on the board.
      </div>
      <LeagueBaseline />
      <div style={styles.list}>
        {OWNER_INSIGHTS.map((d) => (
          <InsightCard key={d.owner} d={d} keeperPicks={keeperPicks} targetByUid={targetByUid} onToggleKeeper={onToggleKeeper} />
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

function InsightCard({
  d,
  keeperPicks,
  targetByUid,
  onToggleKeeper,
}: {
  d: OwnerInsight;
  keeperPicks: Record<string, boolean>;
  targetByUid: Map<string, number>;
  onToggleKeeper: (playerUid: string, next: boolean) => void;
}) {
  const isSean = d.owner === "Sean";

  // Rank this owner's keeper options by expected value (target − keeper cost) and
  // show the best 4; that's where their two keeps almost certainly come from.
  const ranked = d.keeperOptions
    .map((k) => {
      const id = uid(k.player);
      const target = targetByUid.get(id) ?? null;
      return { ...k, id, target, ev: target != null ? target - k.cost : null };
    })
    .sort((a, b) => (b.ev ?? -Infinity) - (a.ev ?? -Infinity));
  const topKeepers = ranked.slice(0, 4);
  const selectedCount = ranked.filter((k) => isExpectedKeeper(k.id, keeperPicks)).length;

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
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: "#5B9BD5" }}>
              2026 KEEPER WATCH <span style={{ color: "#5B6270", fontWeight: 400 }}>· kept {d.keeperHistory}</span>
            </span>
            <span style={{ fontSize: 10, color: selectedCount === 2 ? "#8FCB9E" : "#E8A33D" }}>
              {selectedCount}/2 picked
            </span>
          </div>
          <div style={{ fontSize: 10, color: "#5B6270", marginBottom: 6 }}>
            Top 4 by value (target − keeper cost). Check the two you expect {isSean ? "to keep" : `${d.owner} to keep`}{" "}
            — checked players turn pale orange on the board.
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ color: "#5B6270", fontSize: 10, textAlign: "right" }}>
                <th style={{ width: 22 }} />
                <th style={{ textAlign: "left", fontWeight: 500, paddingBottom: 3 }}>Player</th>
                <th style={{ fontWeight: 500, paddingBottom: 3 }}>Keeper</th>
                <th style={{ fontWeight: 500, paddingBottom: 3 }}>Target</th>
                <th style={{ fontWeight: 500, paddingBottom: 3, paddingLeft: 8 }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {topKeepers.map((k) => {
                const checked = isExpectedKeeper(k.id, keeperPicks);
                const evColor = k.ev == null ? "#5B6270" : k.ev >= 0 ? "#4CAF6B" : "#E1524B";
                return (
                  <tr
                    key={k.player}
                    title={k.note}
                    onClick={() => onToggleKeeper(k.id, !checked)}
                    style={{
                      cursor: "pointer",
                      background: checked ? "rgba(232, 163, 61, 0.16)" : "transparent",
                    }}
                  >
                    <td style={{ textAlign: "center", padding: "3px 0" }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onToggleKeeper(k.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: "pointer", accentColor: "#E8A33D" }}
                      />
                    </td>
                    <td style={{ textAlign: "left", padding: "3px 4px", color: "#EDEEF0" }}>
                      {k.player}{" "}
                      <span style={{ color: (POS_COLOR as Record<string, string>)[k.pos] ?? "#8B92A0", fontSize: 10 }}>
                        {k.pos}
                      </span>
                      {k.likely && (
                        <span style={{ color: "#E8A33D", fontSize: 10 }} title="Our default guess">
                          {" "}
                          ★
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: "#C6CAD2" }}>
                      ${k.cost}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: "#C6CAD2" }}>
                      {k.target != null ? `$${k.target}` : "—"}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        paddingLeft: 8,
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontWeight: 600,
                        color: evColor,
                      }}
                    >
                      {k.ev == null ? "—" : `${k.ev >= 0 ? "+" : "−"}$${Math.abs(k.ev)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ fontSize: 11, color: "#C6CAD2", marginTop: 8, fontStyle: "italic" }}>{d.keeperOutlook}</div>
        </div>
      </div>
    </div>
  );
}
