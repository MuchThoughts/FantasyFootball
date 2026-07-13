import { OWNER_INSIGHTS } from "./data/drafters";
import { Player } from "./data/players";
import { PRICE_CURVE } from "./data/priceCurve";
import { Strategy } from "./data/strategies";
import type { RankingConfig, RankingSource } from "./rankings";

export type Pos = "QB" | "RB" | "WR" | "TE" | "DEF";

export const POSITIONS: Pos[] = ["QB", "RB", "WR", "TE", "DEF"];

export const POS_COLOR: Record<Pos, string> = {
  QB: "#E8A33D",
  RB: "#4CAF6B",
  WR: "#5B9BD5",
  TE: "#C77DD2",
  DEF: "#8B92A0",
};

// Fixed roster shape: 2 QB, 2 RB, 2 WR, 2 FLEX (RB/WR/TE), 1 TE, 1 DEF, 6 BENCH = 16 slots.
// Everything except FLEX/BENCH position is locked; $ amounts on every slot are always editable.
export const FIXED_SLOT_POS: Record<string, Pos> = {
  qb1: "QB",
  qb2: "QB",
  rb1: "RB",
  rb2: "RB",
  wr1: "WR",
  wr2: "WR",
  te: "TE",
  def: "DEF",
};

export function slotLabel(id: string): string {
  if (id.startsWith("flex")) return "FLEX " + id.slice(4);
  if (id.startsWith("bench")) return "Bench " + id.slice(5);
  return id.slice(0, -1).toUpperCase() + id.slice(-1);
}

export interface SlotLabel {
  slotId: string;
  label: string; // position-ordinal name, e.g. "QB1", "RB3", "QB3 Bench"
  amount: number;
  pos: string;
  bench: boolean;
}

// Name each slot by its position and price-rank within that position, tagging
// bench slots: a $7 QB behind $30/$21 QBs becomes "QB3 Bench". These labels drive
// the Targets sections and the board's assign-to-slot menu.
export function buildSlotLabels(strategy: { slots: { id: string; pos: string; amount: number }[] } | undefined): Map<string, SlotLabel> {
  const map = new Map<string, SlotLabel>();
  if (!strategy) return map;
  const byPos: Record<string, { id: string; amount: number }[]> = {};
  strategy.slots.forEach((sl) => {
    (byPos[sl.pos] = byPos[sl.pos] || []).push({ id: sl.id, amount: Number(sl.amount) || 0 });
  });
  for (const pos of Object.keys(byPos)) {
    byPos[pos]
      .sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id))
      .forEach((s, i) => {
        const bench = s.id.startsWith("bench");
        map.set(s.id, { slotId: s.id, label: `${pos}${i + 1}${bench ? " Bench" : ""}`, amount: s.amount, pos, bench });
      });
  }
  return map;
}

