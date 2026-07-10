import { Player } from "./data/players";
import { PRICE_CURVE } from "./data/priceCurve";
import { Strategy } from "./data/strategies";

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

export function uid(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
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
  keepers: Record<string, KeeperEntry>;
  drafted: Record<string, DraftedEntry>;
  playerMeta: Record<string, PlayerMetaEntry>;
  // Interest ratings (love/like/dislike) are scoped per strategy: playerId -> interest,
  // keyed by strategyId. Switching strategy shows that strategy's own ratings.
  interestByStrategy: Record<string, Record<string, Interest>>;
  tierOverrides: Record<string, number[]>;
  customPlayers: Player[];
  strategies: Strategy[];
  activeStrategyId: string;
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
  activeInterest: Record<string, Interest>
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
  POSITIONS.forEach((pos) => {
    const posRows = rankedRows.filter((r) => r.pos === pos);
    const n = posRows.length;
    positionCounts[pos] = n;

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

export interface StrategyTargets {
  targetIds: Set<string>;
  sums: Record<string, number>;
  listByPos: Record<string, BoardRow[]>;
}

// Single combined dropdown covering both draft/keeper ownership and scouting interest —
// a player is either an ownership state (Mine/Keeper/My Keeper) or an interest rating
// (Love/Like/Dislike), never both at once, so one value suffices.
export const STATUS_OPTIONS = [
  { value: "", label: "Open", color: "#3A3F4A", text: "#C9CCD2" },
  { value: "love", label: "Love", color: "#2E7D46", text: "#EDEEF0" },
  { value: "like", label: "Like", color: "#4C8F5B", text: "#EDEEF0" },
  { value: "dislike", label: "Dislike", color: "#A83A34", text: "#EDEEF0" },
  { value: "mine", label: "Mine", color: "#3B6FA0", text: "#EDEEF0" },
  { value: "keeper", label: "Keeper", color: "#8A5A2E", text: "#EDEEF0" },
  { value: "keeper-mine", label: "My Keeper", color: "#5B3F8A", text: "#EDEEF0" },
] as const;

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

export interface StrategyRecommendation {
  bestId: string;
  bestName: string;
  margin: number; // score gap between best and the active strategy, in budget fraction
  reasons: string[];
  // Qualitative advice from the stars signal, shown even when no strategy in the list
  // is configured top-heavy enough for the scores to separate on that axis.
  hint: string | null;
  scores: Record<string, number>;
}

// Scores each strategy against the market read: a strategy is favored when its budget
// is weighted toward positions/tiers the room is underpaying for, and away from where
// it's overpaying. Score units ≈ fraction of budget saved vs. paying target everywhere.
export function recommendStrategy(
  read: MarketRead,
  strategies: Strategy[],
  activeStrategyId: string
): StrategyRecommendation | null {
  if (read.samples < MIN_MARKET_SAMPLES || strategies.length < 2) return null;

  const scores: Record<string, number> = {};
  for (const s of strategies) {
    const total = s.slots.reduce((sum, sl) => sum + (Number(sl.amount) || 0), 0) || 1;
    let expectedCost = 0;
    POSITIONS.forEach((pos) => {
      const share = s.slots.filter((sl) => sl.pos === pos).reduce((sum, sl) => sum + (Number(sl.amount) || 0), 0) / total;
      const p = read.posInflation[pos];
      const infl = p && p.n >= MIN_SIGNAL_SAMPLES ? p.ratio : read.overall;
      expectedCost += share * infl;
    });
    let score = 1 - expectedCost;
    if (read.stars && read.stars.n >= MIN_SIGNAL_SAMPLES) {
      // Reward/punish budget concentration in star-priced slots on top of the position
      // signal — this is what separates Stars & Scrubs from a balanced build.
      const starsShare =
        s.slots.filter((sl) => (Number(sl.amount) || 0) >= STAR_TARGET_MIN).reduce((sum, sl) => sum + (Number(sl.amount) || 0), 0) /
        total;
      score += 0.6 * starsShare * (1 - read.stars.ratio);
    }
    scores[s.id] = score;
  }

  let best = strategies[0];
  for (const s of strategies) if (scores[s.id] > scores[best.id]) best = s;

  const reasons: string[] = [];
  const fmtDelta = (ratio: number) => `${ratio >= 1 ? "+" : "−"}${Math.abs(Math.round((ratio - 1) * 100))}%`;
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
  return { bestId: best.id, bestName: best.name, margin: scores[best.id] - activeScore, reasons, hint, scores };
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
