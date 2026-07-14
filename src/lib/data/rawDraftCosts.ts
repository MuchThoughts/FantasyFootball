import { Player } from "./players";
import { uid } from "../draftLogic";

// Raw league draft costs by positional price rank, computed from the actual
// 2023-2025 auction results (scratchpad drafts.json).
//
// For each position, every year's rostered players are sorted by salary to form
// that year's price ladder (keepers occupy ranks at their keeper cost). A rank's
// price is the 70/25/5 weighted average of its 2025/2024/2023 salaries when all
// three are real auction prices; if a keeper (or missing depth) occupies the slot
// in any year, the price is instead the most recent real auction price, unweighted.

export interface RawCostRow {
  rank: number;
  price: number;
  // "weighted" = 70/25/5 blend; "latest2025"/"latest2024"/"latest2023" = that
  // year's real price, used because a keeper/missing slot broke the blend.
  method: string;
  y2025: number | null;
  y2024: number | null;
  y2023: number | null;
  k2025: boolean;
  k2024: boolean;
  k2023: boolean;
}

// Simplified (rounded) actual draft cost for a positional rank — what the
// league has historically paid for the Nth-priciest player at that position.
export function rawCostAt(pos: string, rank: number | null | undefined): number | null {
  if (rank == null) return null;
  const rows = RAW_DRAFT_COSTS[pos];
  if (!rows || rows.length === 0) return null;
  const row = rows.find((r) => r.rank === rank) ?? rows[rows.length - 1];
  return Math.round(row.price);
}

// Projected auction cost for every player: their positional rank in the given
// (nobody-kept) ranking mapped onto the raw draft-cost ladder. This is what a
// player "would go for" this year — e.g. the QB15 costs whatever your league's
// QB15 has cost — the basis for the Insights keeper-value column.
export function rawCostTargets(players: Player[]): Map<string, number> {
  const posCounts: Record<string, number> = {};
  const m = new Map<string, number>();
  for (const p of [...players].sort((a, b) => a.adp - b.adp)) {
    posCounts[p.pos] = (posCounts[p.pos] || 0) + 1;
    m.set(uid(p.name), rawCostAt(p.pos, posCounts[p.pos]) ?? 1);
  }
  return m;
}

