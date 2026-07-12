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
 * Data-optimized presets for this league (12 teams, $200, 2 starting QBs).
 *
 * Slot prices come from a knapsack optimizer that crossed the league's own
 * 3-year price curve (priceCurve.ts — what the room actually pays for the Nth
 * player at each position) with 2025 season fantasy points by positional
 * finish rank, discounted for draft-rank uncertainty. Key findings:
 *
 *  - Mid QBs are the best-priced asset: QB7–11 cost $22–29 here and scored
 *    296–316 — every dollar returns ~6–7 pts vs ~4 for a $62 elite.
 *  - Elite RBs are a real tier (top 4 scored 328–366; RB5+ falls off fast),
 *    and mid RBs ($18–22 for RB10–15, 212–236 pts) are underpriced volume.
 *  - $40+ WRs are the league's worst buy (~3 pts/$); WR8–24 all scored within
 *    40 pts of each other, so $9–23 WRs lose almost nothing.
 *  - TE past #1 is flat (TE2–13 scored 121–167): pay $1–6 unless chasing the
 *    McBride-sized gap. DEF: $2 for the consensus top unit, never more.
 *  - Bench dollars buy zero starting-lineup points: every preset now spends
 *    $190 on starters and $10 on bench ($5 of it on the mandatory QB3).
 *
 * Every preset sums to exactly $200.
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
    id: "preset-optimal",
    name: "Max Points",
    description:
      "The unconstrained optimum from 2025 results × this league's price curve: two QBs from the underpriced " +
      "$24–29 pocket (QB7–11 scored 296–316), a ~$49 elite RB plus three $19–22 RBs filling both flexes, " +
      "punt WRs at $9–10 (WR8–24 scored within 40 pts of each other), $2 TE and DEF. Projects ~2,210 starter " +
      "pts — roughly 280 more than the league-average allocation.",
    slots: slots([
      ["qb1", "QB", 29], ["qb2", "QB", 27],
      ["rb1", "RB", 49], ["rb2", "RB", 22],
      ["wr1", "WR", 10], ["wr2", "WR", 9],
      ["te", "TE", 2], ["def", "DEF", 2],
      ["flex1", "RB", 21], ["flex2", "RB", 19],
      ["bench1", "QB", 5], ["bench2", "RB", 1], ["bench3", "RB", 1],
      ["bench4", "WR", 1], ["bench5", "WR", 1], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-heroqb",
    name: "Hero QB",
    description:
      "One true elite QB at ~$54 (QB1–4 scored 350–375) with a $13 QB2 from the QB14–17 tier, then the " +
      "optimizer's core: ~$49 stud RB plus three mid RBs. WRs are punted — $40+ WRs return only ~3 pts/$ " +
      "here, the worst star buy on the board. ~2,145 projected starter pts.",
    slots: slots([
      ["qb1", "QB", 54], ["qb2", "QB", 13],
      ["rb1", "RB", 49], ["rb2", "RB", 22],
      ["wr1", "WR", 6], ["wr2", "WR", 5],
      ["te", "TE", 2], ["def", "DEF", 2],
      ["flex1", "RB", 19], ["flex2", "RB", 18],
      ["bench1", "QB", 5], ["bench2", "RB", 1], ["bench3", "RB", 1],
      ["bench4", "WR", 1], ["bench5", "WR", 1], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-dualqb",
    name: "Dual Elite QB",
    description:
      "Two elites — but pay for the BOTTOM of the elite tier: QB5–6 go $35–43 here and scored within 25 pts " +
      "of the $62 guys. The backbone stays RB-heavy ($45 stud + $12–22 volume) and WR/TE are punted. " +
      "~2,160 projected starter pts.",
    slots: slots([
      ["qb1", "QB", 43], ["qb2", "QB", 35],
      ["rb1", "RB", 45], ["rb2", "RB", 22],
      ["wr1", "WR", 5], ["wr2", "WR", 5],
      ["te", "TE", 2], ["def", "DEF", 2],
      ["flex1", "RB", 19], ["flex2", "RB", 12],
      ["bench1", "QB", 5], ["bench2", "RB", 1], ["bench3", "RB", 1],
      ["bench4", "WR", 1], ["bench5", "WR", 1], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-valueqb",
    name: "Value QBs (Spread)",
    description:
      "Nothing over $30: two QBs at $27–29 (the QB7–9 pocket), four RBs at $19–29, and the only build that " +
      "buys a real WR2 ($23 + $12) and a mid TE ($6). Lowest variance in the room — no single bust sinks it. " +
      "~2,180 projected starter pts.",
    slots: slots([
      ["qb1", "QB", 29], ["qb2", "QB", 27],
      ["rb1", "RB", 29], ["rb2", "RB", 22],
      ["wr1", "WR", 23], ["wr2", "WR", 12],
      ["te", "TE", 6], ["def", "DEF", 2],
      ["flex1", "RB", 21], ["flex2", "RB", 19],
      ["bench1", "QB", 5], ["bench2", "RB", 1], ["bench3", "RB", 1],
      ["bench4", "WR", 1], ["bench5", "WR", 1], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-stars",
    name: "Stars & Scrubs",
    description:
      "Three studs — $54 QB, $49 RB, $52 WR — then nothing over $8. The data likes stars at QB and RB but " +
      "shows WR studs return only ~3.5 pts/$, so this is ceiling-chasing, not value (~2,065 projected pts). " +
      "Best deployed when the room is letting elite players go under their historical prices.",
    slots: slots([
      ["qb1", "QB", 54], ["qb2", "QB", 8],
      ["rb1", "RB", 49], ["rb2", "RB", 8],
      ["wr1", "WR", 52], ["wr2", "WR", 5],
      ["te", "TE", 3], ["def", "DEF", 2],
      ["flex1", "RB", 7], ["flex2", "TE", 2],
      ["bench1", "QB", 5], ["bench2", "RB", 1], ["bench3", "RB", 1],
      ["bench4", "WR", 1], ["bench5", "WR", 1], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-zerorb",
    name: "Zero RB",
    description:
      "If you punt RB ($5–7 starters), the money must go to the two alpha WRs ($52–59) — mid-priced WRs are " +
      "this league's worst asset, so don't spread it. Cheap TEs fill both flexes ($2–4 TEs scored 141–152, " +
      "basically free). ~2,060 projected pts: the data's least favorite build, kept as the RB-dead-zone hedge.",
    slots: slots([
      ["qb1", "QB", 29], ["qb2", "QB", 27],
      ["rb1", "RB", 7], ["rb2", "RB", 5],
      ["wr1", "WR", 59], ["wr2", "WR", 52],
      ["te", "TE", 4], ["def", "DEF", 2],
      ["flex1", "TE", 3], ["flex2", "TE", 2],
      ["bench1", "QB", 5], ["bench2", "RB", 1], ["bench3", "RB", 1],
      ["bench4", "WR", 1], ["bench5", "WR", 1], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-herorb",
    name: "Hero RB",
    description:
      "A ~$49 elite RB (the top 4 scored 328–366, a full tier above RB5+) with $12–13 volume behind him, two " +
      "$27–29 QBs from the value pocket, and real WRs at $21–23. Second-highest projection of any named build " +
      "(~2,165 pts) and the most balanced roster the data endorses.",
    slots: slots([
      ["qb1", "QB", 29], ["qb2", "QB", 27],
      ["rb1", "RB", 49], ["rb2", "RB", 13],
      ["wr1", "WR", 23], ["wr2", "WR", 21],
      ["te", "TE", 2], ["def", "DEF", 2],
      ["flex1", "RB", 12], ["flex2", "RB", 12],
      ["bench1", "QB", 5], ["bench2", "RB", 1], ["bench3", "RB", 1],
      ["bench4", "WR", 1], ["bench5", "WR", 1], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-elitete",
    name: "Elite TE",
    description:
      "Pay the $19 TE2 market price for a shot at the McBride-sized gap (TE1 outscored TE2 by 86 pts in 2025 " +
      "— but you're buying the chance, not the certainty). The rest is the optimizer core: $45 RB + volume, " +
      "$25–27 QBs, punted WRs. ~2,190 projected pts — sneaky-strong if the elite TE falls near $20.",
    slots: slots([
      ["qb1", "QB", 27], ["qb2", "QB", 25],
      ["rb1", "RB", 45], ["rb2", "RB", 22],
      ["wr1", "WR", 5], ["wr2", "WR", 5],
      ["te", "TE", 19], ["def", "DEF", 2],
      ["flex1", "RB", 21], ["flex2", "RB", 19],
      ["bench1", "QB", 5], ["bench2", "RB", 1], ["bench3", "RB", 1],
      ["bench4", "WR", 1], ["bench5", "WR", 1], ["bench6", "TE", 1],
    ]),
  },
];

/*
 * Snapshots of every previously shipped preset version. Migration compares a
 * profile's saved presets against these; an exact match means the user never
 * customized it, so it's safe to swap in the refreshed default. Anything the
 * user edited matches nothing here and is preserved untouched. A preset id can
 * appear multiple times (one entry per shipped generation).
 */
export const LEGACY_STRATEGIES: Strategy[] = [
  // --- generation 1: original launch presets ---
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
  // --- generation 2: research-backed superflex presets (pre data-optimization) ---
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
