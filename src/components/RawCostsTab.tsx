"use client";

import { RAW_DRAFT_COSTS, RawCostRow } from "@/lib/data/rawDraftCosts";
import { points2025At } from "@/lib/data/points2025";
import { POS_COLOR, POSITIONS, Pos } from "@/lib/draftLogic";
import { styles } from "./styles";

function fmtPrice(v: number): string {
  return Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2).replace(/0$/, "")}`;
}

function fmtPts(v: number): string {
  return v.toFixed(1).replace(/\.0$/, "");
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
        being that whatever rank you pay for at the draft, that&apos;s roughly the season you should expect. Hover
        any row for the year-by-year price breakdown.
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
        {POSITIONS.map((pos) => (
          <PositionTable key={pos} pos={pos} rows={RAW_DRAFT_COSTS[pos] ?? []} />
        ))}
      </div>
    </div>
  );
}

function PositionTable({ pos, rows }: { pos: Pos; rows: RawCostRow[] }) {
  return (
    <div style={{ ...styles.panel, flex: "1 1 150px", minWidth: 150, padding: 10 }}>
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
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const pts = points2025At(pos, r.rank);
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
