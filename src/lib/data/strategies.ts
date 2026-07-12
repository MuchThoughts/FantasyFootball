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
 * Data-tuned presets for this league (12 teams, $200, 2 starting QBs).
 *
 * Prices were derived in two passes: a knapsack optimizer over the league's
 * 3-year price curve × 2025 finish points, then corrected against what the
 * players ACTUALLY DRAFTED in each price band went on to score (auction rank
 * is not finish rank — you don't get to buy the future QB8 by paying the QB8
 * price). What survives both passes:
 *
 *  - Mid QBs are the league's best asset: the actual $22–29 QB buys returned
 *    the same points as the $51+ elite cohort at half the price.
 *  - One elite RB is worth it: actual RB1–4 buys averaged ~286 pts. But the
 *    $19–22 RB band busted hard (~138 avg) while $8–18 RBs returned ~174 —
 *    buy ONE stud plus $12–18 volume, never a stack of $20 backs.
 *  - $40+ WRs are the biggest overpay (~178 pts for ~$47). The value band is
 *    $11–23 (~167 pts for ~$15). $9–10 WRs were a dead zone (~77 pts) — don't
 *    punt a starting WR slot below ~$11.
 *  - TE past the top guy is flat: pay $1–6 unless buying a true TE1 candidate.
 *    DEF is $1–2, always.
 *  - Starters get ~$186 of the $200; the $14 bench buys a usable ~$6 QB3
 *    (bye-week coverage is mandatory with 2 QB slots) and a ~$3 RB stash.
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
      "The reconciled best build: two mid-tier QBs at $24–29 (the league's actual buys in that pocket matched " +
      "the $51+ elites at half the price), one ~$50 elite RB with $12–18 volume behind him (the $19–22 RB band " +
      "busted; $8–18 returned more), and three WRs from the $13–20 value band — never $9–10, which was a dead " +
      "zone. $2 TE, $1 DEF, and a $14 bench anchored by a $6 QB3.",
    slots: slots([
      ["qb1", "QB", 29], ["qb2", "QB", 24],
      ["rb1", "RB", 50], ["rb2", "RB", 18],
      ["wr1", "WR", 20], ["wr2", "WR", 17],
      ["te", "TE", 2], ["def", "DEF", 1],
      ["flex1", "RB", 12], ["flex2", "WR", 13],
      ["bench1", "QB", 6], ["bench2", "RB", 3], ["bench3", "RB", 1],
      ["bench4", "WR", 2], ["bench5", "WR", 1], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-heroqb",
    name: "Hero QB",
    description:
      "One true elite QB at ~$54 with a $13 QB2 — you're paying for the healthy-elite ceiling (350–375 pts) " +
      "and wearing the injury risk that made the league's actual elite-QB buys break even with the mid tier. " +
      "The rest follows the data: ~$49 stud RB, $12–14 RB volume, and WRs from the $13–16 value band.",
    slots: slots([
      ["qb1", "QB", 54], ["qb2", "QB", 13],
      ["rb1", "RB", 49], ["rb2", "RB", 14],
      ["wr1", "WR", 16], ["wr2", "WR", 13],
      ["te", "TE", 2], ["def", "DEF", 1],
      ["flex1", "RB", 12], ["flex2", "RB", 12],
      ["bench1", "QB", 6], ["bench2", "RB", 3], ["bench3", "RB", 1],
      ["bench4", "WR", 2], ["bench5", "WR", 1], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-dualqb",
    name: "Dual Elite QB",
    description:
      "Two elites, but pay for the BOTTOM of the elite tier (QB5–6 go $35–43 here, within 25 pts of the $62 " +
      "guys when healthy). Highest concentration risk of any build — the league's one $91 dual-QB team was " +
      "wrecked by two injuries. Elsewhere: $45 stud RB, $9–13 RB volume, value-band WRs.",
    slots: slots([
      ["qb1", "QB", 43], ["qb2", "QB", 35],
      ["rb1", "RB", 45], ["rb2", "RB", 13],
      ["wr1", "WR", 14], ["wr2", "WR", 12],
      ["te", "TE", 2], ["def", "DEF", 1],
      ["flex1", "RB", 12], ["flex2", "RB", 9],
      ["bench1", "QB", 6], ["bench2", "RB", 3], ["bench3", "RB", 1],
      ["bench4", "WR", 2], ["bench5", "WR", 1], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-valueqb",
    name: "Value QBs (Spread)",
    description:
      "Nothing over $30: two QBs from the $27–29 pocket, RBs at $18–29 (skipping the busted $20–22 stack), " +
      "and three WRs from the $16–23 value band. Lowest variance in the room — no single bust sinks it — at " +
      "the cost of owning no elite-RB ceiling.",
    slots: slots([
      ["qb1", "QB", 29], ["qb2", "QB", 27],
      ["rb1", "RB", 29], ["rb2", "RB", 18],
      ["wr1", "WR", 23], ["wr2", "WR", 16],
      ["te", "TE", 6], ["def", "DEF", 1],
      ["flex1", "RB", 18], ["flex2", "WR", 19],
      ["bench1", "QB", 6], ["bench2", "RB", 3], ["bench3", "RB", 1],
      ["bench4", "WR", 2], ["bench5", "WR", 1], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-stars",
    name: "Stars & Scrubs",
    description:
      "Three studs — $54 QB, $49 RB, $52 WR — then nothing over $8. Pure ceiling play: the elite-WR leg is " +
      "the weakest by this league's realized returns, and no team that put 60%+ of budget into three players " +
      "finished top-5 last year. Use only when the room is letting elites go under their historical prices.",
    slots: slots([
      ["qb1", "QB", 54], ["qb2", "QB", 8],
      ["rb1", "RB", 49], ["rb2", "RB", 8],
      ["wr1", "WR", 52], ["wr2", "WR", 5],
      ["te", "TE", 3], ["def", "DEF", 1],
      ["flex1", "RB", 4], ["flex2", "TE", 2],
      ["bench1", "QB", 6], ["bench2", "RB", 3], ["bench3", "RB", 1],
      ["bench4", "WR", 2], ["bench5", "WR", 1], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-zerorb",
    name: "Zero RB",
    description:
      "Punt RB ($5–7 starters) and pour the savings into WRs. The catch in this league: expensive WRs are the " +
      "worst-priced asset, so even executed well this build fights the market — it's the hedge for when the " +
      "room's RB bidding gets irrational, not a default. Mid QBs, cheap TEs in the flex.",
    slots: slots([
      ["qb1", "QB", 29], ["qb2", "QB", 27],
      ["rb1", "RB", 7], ["rb2", "RB", 5],
      ["wr1", "WR", 52], ["wr2", "WR", 43],
      ["te", "TE", 4], ["def", "DEF", 1],
      ["flex1", "WR", 13], ["flex2", "TE", 5],
      ["bench1", "QB", 6], ["bench2", "RB", 3], ["bench3", "RB", 1],
      ["bench4", "WR", 2], ["bench5", "WR", 1], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-herorb",
    name: "Hero RB",
    description:
      "Pay up to the RB1–2 tier (~$59) for a true bell-cow — actual elite-RB buys averaged ~286 pts, the most " +
      "reliable expensive purchase in the league — with $12 RB volume behind him, two $25–27 QBs from the " +
      "value pocket, and $16–20 WRs. The closest sibling to Max Points, trading WR3 money for more RB1.",
    slots: slots([
      ["qb1", "QB", 27], ["qb2", "QB", 25],
      ["rb1", "RB", 59], ["rb2", "RB", 12],
      ["wr1", "WR", 20], ["wr2", "WR", 16],
      ["te", "TE", 2], ["def", "DEF", 1],
      ["flex1", "RB", 12], ["flex2", "RB", 12],
      ["bench1", "QB", 6], ["bench2", "RB", 3], ["bench3", "RB", 1],
      ["bench4", "WR", 2], ["bench5", "WR", 1], ["bench6", "TE", 1],
    ]),
  },
  {
    id: "preset-elitete",
    name: "Elite TE",
    description:
      "Pay the ~$19 TE2 market price only for a true TE1-overall candidate (the 2025 TE1 outscored TE2 by 86 " +
      "pts — you're buying that chance). Rest of the build: $45 RB + $13–15 volume, $25–27 QBs, value-band " +
      "WRs. If the elite TE goes past ~$22, bail to a $2 TE and slide the money to RB.",
    slots: slots([
      ["qb1", "QB", 27], ["qb2", "QB", 25],
      ["rb1", "RB", 45], ["rb2", "RB", 15],
      ["wr1", "WR", 16], ["wr2", "WR", 13],
      ["te", "TE", 19], ["def", "DEF", 1],
      ["flex1", "RB", 13], ["flex2", "RB", 12],
      ["bench1", "QB", 6], ["bench2", "RB", 3], ["bench3", "RB", 1],
      ["bench4", "WR", 2], ["bench5", "WR", 1], ["bench6", "TE", 1],
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
  // --- generation 3: first data-optimized pass (finish-curve model, pre correction
  // for auction-rank vs finish-rank) ---
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
