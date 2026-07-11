"use client";

import { OffenseTeam } from "@/lib/data/offense";
import { OLINE_RANKINGS, OLINE_RANKINGS_SOURCE, OLINE_RANKINGS_URL } from "@/lib/data/lineRankings";
import { styles } from "./styles";

type OffenseRow = OffenseTeam & { team: string; diff25: number | null; diff24: number | null };

interface OffensesTabProps {
  rows: OffenseRow[];
  sort: string;
  setSort: (key: string) => void;
}

// A 1-to-N ranked list of team names, rendered as a two-column grid with a
// rank badge on each row. Used for the offensive line ranking below the table.
function RankedList({
  title,
  teams,
  source,
  sourceUrl,
}: {
  title: string;
  teams: string[];
  source: string;
  sourceUrl: string;
}) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={styles.panelTitle}>{title}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 4,
        }}
      >
        {teams.map((team, i) => {
          const rank = i + 1;
          // Green at the top, red at the bottom, muted through the middle.
          const color = rank <= 8 ? "#4CAF6B" : rank <= 16 ? "#8FCB9E" : rank <= 24 ? "#8B92A0" : "#E1524B";
          return (
            <div
              key={team}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 8px",
                background: "#14171C",
                border: "1px solid #2A2F38",
                borderRadius: 6,
              }}
            >
              <span
                style={{
                  ...styles.tdMono,
                  fontSize: 11,
                  color,
                  minWidth: 20,
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                {rank}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>{team}</span>
            </div>
          );
        })}
      </div>
      <div style={{ ...styles.emptyState, marginTop: 8 }}>
        Source:{" "}
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#5B9BD5" }}>
          {source}
        </a>
      </div>
    </div>
  );
}

export function OffensesTab({ rows, sort, setSort }: OffensesTabProps) {
  const diffColor = (v: number | null) => {
    if (v == null) return "#8B92A0";
    return v > 0 ? "#4CAF6B" : v < 0 ? "#E1524B" : "#8B92A0";
  };
  const cols: [string, string][] = [
    ["ppg25", "PPG '25"],
    ["opp25", "Allowed '25"],
    ["diff25", "Diff '25"],
    ["ppg24", "PPG '24"],
    ["opp24", "Allowed '24"],
    ["diff24", "Diff '24"],
  ];
  return (
    <div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, ...styles.thSticky2, left: 0, minWidth: 110 }}>Team</th>
              {cols.map(([k, label]) => (
                <th
                  key={k}
                  style={{ ...styles.th, cursor: "pointer", color: sort === k ? "#EDEEF0" : "#8B92A0" }}
                  onClick={() => setSort(k)}
                >
                  {label}
                  {sort === k ? " ▾" : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.team}>
                <td style={{ ...styles.td, ...styles.tdSticky2, left: 0, fontWeight: 600 }}>{r.team}</td>
                <td style={{ ...styles.td, ...styles.tdMono }}>{r.ppg25 != null ? r.ppg25.toFixed(1) : "—"}</td>
                <td style={{ ...styles.td, ...styles.tdMono }}>{r.opp25 != null ? r.opp25.toFixed(1) : "—"}</td>
                <td style={{ ...styles.td, ...styles.tdMono, color: diffColor(r.diff25) }}>
                  {r.diff25 != null ? (r.diff25 > 0 ? "+" : "") + r.diff25.toFixed(1) : "—"}
                </td>
                <td style={{ ...styles.td, ...styles.tdMono }}>{r.ppg24 != null ? r.ppg24.toFixed(1) : "—"}</td>
                <td style={{ ...styles.td, ...styles.tdMono }}>{r.opp24 != null ? r.opp24.toFixed(1) : "—"}</td>
                <td style={{ ...styles.td, ...styles.tdMono, color: diffColor(r.diff24) }}>
                  {r.diff24 != null ? (r.diff24 > 0 ? "+" : "") + r.diff24.toFixed(1) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ ...styles.emptyState, marginTop: 10 }}>
        PPG = points scored per game by that offense. Allowed = points per game given up by that team&apos;s
        defense. Diff = PPG minus Allowed (positive means the team outscores what it gives up). Tap a column header
        to sort. Dashes mean that figure wasn&apos;t available for that team/season.
      </div>

      <RankedList
        title="Offensive Line Rankings — 2026"
        teams={OLINE_RANKINGS}
        source={OLINE_RANKINGS_SOURCE}
        sourceUrl={OLINE_RANKINGS_URL}
      />
    </div>
  );
}
