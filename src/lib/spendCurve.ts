import { RAW_DRAFT_COSTS } from "./data/rawDraftCosts";
import { points2025At } from "./data/points2025";
import { Pos, POSITIONS } from "./draftLogic";

/*
 * Where is it worth spending up?
 *
 * Points-per-dollar on its own always flatters the cheap end — a $1 player who
 * scores 130 beats every stud on that ratio, but you can't start sixteen of him.
 * Two corrections make the number decision-grade:
 *
 *  1. Measure against REPLACEMENT, not zero. What a player is really worth is
 *     the points he adds over the guy you could have had for ~$1 at that
 *     position, so a position's value is the gap above its last startable slot.
 *  2. Compare the SLOPE between two slots, not the ratio at one. "Is the top
 *     worth it" is Δpoints ÷ Δprice between the tiers you're choosing between.
 *
 * Replacement ranks below assume this league: 12 teams starting 2 QB, 2 RB,
 * 2 WR, 1 TE, 2 FLEX. The flex is assumed to absorb ~12 RB, ~10 WR and ~2 TE,
 * so RB/WR replacement sits deeper than their nominal starter counts.
 */
export const REPLACEMENT_RANK: Record<Pos, number> = { QB: 24, RB: 36, WR: 34, TE: 14, DEF: 12 };

// Below this spread there's nothing to decide — the whole position costs the same.
const FLAT_POSITION_SPREAD = 5;
// How much better one slope must be than the other before we call it.
const DECISIVE = 1.15;

export type Verdict = "spend-up" | "cheap-end" | "flat" | "punt";

export interface SpendCurve {
  pos: Pos;
  replacementRank: number;
  replacementPrice: number;
  /** Points the rank-1 player adds over the last startable one — the size of the prize. */
  eliteEdge: number;
  elitePrice: number;
  /** Δpoints per extra dollar moving from the mid tier up to rank 1. */
  topSlope: number | null;
  /** Δpoints per extra dollar moving from replacement up to the late tier. */
  lateSlope: number | null;
  topFrom: number;
  lateFrom: number;
  /** Biggest single-rank scoring drop inside the startable range. */
  cliff: { from: number; to: number; drop: number; price: number } | null;
  verdict: Verdict;
}

function at(pos: Pos, rank: number): { price: number; pts: number } | null {
  const row = (RAW_DRAFT_COSTS[pos] ?? []).find((r) => r.rank === rank);
  const pts = points2025At(pos, rank);
  return row && pts != null ? { price: row.price, pts } : null;
}

// Slope between two ranks: points gained per extra dollar spent going from the
// cheaper rank up to the dearer one. Null when the two cost the same.
function slope(pos: Pos, better: number, worse: number): number | null {
  const a = at(pos, better);
  const b = at(pos, worse);
  if (!a || !b) return null;
  const dPrice = a.price - b.price;
  if (dPrice <= 0.5) return null;
  return (a.pts - b.pts) / dPrice;
}

function computeOne(pos: Pos): SpendCurve | null {
  const rows = RAW_DRAFT_COSTS[pos] ?? [];
  if (rows.length === 0) return null;
  // Shallow positions (DEF) may not price as deep as the nominal replacement
  // slot; fall back to the deepest rank we actually have.
  const deepest = rows[rows.length - 1].rank;
  const repl = Math.min(REPLACEMENT_RANK[pos], deepest);
  const elite = at(pos, 1);
  const base = at(pos, repl);
  if (!elite || !base) return null;

  // Tier anchors scale with how deep the position starts, so TE isn't judged on
  // the same rank numbers as WR.
  const mid = Math.max(2, Math.round(repl / 4));
  const late = Math.max(mid + 1, Math.round(repl / 2));

  const topSlope = slope(pos, 1, mid);
  const lateSlope = slope(pos, late, repl);

  // Biggest one-rank scoring drop among startable slots.
  let cliff: SpendCurve["cliff"] = null;
  for (let r = 1; r < repl; r++) {
    const a = at(pos, r);
    const b = at(pos, r + 1);
    if (!a || !b) continue;
    const drop = a.pts - b.pts;
    if (!cliff || drop > cliff.drop) cliff = { from: r, to: r + 1, drop, price: a.price };
  }

  const spread = elite.price - base.price;
  let verdict: Verdict;
  if (spread < FLAT_POSITION_SPREAD) verdict = "punt";
  else if (topSlope == null || lateSlope == null) verdict = "flat";
  else if (topSlope >= lateSlope * DECISIVE) verdict = "spend-up";
  else if (lateSlope >= topSlope * DECISIVE) verdict = "cheap-end";
  else verdict = "flat";

  return {
    pos,
    replacementRank: repl,
    replacementPrice: base.price,
    eliteEdge: elite.pts - base.pts,
    elitePrice: elite.price,
    topSlope,
    lateSlope,
    topFrom: mid,
    lateFrom: late,
    cliff,
    verdict,
  };
}

export const SPEND_CURVES: SpendCurve[] = POSITIONS.map(computeOne).filter((c): c is SpendCurve => c != null);

export const VERDICT_META: Record<Verdict, { label: string; color: string; blurb: string }> = {
  "spend-up": {
    label: "SPEND UP",
    color: "#4CAF6B",
    blurb: "dollars at the top buy more points than dollars at the bottom",
  },
  "cheap-end": {
    label: "SHOP CHEAP",
    color: "#E8A33D",
    blurb: "the late tier converts dollars better — the premium at the top is dead weight",
  },
  flat: { label: "PAY MARKET", color: "#8B92A0", blurb: "the curve converts about the same either way" },
  punt: { label: "PUNT", color: "#5B9BD5", blurb: "no real price spread here — take the minimum" },
};
