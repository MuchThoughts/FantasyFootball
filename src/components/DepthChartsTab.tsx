"use client";

import { useMemo, useState } from "react";
import { DEPTH_CHARTS, DepthChartEntry, TEAM_NAMES } from "@/lib/data/depthCharts";
import { Board, BoardRow, fmtMoney, POS_COLOR, tierColor } from "@/lib/draftLogic";
import { styles, chipActive } from "./styles";

interface DepthChartsTabProps {
  board: Board;
}

type PosFilter = "BOTH" | "RB" | "WR";

// A browsing reference, not a draft-action surface: every team's RB and WR
// order, as FantasyPros' depth chart has it, each name enriched with your own
// board data — Act price, tier, your rating — wherever it links to a player
// you're actually tracking. Camp bodies several names deep with no fantasy
// relevance show as plain grey text; there's nothing in the app to say about
// them, but the name is still worth having so you know who's ahead of whom.
export function DepthChartsTab({ board }: DepthChartsTabProps) {
  const [posFilter, setPosFilter] = useState<PosFilter>("BOTH");
  const [search, setSearch] = useState("");

  const rowByUid = useMemo(() => new Map(board.rows.map((r) => [r.id, r])), [board.rows]);

  const teams = useMemo(() => Object.keys(DEPTH_CHARTS).sort((a, b) => TEAM_NAMES[a].localeCompare(TEAM_NAMES[b])), []);

  const filteredTeams = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return teams;
    return teams.filter((code) => {
      if (code.toLowerCase().includes(s) || TEAM_NAMES[code].toLowerCase().includes(s)) return true;
      const chart = DEPTH_CHARTS[code];
      return [...chart.RB, ...chart.WR].some((e) => e.name.toLowerCase().includes(s));
    });
  }, [teams, search]);

  const positions: Exclude<PosFilter, "BOTH">[] = posFilter === "BOTH" ? ["RB", "WR"] : [posFilter];

  return (
    <div>
      <div style={{ fontSize: 11, color: "#8B92A0", marginBottom: 10, lineHeight: 1.5 }}>
        Every team&apos;s RB and WR depth chart, pulled from FantasyPros. Rows tied to a player you&apos;re tracking
        show his Act price, tier, and rating — the shading matches the Board: darker for Loved than Liked. Names in
        grey aren&apos;t in this league&apos;s player pool; there&apos;s nothing to price, but the depth order still
        tells you who&apos;s ahead of whom.
      </div>

      <input
        style={{ ...styles.input, marginBottom: 10 }}
        placeholder="Search a team or player…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div style={styles.chipRow}>
        {(["BOTH", "RB", "WR"] as PosFilter[]).map((p) => (
          <button
            key={p}
            style={posFilter === p ? { ...styles.chip, ...chipActive(p === "BOTH" ? "ALL" : p) } : styles.chip}
            onClick={() => setPosFilter(p)}
          >
            {p === "BOTH" ? "RB + WR" : p}
          </button>
        ))}
      </div>

      {filteredTeams.length === 0 ? (
        <div style={styles.emptyState}>No team or player matches that search.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 8 }}>
          {filteredTeams.map((code) => (
            <TeamCard key={code} code={code} positions={positions} rowByUid={rowByUid} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamCard({
  code,
  positions,
  rowByUid,
}: {
  code: string;
  positions: ("RB" | "WR")[];
  rowByUid: Map<string, BoardRow>;
}) {
  const chart = DEPTH_CHARTS[code];
  return (
    <div style={{ ...styles.playerCard, padding: "8px 10px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#EDEEF0", marginBottom: 6 }}>
        {TEAM_NAMES[code]} <span style={{ color: "#5B6270", fontWeight: 400, fontSize: 10 }}>{code}</span>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {positions.map((pos) => (
          <div key={pos} style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
              <span style={{ ...styles.posTagSm, background: POS_COLOR[pos] }}>{pos}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {chart[pos].map((e, i) => (
                <DepthRow key={e.name} entry={e} depth={i + 1} row={e.playerUid ? rowByUid.get(e.playerUid) : undefined} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DepthRow({ entry, depth, row }: { entry: DepthChartEntry; depth: number; row: BoardRow | undefined }) {
  const gone = row && (row.isDrafted || row.isKeeper);
  const tint =
    !row || gone
      ? undefined
      : row.interest === "love"
      ? "rgba(76, 175, 107, 0.38)"
      : row.interest === "like"
      ? "rgba(76, 175, 107, 0.14)"
      : row.interest === "dislike"
      ? "rgba(225, 82, 75, 0.14)"
      : undefined;

  return (
    <div
      title={row ? `${entry.name} — ${row.pos}${row.effRank ?? ""}${row.act != null ? `, Act ${fmtMoney(row.act)}` : ""}` : entry.name}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 3px",
        borderRadius: 3,
        background: tint,
        opacity: gone ? 0.45 : 1,
      }}
    >
      <span style={{ ...styles.tdMono, fontSize: 9.5, color: "#5B6270", width: 12, flexShrink: 0, alignSelf: "flex-start", paddingTop: 1 }}>
        {depth}
      </span>
      <span
        style={{
          fontSize: 11.5,
          color: row ? "#EDEEF0" : "#5B6270",
          fontStyle: row ? "normal" : "italic",
          textDecoration: gone ? "line-through" : "none",
          lineHeight: 1.25,
          // Wrap rather than truncate — this is a reference list, so a long
          // name losing its ending to an ellipsis is worse than a two-line row.
          flex: "1 1 auto",
          minWidth: 0,
        }}
      >
        {entry.name}
      </span>
      {row && (
        <span style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto", flexShrink: 0, alignSelf: "flex-start", paddingTop: 1 }}>
          {row.tier != null && (
            <span
              title={`Tier ${row.tier}`}
              style={{ width: 6, height: 6, borderRadius: "50%", background: tierColor(row.tier) }}
            />
          )}
          {row.mine && <span style={{ fontSize: 9, color: "#8FCB9E", fontWeight: 700 }}>you</span>}
          {row.act != null && (
            <span style={{ ...styles.tdMono, fontSize: 10, color: "#8B92A0" }}>{fmtMoney(row.act)}</span>
          )}
        </span>
      )}
    </div>
  );
}
