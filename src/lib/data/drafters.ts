// League-mate draft profiles, built from the 2023–2025 auction results and the
// official keeper spreadsheet (2026.01.08 FFL Draft & Keeper Results).
//
// Team → owner mapping was reconstructed from keeper-price continuity (+$5/yr):
// "I'd rather be f..." (2023) kept CMC $54→$59 and CeeDee $40→$45 as VFL, so it's
// David; "NPF's Bookie" (2023) is Kyle (his $3 D'Andre Swift became Benjels' $8
// keep). All stats below therefore cover three full drafts for every owner.
//
// Metric definitions:
// - picksTo120: sorted by price, how many players it takes to hit $120 of the
//   $200 budget (keepers included). Lower = more top-heavy. League avg 3.6.
// - onesPerYear: $1 non-DEF auction buys per draft (keeper-lottery tickets).
//   League avg 4.0.
// - top3Share: % of total spend on their three most expensive players.
// - earlyShare: % of budget committed by the end of nomination round 4
//   (keepers count as pre-committed). League money overall is ~70% gone by then.
// - posShare/posDelta: 3-yr avg % of budget per position, and the difference
//   vs the league's 3-yr average (QB 28.8 / RB 31.8 / WR 34.1 / TE 4.7 / DEF 0.4).
//
// Keeper rules encoded here: keeper cost = last salary + $5, undrafted = $10,
// a player can be kept at most two consecutive years ("2nd keep" = final year).
//
// Keeper options are valued against CURRENT 2026 rankings (PLAYERS_DATA), not
// 2025 finishes — players change teams and situations. Market $ = the league's
// 3-yr price curve (PRICE_CURVE) at the player's 2026 positional rank; a keep
// is "likely" when it beats market or clearly fits the owner's pattern.

export interface KeeperOption {
  player: string;
  pos: string;
  cost: number;
  note: string;
  likely?: boolean;
}

export interface OwnerInsight {
  owner: string;
  team: string; // current (2026) team name
  teamHistory?: string; // older names, if they rebrand
  archetype: string;
  picksTo120: number;
  onesPerYear: number;
  top3Share: number;
  earlyShare: number;
  maxEver: { player: string; price: number; year: number };
  posShare: Record<string, number>;
  posDelta: Record<string, number>;
  reads: string[];
  loyalty: string[];
  keeperHistory: string;
  keeperOptions: KeeperOption[];
  keeperOutlook: string;
}

export const LEAGUE_AVG = {
  picksTo120: 3.6,
  onesPerYear: 4.0,
  posShare: { QB: 28.8, RB: 31.8, WR: 34.1, TE: 4.7, DEF: 0.4 } as Record<string, number>,
};