export function uid(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Players a league-mate might keep, drawn from the Insights keeper options.
// Ineligible players (already kept twice) are never listed there, so they
// correctly stay in the pool. `likelyDefault` is the built-in guess (the
// ★-flagged options); the user can override it per player on the Insights tab.
// The effective set tints rows pale orange as a "probably won't be available at
// auction" warning.
export interface LikelyKeeper {
  owner: string;
  cost: number;
}
export interface KeeperCandidate extends LikelyKeeper {
  uid: string;
  player: string;
  pos: string;
  likelyDefault: boolean;
}

// The app user's owner name in the Insights data — their checked keepers count
// as "mine" (fill strategy slots, spend their budget).
export const MY_OWNER = "Sean";

export const KEEPER_CANDIDATES: KeeperCandidate[] = OWNER_INSIGHTS.flatMap((o) =>
  o.keeperOptions.map((k) => ({
    uid: uid(k.player),
    player: k.player,
    pos: k.pos,
    owner: o.owner,
    cost: k.cost,
    likelyDefault: !!k.likely,
  }))
);

// A player is on exactly one owner's roster, so keying candidates by uid is safe.
export const KEEPER_CANDIDATE_BY_UID: Record<string, KeeperCandidate> = {};
for (const c of KEEPER_CANDIDATES) KEEPER_CANDIDATE_BY_UID[c.uid] = c;

// Effective "expected keeper" = the user's per-player override if set, else the
// built-in likely default.
export function isExpectedKeeper(playerUid: string, picks: Record<string, boolean>): boolean {
  const override = picks[playerUid];
  if (override !== undefined) return override;
  return KEEPER_CANDIDATE_BY_UID[playerUid]?.likelyDefault ?? false;
}

// The Insights checkboxes ARE the keeper designation: every checked candidate
// becomes a real keeper entry (off the board, cost pre-committed against the
// auction pool, mine = it's on your roster). This is the only keeper source —
// the old per-player status dropdown is gone.
export function expectedKeepers(picks: Record<string, boolean>): Record<string, KeeperEntry> {
  const out: Record<string, KeeperEntry> = {};
  for (const c of KEEPER_CANDIDATES) {
    if (isExpectedKeeper(c.uid, picks)) {
      out[c.uid] = { name: c.player, pos: c.pos as Pos, cost: c.cost, mine: c.owner === MY_OWNER };
    }
  }
  return out;
}

export function fmtMoney(n: number): string {
  const r = Math.round(n);
  return (r < 0 ? "-$" : "$") + Math.abs(r);
}

export function fmtPct(n: number): string {
  return (n >= 0 ? "+" : "") + Math.round(n * 100) + "%";
}

/* Look up the raw dollar price for a position + rank (1-indexed) — the actual
   weighted price the league paid for the Nth most expensive player at that position.
   Falls back to the last known value, then min bid. */
export function curveDollars(pos: string, effRank: number): number {
  const arr = PRICE_CURVE[pos];
  if (!arr) return 1;
  if (effRank <= arr.length) return arr[effRank - 1];
  return arr[arr.length - 1];
}

// Market price for every player with NOBODY kept: positional rank in ranking
// order -> the league curve. The stable benchmark for keeper EV on the Insights
// tab — checked keepers leave the board, so live board targets vanish for
// exactly the players being evaluated.
export function marketTargets(players: Player[]): Map<string, number> {
  const posCounts: Record<string, number> = {};
  const m = new Map<string, number>();
  for (const p of [...players].sort((a, b) => a.adp - b.adp)) {
    posCounts[p.pos] = (posCounts[p.pos] || 0) + 1;
    m.set(uid(p.name), Math.max(Math.round(curveDollars(p.pos, posCounts[p.pos])), 1));
  }
  return m;
}

// suggest a $ amount for a slot based on how many earlier slots (in fixed array order)
// already claim the same position — i.e. this slot's effective market rank at that position
export function suggestSlotAmount(
  slots: { pos: string }[],
  index: number,
  newPos: string
): number {
  let count = 0;
  slots.forEach((s, i) => {
    if (i < index && s.pos === newPos) count++;
  });
  return Math.max(1, Math.round(curveDollars(newPos, count + 1)));
}

export const TIER_PALETTE = ["#4C8F5B", "#5B9BD5", "#C77DD2", "#E8A33D", "#A83A34", "#8B92A0"];
export function tierColor(tier: number | null | undefined): string {
  if (!tier) return "#2A2F38";
  return TIER_PALETTE[(tier - 1) % TIER_PALETTE.length];
}

export interface Settings {
  teams: number;
  budget: number;
  rosterSize: number;
}

export interface KeeperEntry {
  name: string;
  pos: Pos;
  cost: number | "";
  mine: boolean;
}

export interface DraftedEntry {
  price: number | "";
  mine: boolean;
}

export type Interest = "love" | "like" | "neutral" | "dislike";

export interface PlayerMetaEntry {
  max?: number | "";
  // Legacy: interest used to live here globally. It's now per-strategy in
  // DraftData.interestByStrategy; this field is only read once, to migrate old data.
  interest?: Interest;
}

export interface DraftData {
  settings: Settings;
  drafted: Record<string, DraftedEntry>;
  playerMeta: Record<string, PlayerMetaEntry>;
  // Interest ratings (love/like/dislike) are scoped per strategy: playerId -> interest,
  // keyed by strategyId. Switching strategy shows that strategy's own ratings.
  interestByStrategy: Record<string, Record<string, Interest>>;
  tierOverrides: Record<string, number[]>;
  customPlayers: Player[];
  strategies: Strategy[];
  activeStrategyId: string;
  // THE keeper source of truth: which players you expect each league-mate (and
  // you) to keep, as an override map keyed by player uid: true = keeper, false =
  // explicitly not, absent = use the built-in likely default. Checked players
  // become real keepers via expectedKeepers(); edited on the Insights tab.
  keeperPicks: Record<string, boolean>;
  // Curated slot assignments per strategy: strategyId -> (playerUid -> slotId).
  // A player pinned to a slot surfaces in that slot's Targets section (set via
  // the board's press-and-hold menu).
  assignmentsByStrategy: Record<string, Record<string, string>>;
  // Uploaded ranking lists plus which source/blend/overrides are active —
  // see rankings.ts. The active ranking drives board order and price targets.
  rankingSources: RankingSource[];
  ranking: RankingConfig;
}

export function defaultSettings(): Settings {
  return { teams: 12, budget: 200, rosterSize: 16 };
}

export interface BoardRow {
  id: string;
  name: string;
  pos: Pos;
  team: string;
  adp: number;
  effRank: number | null;
  target: number | null;
  isKeeper: boolean;
  tier: number | null;
  isDrafted: boolean;
  keeperCost: number | "";
  paid: number | "";
  mine: boolean;
  live: number | null;
  max: number | "";
  interest: Interest;
  // On keeper rows: who's keeping the player and at what cost (from the Insights
  // candidate data). Null on regular rows.
  likelyKeeper: LikelyKeeper | null;
}

export interface Board {
  totalBudget: number;
  keeperCostSum: number;
  availablePool: number;
  moneySpentAuction: number;
  remainingPool: number;
  inflation: number;
  rows: BoardRow[];
  keeperList: (KeeperEntry & { id: string })[];
  myDrafted: BoardRow[];
  myKeepers: BoardRow[];
  myBudgetUsed: number;
  myBudgetRemaining: number;
  myRosterCount: number;
  mySlotsRemaining: number;
  paceDelta: number;
  tierBreaks: Record<string, number[]>;
  positionCounts: Record<string, number>;
}

// Find the rank (1-indexed, clamped to an interior boundary) whose market price is
// closest to a given dollar amount — used to place a tier bar at "roughly what this
// strategy slot would pay," so tiers read as "the players you can get for each slot."
function nearestRankForAmount(pos: string, amount: number, n: number): number | null {
  if (n < 2 || amount <= 0) return null;
  let bestRank = 1;
  let bestDiff = Infinity;
  for (let r = 1; r <= n; r++) {
    const diff = Math.abs(curveDollars(pos, r) - amount);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestRank = r;
    }
  }
  return Math.max(1, Math.min(n - 1, bestRank));
}

