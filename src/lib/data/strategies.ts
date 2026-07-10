export interface StrategySlot {
  id: string;
  pos: "QB" | "RB" | "WR" | "TE" | "DEF";
  amount: number;
  fixed: boolean;
}

export interface Strategy {
  id: string;
  name: string;
  /** Why this build works and how to spend at each position — shown on the Strategy tab. */
  description?: string;
  slots: StrategySlot[];
}

type SlotSpec = [id: string, pos: StrategySlot["pos"], amount: number];

const FIXED_IDS = new Set(["qb1", "qb2", "rb1", "rb2", "wr1", "wr2", "te", "def"]);

function slots(specs: SlotSpec[]): StrategySlot[] {
  return specs.map(([id, pos, amount]) => ({ id, pos, amount, fixed: FIXED_IDS.has(id) }));
}

/*
 * Research-backed auction presets for this league's format (12 teams, $200,
 * 2 starting QBs — i.e. superflex economics). Slot amounts are calibrated to
 * this league's own historical price curve (see priceCurve.ts), so each $
 * figure maps to a real market rank. Every preset sums to exactly $200.
 *
 * Superflex consensus from the research:
 *  - Plan 35–45% of budget at QB; elite QBs go $42–65 here vs $14–22 in 1QB.
 *  - Roster 3 QBs — with every team starting two, waivers hold no startable QBs.
 *  - Spend ~70–90% on starters; keep $1–2 per bench slot so you're never shut out.
 */
