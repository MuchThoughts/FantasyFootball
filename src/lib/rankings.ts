import { Player } from "./data/players";
import { uid } from "./draftLogic";

/*
 * Rankings: uploadable, switchable, blendable player rankings.
 *
 * A RankingSource is an uploaded list mapping playerId -> overall rank (1..N,
 * dense). The built-in ADP from players.ts is always available as a virtual
 * source (BUILTIN_SOURCE_ID) and never stored.
 *
 * The active view is either one source or a weighted blend of several. Manual
 * overrides sit on top of whichever view is active, so hand edits survive
 * switching sources. The result is materialized as each player's `adp`
 * (effective overall rank 1..N) — everything downstream (board order,
 * positional rank -> price targets, tiers) already flows from adp.
 */

export const BUILTIN_SOURCE_ID = "builtin";
export const BUILTIN_SOURCE_NAME = "Built-in ADP";

export interface RankingSource {
  id: string;
  name: string;
  createdAt: string;
  ranks: Record<string, number>; // playerId -> overall rank (1..N, dense)
}

export interface RankingConfig {
  mode: "source" | "blend";
  activeSourceId: string; // used in "source" mode
  // Blend weight per source id; a source absent from the map defaults to
  // weight 1, so a fresh blend averages everything equally. 0 excludes.
  weights: Record<string, number>;
  overrides: Record<string, number>; // playerId -> manual overall rank
}

export function defaultRankingConfig(): RankingConfig {
  return { mode: "source", activeSourceId: BUILTIN_SOURCE_ID, weights: {}, overrides: {} };
}

// The built-in ADP as a dense 1..N rank map (raw adp values have gaps).
export function builtinRanks(players: Player[]): Record<string, number> {
  const ranks: Record<string, number> = {};
  [...players]
    .sort((a, b) => a.adp - b.adp)
    .forEach((p, i) => {
      ranks[uid(p.name)] = i + 1;
    });
  return ranks;
}

// All selectable sources: built-in first, then uploads in creation order.
export function allSources(players: Player[], uploaded: RankingSource[]): RankingSource[] {
  return [
    { id: BUILTIN_SOURCE_ID, name: BUILTIN_SOURCE_NAME, createdAt: "", ranks: builtinRanks(players) },
    ...uploaded,
  ];
}

export function blendWeight(config: RankingConfig, sourceId: string): number {
  const w = config.weights[sourceId];
  return typeof w === "number" && w >= 0 ? w : 1;
}

// Per-player blend score: weighted mean of each source's rank, where a player
// missing from a source counts as one past the bottom of that source's list —
// "unranked here" is a real (negative) signal, not a gap to skip.
function blendScores(sources: RankingSource[], config: RankingConfig, playerIds: string[]): Record<string, number> {
  const active = sources
    .map((s) => ({ s, w: blendWeight(config, s.id) }))
    .filter(({ s, w }) => w > 0 && Object.keys(s.ranks).length > 0);
  const scores: Record<string, number> = {};
  if (active.length === 0) return scores;
  const totalW = active.reduce((sum, { w }) => sum + w, 0);
  for (const id of playerIds) {
    let acc = 0;
    for (const { s, w } of active) {
      const size = Object.keys(s.ranks).length;
      acc += w * (s.ranks[id] ?? size + 1);
    }
    scores[id] = acc / totalW;
  }
  return scores;
}

// Materialize the active ranking as a new player array with adp = effective
// overall rank (1..N). Order: active source/blend score, unranked players
// after ranked ones in built-in order, then manual overrides inserted at
// their exact target ranks.
export function applyRanking(players: Player[], uploaded: RankingSource[], config: RankingConfig): Player[] {
  const sources = allSources(players, uploaded);
  const builtin = sources[0].ranks;
  const ids = players.map((p) => uid(p.name));

  let scores: Record<string, number>;
  if (config.mode === "blend") {
    scores = blendScores(sources, config, ids);
  } else {
    const src = sources.find((s) => s.id === config.activeSourceId) ?? sources[0];
    scores = src.ranks;
  }
  if (Object.keys(scores).length === 0) scores = builtin;

  const scoreOf = (p: Player) => {
    const id = uid(p.name);
    const s = scores[id];
    // Unranked players sort after every ranked one, keeping built-in order
    // among themselves (builtin ranks are dense, so /10000 stays < 1).
    return s !== undefined ? s : 1e6 + (builtin[id] ?? 1e6) / 10000;
  };

  const withOverride: { p: Player; rank: number }[] = [];
  const rest: Player[] = [];
  for (const p of players) {
    const o = config.overrides[uid(p.name)];
    if (typeof o === "number" && o >= 1) withOverride.push({ p, rank: o });
    else rest.push(p);
  }
  rest.sort((a, b) => scoreOf(a) - scoreOf(b) || (builtin[uid(a.name)] ?? 0) - (builtin[uid(b.name)] ?? 0));

  // Insert overridden players lowest target rank first so each lands exactly
  // where asked (relative to everyone placed so far).
  withOverride.sort((a, b) => a.rank - b.rank || scoreOf(a.p) - scoreOf(b.p));
  const ordered = [...rest];
  for (const { p, rank } of withOverride) {
    ordered.splice(Math.min(Math.max(rank - 1, 0), ordered.length), 0, p);
  }

  return ordered.map((p, i) => ({ ...p, adp: i + 1 }));
}