// Default tier breaks for a position, derived from the active strategy's slot $
// amounts at that position — one candidate boundary per distinct slot amount.
function strategyDerivedBreaks(pos: string, n: number, activeStrategy: Strategy | undefined): number[] {
  if (!activeStrategy) return [];
  const ranks = new Set<number>();
  activeStrategy.slots
    .filter((sl) => sl.pos === pos)
    .forEach((sl) => {
      const rank = nearestRankForAmount(pos, Number(sl.amount) || 0, n);
      if (rank != null) ranks.add(rank);
    });
  return Array.from(ranks).sort((a, b) => a - b);
}

export function computeBoard(
  settings: Settings,
  keepers: Record<string, KeeperEntry>,
  drafted: Record<string, DraftedEntry>,
  allPlayers: Player[],
  playerMeta: Record<string, PlayerMetaEntry>,
  tierOverrides: Record<string, number[]>,
  activeStrategy: Strategy | undefined,
  activeInterest: Record<string, Interest>,
  // When the active ranking supplies its own tiers (an uploaded list with a tier
  // column), use those directly; otherwise tiers are derived from strategy prices.
  sourceTiers?: Record<string, number>
): Board {
  const totalBudget = settings.teams * settings.budget;
  const keeperList = Object.entries(keepers).map(([id, k]) => ({ id, ...k }));
  const keeperCostSum = keeperList.reduce((s, k) => s + (Number(k.cost) || 0), 0);
  const availablePool = Math.max(totalBudget - keeperCostSum, 1);

  const keptIds = new Set(Object.keys(keepers));
  const available = allPlayers.filter((p) => !keptIds.has(uid(p.name)));
  const keptPlayers = allPlayers.filter((p) => keptIds.has(uid(p.name)));

  const sorted = [...available].sort((a, b) => a.adp - b.adp);
  const posCounts: Record<string, number> = {};
  const rankedRows = sorted.map((p) => {
    const pos = p.pos;
    posCounts[pos] = (posCounts[pos] || 0) + 1;
    const effRank = posCounts[pos];
    const target = Math.max(Math.round(curveDollars(pos, effRank)), 1);
    return { id: uid(p.name), name: p.name, pos, team: p.team, adp: p.adp, effRank, target, isKeeper: false };
  });
  const keptRows = keptPlayers.map((p) => ({
    id: uid(p.name),
    name: p.name,
    pos: p.pos,
    team: p.team,
    adp: p.adp,
    effRank: null as number | null,
    target: null as number | null,
    isKeeper: true,
  }));
  const rows = [...rankedRows, ...keptRows].sort((a, b) => a.adp - b.adp);

  const draftedIds = new Set(
    Object.entries(drafted)
      .filter(([, d]) => d && d.price !== "" && d.price !== null && d.price !== undefined)
      .map(([id]) => id)
  );
  const undraftedRows = rankedRows.filter((r) => !draftedIds.has(r.id));

  const moneySpentAuction = Object.entries(drafted)
    .filter(([id]) => draftedIds.has(id))
    .reduce((s, [, d]) => s + (Number(d.price) || 0), 0);
  const remainingPool = availablePool - moneySpentAuction;
  const remainingTargetSum = undraftedRows.reduce((s, r) => s + r.target, 0);
  const inflation = remainingTargetSum > 0 ? remainingPool / remainingTargetSum : 1;

  const tierMap: Record<string, number> = {};
  const tierBreaksUsed: Record<string, number[]> = {};
  const positionCounts: Record<string, number> = {};
  const useSourceTiers = !!sourceTiers && Object.keys(sourceTiers).length > 0;
  POSITIONS.forEach((pos) => {
    const posRows = rankedRows.filter((r) => r.pos === pos);
    const n = posRows.length;
    positionCounts[pos] = n;

    if (useSourceTiers) {
      // Tiers come from the uploaded ranking. No draggable break bars — the
      // divider lines are drawn wherever the uploaded tier changes.
      tierBreaksUsed[pos] = [];
      posRows.forEach((r) => (tierMap[r.id] = sourceTiers![r.id] ?? 0));
      return;
    }

    // Presence of the key (even an empty array, meaning "all bars manually removed")
    // means the user has taken manual control of this position's tiers; absence means
    // "use whatever the active strategy implies."
    const hasOverride = Object.prototype.hasOwnProperty.call(tierOverrides, pos);
    const breaks = hasOverride ? tierOverrides[pos] : strategyDerivedBreaks(pos, n, activeStrategy);
    tierBreaksUsed[pos] = breaks;

    posRows.forEach((r) => {
      let tier = 1;
      for (const b of breaks) {
        if (r.effRank > b) tier++;
        else break;
      }
      tierMap[r.id] = tier;
    });
  });

  const finalRows: BoardRow[] = rows.map((r) => {
    const meta = playerMeta[r.id] || {};
    if (r.isKeeper) {
      const k = keepers[r.id] || ({} as KeeperEntry);
      return {
        ...r,
        tier: null,
        isDrafted: false,
        keeperCost: k.cost !== undefined && k.cost !== "" ? Number(k.cost) : "",
        paid: "",
        mine: !!k.mine,
        live: null,
        max: meta.max ?? "",
        interest: activeInterest[r.id] ?? "neutral",
        // Keeper rows keep their owner/cost info so the board can label who's
        // taking the player out of the pool.
        likelyKeeper: KEEPER_CANDIDATE_BY_UID[r.id] ?? null,
      };
    }
    const d = drafted[r.id];
    const isDrafted = draftedIds.has(r.id);
    const live = isDrafted ? null : Math.max(Math.round((r.target as number) * inflation), 1);
    return {
      ...r,
      tier: tierMap[r.id] || 1,
      isDrafted,
      keeperCost: "",
      paid: d && d.price !== "" && d.price != null ? Number(d.price) : "",
      mine: d ? !!d.mine : false,
      live,
      max: meta.max ?? "",
      interest: activeInterest[r.id] ?? "neutral",
      likelyKeeper: null,
    };
  });

  const myDrafted = finalRows.filter((r) => !r.isKeeper && r.isDrafted && r.mine);
  const myKeepers = finalRows.filter((r) => r.isKeeper && r.mine);
  const myBudgetUsed =
    myDrafted.reduce((s, r) => s + (Number(r.paid) || 0), 0) +
    myKeepers.reduce((s, k) => s + (Number(k.keeperCost) || 0), 0);
  const myRosterCount = myDrafted.length + myKeepers.length;
  const myBudgetRemaining = settings.budget - myBudgetUsed;
  const mySlotsRemaining = Math.max(settings.rosterSize - myRosterCount, 0);
  const paceDelta =
    myDrafted.length > 0
      ? myDrafted.reduce((s, r) => s + (Number(r.paid) || 0), 0) -
        myDrafted.reduce((s, r) => s + (Number(r.target) || 0), 0)
      : 0;

  return {
    totalBudget,
    keeperCostSum,
    availablePool,
    moneySpentAuction,
    remainingPool,
    inflation,
    rows: finalRows,
    keeperList,
    myDrafted,
    myKeepers,
    myBudgetUsed,
    myBudgetRemaining,
    myRosterCount,
    mySlotsRemaining,
    paceDelta,
    tierBreaks: tierBreaksUsed,
    positionCounts,
  };
}