export const RAW_DRAFT_COSTS: Record<string, RawCostRow[]> = {
  QB: [
    { rank: 1, price: 61.85, method: "weighted", y2025: 62, y2024: 62, y2023: 59, k2025: false, k2024: false, k2023: false },
    { rank: 2, price: 61.6, method: "weighted", y2025: 62, y2024: 61, y2023: 59, k2025: false, k2024: false, k2023: false },
    { rank: 3, price: 54.6, method: "weighted", y2025: 52, y2024: 61, y2023: 59, k2025: false, k2024: false, k2023: false },
    { rank: 4, price: 51.75, method: "weighted", y2025: 49, y2024: 59, y2023: 54, k2025: false, k2024: false, k2023: false },
    { rank: 5, price: 49.0, method: "latest2024", y2025: 42, y2024: 49, y2023: 51, k2025: true, k2024: false, k2023: false },
    { rank: 6, price: 41.45, method: "weighted", y2025: 41, y2024: 42, y2023: 45, k2025: false, k2024: false, k2023: false },
    { rank: 7, price: 34.3, method: "weighted", y2025: 33, y2024: 37, y2023: 39, k2025: false, k2024: false, k2023: false },
    { rank: 8, price: 28.4, method: "weighted", y2025: 26, y2024: 33, y2023: 39, k2025: false, k2024: false, k2023: false },
    { rank: 9, price: 26.65, method: "weighted", y2025: 25, y2024: 29, y2023: 38, k2025: false, k2024: false, k2023: false },
    { rank: 10, price: 24.0, method: "latest2025", y2025: 24, y2024: 29, y2023: 36, k2025: false, k2024: true, k2023: false },
    { rank: 11, price: 24.35, method: "weighted", y2025: 23, y2024: 27, y2023: 30, k2025: false, k2024: false, k2023: false },
    { rank: 12, price: 22.75, method: "weighted", y2025: 22, y2024: 24, y2023: 27, k2025: false, k2024: false, k2023: false },
    { rank: 13, price: 22.0, method: "latest2024", y2025: 22, y2024: 22, y2023: 27, k2025: true, k2024: false, k2023: false },
    { rank: 14, price: 20.7, method: "weighted", y2025: 20, y2024: 22, y2023: 24, k2025: false, k2024: false, k2023: false },
    { rank: 15, price: 19.75, method: "weighted", y2025: 19, y2024: 21, y2023: 24, k2025: false, k2024: false, k2023: false },
    { rank: 16, price: 15.7, method: "weighted", y2025: 14, y2024: 20, y2023: 18, k2025: false, k2024: false, k2023: false },
    { rank: 17, price: 20.0, method: "latest2024", y2025: 13, y2024: 20, y2023: 14, k2025: true, k2024: false, k2023: false },
    { rank: 18, price: 12.75, method: "weighted", y2025: 11, y2024: 18, y2023: 11, k2025: false, k2024: false, k2023: false },
    { rank: 19, price: 11.8, method: "weighted", y2025: 10, y2024: 17, y2023: 11, k2025: false, k2024: false, k2023: false },
    { rank: 20, price: 10.0, method: "latest2025", y2025: 10, y2024: 16, y2023: 8, k2025: false, k2024: true, k2023: false },
    { rank: 21, price: 9.0, method: "latest2025", y2025: 9, y2024: 8, y2023: 7, k2025: false, k2024: true, k2023: false },
    { rank: 22, price: 7.0, method: "latest2024", y2025: 9, y2024: 7, y2023: 5, k2025: true, k2024: false, k2023: false },
    { rank: 23, price: 8.0, method: "latest2025", y2025: 8, y2024: 6, y2023: 5, k2025: false, k2024: true, k2023: false },
    { rank: 24, price: 4.0, method: "latest2024", y2025: 8, y2024: 4, y2023: 3, k2025: true, k2024: false, k2023: false },
    { rank: 25, price: 6.05, method: "weighted", y2025: 7, y2024: 4, y2023: 3, k2025: false, k2024: false, k2023: false },
    { rank: 26, price: 5.05, method: "weighted", y2025: 6, y2024: 3, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 27, price: 3.0, method: "latest2024", y2025: 6, y2024: 3, y2023: 1, k2025: true, k2024: false, k2023: false },
    { rank: 28, price: 2.0, method: "latest2024", y2025: 6, y2024: 2, y2023: 1, k2025: true, k2024: false, k2023: false },
    { rank: 29, price: 4.05, method: "weighted", y2025: 5, y2024: 2, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 30, price: 2.65, method: "weighted", y2025: 3, y2024: 2, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 31, price: 1.95, method: "weighted", y2025: 2, y2024: 2, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 32, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 33, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 34, price: 1.0, method: "latest2025", y2025: 1, y2024: 1, y2023: null, k2025: false, k2024: false, k2023: false },
    { rank: 35, price: 1.0, method: "latest2025", y2025: 1, y2024: 1, y2023: null, k2025: false, k2024: false, k2023: false },
    { rank: 36, price: 1.0, method: "latest2024", y2025: null, y2024: 1, y2023: null, k2025: false, k2024: false, k2023: false },
  ],
  RB: [
    { rank: 1, price: 63.25, method: "weighted", y2025: 64, y2024: 63, y2023: 54, k2025: false, k2024: false, k2023: false },
    { rank: 2, price: 63.0, method: "latest2025", y2025: 63, y2024: 59, y2023: 49, k2025: false, k2024: true, k2023: false },
    { rank: 3, price: 50.05, method: "weighted", y2025: 51, y2024: 48, y2023: 47, k2025: false, k2024: false, k2023: false },
    { rank: 4, price: 44.0, method: "latest2024", y2025: 49, y2024: 44, y2023: 44, k2025: true, k2024: false, k2023: false },
    { rank: 5, price: 44.35, method: "weighted", y2025: 47, y2024: 37, y2023: 44, k2025: false, k2024: false, k2023: false },
    { rank: 6, price: 44.2, method: "weighted", y2025: 47, y2024: 37, y2023: 41, k2025: false, k2024: false, k2023: false },
    { rank: 7, price: 39.9, method: "weighted", y2025: 42, y2024: 34, y2023: 40, k2025: false, k2024: false, k2023: false },
    { rank: 8, price: 38.25, method: "weighted", y2025: 41, y2024: 31, y2023: 36, k2025: false, k2024: false, k2023: false },
    { rank: 9, price: 30.45, method: "weighted", y2025: 31, y2024: 29, y2023: 30, k2025: false, k2024: false, k2023: false },
    { rank: 10, price: 28.75, method: "weighted", y2025: 29, y2024: 28, y2023: 29, k2025: false, k2024: false, k2023: false },
    { rank: 11, price: 24.0, method: "latest2025", y2025: 24, y2024: 28, y2023: 29, k2025: false, k2024: true, k2023: false },
    { rank: 12, price: 23.0, method: "latest2025", y2025: 23, y2024: 21, y2023: 25, k2025: false, k2024: true, k2023: false },
    { rank: 13, price: 21.0, method: "latest2025", y2025: 21, y2024: 16, y2023: 25, k2025: false, k2024: true, k2023: false },
    { rank: 14, price: 19.45, method: "weighted", y2025: 21, y2024: 14, y2023: 25, k2025: false, k2024: false, k2023: false },
    { rank: 15, price: 19.1, method: "weighted", y2025: 21, y2024: 13, y2023: 23, k2025: false, k2024: false, k2023: false },
    { rank: 16, price: 19.1, method: "weighted", y2025: 21, y2024: 13, y2023: 23, k2025: false, k2024: false, k2023: false },
    { rank: 17, price: 20.0, method: "latest2025", y2025: 20, y2024: 13, y2023: 21, k2025: false, k2024: true, k2023: false },
    { rank: 18, price: 15.0, method: "latest2025", y2025: 15, y2024: 11, y2023: 16, k2025: false, k2024: true, k2023: false },
    { rank: 19, price: 10.0, method: "latest2024", y2025: 15, y2024: 10, y2023: 15, k2025: true, k2024: false, k2023: false },
    { rank: 20, price: 13.0, method: "weighted", y2025: 14, y2024: 10, y2023: 14, k2025: false, k2024: false, k2023: false },
    { rank: 21, price: 12.95, method: "weighted", y2025: 14, y2024: 10, y2023: 13, k2025: false, k2024: false, k2023: false },
    { rank: 22, price: 13.0, method: "latest2025", y2025: 13, y2024: 10, y2023: 12, k2025: false, k2024: true, k2023: false },
    { rank: 23, price: 12.0, method: "latest2025", y2025: 12, y2024: 8, y2023: 11, k2025: false, k2024: true, k2023: false },
    { rank: 24, price: 9.95, method: "weighted", y2025: 11, y2024: 7, y2023: 10, k2025: false, k2024: false, k2023: false },
    { rank: 25, price: 10.0, method: "latest2023", y2025: 11, y2024: 7, y2023: 10, k2025: true, k2024: true, k2023: false },
    { rank: 26, price: 6.0, method: "latest2024", y2025: 10, y2024: 6, y2023: 8, k2025: true, k2024: false, k2023: false },
    { rank: 27, price: 8.2, method: "weighted", y2025: 9, y2024: 6, y2023: 8, k2025: false, k2024: false, k2023: false },
    { rank: 28, price: 8.1, method: "weighted", y2025: 9, y2024: 6, y2023: 6, k2025: false, k2024: false, k2023: false },
    { rank: 29, price: 8.0, method: "latest2025", y2025: 8, y2024: 6, y2023: 6, k2025: false, k2024: true, k2023: false },
    { rank: 30, price: 6.4, method: "weighted", y2025: 7, y2024: 5, y2023: 5, k2025: false, k2024: false, k2023: false },
    { rank: 31, price: 5.6, method: "weighted", y2025: 6, y2024: 5, y2023: 3, k2025: false, k2024: false, k2023: false },
    { rank: 32, price: 5.6, method: "weighted", y2025: 6, y2024: 5, y2023: 3, k2025: false, k2024: false, k2023: false },
    { rank: 33, price: 5.35, method: "weighted", y2025: 6, y2024: 4, y2023: 3, k2025: false, k2024: false, k2023: false },
    { rank: 34, price: 5.3, method: "weighted", y2025: 6, y2024: 4, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 35, price: 3.0, method: "latest2024", y2025: 6, y2024: 3, y2023: 2, k2025: true, k2024: false, k2023: false },
    { rank: 36, price: 4.35, method: "weighted", y2025: 5, y2024: 3, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 37, price: 3.65, method: "weighted", y2025: 4, y2024: 3, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 38, price: 3.4, method: "weighted", y2025: 4, y2024: 2, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 39, price: 3.4, method: "weighted", y2025: 4, y2024: 2, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 40, price: 2.7, method: "weighted", y2025: 3, y2024: 2, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 41, price: 2.7, method: "weighted", y2025: 3, y2024: 2, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 42, price: 2.7, method: "weighted", y2025: 3, y2024: 2, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 43, price: 2.65, method: "weighted", y2025: 3, y2024: 2, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 44, price: 1.7, method: "weighted", y2025: 2, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 45, price: 1.7, method: "weighted", y2025: 2, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 46, price: 1.7, method: "weighted", y2025: 2, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 47, price: 1.7, method: "weighted", y2025: 2, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 48, price: 1.7, method: "weighted", y2025: 2, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 49, price: 1.7, method: "weighted", y2025: 2, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 50, price: 1.7, method: "weighted", y2025: 2, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 51, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 52, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 53, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 54, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 55, price: 1.0, method: "latest2025", y2025: 1, y2024: null, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 56, price: 1.0, method: "latest2025", y2025: 1, y2024: null, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 57, price: 1.0, method: "latest2025", y2025: 1, y2024: null, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 58, price: 1.0, method: "latest2025", y2025: 1, y2024: null, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 59, price: 1.0, method: "latest2025", y2025: 1, y2024: null, y2023: null, k2025: false, k2024: false, k2023: false },
    { rank: 60, price: 1.0, method: "latest2025", y2025: 1, y2024: null, y2023: null, k2025: false, k2024: false, k2023: false },
    { rank: 61, price: 1.0, method: "latest2025", y2025: 1, y2024: null, y2023: null, k2025: false, k2024: false, k2023: false },
  ],
  WR: [
    { rank: 1, price: 58.9, method: "weighted", y2025: 59, y2024: 59, y2023: 57, k2025: false, k2024: false, k2023: false },
    { rank: 2, price: 52.2, method: "weighted", y2025: 51, y2024: 56, y2023: 50, k2025: false, k2024: false, k2023: false },
    { rank: 3, price: 50.55, method: "weighted", y2025: 50, y2024: 53, y2023: 46, k2025: false, k2024: false, k2023: false },
    { rank: 4, price: 43.4, method: "weighted", y2025: 41, y2024: 50, y2023: 44, k2025: false, k2024: false, k2023: false },
    { rank: 5, price: 42.2, method: "weighted", y2025: 41, y2024: 46, y2023: 40, k2025: false, k2024: false, k2023: false },
    { rank: 6, price: 40.75, method: "weighted", y2025: 39, y2024: 46, y2023: 39, k2025: false, k2024: false, k2023: false },
    { rank: 7, price: 34.0, method: "latest2023", y2025: 34, y2024: 45, y2023: 34, k2025: true, k2024: true, k2023: false },
    { rank: 8, price: 28.8, method: "weighted", y2025: 28, y2024: 30, y2023: 34, k2025: false, k2024: false, k2023: false },
    { rank: 9, price: 23.6, method: "weighted", y2025: 21, y2024: 29, y2023: 33, k2025: false, k2024: false, k2023: false },
    { rank: 10, price: 22.8, method: "weighted", y2025: 21, y2024: 27, y2023: 27, k2025: false, k2024: false, k2023: false },
    { rank: 11, price: 21.85, method: "weighted", y2025: 20, y2024: 26, y2023: 27, k2025: false, k2024: false, k2023: false },
    { rank: 12, price: 25.0, method: "latest2024", y2025: 20, y2024: 25, y2023: 25, k2025: true, k2024: false, k2023: false },
    { rank: 13, price: 20.7, method: "weighted", y2025: 19, y2024: 25, y2023: 23, k2025: false, k2024: false, k2023: false },
    { rank: 14, price: 20.65, method: "weighted", y2025: 19, y2024: 25, y2023: 22, k2025: false, k2024: false, k2023: false },
    { rank: 15, price: 18.0, method: "latest2025", y2025: 18, y2024: 25, y2023: 21, k2025: false, k2024: true, k2023: false },
    { rank: 16, price: 19.65, method: "weighted", y2025: 18, y2024: 24, y2023: 21, k2025: false, k2024: false, k2023: false },
    { rank: 17, price: 19.35, method: "weighted", y2025: 18, y2024: 23, y2023: 20, k2025: false, k2024: false, k2023: false },
    { rank: 18, price: 17.4, method: "weighted", y2025: 16, y2024: 21, y2023: 19, k2025: false, k2024: false, k2023: false },
    { rank: 19, price: 17.0, method: "weighted", y2025: 16, y2024: 20, y2023: 16, k2025: false, k2024: false, k2023: false },
    { rank: 20, price: 16.05, method: "weighted", y2025: 15, y2024: 19, y2023: 16, k2025: false, k2024: false, k2023: false },
    { rank: 21, price: 15.0, method: "latest2024", y2025: 14, y2024: 15, y2023: 14, k2025: true, k2024: false, k2023: false },
    { rank: 22, price: 11.8, method: "weighted", y2025: 11, y2024: 14, y2023: 12, k2025: false, k2024: false, k2023: false },
    { rank: 23, price: 11.45, method: "weighted", y2025: 11, y2024: 13, y2023: 10, k2025: false, k2024: false, k2023: false },
    { rank: 24, price: 10.9, method: "weighted", y2025: 11, y2024: 11, y2023: 9, k2025: false, k2024: false, k2023: false },
    { rank: 25, price: 11.0, method: "latest2025", y2025: 11, y2024: 11, y2023: 8, k2025: false, k2024: true, k2023: false },
    { rank: 26, price: 10.0, method: "latest2024", y2025: 11, y2024: 10, y2023: 8, k2025: true, k2024: false, k2023: false },
    { rank: 27, price: 7.0, method: "latest2023", y2025: 11, y2024: 10, y2023: 7, k2025: true, k2024: true, k2023: false },
    { rank: 28, price: 9.6, method: "weighted", y2025: 10, y2024: 9, y2023: 7, k2025: false, k2024: false, k2023: false },
    { rank: 29, price: 8.85, method: "weighted", y2025: 9, y2024: 9, y2023: 6, k2025: false, k2024: false, k2023: false },
    { rank: 30, price: 8.6, method: "weighted", y2025: 9, y2024: 8, y2023: 6, k2025: false, k2024: false, k2023: false },
    { rank: 31, price: 8.35, method: "weighted", y2025: 9, y2024: 7, y2023: 6, k2025: false, k2024: false, k2023: false },
    { rank: 32, price: 6.0, method: "latest2024", y2025: 9, y2024: 6, y2023: 5, k2025: true, k2024: false, k2023: false },
    { rank: 33, price: 8.0, method: "latest2025", y2025: 8, y2024: 6, y2023: 5, k2025: false, k2024: true, k2023: false },
    { rank: 34, price: 8.0, method: "latest2025", y2025: 8, y2024: 6, y2023: 4, k2025: false, k2024: true, k2023: false },
    { rank: 35, price: 5.0, method: "latest2024", y2025: 7, y2024: 5, y2023: 4, k2025: true, k2024: false, k2023: false },
    { rank: 36, price: 5.0, method: "latest2024", y2025: 7, y2024: 5, y2023: 3, k2025: true, k2024: false, k2023: false },
    { rank: 37, price: 4.0, method: "latest2024", y2025: 7, y2024: 4, y2023: 3, k2025: true, k2024: false, k2023: false },
    { rank: 38, price: 5.35, method: "weighted", y2025: 6, y2024: 4, y2023: 3, k2025: false, k2024: false, k2023: false },
    { rank: 39, price: 4.65, method: "weighted", y2025: 5, y2024: 4, y2023: 3, k2025: false, k2024: false, k2023: false },
    { rank: 40, price: 4.65, method: "weighted", y2025: 5, y2024: 4, y2023: 3, k2025: false, k2024: false, k2023: false },
    { rank: 41, price: 4.6, method: "weighted", y2025: 5, y2024: 4, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 42, price: 4.35, method: "weighted", y2025: 5, y2024: 3, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 43, price: 3.65, method: "weighted", y2025: 4, y2024: 3, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 44, price: 2.95, method: "weighted", y2025: 3, y2024: 3, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 45, price: 2.7, method: "weighted", y2025: 3, y2024: 2, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 46, price: 2.7, method: "weighted", y2025: 3, y2024: 2, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 47, price: 2.7, method: "weighted", y2025: 3, y2024: 2, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 48, price: 2.0, method: "weighted", y2025: 2, y2024: 2, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 49, price: 2.0, method: "weighted", y2025: 2, y2024: 2, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 50, price: 1.25, method: "weighted", y2025: 1, y2024: 2, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 51, price: 1.25, method: "weighted", y2025: 1, y2024: 2, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 52, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 53, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 54, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 55, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 56, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 57, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 58, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 59, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 60, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 61, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 62, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 63, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 64, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 65, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 66, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 67, price: 1.0, method: "latest2024", y2025: null, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 68, price: 1.0, method: "latest2024", y2025: null, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 69, price: 1.0, method: "latest2024", y2025: null, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 70, price: 1.0, method: "latest2024", y2025: null, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 71, price: 1.0, method: "latest2024", y2025: null, y2024: 1, y2023: null, k2025: false, k2024: false, k2023: false },
    { rank: 72, price: 1.0, method: "latest2024", y2025: null, y2024: 1, y2023: null, k2025: false, k2024: false, k2023: false },
    { rank: 73, price: 1.0, method: "latest2024", y2025: null, y2024: 1, y2023: null, k2025: false, k2024: false, k2023: false },
  ],
  TE: [
    { rank: 1, price: 24.25, method: "weighted", y2025: 22, y2024: 27, y2023: 42, k2025: false, k2024: false, k2023: false },
    { rank: 2, price: 19.05, method: "weighted", y2025: 20, y2024: 16, y2023: 21, k2025: false, k2024: false, k2023: false },
    { rank: 3, price: 9.1, method: "weighted", y2025: 8, y2024: 11, y2023: 15, k2025: false, k2024: false, k2023: false },
    { rank: 4, price: 9.0, method: "latest2024", y2025: 7, y2024: 9, y2023: 15, k2025: true, k2024: false, k2023: false },
    { rank: 5, price: 5.95, method: "weighted", y2025: 5, y2024: 7, y2023: 14, k2025: false, k2024: false, k2023: false },
    { rank: 6, price: 5.0, method: "latest2025", y2025: 5, y2024: 6, y2023: 8, k2025: false, k2024: true, k2023: false },
    { rank: 7, price: 5.1, method: "weighted", y2025: 5, y2024: 5, y2023: 7, k2025: false, k2024: false, k2023: false },
    { rank: 8, price: 4.05, method: "weighted", y2025: 4, y2024: 4, y2023: 5, k2025: false, k2024: false, k2023: false },
    { rank: 9, price: 3.2, method: "weighted", y2025: 3, y2024: 4, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 10, price: 2.25, method: "weighted", y2025: 2, y2024: 3, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 11, price: 2.2, method: "weighted", y2025: 2, y2024: 3, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 12, price: 2.2, method: "weighted", y2025: 2, y2024: 3, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 13, price: 1.25, method: "weighted", y2025: 1, y2024: 2, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 14, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 15, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 16, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 17, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 18, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 19, price: 1.0, method: "latest2025", y2025: 1, y2024: null, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 20, price: 1.0, method: "latest2023", y2025: null, y2024: null, y2023: 1, k2025: false, k2024: false, k2023: false },
  ],
  DEF: [
    { rank: 1, price: 2.0, method: "weighted", y2025: 2, y2024: 2, y2023: 2, k2025: false, k2024: false, k2023: false },
    { rank: 2, price: 1.95, method: "weighted", y2025: 2, y2024: 2, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 3, price: 1.95, method: "weighted", y2025: 2, y2024: 2, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 4, price: 1.7, method: "weighted", y2025: 2, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 5, price: 1.7, method: "weighted", y2025: 2, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 6, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 7, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 8, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 9, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 10, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
    { rank: 11, price: 1.0, method: "weighted", y2025: 1, y2024: 1, y2023: 1, k2025: false, k2024: false, k2023: false },
  ],
};
