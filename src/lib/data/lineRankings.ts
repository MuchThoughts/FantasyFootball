// 2026 NFL offensive line rankings, 1 (best) to 32 (worst).
// Source: Sharp Football Analysis, "2026 NFL Offensive Line Rankings, All 32 Teams"
// https://www.sharpfootballanalysis.com/analysis/best-nfl-offensive-line-rankings/
// Ranks include ties exactly as published (e.g. two teams at 10, then 12).
// Team names use the same nicknames as OFFENSE_DATA so the two tables read alike.
export const OLINE_RANKINGS_SOURCE = "Sharp Football Analysis (2026)";
export const OLINE_RANKINGS_URL =
  "https://www.sharpfootballanalysis.com/analysis/best-nfl-offensive-line-rankings/";

export interface LineRank {
  rank: number;
  team: string;
  score: number;
}

export const OLINE_RANKINGS: LineRank[] = [
  { rank: 1, team: "Broncos", score: 100 },
  { rank: 2, team: "Eagles", score: 91 },
  { rank: 3, team: "Bills", score: 87 },
  { rank: 4, team: "Buccaneers", score: 86 },
  { rank: 5, team: "Rams", score: 84 },
  { rank: 6, team: "Bears", score: 82 },
  { rank: 7, team: "49ers", score: 78 },
  { rank: 8, team: "Chargers", score: 73 },
  { rank: 9, team: "Seahawks", score: 65 },
  { rank: 10, team: "Falcons", score: 64 },
  { rank: 10, team: "Colts", score: 60 },
  { rank: 12, team: "Panthers", score: 58 },
  { rank: 12, team: "Vikings", score: 57 },
  { rank: 14, team: "Lions", score: 56 },
  { rank: 15, team: "Patriots", score: 53 },
  { rank: 16, team: "Saints", score: 52 },
  { rank: 17, team: "Jaguars", score: 51 },
  { rank: 17, team: "Cowboys", score: 48 },
  { rank: 19, team: "Jets", score: 47 },
  { rank: 20, team: "Giants", score: 46 },
  { rank: 21, team: "Steelers", score: 45 },
  { rank: 22, team: "Commanders", score: 43 },
  { rank: 23, team: "Chiefs", score: 38 },
  { rank: 24, team: "Ravens", score: 32 },
  { rank: 25, team: "Raiders", score: 31 },
  { rank: 26, team: "Cardinals", score: 28 },
  { rank: 27, team: "Packers", score: 18 },
  { rank: 28, team: "Bengals", score: 16 },
  { rank: 29, team: "Dolphins", score: 10 },
  { rank: 30, team: "Titans", score: 8 },
  { rank: 31, team: "Texans", score: 6 },
  { rank: 32, team: "Browns", score: 5 },
];