export function computeStrategySlots(strategy: Strategy | undefined): Record<Pos, number> {
  const slots: Record<Pos, number> = { QB: 0, RB: 0, WR: 0, TE: 0, DEF: 0 };
  if (strategy) {
    strategy.slots.forEach((s) => {
      slots[s.pos] = (slots[s.pos] || 0) + 1;
    });
  }
  return slots;
}

// Assign each of "my" rostered players (keepers, and drafted players when passed)
// to the strategy slot at its position whose planned target price is closest to
// what the player cost — so a keeper priced like an RB2/RB3 fills that slot rather
// than always landing in RB1. Greedy closest-pair-first; ties favor the earlier
// (pricier) slot. Shared by the Strategy tab's slot table, the Board's target-zone
// brackets, and the strategy recommender so all agree on which slots are filled.
export function assignKeepersToSlots(strategy: Strategy | undefined, myKeepers: BoardRow[]): Map<string, BoardRow> {
  const map = new Map<string, BoardRow>();
  if (!strategy) return map;

  const slotsByPos: Record<string, { id: string; amount: number }[]> = {};
  strategy.slots.forEach((sl) => {
    (slotsByPos[sl.pos] = slotsByPos[sl.pos] || []).push({ id: sl.id, amount: Number(sl.amount) || 0 });
  });
  const keepersByPos: Record<string, BoardRow[]> = {};
  myKeepers.forEach((k) => {
    (keepersByPos[k.pos] = keepersByPos[k.pos] || []).push(k);
  });

  Object.entries(keepersByPos).forEach(([pos, keepers]) => {
    const slots = slotsByPos[pos] || [];
    // Every keeper/slot pairing, ranked by how close the keeper's cost is to
    // the slot's target price; greedily take the closest pair first so each
    // keeper lands in its best-fitting open slot.
    const pairs: { ki: number; si: number; diff: number }[] = [];
    keepers.forEach((k, ki) => {
      const cost = Number(k.keeperCost) || Number(k.paid) || 0;
      slots.forEach((s, si) => pairs.push({ ki, si, diff: Math.abs(s.amount - cost) }));
    });
    pairs.sort((a, b) => a.diff - b.diff);
    const usedK = new Set<number>();
    const usedS = new Set<number>();
    pairs.forEach(({ ki, si }) => {
      if (usedK.has(ki) || usedS.has(si)) return;
      usedK.add(ki);
      usedS.add(si);
      map.set(slots[si].id, keepers[ki]);
    });
  });
  return map;
}

