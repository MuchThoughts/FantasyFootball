// League-mate draft profiles, built from the 2023–2025 auction results and the
// official keeper spreadsheet (2026.01.08 FFL Draft & Keeper Results).
//
// Team → owner mapping was reconstructed from keeper-price continuity (+$5/yr):
// "NPF's Bookie" (2023) is Kyle (his $3 D'Andre Swift became Benjels' $8 keep).
// All stats below therefore cover three full drafts for every owner.
//
// David (VFL) and Jonathan (AFC Richmond) left after 2025, but their franchises
// did NOT fold: the official 2026 keeper sheet shows Bo running the old VFL
// roster as "Hotspurs" and Kaleb running AFC Richmond, each keeping players at
// prices only the incumbent roster could have (keeper cost = last salary + $5;
// Bo's Chase Brown at $15 is David's $10 plus five). So both are live rivals
// again, flagged inheritedFrom — the stats and reads on those two cards are the
// PREVIOUS owner's three drafts and say nothing about how the new owner bids.
// League averages and the three-year price curve are unchanged: those drafts
// happened regardless of who owns the team now.
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
// 3-yr price curve (PRICE_CURVE) at the player's 2026 positional rank.
//
// Which of those options were actually kept is NOT decided here — that comes
// from OFFICIAL_KEEPERS_2026 below, transcribed from the league's declared
// keepers. This list is the menu; that list is the order.

export interface KeeperOption {
  player: string;
  pos: string;
  cost: number;
  note: string;
}

// The 2026 keeps as declared on the official sheet — no longer a projection.
// This is the one place a player is designated a keeper; the checkboxes on the
// Insights tab start from it and can still be overridden if the sheet changes.
export interface OfficialKeeper {
  player: string; // must match PLAYERS_DATA exactly — uid() keys off it
  pos: string;
  cost: number; // "Kept For"
  owner: string;
  franchise: string;
  // A player can be kept two years running and no more, so this year's keeps
  // split into ones that can be kept again in 2027 (at cost + $5) and ones
  // burning their final year. It's the difference between a keeper that's an
  // asset next winter and one that's rented.
  eligible2027: boolean;
  value2027: number | null;
}

export const OFFICIAL_KEEPERS_2026: OfficialKeeper[] = [
  { player: "Tyler Warren", pos: "TE", cost: 10, owner: "Kaleb", franchise: "AFC Richmond", eligible2027: true, value2027: 15 },
  { player: "Kenneth Walker III", pos: "RB", cost: 34, owner: "Kaleb", franchise: "AFC Richmond", eligible2027: true, value2027: 39 },
  { player: "Jahmyr Gibbs", pos: "RB", cost: 54, owner: "Kyle", franchise: "Benjels", eligible2027: false, value2027: null },
  { player: "Chris Olave", pos: "WR", cost: 10, owner: "Kyle", franchise: "Benjels", eligible2027: true, value2027: 15 },
  { player: "Bryce Young", pos: "QB", cost: 16, owner: "Mike J.", franchise: "BigDawgs", eligible2027: true, value2027: 21 },
  { player: "Ladd McConkey", pos: "WR", cost: 12, owner: "Mike J.", franchise: "BigDawgs", eligible2027: false, value2027: null },
  { player: "Luther Burden III", pos: "WR", cost: 6, owner: "Nathan", franchise: "Everyone Loves The Drake", eligible2027: true, value2027: 11 },
  { player: "Drake Maye", pos: "QB", cost: 11, owner: "Nathan", franchise: "Everyone Loves The Drake", eligible2027: false, value2027: null },
  { player: "Travis Etienne Jr.", pos: "RB", cost: 8, owner: "Michael", franchise: "For Kyren Out Loud", eligible2027: true, value2027: 13 },
  { player: "Rashee Rice", pos: "WR", cost: 14, owner: "Michael", franchise: "For Kyren Out Loud", eligible2027: true, value2027: 19 },
  { player: "Michael Wilson", pos: "WR", cost: 10, owner: "Ryan", franchise: "Music City Miracle Whip", eligible2027: true, value2027: 15 },
  { player: "Emeka Egbuka", pos: "WR", cost: 23, owner: "Ryan", franchise: "Music City Miracle Whip", eligible2027: true, value2027: 28 },
  { player: "Jaxon Smith-Njigba", pos: "WR", cost: 19, owner: "Grayson", franchise: "Scattered Smothered Covered", eligible2027: false, value2027: null },
  { player: "Caleb Williams", pos: "QB", cost: 29, owner: "Josh", franchise: "SHHH...IT FLOWS DOWNHILL", eligible2027: true, value2027: 34 },
  { player: "Tyler Shough", pos: "QB", cost: 6, owner: "Josh", franchise: "SHHH...IT FLOWS DOWNHILL", eligible2027: true, value2027: 11 },
  { player: "Matthew Stafford", pos: "QB", cost: 15, owner: "Sean", franchise: "Digging Out of a Burrow", eligible2027: true, value2027: 20 },
  { player: "George Pickens", pos: "WR", cost: 16, owner: "Sean", franchise: "Digging Out of a Burrow", eligible2027: true, value2027: 21 },
  { player: "Jaxson Dart", pos: "QB", cost: 12, owner: "Doug", franchise: "Turbo Team", eligible2027: true, value2027: 17 },
  { player: "Bo Nix", pos: "QB", cost: 13, owner: "Doug", franchise: "Turbo Team", eligible2027: false, value2027: null },
  { player: "Chase Brown", pos: "RB", cost: 15, owner: "Bo", franchise: "Hotspurs", eligible2027: false, value2027: null },
  // The sheet writes him "James Cook III"; PLAYERS_DATA has the same Bills RB
  // as "James Cook", and the name here has to match for the uid to line up.
  { player: "James Cook", pos: "RB", cost: 36, owner: "Adam", franchise: "Vols2TheWall", eligible2027: true, value2027: 41 },
  { player: "Brock Bowers", pos: "TE", cost: 12, owner: "Adam", franchise: "Vols2TheWall", eligible2027: false, value2027: null },
];