export const OWNER_INSIGHTS: OwnerInsight[] = [
  {
    owner: "Sean",
    team: "Digging Out of a Burrow",
    teamHistory: "was Ties are for Soccer",
    archetype: "QB-rich, patient builder",
    picksTo120: 4.0,
    onesPerYear: 2.7,
    top3Share: 55.2,
    earlyShare: 68,
    maxEver: { player: "Jalen Hurts", price: 59, year: 2023 },
    posShare: { QB: 40.2, RB: 30.5, WR: 27.3, TE: 1.5, DEF: 0.3 },
    posDelta: { QB: 11.4, RB: -1.3, WR: -6.8, TE: -3.2, DEF: -0.1 },
    reads: [
      "Self-scout: you're the 2nd-biggest QB spender ($93 on Burrow + Daniels in '25) and dead last in TE spend (1.5% vs 4.7% league).",
      "You buy fewer $1 fliers than almost anyone (2.7/yr vs 4.0) — that's fewer cheap-keeper lottery tickets. The strategy doc's rounds 13–16 plan fixes this.",
      "Patient structure (4 picks to $120, league-low top-heaviness) is your edge — you're the biggest wallet in rounds 3–6 when the value cliff hits.",
    ],
    loyalty: ["Jayden Daniels", "Jameson Williams", "Cooper Kupp", "David Montgomery", "James Conner"],
    keeperHistory: "2024: Kupp $25, Montgomery $11 · 2025: Daniels $42, Jameson Williams $7",
    keeperOptions: [
      { player: "George Pickens", pos: "WR", cost: 16, likely: true, note: "2026 WR13 after the Dallas breakout — market ~$20, real surplus at $16" },
      { player: "Matthew Stafford", pos: "QB", cost: 15, likely: true, note: "2026 QB14 — a startable second QB at market price in a 2QB league" },
      { player: "Cam Skattebo", pos: "RB", cost: 10, note: "2026 RB22, market ~$10 — breakeven flex depth if you want a third hold" },
      { player: "Rico Dowdle", pos: "RB", cost: 6, note: "Traded to Pittsburgh into a committee — 2026 RB35, market ~$3. The '25 surplus is gone" },
      { player: "Jaylen Waddle", pos: "WR", cost: 16, note: "Traded to Denver — 2026 WR25, market ~$9. Throw back" },
      { player: "Jayden Daniels", pos: "QB", cost: 47, note: "2nd keep. Still 2026 QB7, but market ~$29 — an $18 overpay. Throw back and shop the cliff" },
    ],
    keeperOutlook: "Best pair by 2026 rank: Pickens $16 + Stafford $15 = a WR2 and a starting QB for $31, entering the auction with $169 and QB1 money intact.",
  },
  {
    owner: "Adam",
    team: "Vols2TheWall",
    archetype: "TE spender, fast starter",
    picksTo120: 3.7,
    onesPerYear: 4.0,
    top3Share: 57.2,
    earlyShare: 80,
    maxEver: { player: "Garrett Wilson", price: 46, year: 2024 },
    posShare: { QB: 31.8, RB: 32.7, WR: 21.5, TE: 13.3, DEF: 0.5 },
    posDelta: { QB: 3.0, RB: 0.9, WR: -12.6, TE: 8.6, DEF: 0.1 },
    reads: [
      "The league's only real TE buyer: Kelce $42 and $27, plus Pitts, Bowers, LaPorta — +8.6 pts of budget vs league. If you want a TE, he's the one bidding against you.",
      "Starves WR to do it: -12.6 pts vs league, the lowest WR share of anyone. He rarely contests the WR value rounds — shop there freely.",
      "Fastest sustained starter: ~80% of budget gone by nomination round 4 in all three drafts. Bid him up rounds 1–3, ignore him after.",
      "Roster churner — trades actively in-season (acquired Bowers and Geno mid-'25), so his keeper pool isn't just his draft.",
    ],
    loyalty: ["Travis Kelce", "Tua Tagovailoa", "Trevor Lawrence", "Courtland Sutton", "Nico Collins", "Sam LaPorta"],
    keeperHistory: "2024: Nico Collins $6 · 2025: Darnold $9, Sutton $7",
    keeperOptions: [
      { player: "Brock Bowers", pos: "TE", cost: 12, likely: true, note: "2026 TE2, market ~$19 — he traded for him and he pays TE premiums; near-lock" },
      { player: "James Cook", pos: "RB", cost: 36, likely: true, note: "2026 RB6, market ~$40 — a big tag that's now actually below market" },
      { player: "Daniel Jones", pos: "QB", cost: 6, note: "2026 QB22 — roughly market at $6, but a startable-QB tag fits his cheap-keep pattern" },
      { player: "Zay Flowers", pos: "WR", cost: 16, note: "2026 WR19, market ~$12 — modest overpay now" },
      { player: "Courtland Sutton", pos: "WR", cost: 12, note: "2nd keep, but he fell to 2026 WR35 — market ~$3" },
      { player: "Geno Smith", pos: "QB", cost: 14, note: "2026 QB31 — dead money" },
    ],
    keeperOutlook: "Bowers $12 is the anchor; the real call is Cook $36 (below market but pricey) vs D. Jones $6 (his usual cheap-QB keep). Either way TE is solved before the room sits down.",
  },
  {
    owner: "David",
    team: "VFL",
    teamHistory: "was I'd rather be f... in '23",
    archetype: "QB punter, no dumpster-diver",
    picksTo120: 3.7,
    onesPerYear: 1.0,
    top3Share: 56.8,
    earlyShare: 74,
    maxEver: { player: "Christian McCaffrey (keeper)", price: 59, year: 2024 },
    posShare: { QB: 18.8, RB: 36.9, WR: 38.3, TE: 5.3, DEF: 0.3 },
    posDelta: { QB: -10.0, RB: 5.1, WR: 4.2, TE: 0.6, DEF: -0.1 },
    reads: [
      "The biggest QB punter over three years (-10 pts vs league; $26 total QB room in '24) — he's a core reason QB7–13 go cheap. But '25 he pivoted: Dak $26 + McCarthy $25, so don't assume he stays out.",
      "Never shops the $1 bin: zero $1 non-DEF buys in '24 AND '25 (league avg is 4/yr). His bench is $2–$11 veterans, not lottery tickets.",
      "Will keep at the very top when he has an elite: kept CMC $59 + CeeDee $45 in '24 — $104 pre-committed. If his keepers are cheap, he has stud money.",
    ],
    loyalty: ["Christian McCaffrey", "CeeDee Lamb", "Tony Pollard", "Chase Brown", "Brock Bowers", "Kirk Cousins"],
    keeperHistory: "2024: CMC $59, CeeDee $45 · 2025: Chase Brown $10, Bowers $7",
    keeperOptions: [
      { player: "Chase Brown", pos: "RB", cost: 15, likely: true, note: "2nd keep. 2026 RB9, market ~$29 — the clearest surplus on his roster" },
      { player: "Sam Darnold", pos: "QB", cost: 14, note: "Fell to 2026 QB23 in Seattle, market ~$3 — the QB-punt fit is gone" },
      { player: "Breece Hall", pos: "RB", cost: 26, note: "2026 RB19, market ~$12 — a $14 overpay" },
      { player: "Ricky Pearsall", pos: "WR", cost: 16, note: "2026 WR41 — throw back" },
      { player: "Malik Nabers", pos: "WR", cost: 46, note: "Still WR10 talent, but market ~$22 coming off the injury — a $24 gamble" },
    ],
    keeperOutlook: "Chase Brown $15 is his only clear keep by 2026 ranks. If he holds just Brown he enters with $185 of stud money — and don't assume the QB punt holds after his '25 Dak+McCarthy pivot.",
  },
  {
    owner: "Doug",
    team: "Turbo Team",
    archetype: "RB-anchor loyalist",
    picksTo120: 3.7,
    onesPerYear: 4.3,
    top3Share: 56.8,
    earlyShare: 73,
    maxEver: { player: "Bijan Robinson / Saquon Barkley", price: 63, year: 2024 },
    posShare: { QB: 20.2, RB: 40.0, WR: 37.5, TE: 1.8, DEF: 0.3 },
    posDelta: { QB: -8.6, RB: 8.2, WR: 3.4, TE: -2.9, DEF: -0.1 },
    reads: [
      "Paid exactly $63 for the top RB two years running (Bijan '24, Saquon '25). Nominate an elite RB in round 1 and he will bite.",
      "QB punter at auction (-8.6 pts) who solves QB via cheap keepers instead (Nix $8). He won't fight you at the QB cliff.",
      "The league's most loyal drafter: Puka 3 straight years, Charbonnet 3 straight, Purdy, Nix, Freiermuth, Washington DEF twice. Nominate HIS guys and he'll pay a loyalty tax.",
      "Punts TE harder than anyone but you (1.8%).",
    ],
    loyalty: ["Puka Nacua", "Zach Charbonnet", "Brock Purdy", "Bo Nix", "DJ Moore", "Pat Freiermuth"],
    keeperHistory: "2024: Pacheco $16, Puka $6 · 2025: Puka $11, Nix $8",
    keeperOptions: [
      { player: "Jaxson Dart", pos: "QB", cost: 12, likely: true, note: "2026 QB9, market ~$25 — the best surplus on his roster" },
      { player: "Bo Nix", pos: "QB", cost: 13, likely: true, note: "2nd keep. 2026 QB11, market ~$23 — still ~$10 of surplus" },
      { player: "Zach Charbonnet", pos: "RB", cost: 11, note: "His guy three years running, but 2026 RB47 — loyalty would cost ~$10 over market" },
      { player: "Xavier Worthy", pos: "WR", cost: 20, note: "2026 WR55 — throw back" },
      { player: "Saquon Barkley", pos: "RB", cost: 68, note: "2026 RB12, market ~$19 — the easiest throwback in the league; he'll re-shop the RB1 tier" },
    ],
    keeperOutlook: "Likely Nix $13 + Dart $12 → $175 with two top-11 2026 QBs locked, which is exactly how he funds another $60+ RB1. Puka is ineligible (two keeps used).",
  },
  {
    owner: "Grayson",
    team: "Scattered Smothered Covered",
    archetype: "Josh Allen tax payer",
    picksTo120: 3.7,
    onesPerYear: 4.7,
    top3Share: 59.2,
    earlyShare: 83,
    maxEver: { player: "Josh Allen", price: 62, year: 2025 },
    posShare: { QB: 34.0, RB: 25.0, WR: 35.5, TE: 4.8, DEF: 0.5 },
    posDelta: { QB: 5.2, RB: -6.8, WR: 1.4, TE: 0.1, DEF: 0.1 },
    reads: [
      "Pays for Josh Allen, specifically: $59 in '23, $62 in '25, and $95 total on QB in '25 (Allen + Love $33). Never bid-war him for Allen — just make it cost $65+.",
      "Chronically RB-light (-6.8 pts): his RB room is the $11–13 tier (Warren, Mason, Mostert, Stevenson). He won't contest your RB1/RB2 buys.",
      "Historically the fastest money out the door: 88–90% of budget spent by round 4 in '23–'24. He cooled to 70% in '25 — the keeper era slowed him down.",
      "Keeps ascending young WRs (JSN, BTJ) — he's building WR depth via keepers, not auction.",
    ],
    loyalty: ["Josh Allen", "Jaxon Smith-Njigba", "Jonathan Taylor", "C.J. Stroud"],
    keeperHistory: "2024: J. Taylor $21, Stroud $6 · 2025: JSN $14, Brian Thomas Jr. $9",
    keeperOptions: [
      { player: "Jaxon Smith-Njigba", pos: "WR", cost: 19, likely: true, note: "2nd keep. 2026 WR3, market ~$51 — a $30+ surplus, second-best keep in the league" },
      { player: "Trey McBride", pos: "TE", cost: 27, likely: true, note: "2026 TE1, market ~$23 — a small premium for the only elite TE in a 2-flex league" },
      { player: "Josh Allen", pos: "QB", cost: 67, note: "Nearly fair now vs his usual $62 auction price — keeping would dodge the bidding war entirely" },
      { player: "Brian Thomas Jr.", pos: "WR", cost: 14, note: "2nd keep, but he fell to 2026 WR38 after the lost season — market ~$3, no longer keepable" },
      { player: "Terry McLaurin", pos: "WR", cost: 25, note: "2026 WR21, market ~$12" },
    ],
    keeperOutlook: "JSN $19 is a lock. BTJ's collapse opens the second slot: McBride $27 or even Allen $67 (near-fair now) are the live options. Either way, expect the Allen money to be there a third time.",
  },
  {
    owner: "Jonathan",
    team: "AFC Richmond",
    archetype: "QB hoarder",
    picksTo120: 4.0,
    onesPerYear: 5.0,
    top3Share: 56.2,
    earlyShare: 82,
    maxEver: { player: "Josh Allen", price: 62, year: 2024 },
    posShare: { QB: 32.3, RB: 30.2, WR: 33.0, TE: 4.0, DEF: 0.3 },
    posDelta: { QB: 3.5, RB: -1.6, WR: -1.1, TE: -0.7, DEF: -0.1 },
    reads: [
      "Drafted exactly FOUR QBs in all three drafts — the 2QB-league corner move. He's your only rival for $1–6 QB3s; buy yours a round before he starts.",
      "Structure swings wildly: '24 was stars-and-scrubs (Allen $62 + Jefferson $53, 72% top-3, eight $1 players), '25 was spread. Read his first two buys to know which mode he's in.",
      "The best flier-to-keeper converter: turned $6 Bucky and $6 Fields into keeps. He drafts the $1–6 rounds with next year in mind.",
    ],
    loyalty: ["Breece Hall", "Anthony Richardson", "Justin Fields", "Nick Chubb"],
    keeperHistory: "2024: Richardson $29, Breece $28 · 2025: Bucky $6, Fields $6",
    keeperOptions: [
      { player: "Bucky Irving", pos: "RB", cost: 11, likely: true, note: "2nd keep. 2026 RB20, market ~$11 — breakeven, but the best tag he holds" },
      { player: "Tyler Warren", pos: "TE", cost: 10, note: "2026 TE4, market ~$6 — a small overpay for real TE production" },
      { player: "Tucker Kraft", pos: "TE", cost: 8, note: "2026 TE7 coming off the ACL — market ~$4" },
      { player: "Rome Odunze", pos: "WR", cost: 13, note: "2026 WR29, market ~$6" },
      { player: "Cam Ward", pos: "QB", cost: 11, note: "2026 QB26 — even his QB-hoard instinct can't justify it" },
      { player: "Ashton Jeanty", pos: "RB", cost: 52, note: "2026 RB7, market ~$39 — a $13 overpay on a big number" },
    ],
    keeperOutlook: "The thinnest keeper slate in the league by 2026 ranks — nothing beats market. If he throws it all back he enters with $200 and the 4-QB habit intact; price your QB3 accordingly.",
  },
  {
    owner: "Josh",
    team: "SHHH...IT FLOWS DOWNHILL",
    archetype: "WR-heavy, never keeps",
    picksTo120: 3.7,
    onesPerYear: 5.3,
    top3Share: 58.2,
    earlyShare: 82,
    maxEver: { player: "Ja'Marr Chase", price: 50, year: 2024 },
    posShare: { QB: 19.8, RB: 32.3, WR: 43.8, TE: 3.2, DEF: 0.5 },
    posDelta: { QB: -9.0, RB: 0.5, WR: 9.7, TE: -1.5, DEF: 0.1 },
    reads: [
      "Has NEVER kept a player — zero keepers in '24 and '25, full $200 both years. If the streak holds he enters with an open roster and the biggest bankroll.",
      "The league's heaviest WR spender (+9.7 pts): he's your main competition in the WR rounds 3–6 value window.",
      "QB bargain-shopper: never over $24 (Watson $22, Rodgers $20, Caleb $24, Goff $20) — a fellow architect of the cheap-QB market.",
      "Buys mid-priced veterans over youth — his roster ages, which is partly why he never has keepers worth keeping.",
    ],
    loyalty: ["Amon-Ra St. Brown", "Aaron Rodgers", "D'Andre Swift"],
    keeperHistory: "2024: none · 2025: none — the league's only serial non-keeper",
    keeperOptions: [
      { player: "Caleb Williams", pos: "QB", cost: 29, likely: true, note: "2026 QB6, market ~$35 — the one tag on his roster with actual surplus, in a 2QB league" },
      { player: "Amon-Ra St. Brown", pos: "WR", cost: 44, note: "2026 WR4 — dead-on market price; he can just re-buy him, and has twice" },
      { player: "Jonathan Taylor", pos: "RB", cost: 47, note: "2026 RB4, market ~$45 — the rushing crown is already priced in; fair, not a bargain" },
      { player: "D'Andre Swift", pos: "RB", cost: 14, note: "2026 RB26, market ~$6" },
    ],
    keeperOutlook: "Still the coin flip of the league: Caleb $29 is the only real value, but he has never kept anyone. If the streak holds, plan for him to bully the WR middle rounds with $200.",
  },
  {
    owner: "Kyle",
    team: "Benjels",
    teamHistory: "was NPF's Bookie in '23",
    archetype: "Two-anchor stars & scrubs",
    picksTo120: 3.0,
    onesPerYear: 5.3,
    top3Share: 63.3,
    earlyShare: 81,
    maxEver: { player: "Amon-Ra St. Brown", price: 56, year: 2024 },
    posShare: { QB: 31.3, RB: 37.0, WR: 29.3, TE: 1.7, DEF: 0.5 },
    posDelta: { QB: 2.5, RB: 5.2, WR: -4.8, TE: -3.0, DEF: 0.1 },
    reads: [
      "The most predictable structure in the league: two $40+ anchors and $120 spent in EXACTLY 3 players, all three years. When his second anchor lands, his draft is functionally over.",
      "After the anchors he lives in the $1–9 bin — beat him on any $10–25 player in rounds 5–8; he can't respond.",
      "RB-tilted (+5.2) and pays for elite RB specifically: Gibbs $44, then kept him at $49. Punts TE ($5 Kelce, $3 Goedert).",
    ],
    loyalty: ["Jahmyr Gibbs", "Tee Higgins", "D'Andre Swift"],
    keeperHistory: "2024: Love $16, Swift $8 · 2025: Gibbs $49, Tee Higgins $20",
    keeperOptions: [
      { player: "Chris Olave", pos: "WR", cost: 10, likely: true, note: "2026 WR12, market ~$21 — quietly the best value on his roster" },
      { player: "Jahmyr Gibbs", pos: "RB", cost: 54, likely: true, note: "2nd keep, final year. 2026 RB2, market ~$59 — still below market for his kind of anchor" },
      { player: "Colston Loveland", pos: "TE", cost: 6, note: "2026 TE3, market ~$9 — small surplus that fits his TE-punt budget" },
      { player: "DeVonta Smith", pos: "WR", cost: 23, note: "2026 WR16, market ~$17" },
      { player: "Tee Higgins", pos: "WR", cost: 25, note: "2nd keep; 2026 WR18, market ~$16" },
      { player: "Woody Marks", pos: "RB", cost: 7, note: "2026 RB57 — the late-'25 Houston role didn't survive the offseason" },
    ],
    keeperOutlook: "Likely Gibbs $54 + Olave $10 → $136 left, meaning ONE more big anchor and then $1s. Once he buys his second $40+ player, he's done bidding.",
  },
  {
    owner: "Michael",
    team: "For Kyren Out Loud",
    teamHistory: "was Full Chubb in '23–'24",
    archetype: "Max-QB, two-stud skeleton",
    picksTo120: 3.0,
    onesPerYear: 1.3,
    top3Share: 65.7,
    earlyShare: 66,
    maxEver: { player: "Lamar Jackson", price: 62, year: 2025 },
    posShare: { QB: 40.3, RB: 29.5, WR: 26.5, TE: 3.5, DEF: 0.2 },
    posDelta: { QB: 11.5, RB: -2.3, WR: -7.6, TE: -1.2, DEF: -0.2 },
    reads: [
      "The league's biggest QB spender (+11.5 pts): $51–62 on his QB1 three straight years (Lamar, Hurts, Lamar) and 4 QBs rostered in '24 and '25 ($94 and $80 of QB spend).",
      "'25 blueprint: $121 on Lamar + Chase, then not a single buy over $10. Nominate elite QBs and WRs early to drain him, then own rounds 3–6.",
      "Highest top-3 concentration in the league (65.7%) — his depth is always thin; he rebuilds it with $2–3 fliers, almost never $1s.",
    ],
    loyalty: ["Lamar Jackson", "Kyren Williams", "Rashee Rice", "Alvin Kamara", "Jaylen Warren"],
    keeperHistory: "2024: Kyren $10, Kamara $7 · 2025: Kyren $15, Nico $11",
    keeperOptions: [
      { player: "Rashee Rice", pos: "WR", cost: 14, likely: true, note: "2026 WR9, market ~$23 — a $9 surplus on a player he keeps buying" },
      { player: "Quinshon Judkins", pos: "RB", cost: 8, likely: true, note: "2026 RB21, market ~$10 — exactly the RB-value keep he's made twice" },
      { player: "Lamar Jackson", pos: "QB", cost: 67, note: "2026 QB2, market ~$62 — keeping is only ~$5 over re-bidding now, and he WILL own a $60 QB either way" },
      { player: "Jacory Croskey-Merritt", pos: "RB", cost: 11, note: "2026 RB40, market ~$2" },
      { player: "C.J. Stroud", pos: "QB", cost: 15, note: "Fell to 2026 QB27 — market ~$1" },
    ],
    keeperOutlook: "Kyren and Nico are both ineligible (two keeps used). Likely Rice $14 + Judkins $8 → $178, and history says ~$120 of it goes to two players by round 2.",
  },
  {
    owner: "Mike J.",
    team: "BigDawgs",
    archetype: "Boom-or-bust whale",
    picksTo120: 3.3,
    onesPerYear: 5.0,
    top3Share: 67.8,
    earlyShare: 74,
    maxEver: { player: "Lamar Jackson", price: 61, year: 2024 },
    posShare: { QB: 32.7, RB: 28.2, WR: 33.7, TE: 4.8, DEF: 0.5 },
    posDelta: { QB: 3.9, RB: -3.6, WR: -0.4, TE: 0.1, DEF: 0.1 },
    reads: [
      "The widest year-to-year swings in the league: '24 was $169 on three players (Lamar $61 + Tyreek $59 + Burrow $49) followed by NINE $1 buys; '25 was a normal balanced draft.",
      "When he's in whale mode, bid him up relentlessly through round 3 — he had nothing over $11 left in '24. His first two prices tell you which Mike showed up.",
      "Keeps cheap breakouts, never expensive ones (Achane $6, Aiyuk $11, McConkey $7). Don't expect his stars back off the board.",
    ],
    loyalty: ["De'Von Achane", "Ladd McConkey", "Brandon Aiyuk", "Darnell Mooney"],
    keeperHistory: "2024: Aiyuk $11, Achane $6 · 2025: Achane $11, McConkey $7",
    keeperOptions: [
      { player: "Ladd McConkey", pos: "WR", cost: 12, likely: true, note: "2nd keep. 2026 WR22, market ~$11 — breakeven, and the only tag on his roster that isn't underwater" },
      { player: "Dalton Kincaid", pos: "TE", cost: 6, note: "2026 TE15, market ~$1" },
      { player: "Jordan Mason", pos: "RB", cost: 16, note: "Traded into Minnesota's committee — 2026 RB39, market ~$2" },
      { player: "Bryce Young", pos: "QB", cost: 16, note: "2026 QB25, market ~$1" },
      { player: "Baker Mayfield", pos: "QB", cost: 27, note: "Fell to 2026 QB18, market ~$11 — a $16 overpay for 'startable'" },
    ],
    keeperOutlook: "Achane is ineligible (two keeps used) and nothing else beats market — McConkey at breakeven is the ceiling. If he throws it all back he enters with the full $200: brace for another $160-on-three-players whale draft.",
  },
  {
    owner: "Nathan",
    team: "Everyone Loves The Drake",
    teamHistory: "was Penix Mightier '24, Red Stallions '23",
    archetype: "Buys the draft's #1 price",
    picksTo120: 3.3,
    onesPerYear: 3.7,
    top3Share: 60.6,
    earlyShare: 67,
    maxEver: { player: "Bijan Robinson", price: 64, year: 2025 },
    posShare: { QB: 24.2, RB: 30.7, WR: 41.6, TE: 3.2, DEF: 0.2 },
    posDelta: { QB: -4.6, RB: -1.1, WR: 7.5, TE: -1.5, DEF: -0.2 },
    reads: [
      "Has bought the single most expensive player in the draft three years running: Jefferson $57, Mahomes $61, Bijan $64. Whoever you nominate first at the elite tier, he's the last hand up — use that.",
      "No positional identity: 53% WR in '23, 40% QB in '24, 59% RB in '25. He chases last season's points, so project his '26 target from whoever just won leagues.",
      "Keeps his Drakes: London and Maye are the team name — sentiment is real data here.",
    ],
    loyalty: ["Drake London", "Drake Maye", "James Cook", "Christian Kirk"],
    keeperHistory: "2024: Cook $13, LaPorta $6 · 2025: London $34, Maye $6",
    keeperOptions: [
      { player: "Drake Maye", pos: "QB", cost: 11, likely: true, note: "2nd keep. 2026 QB3, market ~$54 — a $43 surplus, the best keeper value in the league. Lock." },
      { player: "Drake London", pos: "WR", cost: 39, likely: true, note: "2nd keep. 2026 WR7, market ~$29 — a $10 overpay the curve hates, but sentiment (and last year's keep) says he does it anyway" },
      { player: "Bijan Robinson", pos: "RB", cost: 69, note: "2026 RB1, market ~$64 — only ~$5 over for the top RB; the stronger second keep on the math" },
      { player: "Tetairoa McMillan", pos: "WR", cost: 24, note: "2026 WR15, market ~$19 — modest overpay" },
      { player: "Marvin Harrison Jr.", pos: "WR", cost: 21, note: "2026 WR32, market ~$5" },
    ],
    keeperOutlook: "Maye $11 is a lock. The second keep flipped: London $39 is now $10 over market while Bijan $69 is nearly fair — watch whether sentiment or math wins. Bijan+Maye = $80 pre-fed and a quiet draft.",
  },
  {
    owner: "Ryan",
    team: "Smokin' Herbs",
    teamHistory: "was Herbs and spices '25, Music City Miracle Whip '24",
    archetype: "WR+TE buyer, flier factory",
    picksTo120: 3.7,
    onesPerYear: 5.7,
    top3Share: 60.8,
    earlyShare: 77,
    maxEver: { player: "Patrick Mahomes", price: 59, year: 2023 },
    posShare: { QB: 20.3, RB: 28.7, WR: 41.0, TE: 9.2, DEF: 0.5 },
    posDelta: { QB: -8.5, RB: -3.1, WR: 6.9, TE: 4.5, DEF: 0.1 },
    reads: [
      "Owns A.J. Brown every single year at $41–46, three drafts straight. Nominate AJB early — it's a guaranteed $40+ withdrawal from his stack.",
      "The only owner besides Adam who pays TE (Waller $15, Andrews $16, Kittle $20) — make him pay retail-plus for it.",
      "QB punter at auction (-8.5) whose fix is keeping QBs cheap: Herbert $22, Kyler twice. His team names are literally Herbert puns.",
      "Buys the most $1 fliers in the league (5.7/yr) — his endgame competes directly with your keeper-lottery plan.",
    ],
    loyalty: ["A.J. Brown", "Justin Herbert", "Kyler Murray", "Mike Evans", "Jakobi Meyers", "Rashid Shaheed"],
    keeperHistory: "2024: Evans $10, Kyler $8 · 2025: Herbert $22, Kyler $13",
    keeperOptions: [
      { player: "Emeka Egbuka", pos: "WR", cost: 23, likely: true, note: "2026 WR14, market ~$20 — slightly over, but the closest thing to value he holds" },
      { player: "Justin Herbert", pos: "QB", cost: 27, likely: true, note: "2nd keep. 2026 QB12, market ~$21 — a loyalty overpay, but the team is named after him" },
      { player: "Stefon Diggs", pos: "WR", cost: 13, note: "2026 WR53 and unsigned — throw back" },
      { player: "George Kittle", pos: "TE", cost: 25, note: "2026 TE17, market ~$1 — even a TE buyer can't justify it" },
      { player: "Isiah Pacheco", pos: "RB", cost: 19, note: "2026 RB58 — dead money" },
      { player: "A.J. Brown", pos: "WR", cost: 46, note: "Fell to 2026 WR11, market ~$21 — after three straight $40+ buys he can finally get him at half price at auction" },
    ],
    keeperOutlook: "Kyler is ineligible (two keeps used). Nothing on his roster beats market: Egbuka $23 + Herbert $27 → $150 costs ~$10 vs re-buying, and it caps his AJB chase money — watch whether loyalty or math wins.",
  },
];