export interface StrategyZone {
  slotId: string;
  label: string; // slot role, e.g. "RB2", "FLEX 1", "Bench 3"
  amount: number; // the slot's planned $
  ids: string[]; // the ~5 available players priced nearest that $
}

// The Strategy tab's per-slot target lists (the 5 available players priced nearest
// each slot's planned $) for one position — exposed so the Board can bracket those
// ranges alongside the table. Keeper-filled and $0 slots produce no zone.
export function computeStrategyZones(rows: BoardRow[], strategy: Strategy | undefined, pos: string): StrategyZone[] {
  if (!strategy) return [];
  const keeperSlots = assignKeepersToSlots(
    strategy,
    rows.filter((r) => r.isKeeper && r.mine)
  );
  const candidates = rows.filter(
    (r) => r.pos === pos && r.target != null && !r.isDrafted && !r.isKeeper && r.interest !== "dislike"
  );
  return strategy.slots
    .filter((sl) => sl.pos === pos && !keeperSlots.has(sl.id) && (Number(sl.amount) || 0) > 0)
    .map((sl) => {
      const amt = Number(sl.amount) || 0;
      const ids = [...candidates]
        .sort((a, b) => Math.abs((a.target as number) - amt) - Math.abs((b.target as number) - amt))
        .slice(0, 5)
        .map((r) => r.id);
      return { slotId: sl.id, label: slotLabel(sl.id), amount: amt, ids };
    })
    .filter((z) => z.ids.length > 0);
}