export const DEFAULT_STRATEGIES: Strategy[] = [
  {
    id: "preset-balanced",
    name: "League Average",
    description:
      "The market baseline: what this league has historically paid at every slot (~75% starters / 25% bench, " +
      "~26% at QB). Use it to spot when the room is over- or underpaying a position, then pivot to the preset " +
      "that attacks the discount.",
    slots: slots([
      ["qb1", "QB", 28], ["qb2", "QB", 12],
      ["rb1", "RB", 28], ["rb2", "RB", 13],
      ["wr1", "WR", 26], ["wr2", "WR", 11],
      ["te", "TE", 12], ["def", "DEF", 1],
      ["flex1", "RB", 10], ["flex2", "WR", 10],
      ["bench1", "QB", 11], ["bench2", "RB", 9], ["bench3", "RB", 8],
      ["bench4", "WR", 10], ["bench5", "WR", 10], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-heroqb",
    name: "Hero QB",
    description:
      "Pay up ($50–55) for one elite every-week QB, pair him with a ~$14 QB2 from the QB12–15 tier, and stash a " +
      "$5–8 QB3 — three QBs total, since superflex waivers hold no starters. QB lands at ~$76 (38%), inside the " +
      "35–45% consensus band, while still funding a ~$28 RB1 and ~$24 WR1.",
    slots: slots([
      ["qb1", "QB", 55], ["qb2", "QB", 14],
      ["rb1", "RB", 28], ["rb2", "RB", 13],
      ["wr1", "WR", 24], ["wr2", "WR", 12],
      ["te", "TE", 5], ["def", "DEF", 1],
      ["flex1", "RB", 10], ["flex2", "WR", 10],
      ["bench1", "QB", 7], ["bench2", "RB", 6], ["bench3", "RB", 4],
      ["bench4", "WR", 6], ["bench5", "WR", 4], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-dualqb",
    name: "Dual Elite QB",
    description:
      "Lock up two top-6 QBs (~$52 + $36 at this league's prices) and simply win the highest-scoring, most stable " +
      "position every week. ~46% of budget at QB is the top of the superflex range, so everywhere else you hunt " +
      "value: $12–21 RBs and WRs, a $5 TE, and a $4 QB3 flier.",
    slots: slots([
      ["qb1", "QB", 52], ["qb2", "QB", 36],
      ["rb1", "RB", 21], ["rb2", "RB", 12],
      ["wr1", "WR", 21], ["wr2", "WR", 12],
      ["te", "TE", 5], ["def", "DEF", 1],
      ["flex1", "RB", 9], ["flex2", "WR", 9],
      ["bench1", "QB", 4], ["bench2", "RB", 5], ["bench3", "RB", 3],
      ["bench4", "WR", 5], ["bench5", "WR", 4], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-valueqb",
    name: "Value QBs (Spread)",
    description:
      "Skip the $50+ QB bidding wars and buy two stable starters from the QB8–13 tier ($20–27 each), then spread " +
      "the savings into the deepest lineup in the room — six players at $12–29. Lowest-variance build: no single " +
      "injury sinks the season, and the depth doubles as trade ammo.",
    slots: slots([
      ["qb1", "QB", 27], ["qb2", "QB", 20],
      ["rb1", "RB", 29], ["rb2", "RB", 19],
      ["wr1", "WR", 28], ["wr2", "WR", 20],
      ["te", "TE", 9], ["def", "DEF", 1],
      ["flex1", "RB", 12], ["flex2", "WR", 12],
      ["bench1", "QB", 6], ["bench2", "RB", 5], ["bench3", "RB", 3],
      ["bench4", "WR", 4], ["bench5", "WR", 4], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-stars",
    name: "Stars & Scrubs",
    description:
      "Concentrate ~75% of budget in three studs — elite QB (~$52), elite RB (~$55), top-4 WR (~$44) — then fill " +
      "out with $1–8 fliers and work the waiver wire hard. Maximum ceiling, thin depth: best when the room " +
      "overpays mid-tier players, leaving real $1–2 values at the end.",
    slots: slots([
      ["qb1", "QB", 52], ["qb2", "QB", 14],
      ["rb1", "RB", 55], ["rb2", "RB", 8],
      ["wr1", "WR", 44], ["wr2", "WR", 8],
      ["te", "TE", 2], ["def", "DEF", 1],
      ["flex1", "RB", 5], ["flex2", "WR", 5],
      ["bench1", "QB", 1], ["bench2", "RB", 1], ["bench3", "RB", 1],
      ["bench4", "WR", 1], ["bench5", "WR", 1], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-zerorb",
    name: "Zero RB",
    description:
      "Fade the RB bidding wars: cap both RB starters at $4–6, load up on four WRs ($12–40) plus two solid QBs " +
      "($40/$22). RBs get hurt and lose jobs far more often than WRs — spend bench dollars on upside RB stashes " +
      "who can inherit a backfield mid-season.",
    slots: slots([
      ["qb1", "QB", 40], ["qb2", "QB", 22],
      ["rb1", "RB", 6], ["rb2", "RB", 4],
      ["wr1", "WR", 40], ["wr2", "WR", 25],
      ["te", "TE", 6], ["def", "DEF", 1],
      ["flex1", "WR", 16], ["flex2", "WR", 12],
      ["bench1", "QB", 6], ["bench2", "RB", 5], ["bench3", "RB", 4],
      ["bench4", "WR", 7], ["bench5", "WR", 5], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-herorb",
    name: "Hero RB",
    description:
      "One true bell-cow RB (~$55) anchors the roster while RB2 stays cheap ($6); two mid-tier QBs ($35/$20) keep " +
      "you competitive at superflex and WR depth carries the rest. You capture the scarce elite-RB edge without " +
      "paying the double-stud premium.",
    slots: slots([
      ["qb1", "QB", 35], ["qb2", "QB", 20],
      ["rb1", "RB", 55], ["rb2", "RB", 6],
      ["wr1", "WR", 22], ["wr2", "WR", 17],
      ["te", "TE", 5], ["def", "DEF", 1],
      ["flex1", "WR", 10], ["flex2", "WR", 10],
      ["bench1", "QB", 5], ["bench2", "RB", 4], ["bench3", "RB", 3],
      ["bench4", "WR", 4], ["bench5", "WR", 2], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-elitete",
    name: "Elite TE",
    description:
      "This league's history prices the TE1 at just ~$23 while an elite TE returns weekly top-flex value — pay " +
      "the ~$20, win the position outright, and still fit a ~$44 QB1 and ~$28 RB1. Everyone else fights over the " +
      "$1–6 TE scrubs all season.",
    slots: slots([
      ["qb1", "QB", 44], ["qb2", "QB", 16],
      ["rb1", "RB", 28], ["rb2", "RB", 12],
      ["wr1", "WR", 24], ["wr2", "WR", 12],
      ["te", "TE", 20], ["def", "DEF", 1],
      ["flex1", "RB", 9], ["flex2", "WR", 9],
      ["bench1", "QB", 6], ["bench2", "RB", 6], ["bench3", "RB", 4],
      ["bench4", "WR", 5], ["bench5", "WR", 3], ["bench6", "TE", 1],
    ]),
  },
];

// Snapshot of the presets as they shipped before the research-backed overhaul.
// Used only to detect saved copies the user never customized, so migration can
// swap them for the new defaults without touching anything user-edited.
export const LEGACY_STRATEGIES: Strategy[] = [
  {
    id: "preset-balanced",
    name: "League Average",
    slots: slots([
      ["qb1", "QB", 28], ["qb2", "QB", 12],
      ["rb1", "RB", 28], ["rb2", "RB", 13],
      ["wr1", "WR", 26], ["wr2", "WR", 11],
      ["te", "TE", 12], ["def", "DEF", 1],
      ["flex1", "RB", 10], ["flex2", "WR", 10],
      ["bench1", "QB", 11], ["bench2", "RB", 9], ["bench3", "RB", 8],
      ["bench4", "WR", 10], ["bench5", "WR", 10], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-stars",
    name: "Stars & Scrubs",
    slots: slots([
      ["qb1", "QB", 28], ["qb2", "QB", 12],
      ["rb1", "RB", 30], ["rb2", "RB", 13],
      ["wr1", "WR", 27], ["wr2", "WR", 11],
      ["te", "TE", 12], ["def", "DEF", 1],
      ["flex1", "RB", 10], ["flex2", "RB", 9],
      ["bench1", "RB", 9], ["bench2", "RB", 8], ["bench3", "RB", 8],
      ["bench4", "WR", 11], ["bench5", "WR", 10], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-qbanchor",
    name: "QB Anchor",
    slots: slots([
      ["qb1", "QB", 27], ["qb2", "QB", 12],
      ["rb1", "RB", 27], ["rb2", "RB", 13],
      ["wr1", "WR", 26], ["wr2", "WR", 11],
      ["te", "TE", 12], ["def", "DEF", 1],
      ["flex1", "RB", 10], ["flex2", "WR", 10],
      ["bench1", "QB", 11], ["bench2", "QB", 10], ["bench3", "RB", 9],
      ["bench4", "WR", 10], ["bench5", "WR", 10], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-zerorb",
    name: "Zero RB",
    slots: slots([
      ["qb1", "QB", 27], ["qb2", "QB", 12],
      ["rb1", "RB", 28], ["rb2", "RB", 13],
      ["wr1", "WR", 26], ["wr2", "WR", 11],
      ["te", "TE", 12], ["def", "DEF", 1],
      ["flex1", "WR", 10], ["flex2", "WR", 10],
      ["bench1", "QB", 11], ["bench2", "RB", 10], ["bench3", "WR", 10],
      ["bench4", "WR", 9], ["bench5", "WR", 9], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-robustrb",
    name: "Robust RB",
    slots: slots([
      ["qb1", "QB", 31], ["qb2", "QB", 12],
      ["rb1", "RB", 29], ["rb2", "RB", 13],
      ["wr1", "WR", 27], ["wr2", "WR", 11],
      ["te", "TE", 12], ["def", "DEF", 1],
      ["flex1", "RB", 10], ["flex2", "RB", 9],
      ["bench1", "RB", 9], ["bench2", "RB", 8], ["bench3", "RB", 8],
      ["bench4", "RB", 8], ["bench5", "WR", 11], ["bench6", "TE", 1],
    ]),
  },
];