/* ---------------- upload parsing ---------------- */

export interface ParsedRanking {
  ranks: Record<string, number>; // playerId -> dense rank
  matched: number;
  unmatched: string[]; // names we couldn't match to a player on the board
}

// Aggressive name normalization for matching uploads to board players:
// lowercase, strip punctuation, drop generational suffixes.
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv|v)\b\.?$/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Split one CSV/TSV line into cells, honoring double quotes.
function splitLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (!inQuotes && (ch === "," || ch === "\t" || ch === ";")) {
      cells.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  cells.push(cur.trim());
  return cells.filter((c) => c.length > 0);
}

const POS_TOKEN = /^(qb|rb|wr|te|def|dst|d\/st|k)[0-9]*$/i;

/*
 * Parse a pasted/uploaded ranking list. Accepts flexible shapes:
 *   - one player name per line (rank = line order)
 *   - rank,name[,team,pos,...] in any column order (first numeric cell = rank)
 *   - a header row is skipped automatically
 * Names are matched to board players; "Josh Allen BUF" style trailing
 * team/pos tokens are tolerated. Ranks are re-densified to 1..N.
 */
export function parseRankingUpload(text: string, players: Player[]): ParsedRanking {
  const byNorm = new Map<string, string>(); // normalized name -> playerId
  for (const p of players) byNorm.set(normalizeName(p.name), uid(p.name));

  const matchCell = (cell: string): string | null => {
    const direct = byNorm.get(normalizeName(cell));
    if (direct) return direct;
    // tolerate trailing decorations: "Josh Allen BUF", "Josh Allen BUF QB1"
    const tokens = cell.split(/\s+/);
    for (let drop = 1; drop <= 2 && tokens.length - drop >= 2; drop++) {
      const m = byNorm.get(normalizeName(tokens.slice(0, tokens.length - drop).join(" ")));
      if (m) return m;
    }
    return null;
  };

  const entries: { id: string; rank: number }[] = [];
  const unmatched: string[] = [];
  const seen = new Set<string>();
  let ordinal = 0;

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  for (const line of lines) {
    const cells = splitLine(line);
    if (cells.length === 0) continue;

    let rank: number | null = null;
    let matchedId: string | null = null;
    let nameGuess = "";
    for (const cell of cells) {
      const asNum = Number(cell);
      if (rank === null && cell !== "" && Number.isFinite(asNum)) {
        rank = asNum;
        continue;
      }
      if (POS_TOKEN.test(cell)) continue;
      if (!matchedId) matchedId = matchCell(cell);
      if (cell.length > nameGuess.length && !Number.isFinite(asNum)) nameGuess = cell;
    }

    // header row: no player matched and it mentions column-ish words
    if (!matchedId && /\b(rank|player|name|pos|team|overall)\b/i.test(line) && entries.length === 0 && unmatched.length === 0) {
      continue;
    }

    ordinal++;
    if (matchedId) {
      if (!seen.has(matchedId)) {
        seen.add(matchedId);
        entries.push({ id: matchedId, rank: rank ?? ordinal });
      }
    } else if (nameGuess) {
      unmatched.push(nameGuess);
    }
  }

  // densify to 1..N in rank order (stable on upload order for ties)
  entries.sort((a, b) => a.rank - b.rank);
  const ranks: Record<string, number> = {};
  entries.forEach((e, i) => {
    ranks[e.id] = i + 1;
  });

  return { ranks, matched: entries.length, unmatched };
}