export interface StrategyTargets {
  targetIds: Set<string>;
  sums: Record<string, number>;
  listByPos: Record<string, BoardRow[]>;
}

// A player whose league-history target is at least this much counts as "top talent"
// for the stars-vs-depth market signal.
const STAR_TARGET_MIN = 20;
// Signals need at least this many purchases behind them before they're shown/used.
const MIN_SIGNAL_SAMPLES = 2;
// The whole market read stays hidden until this many priced picks are in.
export const MIN_MARKET_SAMPLES = 5;

export interface MarketRead {
  samples: number; // priced, drafted players with a known target
  overall: number; // total paid / total target across all samples
  posInflation: Partial<Record<Pos, { ratio: number; n: number }>>;
  stars: { ratio: number; n: number } | null; // players with target >= STAR_TARGET_MIN
}

// How the room is actually paying relative to this league's historical targets,
// overall / per position / for top-shelf players.
export function computeMarketRead(board: Board): MarketRead {
  const sold = board.rows.filter((r) => !r.isKeeper && r.isDrafted && r.target != null && r.paid !== "");
  const sum = (rows: BoardRow[], f: (r: BoardRow) => number) => rows.reduce((s, r) => s + f(r), 0);
  const ratioOf = (rows: BoardRow[]) => {
    const t = sum(rows, (r) => Number(r.target) || 0);
    return t > 0 ? sum(rows, (r) => Number(r.paid) || 0) / t : 1;
  };

  const posInflation: MarketRead["posInflation"] = {};
  POSITIONS.forEach((pos) => {
    const rows = sold.filter((r) => r.pos === pos);
    if (rows.length > 0) posInflation[pos] = { ratio: ratioOf(rows), n: rows.length };
  });

  const starRows = sold.filter((r) => (Number(r.target) || 0) >= STAR_TARGET_MIN);
  return {
    samples: sold.length,
    overall: sold.length > 0 ? ratioOf(sold) : 1,
    posInflation,
    stars: starRows.length > 0 ? { ratio: ratioOf(starRows), n: starRows.length } : null,
  };
}

// One slot-level observation from evaluating a strategy against the live market.
export interface StrategyNote {
  text: string;
  kind: "hot" | "cheap" | "depleted"; // overpriced band / discounted band / tier is gone
}

