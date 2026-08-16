"use client";

import { RAW_DRAFT_COSTS, RawCostRow } from "@/lib/data/rawDraftCosts";
import { points2025At } from "@/lib/data/points2025";
import { POS_COLOR, POSITIONS, Pos } from "@/lib/draftLogic";
import { parAt, replacementRankFor, SPEND_CURVES, VERDICT_META } from "@/lib/spendCurve";
import { styles } from "./styles";

function fmtPrice(v: number): string {
  return Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2).replace(/0$/, "")}`;
}

function fmtPts(v: number): string {
  return v.toFixed(1).replace(/\.0$/, "");
}

// Points-above-replacement per dollar. At or below replacement there is no edge
// to buy — and dividing a negative by a $1 price throws out wild numbers — so
// those slots read as a dash rather than a false precision.
function fmtParPerDollar(par: number | null, price: number): string {
  if (par == null || price <= 0 || par <= 0) return "—";
  const v = par / price;
  return v >= 100 ? String(Math.round(v)) : v.toFixed(1);
}

// Hover breakdown: each year's raw figure, flagging keeper slots, plus which
// method produced the final price.
function rowTitle(row: RawCostRow): string {
  const yr = (y: number | null, k: boolean) => (y == null ? "—" : `$${y}${k ? " (keeper — skipped)" : ""}`);
  const method =
    row.method === "weighted"
      ? "weighted 70/25/5"
      : `most recent real auction price (${row.method.replace("latest", "")}), unweighted`;
  return `2025 ${yr(row.y2025, row.k2025)} · 2024 ${yr(row.y2024, row.k2024)} · 2023 ${yr(row.y2023, row.k2023)} — ${method}`;
}

export function RawCostsTab() {
  return (
    <div>
      <div style={styles.emptyState}>
        What each positional price slot has actually cost in your league&apos;s last three auctions: 2025 weighted
        70%, 2024 at 25%, 2023 at 5%. When a keeper occupied a slot in a year (their price isn&apos;t a market
        price), that year is ignored and the slot shows the most recent real auction price instead — those rows are
        marked †. <b>Pts</b> is what that rank actually scored in 2025 (FantasyPros season total) — the assumption
        being that whatever rank you pay for at the draft, that&apos;s roughly the season you should expect.{" "}
        <b>PAR/$</b> is what actually decides a bid: points <i>above replacement</i> per dollar — this rank&apos;s
        points minus the last startable player&apos;s, divided by the price. Raw points per dollar always flatters
        $1 players; measuring from replacement asks the real question, how much better than free is this, per
        dollar. Slots at or past replacement show a dash — there&apos;s no edge left to buy. Hover any row for the
        year-by-year price breakdown.
      </div>
      <SpendSummary />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
        {POSITIONS.map((pos) => (
          <PositionTable key={pos} pos={pos} rows={RAW_DRAFT_COSTS[pos] ?? []} />
        ))}
      </div>
    </div>
  );
}

// Where spending up actually pays, per position. Everything here is derived from
// the same two tables below (price by rank, 2025 points by rank) — see
// lib/spendCurve.ts for the replacement-level and slope definitions.
function SpendSummary() {
  const num = (v: number | null) => (v == null ? "—" : v.toFixed(1));
  return (
    <div style={{ ...styles.panel, padding: 12, marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, color: "#8B92A0", marginBottom: 2 }}>
        WHERE IT&apos;S WORTH SPENDING UP
      </div>
      <div style={{ fontSize: 11, color: "#5B6270", marginBottom: 8, lineHeight: 1.5 }}>
        Points per dollar always flatters cheap players, so this measures two better things.{" "}
        <b style={{ color: "#8B92A0" }}>Edge</b> is what the #1 player adds over the last startable one at that
        position — the size of the prize. <b style={{ color: "#8B92A0" }}>Top $</b> and{" "}
        <b style={{ color: "#8B92A0" }}>Late $</b> are points gained per <i>extra</i> dollar when you move up within
        the top tier vs. up from replacement. Whichever is bigger is where your money works harder.
      </div>

      <div style={styles.tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ color: "#5B6270", fontSize: 10 }}>
              <th style={{ textAlign: "left", fontWeight: 500, paddingBottom: 4 }}>Pos</th>
              <th style={{ textAlign: "left", fontWeight: 500, paddingBottom: 4 }}>Verdict</th>
              <th style={{ textAlign: "right", fontWeight: 500, paddingBottom: 4 }} title="Points the #1 player adds over the last startable one">
                Edge
              </th>
              <th style={{ textAlign: "right", fontWeight: 500, paddingBottom: 4 }} title="Points per extra dollar moving up into the #1 slot">
                Top $
              </th>
              <th style={{ textAlign: "right", fontWeight: 500, paddingBottom: 4 }} title="Points per extra dollar moving up from replacement">
                Late $
              </th>
              <th style={{ textAlign: "left", fontWeight: 500, paddingBottom: 4, paddingLeft: 10 }} title="Biggest one-rank scoring drop among startable slots — buy on the high side">
                Biggest cliff
              </th>
            </tr>
          </thead>
          <tbody>
            {SPEND_CURVES.map((c) => {
              const meta = VERDICT_META[c.verdict];
              const topBest = c.topSlope != null && c.lateSlope != null && c.topSlope > c.lateSlope;
              const cell = { padding: "3px 0", borderBottom: "1px solid #20242C", fontFamily: "'IBM Plex Mono', monospace" };
              return (
                <tr key={c.pos} title={meta.blurb}>
                  <td style={{ ...cell, textAlign: "left" }}>
                    <span style={{ ...styles.posTagSm, background: POS_COLOR[c.pos] }}>{c.pos}</span>
                  </td>
                  <td style={{ ...cell, textAlign: "left", fontWeight: 700, fontSize: 10, color: meta.color, paddingRight: 8 }}>
                    {meta.label}
                  </td>
                  <td style={{ ...cell, textAlign: "right", color: "#EDEEF0" }}>+{c.eliteEdge.toFixed(0)}</td>
                  <td style={{ ...cell, textAlign: "right", color: topBest ? "#4CAF6B" : "#8B92A0", fontWeight: topBest ? 700 : 400 }}>
                    {num(c.topSlope)}
                  </td>
                  <td style={{ ...cell, textAlign: "right", color: !topBest ? "#4CAF6B" : "#8B92A0", fontWeight: !topBest ? 700 : 400 }}>
                    {num(c.lateSlope)}
                  </td>
                  <td style={{ ...cell, textAlign: "left", paddingLeft: 10, color: "#C6CAD2", fontSize: 11 }}>
                    {c.cliff ? (
                      <>
                        {c.pos}
                        {c.cliff.from}→{c.pos}
                        {c.cliff.to}{" "}
                        <span style={{ color: "#E1524B" }}>−{c.cliff.drop.toFixed(0)}</span>{" "}
                        <span style={{ color: "#5B6270" }}>pts, buy at ${c.cliff.price}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 11, color: "#5B6270", marginTop: 8, lineHeight: 1.5 }}>
        Read it as the size of the prize (Edge) against the price of chasing it (Top $ vs Late $): a big edge with a
        weak Top $ means the position matters but the premium doesn&apos;t. One caveat — these are 2025{" "}
        <i>finishes</i>, so they show what each rank was worth, not who you can identify on draft day. Treat them as
        the prize on offer and discount by your confidence; being wrong at the cheap end costs $12 instead of $60.
      </div>
    </div>
  );
}

function PositionTable({ pos, rows }: { pos: Pos; rows: RawCostRow[] }) {
  return (
    <div style={{ ...styles.panel, flex: "1 1 172px", minWidth: 172, padding: 10 }}>
      <div style={{ marginBottom: 6 }}>
        <span style={{ ...styles.posTagSm, background: POS_COLOR[pos] }}>{pos}</span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ color: "#5B6270", fontSize: 10 }}>
            <th style={{ textAlign: "left", fontWeight: 500, paddingBottom: 4 }}>Pick</th>
            <th style={{ textAlign: "right", fontWeight: 500, paddingBottom: 4 }}>Price</th>
            <th style={{ textAlign: "right", fontWeight: 500, paddingBottom: 4 }} title="2025 season-ending FPTS for this rank">
              Pts
            </th>
            <th
              style={{ textAlign: "right", fontWeight: 500, paddingBottom: 4 }}
              title={`Points above replacement per dollar: (this rank's 2025 points − ${pos}${replacementRankFor(pos) ?? "?"}'s) ÷ price. A dash means this slot is at or past replacement.`}
            >
              PAR/$
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const pts = points2025At(pos, r.rank);
            const par = parAt(pos, r.rank);
            return (
              <tr key={r.rank} title={rowTitle(r)} style={{ cursor: "help" }}>
                <td
                  style={{
                    textAlign: "left",
                    padding: "2px 0",
                    borderBottom: "1px solid #20242C",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    color: "#8B92A0",
                  }}
                >
                  {pos}
                  {r.rank}
                  {r.method !== "weighted" && (
                    <span style={{ color: "#E8A33D" }} title="A keeper (or missing year) broke the 3-year blend — showing the most recent real auction price">
                      †
                    </span>
                  )}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "2px 0",
                    borderBottom: "1px solid #20242C",
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: "#EDEEF0",
                  }}
                >
                  {fmtPrice(r.price)}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "2px 0",
                    borderBottom: "1px solid #20242C",
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: "#8B92A0",
                    fontSize: 11,
                  }}
                >
                  {pts != null ? fmtPts(pts) : "—"}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "2px 0",
                    borderBottom: "1px solid #20242C",
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: par != null && par > 0 ? "#4CAF6B" : "#4A5160",
                    fontSize: 11,
                  }}
                >
                  {fmtParPerDollar(par, r.price)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
