// League-mate draft profiles, built from the 2023–2025 auction results and the
// official keeper spreadsheet (2026.01.08 FFL Draft & Keeper Results).
//
// Team → owner mapping was reconstructed from keeper-price continuity (+$5/yr):
// "NPF's Bookie" (2023) is Kyle (his $3 D'Andre Swift became Benjels' $8 keep).
// All stats below therefore cover three full drafts for every owner.
//
// David (VFL) and Jonathan (AFC Richmond) left the league after 2025, so they
// have no entry here: with no one to keep them, their whole rosters go back
// into the 2026 auction pool. Historical league averages still include their
// drafts, since those bids really did set the market.
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
// Keeper options are every eligible player on each owner's end-of-2025 roster,
// taken from the 2026 keeper sheet (cost = its "2026 Keeper Value" column).
// Players already kept twice are ineligible and so are absent, which correctly
// leaves them in the pool. A handful of deep-bench names with no 2026 ranking
// are omitted — they aren't on the board, so keeping them changes nothing.
// Options are valued against CURRENT 2026 rankings (PLAYERS_DATA), not
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
      { player: "Matthew Stafford", pos: "QB", cost: 15, likely: true, note: "2025 salary $10, market ~$21" },
      { player: "George Pickens", pos: "WR", cost: 16, likely: true, note: "2025 salary $11, market ~$21" },
      { player: "Cam Skattebo", pos: "RB", cost: 10, note: "2025 salary $5, market ~$13" },
      { player: "Omarion Hampton", pos: "RB", cost: 28, note: "2025 salary $23, market ~$29" },
      { player: "Chris Godwin Jr.", pos: "WR", cost: 6, note: "2025 salary $1, market ~$5" },
      { player: "Rico Dowdle", pos: "RB", cost: 6, note: "2025 salary $1, market ~$3" },
      { player: "Jaylen Waddle", pos: "WR", cost: 16, note: "2025 salary $11, market ~$11" },
      { player: "Jordan Addison", pos: "WR", cost: 8, note: "2025 salary $3, market ~$3" },
      { player: "Hunter Henry", pos: "TE", cost: 6, note: "2025 salary $1, market ~$1" },
      { player: "Brian Robinson Jr.", pos: "RB", cost: 8, note: "2025 salary $3, market ~$1" },
      { player: "Cade Otton", pos: "TE", cost: 10, note: "Undrafted in 2025, market ~$2" },
      { player: "Ollie Gordon II", pos: "RB", cost: 9, note: "2025 salary $4, market ~$1" },
      { player: "Marcus Mariota", pos: "QB", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Seahawks D/ST", pos: "DEF", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Shedeur Sanders", pos: "QB", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Jayden Daniels", pos: "QB", cost: 47, note: "2025 salary $42, market ~$34 · 2nd keep, final year" },
      { player: "DK Metcalf", pos: "WR", cost: 21, note: "2025 salary $16, market ~$8" },
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
      { player: "Javonte Williams", pos: "RB", cost: 9, likely: true, note: "2025 salary $4, market ~$19" },
      { player: "James Cook", pos: "RB", cost: 36, likely: true, note: "2025 salary $31, market ~$44" },
      { player: "Brock Bowers", pos: "TE", cost: 12, note: "2025 salary $7, market ~$19 · 2nd keep, final year" },
      { player: "Zay Flowers", pos: "WR", cost: 16, note: "2025 salary $11, market ~$17" },
      { player: "Daniel Jones", pos: "QB", cost: 6, note: "2025 salary $1, market ~$7" },
      { player: "Malik Willis", pos: "QB", cost: 10, note: "Undrafted in 2025, market ~$9" },
      { player: "Alec Pierce", pos: "WR", cost: 10, note: "Undrafted in 2025, market ~$8" },
      { player: "Broncos D/ST", pos: "DEF", cost: 6, note: "2025 salary $1, market ~$2" },
      { player: "Courtland Sutton", pos: "WR", cost: 12, note: "2025 salary $7, market ~$5 · 2nd keep, final year" },
      { player: "Juwan Johnson", pos: "TE", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Michael Carter", pos: "RB", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Audric Estime", pos: "RB", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Geno Smith", pos: "QB", cost: 14, note: "2025 salary $9, market ~$2" },
      { player: "Josh Jacobs", pos: "RB", cost: 46, note: "2025 salary $41, market ~$19" },
    ],
    keeperOutlook: "Three real values now: Javonte Williams $9 (+$10), Cook $36 (+$8) and Bowers $12 (+$7, 2nd keep). The cheap RB plus Bowers solves TE for $21 and leaves $179; taking Cook instead means committing $45 before the room sits down.",
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
      { player: "Jaxson Dart", pos: "QB", cost: 12, likely: true, note: "2025 salary $7, market ~$27" },
      { player: "Bo Nix", pos: "QB", cost: 13, likely: true, note: "2025 salary $8, market ~$24 · 2nd keep, final year" },
      { player: "Joe Burrow", pos: "QB", cost: 54, note: "2025 salary $49, market ~$49" },
      { player: "Blake Corum", pos: "RB", cost: 10, note: "Undrafted in 2025, market ~$4" },
      { player: "Darnell Mooney", pos: "WR", cost: 8, note: "2025 salary $3, market ~$1" },
      { player: "Brock Purdy", pos: "QB", cost: 28, note: "2025 salary $23, market ~$20" },
      { player: "Steelers D/ST", pos: "DEF", cost: 10, note: "Undrafted in 2025, market ~$2" },
      { player: "Zach Charbonnet", pos: "RB", cost: 11, note: "2025 salary $6, market ~$2" },
      { player: "Dalton Schultz", pos: "TE", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Adonai Mitchell", pos: "WR", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "David Montgomery", pos: "RB", cost: 20, note: "2025 salary $15, market ~$8" },
      { player: "DJ Moore", pos: "WR", cost: 23, note: "2025 salary $18, market ~$10" },
      { player: "Xavier Worthy", pos: "WR", cost: 20, note: "2025 salary $15, market ~$1" },
      { player: "Alvin Kamara", pos: "RB", cost: 29, note: "2025 salary $24, market ~$1" },
      { player: "Saquon Barkley", pos: "RB", cost: 68, note: "2025 salary $63, market ~$23" },
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
      { player: "Jaxon Smith-Njigba", pos: "WR", cost: 19, likely: true, note: "2025 salary $14, market ~$51 · 2nd keep, final year" },
      { player: "Trey McBride", pos: "TE", cost: 27, note: "2025 salary $22, market ~$24" },
      { player: "Tyler Allgeier", pos: "RB", cost: 6, note: "2025 salary $1, market ~$3" },
      { player: "Josh Allen", pos: "QB", cost: 67, note: "2025 salary $62, market ~$62" },
      { player: "Dallas Goedert", pos: "TE", cost: 6, note: "2025 salary $1, market ~$1" },
      { player: "Kyle Monangai", pos: "RB", cost: 10, note: "Undrafted in 2025, market ~$4" },
      { player: "Khalil Shakir", pos: "WR", cost: 8, note: "2025 salary $3, market ~$1" },
      { player: "Kimani Vidal", pos: "RB", cost: 10, note: "Undrafted in 2025, market ~$2" },
      { player: "Jaylen Warren", pos: "RB", cost: 17, note: "2025 salary $12, market ~$8" },
      { player: "Brian Thomas Jr.", pos: "WR", cost: 14, note: "2025 salary $9, market ~$5 · 2nd keep, final year" },
      { player: "Jerry Jeudy", pos: "WR", cost: 10, note: "2025 salary $5, market ~$1" },
      { player: "Lions D/ST", pos: "DEF", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Emanuel Wilson", pos: "RB", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Terry McLaurin", pos: "WR", cost: 25, note: "2025 salary $20, market ~$15" },
      { player: "Mike Evans", pos: "WR", cost: 26, note: "2025 salary $21, market ~$9" },
      { player: "Jordan Love", pos: "QB", cost: 38, note: "2025 salary $33, market ~$10" },
    ],
    keeperOutlook: "JSN $19 is a lock. BTJ's collapse opens the second slot: McBride $27 or even Allen $67 (near-fair now) are the live options. Either way, expect the Allen money to be there a third time.",
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
      { player: "Caleb Williams", pos: "QB", cost: 29, likely: true, note: "2025 salary $24, market ~$41" },
      { player: "Tyler Shough", pos: "QB", cost: 6, likely: true, note: "2025 salary $1, market ~$12" },
      { player: "Amon-Ra St. Brown", pos: "WR", cost: 44, note: "2025 salary $39, market ~$43" },
      { player: "Kyle Pitts Sr.", pos: "TE", cost: 6, note: "2025 salary $1, market ~$5" },
      { player: "Jonathan Taylor", pos: "RB", cost: 47, note: "2025 salary $42, market ~$44" },
      { player: "Christian Watson", pos: "WR", cost: 10, note: "Undrafted in 2025, market ~$7" },
      { player: "Jared Goff", pos: "QB", cost: 25, note: "2025 salary $20, market ~$20" },
      { player: "Dylan Sampson", pos: "RB", cost: 7, note: "2025 salary $2, market ~$1" },
      { player: "Kenneth Gainwell", pos: "RB", cost: 10, note: "Undrafted in 2025, market ~$3" },
      { player: "D'Andre Swift", pos: "RB", cost: 14, note: "2025 salary $9, market ~$6" },
      { player: "Troy Franklin", pos: "WR", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Saints D/ST", pos: "DEF", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Darren Waller", pos: "TE", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Jake Tonges", pos: "TE", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Davante Adams", pos: "WR", cost: 26, note: "2025 salary $21, market ~$16" },
      { player: "Patrick Mahomes", pos: "QB", cost: 46, note: "2025 salary $41, market ~$28" },
      { player: "James Conner", pos: "RB", cost: 26, note: "2025 salary $21, market ~$1" },
    ],
    keeperOutlook: "Still the coin flip of the league: Caleb $29 (+$12) and Shough $6 (+$6) are the only players beating market, and he has never kept anyone. If the streak holds, plan for him to bully the WR middle rounds with $200.",
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
      { player: "Chris Olave", pos: "WR", cost: 10, likely: true, note: "2025 salary $5, market ~$25" },
      { player: "Jahmyr Gibbs", pos: "RB", cost: 54, likely: true, note: "2025 salary $49, market ~$63 · 2nd keep, final year" },
      { player: "Colston Loveland", pos: "TE", cost: 6, note: "2025 salary $1, market ~$9" },
      { player: "Devonta Smith", pos: "WR", cost: 23, note: "2025 salary $18, market ~$20" },
      { player: "Jalen Hurts", pos: "QB", cost: 57, note: "2025 salary $52, market ~$52" },
      { player: "Jayden Reed", pos: "WR", cost: 6, note: "2025 salary $1, market ~$1" },
      { player: "Rams D/ST", pos: "DEF", cost: 6, note: "2025 salary $1, market ~$1" },
      { player: "Jakobi Meyers", pos: "WR", cost: 10, note: "2025 salary $5, market ~$4" },
      { player: "Woody Marks", pos: "RB", cost: 7, note: "2025 salary $2, market ~$1" },
      { player: "Travis Kelce", pos: "TE", cost: 10, note: "2025 salary $5, market ~$3" },
      { player: "Tee Higgins", pos: "WR", cost: 25, note: "2025 salary $20, market ~$17 · 2nd keep, final year" },
      { player: "Jauan Jennings", pos: "WR", cost: 9, note: "2025 salary $4, market ~$1" },
      { player: "Kirk Cousins", pos: "QB", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Emari Demercado", pos: "RB", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Devin Singletary", pos: "RB", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Chuba Hubbard", pos: "RB", cost: 26, note: "2025 salary $21, market ~$10" },
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
      { player: "Travis Etienne Jr.", pos: "RB", cost: 8, likely: true, note: "2025 salary $3, market ~$20" },
      { player: "Rashee Rice", pos: "WR", cost: 14, likely: true, note: "2025 salary $9, market ~$24" },
      { player: "Quinshon Judkins", pos: "RB", cost: 8, note: "2025 salary $3, market ~$13" },
      { player: "Lamar Jackson", pos: "QB", cost: 67, note: "2025 salary $62, market ~$62" },
      { player: "Mark Andrews", pos: "TE", cost: 7, note: "2025 salary $2, market ~$2" },
      { player: "Josh Downs", pos: "WR", cost: 6, note: "2025 salary $1, market ~$1" },
      { player: "Joe Mixon", pos: "RB", cost: 6, note: "2025 salary $1, market ~$1" },
      { player: "Aaron Rodgers", pos: "QB", cost: 10, note: "2025 salary $5, market ~$3" },
      { player: "Jacory Croskey-Merritt", pos: "RB", cost: 11, note: "2025 salary $6, market ~$3" },
      { player: "Ravens D/ST", pos: "DEF", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Tyrone Tracy Jr.", pos: "RB", cost: 13, note: "2025 salary $8, market ~$3" },
      { player: "Matthew Golden", pos: "WR", cost: 14, note: "2025 salary $9, market ~$3" },
      { player: "Ja'Marr Chase", pos: "WR", cost: 64, note: "2025 salary $59, market ~$52" },
      { player: "C.J. Stroud", pos: "QB", cost: 15, note: "2025 salary $10, market ~$3" },
    ],
    keeperOutlook: "Kyren and Nico are both ineligible (two keeps used). Etienne $8 (+$12) and Rice $14 (+$10) are the value pair → $178, and history says ~$120 of it goes to two players by round 2. Judkins $8 is a live third.",
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
      { player: "Ladd McConkey", pos: "WR", cost: 12, likely: true, note: "2025 salary $7, market ~$12 · 2nd keep, final year" },
      { player: "Rhamondre Stevenson", pos: "RB", cost: 7, note: "2025 salary $2, market ~$6" },
      { player: "Christian McCaffrey", pos: "RB", cost: 52, note: "2025 salary $47, market ~$50" },
      { player: "Texans D/ST", pos: "DEF", cost: 6, note: "2025 salary $1, market ~$2" },
      { player: "Keenan Allen", pos: "WR", cost: 6, note: "2025 salary $1, market ~$1" },
      { player: "Dalton Kincaid", pos: "TE", cost: 6, note: "2025 salary $1, market ~$1" },
      { player: "Wan'Dale Robinson", pos: "WR", cost: 10, note: "Undrafted in 2025, market ~$4" },
      { player: "Colby Parkinson", pos: "TE", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Darius Slayton", pos: "WR", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Rams D/ST", pos: "DEF", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Bryce Young", pos: "QB", cost: 16, note: "2025 salary $11, market ~$6" },
      { player: "Austin Ekeler", pos: "RB", cost: 11, note: "2025 salary $6, market ~$1" },
      { player: "Jordan Mason", pos: "RB", cost: 16, note: "2025 salary $11, market ~$3" },
      { player: "Justin Jefferson", pos: "WR", cost: 55, note: "2025 salary $50, market ~$41" },
      { player: "Baker Mayfield", pos: "QB", cost: 27, note: "2025 salary $22, market ~$13" },
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
      { player: "Drake Maye", pos: "QB", cost: 11, likely: true, note: "2025 salary $6, market ~$55 · 2nd keep, final year" },
      { player: "Luther Burden III", pos: "WR", cost: 6, likely: true, note: "2025 salary $1, market ~$11" },
      { player: "Bhayshul Tuten", pos: "RB", cost: 7, note: "2025 salary $2, market ~$10" },
      { player: "Trevor Lawrence", pos: "QB", cost: 24, note: "2025 salary $19, market ~$22" },
      { player: "Drake London", pos: "WR", cost: 39, note: "2025 salary $34, market ~$34 · 2nd keep, final year" },
      { player: "Bijan Robinson", pos: "RB", cost: 69, note: "2025 salary $64, market ~$63" },
      { player: "Tetairoa McMillan", pos: "WR", cost: 24, note: "2025 salary $19, market ~$18" },
      { player: "Jake Ferguson", pos: "TE", cost: 9, note: "2025 salary $4, market ~$2" },
      { player: "Chiefs D/ST", pos: "DEF", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Chimere Dike", pos: "WR", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "John Metchie III", pos: "WR", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Pat Freiermuth", pos: "TE", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Browns D/ST", pos: "DEF", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "RJ Harvey", pos: "RB", cost: 18, note: "2025 salary $13, market ~$6" },
      { player: "TreVeyon Henderson", pos: "RB", cost: 26, note: "2025 salary $21, market ~$12" },
      { player: "Marvin Harrison Jr.", pos: "WR", cost: 21, note: "2025 salary $16, market ~$6" },
    ],
    keeperOutlook: "Maye $11 at a $55 market is the biggest single edge in the league — an automatic keep, and his 2nd/final year. The old second slot is gone: London $39 (2nd keep) and Bijan $69 both sit below market now, so the value play is a cheap flier like Burden $6. Maye alone = $189 to spend.",
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
      { player: "Emeka Egbuka", pos: "WR", cost: 23, note: "2025 salary $18, market ~$21" },
      { player: "Justin Herbert", pos: "QB", cost: 27, note: "2025 salary $22, market ~$23 · 2nd keep, final year" },
      { player: "Michael Wilson", pos: "WR", cost: 10, note: "Undrafted in 2025, market ~$5" },
      { player: "Kareem Hunt", pos: "RB", cost: 6, note: "2025 salary $1, market ~$1" },
      { player: "Rashid Shaheed", pos: "WR", cost: 6, note: "2025 salary $1, market ~$1" },
      { player: "Jacoby Brissett", pos: "QB", cost: 10, note: "Undrafted in 2025, market ~$4" },
      { player: "Cooper Kupp", pos: "WR", cost: 8, note: "2025 salary $3, market ~$1" },
      { player: "Tre Tucker", pos: "WR", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Michael Mayer", pos: "TE", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Jaguars D/ST", pos: "DEF", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "AJ Barner", pos: "TE", cost: 10, note: "Undrafted in 2025, market ~$1" },
      { player: "Stefon Diggs", pos: "WR", cost: 13, note: "2025 salary $8, market ~$1" },
      { player: "Isiah Pacheco", pos: "RB", cost: 19, note: "2025 salary $14, market ~$1" },
      { player: "A.J. Brown", pos: "WR", cost: 46, note: "2025 salary $41, market ~$22" },
      { player: "George Kittle", pos: "TE", cost: 25, note: "2025 salary $20, market ~$1" },
      { player: "Derrick Henry", pos: "RB", cost: 56, note: "2025 salary $51, market ~$21" },
    ],
    keeperOutlook: "Kyler is ineligible (two keeps used). Nothing on his roster beats market: Egbuka $23 + Herbert $27 → $150 costs ~$10 vs re-buying, and it caps his AJB chase money — watch whether loyalty or math wins.",
  },
];