// How one strategy holds up under current prices, over its still-open slots only.
export interface StrategyEval {
  // Estimated $ over (+) or under (−) plan to fill this strategy's open slots at
  // today's prices, including downgrade losses from depleted tiers.
  extraCost: number;
  notes: StrategyNote[]; // biggest slot-level issues/advantages, largest impact first
}

export interface StrategyRecommendation {
  bestId: string;
  bestName: string;
  margin: number; // score gap between best and the active strategy, in budget fraction
  reasons: string[]; // market-wide signals (position/star inflation)
  // Qualitative advice from the stars signal, shown even when no strategy in the list
  // is configured top-heavy enough for the scores to separate on that axis.
  hint: string | null;
  scores: Record<string, number>;
  evals: Record<string, StrategyEval>;
}

const clampRatio = (r: number) => Math.min(Math.max(r, 0.5), 2);

/*
 * Scores each strategy by how executable its plan still is, slot by slot:
 *
 *  - For every slot my roster hasn't filled yet, ask how players priced like that
 *    slot are actually selling — paid/target across sold players in a band around
 *    the slot's planned $ (so $50+ QBs going wild hurts Hero QB without touching
 *    Value QB's $20–27 slots). With no band data yet, fall back to the position
 *    ratio, then the overall ratio, dampened toward 1 since the evidence is only
 *    circumstantial for this band.
 *  - If the quality tier a slot relies on is gone from the board entirely (best
 *    remaining player prices far below the plan), the slot can only downgrade:
 *    half the gap counts as lost value (the other half of the budget re-deploys).
 *
 * Score ≈ fraction of budget saved (+) or bled (−) vs. executing the plan at
 * target prices. The best-scoring strategy is the recommendation.
 */