export interface OwnerInsight {
  owner: string;
  team: string; // current (2026) team name
  teamHistory?: string; // older names, if they rebrand
  // This franchise changed hands for 2026 — the new owner inherited the roster
  // (which is why they can keep players at the old owner's prices), but every
  // stat and read below is the PREVIOUS owner's three years, not theirs.
  inheritedFrom?: string;
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
      { player: "Matthew Stafford", pos: "QB", cost: 15, note: "2025 salary $10, market ~$21" },
      { player: "George Pickens", pos: "WR", cost: 16, note: "2025 salary $11, market ~$21" },
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
    keeperOutlook: "Kept Pickens $16 + Stafford $15 — a WR2 and a starting QB for $31, so you sit down with $169 and your QB1 money intact. Both are keepable again in 2027 ($21 and $20), so neither is a rental.",
  },
  {
    owner: "Bo",
    team: "Hotspurs",
    teamHistory: "David's VFL through '25, before that I'd rather be f...",
    inheritedFrom: "David",
    archetype: "unknown — inherited David's roster",
    picksTo120: 3.7,
    onesPerYear: 1.0,
    top3Share: 56.8,
    earlyShare: 74,
    maxEver: { player: "Christian McCaffrey (keeper)", price: 59, year: 2024 },
    posShare: { QB: 18.8, RB: 36.9, WR: 38.3, TE: 5.3, DEF: 0.3 },
    posDelta: { QB: -10.0, RB: 5.1, WR: 4.2, TE: 0.6, DEF: -0.1 },
    reads: [
      "New owner: Bo took over David's roster for 2026. Every number on this card is David's three drafts; treat none of it as a read on how Bo bids. He is the one unknown in the room.",
      "He kept only Chase Brown $15, so he sits down with $185 — the second-fattest wallet in the league. An unknown bidder with near-full budget is who you get outbid by.",
      "For history: David was the biggest QB punter over three years (-10 pts vs league; $26 total QB room in '24) and a core reason QB7–13 went cheap. If Bo bids anything like normally, that discount is gone.",
      "David never shopped the $1 bin — zero $1 non-DEF buys in '24 and '25 against a league average of 4/yr.",
    ],
    loyalty: ["Christian McCaffrey", "CeeDee Lamb", "Tony Pollard", "Chase Brown", "Brock Bowers", "Kirk Cousins"],
    keeperHistory: "2024: CMC $59, CeeDee $45 · 2025: Chase Brown $10, Bowers $7 (all David's)",
    keeperOptions: [
      { player: "Chase Brown", pos: "RB", cost: 15, note: "2026 RB9, market ~$29 — the roster's clearest surplus, and Bo kept him" },
      { player: "Sam Darnold", pos: "QB", cost: 14, note: "Fell to 2026 QB23 in Seattle, market ~$3" },
      { player: "Breece Hall", pos: "RB", cost: 26, note: "2026 RB19, market ~$12" },
      { player: "Ricky Pearsall", pos: "WR", cost: 16, note: "2026 WR41" },
      { player: "Malik Nabers", pos: "WR", cost: 46, note: "Still WR10 talent, market ~$22 coming off the injury" },
    ],
    keeperOutlook:
      "Kept Chase Brown $15 and nothing else, so Bo enters with $185 and no read attached to it. Everything else off this roster — Darnold, Breece, Pearsall, Nabers — is back in the pool.",
  },
  {
    owner: "Kaleb",
    team: "AFC Richmond",
    teamHistory: "Jonathan's franchise through '25",
    inheritedFrom: "Jonathan",
    archetype: "unknown — inherited Jonathan's roster",
    picksTo120: 4.0,
    onesPerYear: 5.0,
    top3Share: 56.2,
    earlyShare: 82,
    maxEver: { player: "Josh Allen", price: 62, year: 2024 },
    posShare: { QB: 32.3, RB: 30.2, WR: 33.0, TE: 4.0, DEF: 0.3 },
    posDelta: { QB: 3.5, RB: -1.6, WR: -1.1, TE: -0.7, DEF: -0.1 },
    reads: [
      "New owner: Kaleb took over Jonathan's roster for 2026. The numbers on this card are Jonathan's three drafts and carry no information about Kaleb.",
      "Jonathan's four-QBs-a-draft habit is what made the $1–6 QB3 tier cheap, and the three-year curve still carries those bids. Whether that discount survives depends entirely on an owner nobody has bid against.",
      "Kaleb spent $44 of his $200 keeping Kenneth Walker III $34 and Tyler Warren $10 — a real RB2 and a top-five TE, so he is not shopping for either.",
      "For history: Jonathan's structure swung wildly ('24 was Allen $62 + Jefferson $53 and eight $1 players, '25 was spread) and he was the best flier-to-keeper converter in the league.",
    ],
    loyalty: ["Breece Hall", "Anthony Richardson", "Justin Fields", "Nick Chubb"],
    keeperHistory: "2024: Richardson $29, Breece $28 · 2025: Bucky $6, Fields $6 (all Jonathan's)",
    keeperOptions: [
      { player: "Kenneth Walker III", pos: "RB", cost: 34, note: "Kept. Not on the 2025 option sheet — he came to this roster after it was drawn up" },
      { player: "Bucky Irving", pos: "RB", cost: 11, note: "2026 RB20, market ~$11 — passed over, so he's in the pool" },
      { player: "Tyler Warren", pos: "TE", cost: 10, note: "2026 TE4, market ~$6" },
      { player: "Tucker Kraft", pos: "TE", cost: 8, note: "2026 TE7 coming off the ACL — market ~$4" },
      { player: "Rome Odunze", pos: "WR", cost: 13, note: "2026 WR29, market ~$6" },
      { player: "Cam Ward", pos: "QB", cost: 11, note: "2026 QB26" },
      { player: "Ashton Jeanty", pos: "RB", cost: 52, note: "2026 RB7, market ~$39" },
    ],
    keeperOutlook:
      "Kept Walker $34 + Warren $10, entering with $156. Ashton Jeanty $52 and Bucky Irving $11 were both passed over and are in the pool — Bucky at $11 was the sheet's best-value option in the league and nobody took it.",
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
      { player: "Javonte Williams", pos: "RB", cost: 9, note: "2025 salary $4, market ~$19" },
      { player: "James Cook", pos: "RB", cost: 36, note: "2025 salary $31, market ~$44" },
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
    keeperOutlook: "Kept Cook $36 + Bowers $12 — $48 committed, $152 left. He passed on Javonte $9, the cheapest surplus on his sheet, so Javonte is in the pool. Bowers is a 2nd keep and gone after this year; Cook can be held again at $41.",
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
      { player: "Jaxson Dart", pos: "QB", cost: 12, note: "2025 salary $7, market ~$27" },
      { player: "Bo Nix", pos: "QB", cost: 13, note: "2025 salary $8, market ~$24 · 2nd keep, final year" },
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
    keeperOutlook: "Kept Dart $12 + Nix $13 exactly as projected → $175 with two top-11 2026 QBs locked, which is how he funds another $60+ RB1. Nix is his final year; Dart can be held at $17. Burrow $54, Purdy $28 and Saquon $68 all went back.",
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
      { player: "Jaxon Smith-Njigba", pos: "WR", cost: 19, note: "2025 salary $14, market ~$51 · 2nd keep, final year" },
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
    keeperOutlook: "Kept JSN $19 and stopped there — one of only two owners to use a single slot. That leaves $181, the biggest wallet in the league, and Josh Allen $67, McBride $27 and Jordan Love $38 all back in the pool. Expect the Allen money to be there a third time, now with more behind it.",
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
      { player: "Caleb Williams", pos: "QB", cost: 29, note: "2025 salary $24, market ~$41" },
      { player: "Tyler Shough", pos: "QB", cost: 6, note: "2025 salary $1, market ~$12" },
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
    keeperOutlook: "The never-keeps streak is over: Caleb $29 + Shough $6, both QBs, $35 committed and $165 left. He took exactly the two players beating market. Mahomes $46, Amon-Ra $44 and Jonathan Taylor $47 are all in the pool.",
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
      { player: "Chris Olave", pos: "WR", cost: 10, note: "2025 salary $5, market ~$25" },
      { player: "Jahmyr Gibbs", pos: "RB", cost: 54, note: "2025 salary $49, market ~$63 · 2nd keep, final year" },
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
    keeperOutlook: "Kept Gibbs $54 + Olave $10 as projected → $136 left, meaning ONE more big anchor and then $1s. Once he buys his second $40+ player he's done bidding. Hurts $57 went back.",
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
      { player: "Travis Etienne Jr.", pos: "RB", cost: 8, note: "2025 salary $3, market ~$20" },
      { player: "Rashee Rice", pos: "WR", cost: 14, note: "2025 salary $9, market ~$24" },
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
    keeperOutlook: "Kept Etienne $8 + Rice $14 as projected → $178, and history says ~$120 of it goes to two players by round 2. He left Judkins $8 on the table, so that value is in the pool along with Lamar $67 and Chase $64.",
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
      { player: "Ladd McConkey", pos: "WR", cost: 12, note: "2025 salary $7, market ~$12 · 2nd keep, final year" },
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
    keeperOutlook: "He did not throw it back: McConkey $12 + Bryce Young $16, $28 committed and $172 left — still enough for another $160-on-three-players whale draft. Young at $16 is the surprise, a QB2 price for a QB he clearly rates. CMC $52 and Jefferson $55 are in the pool.",
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
      { player: "Drake Maye", pos: "QB", cost: 11, note: "2025 salary $6, market ~$55 · 2nd keep, final year" },
      { player: "Luther Burden III", pos: "WR", cost: 6, note: "2025 salary $1, market ~$11" },
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
    keeperOutlook: "Called it: Maye $11 at a ~$55 market is the biggest single edge in the league, and Burden $6 is the cheap-flier second slot. $17 committed, $183 left — the third-fattest wallet, holding a top-three QB. Maye is his final year. Bijan $69 and London $39 went back.",
  },
  {
    owner: "Ryan",
    team: "Music City Miracle Whip",
    teamHistory: "was Smokin' Herbs, Herbs and spices '25 — back to the '24 name",
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
    keeperOutlook: "Egbuka $23 yes, but Herbert $27 no — he took Michael Wilson $10 instead, spending $33 and keeping $167 for the A.J. Brown chase. That puts Justin Herbert back in the QB pool, which matters: he's the best arm nobody has to outbid a keeper for.",
  },
];