export function recommendStrategy(
  board: Board,
  read: MarketRead,
  strategies: Strategy[],
  activeStrategyId: string,
  budget: number
): StrategyRecommendation | null {
  if (read.samples < MIN_MARKET_SAMPLES || strategies.length < 2) return null;

  const sold = board.rows.filter((r) => !r.isKeeper && r.isDrafted && r.target != null && r.paid !== "");
  const availByPos: Record<string, BoardRow[]> = {};
  POSITIONS.forEach((pos) => {
    availByPos[pos] = board.rows.filter((r) => r.pos === pos && !r.isDrafted && !r.isKeeper && r.target != null);
  });
  const myFilled = [...board.myKeepers, ...board.myDrafted];
  const fmtDelta = (ratio: number) => `${ratio >= 1 ? "+" : "−"}${Math.abs(Math.round((ratio - 1) * 100))}%`;

  // How players priced like this slot are actually selling. Returns the ratio to
  // apply plus how many sold players directly back it (n from the band itself).
  const bandRatio = (pos: string, amt: number): { ratio: number; n: number } => {
    const band = sold.filter((r) => r.pos === pos && (r.target as number) >= amt * 0.6 && (r.target as number) <= amt * 1.7);
    if (band.length >= MIN_SIGNAL_SAMPLES) {
      const t = band.reduce((s, r) => s + (Number(r.target) || 0), 0);
      if (t > 0) return { ratio: clampRatio(band.reduce((s, r) => s + (Number(r.paid) || 0), 0) / t), n: band.length };
    }
    const posSig = read.posInflation[pos as Pos];
    if (posSig && posSig.n >= MIN_SIGNAL_SAMPLES) return { ratio: clampRatio(1 + (posSig.ratio - 1) * 0.5), n: 0 };
    return { ratio: clampRatio(1 + (read.overall - 1) * 0.3), n: 0 };
  };

  const scores: Record<string, number> = {};
  const evals: Record<string, StrategyEval> = {};
  for (const s of strategies) {
    const filledSlots = assignKeepersToSlots(s, myFilled);
    const noted: (StrategyNote & { impact: number })[] = [];
    let extra = 0; // $ over plan across open slots
    for (const sl of s.slots) {
      if (filledSlots.has(sl.id)) continue;
      const amt = Number(sl.amount) || 0;
      if (amt < 1) continue;
      const pool = availByPos[sl.pos] || [];
      const bestAvail = pool.reduce((m, r) => Math.max(m, Number(r.target) || 0), 0);

      if (amt >= 8 && bestAvail < amt * 0.6) {
        // The tier this slot planned to buy is sold out — forced downgrade.
        const loss = (amt - bestAvail) * 0.5;
        extra += loss;
        noted.push({
          text: `${slotLabel(sl.id)}: no ${sl.pos}s left near $${amt} — best remaining ~$${bestAvail}`,
          kind: "depleted",
          impact: loss,
        });
        continue;
      }

      const { ratio, n } = bandRatio(sl.pos, amt);
      const loss = amt * (ratio - 1);
      extra += loss;
      if (n >= MIN_SIGNAL_SAMPLES && Math.abs(ratio - 1) >= 0.12 && amt >= 5) {
        noted.push({
          text: `${slotLabel(sl.id)} ($${amt} planned) projects ~$${Math.max(Math.round(amt * ratio), 1)} — ${sl.pos}s in that range going ${fmtDelta(ratio)} (${n} sold)`,
          kind: ratio > 1 ? "hot" : "cheap",
          impact: Math.abs(loss),
        });
      }
    }
    scores[s.id] = -extra / (budget || 200);
    noted.sort((a, b) => b.impact - a.impact);
    evals[s.id] = { extraCost: Math.round(extra), notes: noted.slice(0, 4).map(({ text, kind }) => ({ text, kind })) };
  }

  let best = strategies[0];
  for (const s of strategies) if (scores[s.id] > scores[best.id]) best = s;

  const reasons: string[] = [];
  const posSignals = POSITIONS.filter((pos) => {
    const p = read.posInflation[pos];
    return p && p.n >= MIN_SIGNAL_SAMPLES && Math.abs(p.ratio - 1) >= 0.08;
  }).sort((a, b) => Math.abs((read.posInflation[b]?.ratio ?? 1) - 1) - Math.abs((read.posInflation[a]?.ratio ?? 1) - 1));
  posSignals.slice(0, 3).forEach((pos) => {
    const p = read.posInflation[pos]!;
    reasons.push(`${pos}s going ${fmtDelta(p.ratio)} vs. target (${p.n} sold)`);
  });
  let hint: string | null = null;
  if (read.stars && read.stars.n >= MIN_SIGNAL_SAMPLES && Math.abs(read.stars.ratio - 1) >= 0.08) {
    reasons.push(`Top talent (target ≥ $${STAR_TARGET_MIN}) going ${fmtDelta(read.stars.ratio)} (${read.stars.n} sold)`);
    hint =
      read.stars.ratio < 1
        ? "Top talent is going cheap — lean stars & scrubs: concentrate budget in your top slots."
        : "Top talent is pricey — lean value: spread budget deeper and skip the early bidding wars.";
  }

  const activeScore = scores[activeStrategyId] ?? scores[best.id];
  return { bestId: best.id, bestName: best.name, margin: scores[best.id] - activeScore, reasons, hint, scores, evals };
}

export function computeStrategyTargets(board: Board, strategySlots: Record<Pos, number>): StrategyTargets {
  const targetIds = new Set<string>();
  const sums: Record<string, number> = {};
  const listByPos: Record<string, BoardRow[]> = {};
  POSITIONS.forEach((pos) => {
    const filledMine =
      board.myDrafted.filter((r) => r.pos === pos).length + board.myKeepers.filter((k) => k.pos === pos).length;
    const need = Math.max((strategySlots[pos] || 0) - filledMine, 0);
    const avail = board.rows
      .filter((r) => r.pos === pos && !r.isDrafted && !r.isKeeper)
      .sort((a, b) => (a.effRank as number) - (b.effRank as number));
    const picked = avail.slice(0, need);
    picked.forEach((r) => targetIds.add(r.id));
    sums[pos] = picked.reduce((s, r) => s + (Number(r.target) || 0), 0);
    listByPos[pos] = picked;
  });
  return { targetIds, sums, listByPos };
}
