// NFL depth charts — running back and wide receiver, all 32 teams.
//
// Pulled from the FantasyPros depth-chart tool on 2026-09-08. Each entry keeps
// its published depth order; where the name matches a player carried in
// players.ts, playerUid links it to that player's board data (rank, tier,
// your rating). Where it doesn't — a camp body several names deep with no
// fantasy relevance — playerUid is null and the tab shows the plain name.
//
// 309 of 453 entries matched; the rest are legitimately outside the app's
// player pool, not transcription misses (verified by direct lookup, not just
// absence). A handful of spelling variants needed an explicit alias
// (Jonathon/Jonathan Brooks, Kenny/Kenneth Gainwell) since a name that
// differs by more than a Jr./Sr./III suffix won't resolve on its own, and a
// same-surname fallback proved unsafe at this depth — it once matched a
// practice-squad Kameron Johnson to the Buccaneers' actual Tez Johnson.
//
// Regenerate by re-pulling all 32 team charts and re-running the matcher.

export interface DepthChartEntry {
  name: string;
  playerUid: string | null;
}

export interface TeamDepthChart {
  RB: DepthChartEntry[];
  WR: DepthChartEntry[];
}

export const TEAM_NAMES: Record<string, string> = {
  "ARI": "Cardinals",
  "ATL": "Falcons",
  "BAL": "Ravens",
  "BUF": "Bills",
  "CAR": "Panthers",
  "CHI": "Bears",
  "CIN": "Bengals",
  "CLE": "Browns",
  "DAL": "Cowboys",
  "DEN": "Broncos",
  "DET": "Lions",
  "GB": "Packers",
  "HOU": "Texans",
  "IND": "Colts",
  "JAC": "Jaguars",
  "KC": "Chiefs",
  "LV": "Raiders",
  "LAC": "Chargers",
  "LAR": "Rams",
  "MIA": "Dolphins",
  "MIN": "Vikings",
  "NE": "Patriots",
  "NO": "Saints",
  "NYG": "Giants",
  "NYJ": "Jets",
  "PHI": "Eagles",
  "PIT": "Steelers",
  "SF": "49ers",
  "SEA": "Seahawks",
  "TB": "Buccaneers",
  "TEN": "Titans",
  "WAS": "Commanders"
};

export const DEPTH_CHARTS: Record<string, TeamDepthChart> = {
  "ARI": {
    "RB": [
      {
        "name": "Jeremiyah Love",
        "playerUid": "jeremiyahlove"
      },
      {
        "name": "Tyler Allgeier",
        "playerUid": "tylerallgeier"
      },
      {
        "name": "James Conner",
        "playerUid": "jamesconner"
      },
      {
        "name": "Trey Benson",
        "playerUid": "treybenson"
      },
      {
        "name": "Bam Knight",
        "playerUid": "bamknight"
      },
      {
        "name": "Evan Hull",
        "playerUid": null
      }
    ],
    "WR": [
      {
        "name": "Marvin Harrison Jr.",
        "playerUid": "marvinharrisonjr"
      },
      {
        "name": "Michael Wilson",
        "playerUid": "michaelwilson"
      },
      {
        "name": "Kendrick Bourne",
        "playerUid": "kendrickbourne"
      },
      {
        "name": "Reggie Virgil",
        "playerUid": "reggievirgil"
      },
      {
        "name": "Jalen Brooks",
        "playerUid": null
      },
      {
        "name": "Devin Duvernay",
        "playerUid": null
      },
      {
        "name": "Simi Fehoko",
        "playerUid": null
      },
      {
        "name": "Harrison Wallace III",
        "playerUid": null
      },
      {
        "name": "Ihmir Smith-Marsette",
        "playerUid": null
      }
    ]
  },
  "ATL": {
    "RB": [
      {
        "name": "Bijan Robinson",
        "playerUid": "bijanrobinson"
      },
      {
        "name": "Brian Robinson Jr.",
        "playerUid": "brianrobinsonjr"
      },
      {
        "name": "Tyler Goodson",
        "playerUid": null
      },
      {
        "name": "Trey Sermon",
        "playerUid": "treysermon"
      },
      {
        "name": "Cash Jones",
        "playerUid": "cashjones"
      }
    ],
    "WR": [
      {
        "name": "Drake London",
        "playerUid": "drakelondon"
      },
      {
        "name": "Zachariah Branch",
        "playerUid": "zachariahbranch"
      },
      {
        "name": "Jahan Dotson",
        "playerUid": "jahandotson"
      },
      {
        "name": "Olamide Zaccheaus",
        "playerUid": "olamidezaccheaus"
      },
      {
        "name": "Chris Blair",
        "playerUid": null
      },
      {
        "name": "Beaux Collins",
        "playerUid": null
      },
      {
        "name": "Dylan Drummond",
        "playerUid": null
      },
      {
        "name": "Vinny Anthony II",
        "playerUid": null
      }
    ]
  },
  "BAL": {
    "RB": [
      {
        "name": "Derrick Henry",
        "playerUid": "derrickhenry"
      },
      {
        "name": "Justice Hill",
        "playerUid": "justicehill"
      },
      {
        "name": "Adam Randall",
        "playerUid": "adamrandall"
      },
      {
        "name": "Rasheen Ali",
        "playerUid": "rasheenali"
      },
      {
        "name": "Jonathan Ward",
        "playerUid": null
      }
    ],
    "WR": [
      {
        "name": "Zay Flowers",
        "playerUid": "zayflowers"
      },
      {
        "name": "Ja'Kobi Lane",
        "playerUid": "jakobilane"
      },
      {
        "name": "Rashod Bateman",
        "playerUid": "rashodbateman"
      },
      {
        "name": "Elijah Sarratt",
        "playerUid": "elijahsarratt"
      },
      {
        "name": "Devontez Walker",
        "playerUid": "devontezwalker"
      },
      {
        "name": "DeAndre Hopkins",
        "playerUid": "deandrehopkins"
      },
      {
        "name": "LaJohntay Wester",
        "playerUid": null
      },
      {
        "name": "Chris Moore",
        "playerUid": null
      },
      {
        "name": "Xavier Guillory",
        "playerUid": null
      }
    ]
  },
  "BUF": {
    "RB": [
      {
        "name": "James Cook",
        "playerUid": "jamescook"
      },
      {
        "name": "Ray Davis",
        "playerUid": "raydavis"
      },
      {
        "name": "Ty Johnson",
        "playerUid": "tyjohnson"
      },
      {
        "name": "Frank Gore Jr.",
        "playerUid": "frankgorejr"
      }
    ],
    "WR": [
      {
        "name": "DJ Moore",
        "playerUid": "djmoore"
      },
      {
        "name": "Khalil Shakir",
        "playerUid": "khalilshakir"
      },
      {
        "name": "Keon Coleman",
        "playerUid": "keoncoleman"
      },
      {
        "name": "Skyler Bell",
        "playerUid": "skylerbell"
      },
      {
        "name": "Joshua Palmer",
        "playerUid": "joshuapalmer"
      },
      {
        "name": "Greg Dortch",
        "playerUid": "gregdortch"
      },
      {
        "name": "Tyrell Shavers",
        "playerUid": null
      },
      {
        "name": "Trent Sherfield Sr.",
        "playerUid": null
      },
      {
        "name": "Stephen Gosnell",
        "playerUid": null
      },
      {
        "name": "Ja'Mori Maclin",
        "playerUid": null
      }
    ]
  },
  "CAR": {
    "RB": [
      {
        "name": "Jonathon Brooks",
        "playerUid": "jonathanbrooks"
      },
      {
        "name": "Chuba Hubbard",
        "playerUid": "chubahubbard"
      },
      {
        "name": "Trevor Etienne",
        "playerUid": "trevoretienne"
      },
      {
        "name": "AJ Dillon",
        "playerUid": "ajdillon"
      },
      {
        "name": "Ahmani Marshall",
        "playerUid": null
      }
    ],
    "WR": [
      {
        "name": "Tetairoa McMillan",
        "playerUid": "tetairoamcmillan"
      },
      {
        "name": "Jalen Coker",
        "playerUid": "jalencoker"
      },
      {
        "name": "Xavier Legette",
        "playerUid": "xavierlegette"
      },
      {
        "name": "John Metchie",
        "playerUid": "johnmetchieiii"
      },
      {
        "name": "Chris Brazzell II",
        "playerUid": "chrisbrazzellii"
      },
      {
        "name": "Jimmy Horn Jr.",
        "playerUid": "jimmyhornjr"
      },
      {
        "name": "Brycen Tremayne",
        "playerUid": null
      },
      {
        "name": "David Moore",
        "playerUid": null
      },
      {
        "name": "Casey Washington",
        "playerUid": null
      }
    ]
  },
  "CHI": {
    "RB": [
      {
        "name": "D'Andre Swift",
        "playerUid": "dandreswift"
      },
      {
        "name": "Kyle Monangai",
        "playerUid": "kylemonangai"
      },
      {
        "name": "Roschon Johnson",
        "playerUid": "roschonjohnson"
      },
      {
        "name": "Zavier Scott",
        "playerUid": "zavierscott"
      },
      {
        "name": "Brittain Brown",
        "playerUid": "brittainbrown"
      },
      {
        "name": "Salvon Ahmed",
        "playerUid": null
      }
    ],
    "WR": [
      {
        "name": "Luther Burden III",
        "playerUid": "lutherburdeniii"
      },
      {
        "name": "Rome Odunze",
        "playerUid": "romeodunze"
      },
      {
        "name": "Zavion Thomas",
        "playerUid": "zavionthomas"
      },
      {
        "name": "Kalif Raymond",
        "playerUid": "kalifraymond"
      },
      {
        "name": "Jahdae Walker",
        "playerUid": "jahdaewalker"
      },
      {
        "name": "Scotty Miller",
        "playerUid": null
      },
      {
        "name": "JP Richardson",
        "playerUid": null
      }
    ]
  },
  "CIN": {
    "RB": [
      {
        "name": "Chase Brown",
        "playerUid": "chasebrown"
      },
      {
        "name": "Samaje Perine",
        "playerUid": "samajeperine"
      },
      {
        "name": "Tahj Brooks",
        "playerUid": "tahjbrooks"
      },
      {
        "name": "Kendall Milton",
        "playerUid": null
      },
      {
        "name": "Kentrel Bullock",
        "playerUid": null
      }
    ],
    "WR": [
      {
        "name": "Ja'Marr Chase",
        "playerUid": "jamarrchase"
      },
      {
        "name": "Tee Higgins",
        "playerUid": "teehiggins"
      },
      {
        "name": "Andrei Iosivas",
        "playerUid": "andreiiosivas"
      },
      {
        "name": "Colbie Young",
        "playerUid": "colbieyoung"
      },
      {
        "name": "Dohnte Meyers",
        "playerUid": null
      },
      {
        "name": "Ke'Shawn Williams",
        "playerUid": null
      },
      {
        "name": "Jordan Moore",
        "playerUid": null
      },
      {
        "name": "Noah Thomas",
        "playerUid": null
      }
    ]
  },
  "CLE": {
    "RB": [
      {
        "name": "Quinshon Judkins",
        "playerUid": "quinshonjudkins"
      },
      {
        "name": "Dylan Sampson",
        "playerUid": "dylansampson"
      },
      {
        "name": "Jaleel McLaughlin",
        "playerUid": "jaleelmclaughlin"
      },
      {
        "name": "Raheim Sanders",
        "playerUid": "raheimsanders"
      },
      {
        "name": "Michael Burton",
        "playerUid": "michaelburton"
      }
    ],
    "WR": [
      {
        "name": "KC Concepcion",
        "playerUid": "kcconcepcion"
      },
      {
        "name": "Denzel Boston",
        "playerUid": "denzelboston"
      },
      {
        "name": "Jerry Jeudy",
        "playerUid": "jerryjeudy"
      },
      {
        "name": "Isaiah Bond",
        "playerUid": "isaiahbond"
      },
      {
        "name": "Malachi Corley",
        "playerUid": null
      },
      {
        "name": "Tylan Wallace",
        "playerUid": null
      },
      {
        "name": "Jamari Thrash",
        "playerUid": null
      },
      {
        "name": "Bryce Oliver",
        "playerUid": null
      },
      {
        "name": "Kole Wilson",
        "playerUid": null
      }
    ]
  },
  "DAL": {
    "RB": [
      {
        "name": "Javonte Williams",
        "playerUid": "javontewilliams"
      },
      {
        "name": "Malik Davis",
        "playerUid": "malikdavis"
      },
      {
        "name": "Emari Demercado",
        "playerUid": "emaridemercado"
      },
      {
        "name": "Hunter Luepke",
        "playerUid": "hunterluepke"
      },
      {
        "name": "Israel Abanikanda",
        "playerUid": null
      }
    ],
    "WR": [
      {
        "name": "CeeDee Lamb",
        "playerUid": "ceedeelamb"
      },
      {
        "name": "George Pickens",
        "playerUid": "georgepickens"
      },
      {
        "name": "Ryan Flournoy",
        "playerUid": "ryanflournoy"
      },
      {
        "name": "KaVontae Turpin",
        "playerUid": "kavontaeturpin"
      },
      {
        "name": "Jonathan Mingo",
        "playerUid": "jonathanmingo"
      },
      {
        "name": "Camden Brown",
        "playerUid": null
      },
      {
        "name": "Anthony Smith",
        "playerUid": null
      },
      {
        "name": "Jordan Hudson",
        "playerUid": null
      }
    ]
  },
  "DEN": {
    "RB": [
      {
        "name": "J.K. Dobbins",
        "playerUid": "jkdobbins"
      },
      {
        "name": "RJ Harvey",
        "playerUid": "rjharvey"
      },
      {
        "name": "Jonah Coleman",
        "playerUid": "jonahcoleman"
      },
      {
        "name": "Tyler Badie",
        "playerUid": "tylerbadie"
      },
      {
        "name": "Adam Prentice",
        "playerUid": null
      },
      {
        "name": "Cody Schrader",
        "playerUid": null
      }
    ],
    "WR": [
      {
        "name": "Jaylen Waddle",
        "playerUid": "jaylenwaddle"
      },
      {
        "name": "Courtland Sutton",
        "playerUid": "courtlandsutton"
      },
      {
        "name": "Pat Bryant",
        "playerUid": "patbryant"
      },
      {
        "name": "Troy Franklin",
        "playerUid": "troyfranklin"
      },
      {
        "name": "Marvin Mims Jr.",
        "playerUid": "marvinmimsjr"
      },
      {
        "name": "Lil'Jordan Humphrey",
        "playerUid": null
      },
      {
        "name": "Michael Bandy",
        "playerUid": "michaelbandy"
      },
      {
        "name": "Dane Key",
        "playerUid": null
      },
      {
        "name": "Kolbe Katsis",
        "playerUid": null
      }
    ]
  },
  "DET": {
    "RB": [
      {
        "name": "Jahmyr Gibbs",
        "playerUid": "jahmyrgibbs"
      },
      {
        "name": "Isiah Pacheco",
        "playerUid": "isiahpacheco"
      },
      {
        "name": "Jacob Saylors",
        "playerUid": "jacobsaylors"
      },
      {
        "name": "Sione Vaki",
        "playerUid": "sionevaki"
      },
      {
        "name": "Jabari Small",
        "playerUid": "jabarismall"
      }
    ],
    "WR": [
      {
        "name": "Amon-Ra St. Brown",
        "playerUid": "amonrastbrown"
      },
      {
        "name": "Jameson Williams",
        "playerUid": "jamesonwilliams"
      },
      {
        "name": "Isaac TeSlaa",
        "playerUid": "isaacteslaa"
      },
      {
        "name": "Tay Martin",
        "playerUid": null
      },
      {
        "name": "Tom Kennedy",
        "playerUid": null
      },
      {
        "name": "Kendrick Law",
        "playerUid": null
      },
      {
        "name": "Dominic Lovett",
        "playerUid": null
      },
      {
        "name": "Jackson Meeks",
        "playerUid": null
      }
    ]
  },
  "GB": {
    "RB": [
      {
        "name": "MarShawn Lloyd",
        "playerUid": "marshawnlloyd"
      },
      {
        "name": "Josh Jacobs",
        "playerUid": "joshjacobs"
      },
      {
        "name": "Kaleb Johnson",
        "playerUid": "kalebjohnson"
      },
      {
        "name": "Chris Brooks",
        "playerUid": "chrisbrooks"
      },
      {
        "name": "Pierre Strong Jr.",
        "playerUid": "pierrestrongjr"
      }
    ],
    "WR": [
      {
        "name": "Christian Watson",
        "playerUid": "christianwatson"
      },
      {
        "name": "Jayden Reed",
        "playerUid": "jaydenreed"
      },
      {
        "name": "Matthew Golden",
        "playerUid": "matthewgolden"
      },
      {
        "name": "Savion Williams",
        "playerUid": "savionwilliams"
      },
      {
        "name": "Skyy Moore",
        "playerUid": null
      },
      {
        "name": "Bo Melton",
        "playerUid": "bomelton"
      },
      {
        "name": "J. Michael Sturdivant",
        "playerUid": null
      },
      {
        "name": "Isaiah Neyor",
        "playerUid": null
      },
      {
        "name": "Chris Hilton Jr.",
        "playerUid": null
      }
    ]
  },
  "HOU": {
    "RB": [
      {
        "name": "David Montgomery",
        "playerUid": "davidmontgomery"
      },
      {
        "name": "Woody Marks",
        "playerUid": "woodymarks"
      },
      {
        "name": "Jawhar Jordan",
        "playerUid": "jawharjordan"
      },
      {
        "name": "British Brooks",
        "playerUid": null
      },
      {
        "name": "Noah Whittington",
        "playerUid": null
      }
    ],
    "WR": [
      {
        "name": "Nico Collins",
        "playerUid": "nicocollins"
      },
      {
        "name": "Kayshon Boutte",
        "playerUid": "kayshonboutte"
      },
      {
        "name": "Jaylin Noel",
        "playerUid": "jaylinnoel"
      },
      {
        "name": "Tank Dell",
        "playerUid": "tankdell"
      },
      {
        "name": "Xavier Hutchinson",
        "playerUid": "xavierhutchinson"
      },
      {
        "name": "Jared Wayne",
        "playerUid": null
      },
      {
        "name": "Mitch Tinsley",
        "playerUid": "mitchtinsley"
      },
      {
        "name": "Lewis Bond",
        "playerUid": null
      },
      {
        "name": "Josh Kelly",
        "playerUid": null
      },
      {
        "name": "Daniel Sobkowicz",
        "playerUid": null
      }
    ]
  },
  "IND": {
    "RB": [
      {
        "name": "Jonathan Taylor",
        "playerUid": "jonathantaylor"
      },
      {
        "name": "Seth McGowan",
        "playerUid": "sethmcgowan"
      },
      {
        "name": "DJ Giddens",
        "playerUid": "djgiddens"
      },
      {
        "name": "Davon Booth",
        "playerUid": null
      },
      {
        "name": "Anderson Castle",
        "playerUid": null
      }
    ],
    "WR": [
      {
        "name": "Alec Pierce",
        "playerUid": "alecpierce"
      },
      {
        "name": "Josh Downs",
        "playerUid": "joshdowns"
      },
      {
        "name": "Keenan Allen",
        "playerUid": "keenanallen"
      },
      {
        "name": "Ashton Dulin",
        "playerUid": "ashtondulin"
      },
      {
        "name": "Deion Burks",
        "playerUid": "deionburks"
      },
      {
        "name": "Nick Westbrook-Ikhine",
        "playerUid": "nickwestbrookikhine"
      },
      {
        "name": "Laquon Treadwell",
        "playerUid": null
      },
      {
        "name": "Anthony Gould",
        "playerUid": null
      }
    ]
  },
  "JAC": {
    "RB": [
      {
        "name": "Bhayshul Tuten",
        "playerUid": "bhayshultuten"
      },
      {
        "name": "Chris Rodriguez Jr.",
        "playerUid": "chrisrodriguezjr"
      },
      {
        "name": "LeQuint Allen Jr.",
        "playerUid": "lequintallenjr"
      },
      {
        "name": "J'Mari Taylor",
        "playerUid": "jmaritaylor"
      },
      {
        "name": "Ameer Abdullah",
        "playerUid": "ameerabdullah"
      }
    ],
    "WR": [
      {
        "name": "Parker Washington",
        "playerUid": "parkerwashington"
      },
      {
        "name": "Brian Thomas Jr.",
        "playerUid": "brianthomasjr"
      },
      {
        "name": "Jakobi Meyers",
        "playerUid": "jakobimeyers"
      },
      {
        "name": "Travis Hunter",
        "playerUid": "travishunter"
      },
      {
        "name": "Josh Cameron",
        "playerUid": null
      },
      {
        "name": "CJ Williams",
        "playerUid": null
      },
      {
        "name": "Michael Wortham",
        "playerUid": "michaelwortham"
      },
      {
        "name": "Austin Trammell",
        "playerUid": null
      },
      {
        "name": "Tim Jones",
        "playerUid": null
      }
    ]
  },
  "KC": {
    "RB": [
      {
        "name": "Kenneth Walker III",
        "playerUid": "kennethwalkeriii"
      },
      {
        "name": "Emmett Johnson",
        "playerUid": "emmettjohnson"
      },
      {
        "name": "Brashard Smith",
        "playerUid": "brashardsmith"
      },
      {
        "name": "Jaydn Ott",
        "playerUid": "jaydnott"
      }
    ],
    "WR": [
      {
        "name": "Rashee Rice",
        "playerUid": "rasheerice"
      },
      {
        "name": "Xavier Worthy",
        "playerUid": "xavierworthy"
      },
      {
        "name": "Tyquan Thornton",
        "playerUid": "tyquanthornton"
      },
      {
        "name": "Cyrus Allen",
        "playerUid": "cyrusallen"
      },
      {
        "name": "Jalen Royals",
        "playerUid": "jalenroyals"
      },
      {
        "name": "Nikko Remigio",
        "playerUid": null
      },
      {
        "name": "Jeff Caldwell",
        "playerUid": null
      },
      {
        "name": "Andrew Armstrong",
        "playerUid": null
      },
      {
        "name": "Omari Evans",
        "playerUid": null
      },
      {
        "name": "Jimmy Holiday",
        "playerUid": null
      }
    ]
  },
  "LAC": {
    "RB": [
      {
        "name": "Omarion Hampton",
        "playerUid": "omarionhampton"
      },
      {
        "name": "Keaton Mitchell",
        "playerUid": "keatonmitchell"
      },
      {
        "name": "Kimani Vidal",
        "playerUid": "kimanividal"
      },
      {
        "name": "Alec Ingold",
        "playerUid": null
      },
      {
        "name": "Gregory Desrosiers",
        "playerUid": null
      },
      {
        "name": "Amar Johnson",
        "playerUid": null
      }
    ],
    "WR": [
      {
        "name": "Ladd McConkey",
        "playerUid": "laddmcconkey"
      },
      {
        "name": "Quentin Johnston",
        "playerUid": "quentinjohnston"
      },
      {
        "name": "Tre' Harris",
        "playerUid": "treharris"
      },
      {
        "name": "Brenen Thompson",
        "playerUid": "brenenthompson"
      },
      {
        "name": "KeAndre Lambert-Smith",
        "playerUid": null
      },
      {
        "name": "Derius Davis",
        "playerUid": "deriusdavis"
      },
      {
        "name": "Theo Wease Jr.",
        "playerUid": "theoweasejr"
      },
      {
        "name": "Dalevon Campbell",
        "playerUid": null
      }
    ]
  },
  "LAR": {
    "RB": [
      {
        "name": "Kyren Williams",
        "playerUid": "kyrenwilliams"
      },
      {
        "name": "Blake Corum",
        "playerUid": "blakecorum"
      },
      {
        "name": "Ronnie Rivers",
        "playerUid": "ronnierivers"
      },
      {
        "name": "Dean Connors",
        "playerUid": null
      },
      {
        "name": "Jordan Waters",
        "playerUid": "jordanwaters"
      }
    ],
    "WR": [
      {
        "name": "Puka Nacua",
        "playerUid": "pukanacua"
      },
      {
        "name": "Davante Adams",
        "playerUid": "davanteadams"
      },
      {
        "name": "Konata Mumpfield",
        "playerUid": "konatamumpfield"
      },
      {
        "name": "Tutu Atwell",
        "playerUid": "tutuatwell"
      },
      {
        "name": "Jordan Whittington",
        "playerUid": "jordanwhittington"
      },
      {
        "name": "CJ Daniels",
        "playerUid": "cjdaniels"
      },
      {
        "name": "Xavier Smith",
        "playerUid": "xaviersmith"
      },
      {
        "name": "Alex Bachman",
        "playerUid": null
      },
      {
        "name": "Brennan Presley",
        "playerUid": null
      }
    ]
  },
  "LV": {
    "RB": [
      {
        "name": "Ashton Jeanty",
        "playerUid": "ashtonjeanty"
      },
      {
        "name": "Mike Washington Jr.",
        "playerUid": "mikewashingtonjr"
      },
      {
        "name": "Dylan Laube",
        "playerUid": "dylanlaube"
      },
      {
        "name": "Raheem Mostert",
        "playerUid": "raheemmostert"
      },
      {
        "name": "Roman Hemby",
        "playerUid": "romanhemby"
      },
      {
        "name": "Dare Ogunbowale",
        "playerUid": null
      },
      {
        "name": "Chris Collier",
        "playerUid": null
      }
    ],
    "WR": [
      {
        "name": "Tre Tucker",
        "playerUid": "tretucker"
      },
      {
        "name": "Jalen Nailor",
        "playerUid": "jalennailor"
      },
      {
        "name": "Jack Bech",
        "playerUid": "jackbech"
      },
      {
        "name": "Malik Benson",
        "playerUid": "malikbenson"
      },
      {
        "name": "Dont'e Thornton Jr.",
        "playerUid": "dontethorntonjr"
      },
      {
        "name": "Dareke Young",
        "playerUid": null
      },
      {
        "name": "Tyler Lockett",
        "playerUid": "tylerlockett"
      },
      {
        "name": "Ronnie Bell",
        "playerUid": "ronniebell"
      },
      {
        "name": "Deven Thompkins",
        "playerUid": null
      },
      {
        "name": "Cody White",
        "playerUid": null
      },
      {
        "name": "Justin Shorter",
        "playerUid": null
      }
    ]
  },
  "MIA": {
    "RB": [
      {
        "name": "De'Von Achane",
        "playerUid": "devonachane"
      },
      {
        "name": "Jaylen Wright",
        "playerUid": "jaylenwright"
      },
      {
        "name": "Ollie Gordon II",
        "playerUid": "olliegordonii"
      }
    ],
    "WR": [
      {
        "name": "Malik Washington",
        "playerUid": "malikwashington"
      },
      {
        "name": "Chris Bell",
        "playerUid": "chrisbell"
      },
      {
        "name": "Caleb Douglas",
        "playerUid": "calebdouglas"
      },
      {
        "name": "Jalen Tolbert",
        "playerUid": "jalentolbert"
      },
      {
        "name": "Kevin Coleman Jr.",
        "playerUid": "kevincolemanjr"
      },
      {
        "name": "Ryan Miller",
        "playerUid": null
      }
    ]
  },
  "MIN": {
    "RB": [
      {
        "name": "Jordan Mason",
        "playerUid": "jordanmason"
      },
      {
        "name": "Aaron Jones",
        "playerUid": "aaronjonessr"
      },
      {
        "name": "Demond Claiborne",
        "playerUid": "demondclaiborne"
      },
      {
        "name": "Max Bredeson",
        "playerUid": null
      },
      {
        "name": "DeeJay Dallas",
        "playerUid": null
      },
      {
        "name": "Jermar Jefferson",
        "playerUid": null
      }
    ],
    "WR": [
      {
        "name": "Justin Jefferson",
        "playerUid": "justinjefferson"
      },
      {
        "name": "Jordan Addison",
        "playerUid": "jordanaddison"
      },
      {
        "name": "Jauan Jennings",
        "playerUid": "jauanjennings"
      },
      {
        "name": "Tai Felton",
        "playerUid": "taifelton"
      },
      {
        "name": "Myles Price",
        "playerUid": "mylesprice"
      },
      {
        "name": "Jeshaun Jones",
        "playerUid": null
      },
      {
        "name": "Michael Briscoe",
        "playerUid": "michaelbriscoe"
      },
      {
        "name": "Dillon Bell",
        "playerUid": null
      }
    ]
  },
  "NE": {
    "RB": [
      {
        "name": "Rhamondre Stevenson",
        "playerUid": "rhamondrestevenson"
      },
      {
        "name": "TreVeyon Henderson",
        "playerUid": "treveyonhenderson"
      },
      {
        "name": "Corey Kiner",
        "playerUid": null
      },
      {
        "name": "Reggie Gilliam",
        "playerUid": null
      },
      {
        "name": "Hassan Haskins",
        "playerUid": null
      },
      {
        "name": "Lan Larison",
        "playerUid": null
      }
    ],
    "WR": [
      {
        "name": "A.J. Brown",
        "playerUid": "ajbrown"
      },
      {
        "name": "Romeo Doubs",
        "playerUid": "romeodoubs"
      },
      {
        "name": "Kyle Williams",
        "playerUid": "kylewilliams"
      },
      {
        "name": "Mack Hollins",
        "playerUid": "mackhollins"
      },
      {
        "name": "DeMario Douglas",
        "playerUid": "demariodouglas"
      },
      {
        "name": "Efton Chism III",
        "playerUid": null
      },
      {
        "name": "Cameron Dorner",
        "playerUid": null
      },
      {
        "name": "Kyle Dixon",
        "playerUid": null
      },
      {
        "name": "Jeremiah Webb",
        "playerUid": null
      }
    ]
  },
  "NO": {
    "RB": [
      {
        "name": "Travis Etienne",
        "playerUid": "travisetiennejr"
      },
      {
        "name": "Alvin Kamara",
        "playerUid": "alvinkamara"
      },
      {
        "name": "Kendre Miller",
        "playerUid": "kendremiller"
      },
      {
        "name": "Audric Estime",
        "playerUid": "audricestime"
      },
      {
        "name": "Zamir White",
        "playerUid": "zamirwhite"
      },
      {
        "name": "CJ Donaldson",
        "playerUid": null
      }
    ],
    "WR": [
      {
        "name": "Chris Olave",
        "playerUid": "chrisolave"
      },
      {
        "name": "Jordyn Tyson",
        "playerUid": "jordyntyson"
      },
      {
        "name": "Devaughn Vele",
        "playerUid": "devaughnvele"
      },
      {
        "name": "Bryce Lance",
        "playerUid": "brycelance"
      },
      {
        "name": "Cedric Tillman",
        "playerUid": "cedrictillman"
      },
      {
        "name": "Barion Brown",
        "playerUid": null
      },
      {
        "name": "Mason Tipton",
        "playerUid": null
      },
      {
        "name": "Kevin Austin Jr.",
        "playerUid": "kevinaustinjr"
      },
      {
        "name": "Trey Palmer",
        "playerUid": null
      }
    ]
  },
  "NYG": {
    "RB": [
      {
        "name": "Cam Skattebo",
        "playerUid": "camskattebo"
      },
      {
        "name": "Tyrone Tracy Jr.",
        "playerUid": "tyronetracyjr"
      },
      {
        "name": "Najee Harris",
        "playerUid": "najeeharris"
      },
      {
        "name": "Devin Singletary",
        "playerUid": "devinsingletary"
      },
      {
        "name": "Patrick Ricard",
        "playerUid": null
      }
    ],
    "WR": [
      {
        "name": "Malik Nabers",
        "playerUid": "maliknabers"
      },
      {
        "name": "Darnell Mooney",
        "playerUid": "darnellmooney"
      },
      {
        "name": "Malachi Fields",
        "playerUid": "malachifields"
      },
      {
        "name": "Odell Beckham Jr.",
        "playerUid": "odellbeckhamjr"
      },
      {
        "name": "Charlie Jones",
        "playerUid": null
      },
      {
        "name": "Braxton Berrios",
        "playerUid": null
      },
      {
        "name": "Jalin Hyatt",
        "playerUid": null
      },
      {
        "name": "Gunner Olszewski",
        "playerUid": null
      },
      {
        "name": "Dalen Cambre",
        "playerUid": null
      }
    ]
  },
  "NYJ": {
    "RB": [
      {
        "name": "Breece Hall",
        "playerUid": "breecehall"
      },
      {
        "name": "Braelon Allen",
        "playerUid": "braelonallen"
      },
      {
        "name": "Isaiah Davis",
        "playerUid": "isaiahdavis"
      },
      {
        "name": "Kene Nwangwu",
        "playerUid": null
      },
      {
        "name": "Chip Trayanum",
        "playerUid": "chiptrayanum"
      },
      {
        "name": "Andrew Beck",
        "playerUid": null
      }
    ],
    "WR": [
      {
        "name": "Garrett Wilson",
        "playerUid": "garrettwilson"
      },
      {
        "name": "Adonai Mitchell",
        "playerUid": "adonaimitchell"
      },
      {
        "name": "Omar Cooper Jr.",
        "playerUid": "omarcooperjr"
      },
      {
        "name": "Isaiah Williams",
        "playerUid": "isaiahwilliams"
      },
      {
        "name": "Tim Patrick",
        "playerUid": "timpatrick"
      },
      {
        "name": "Arian Smith",
        "playerUid": null
      },
      {
        "name": "Jamaal Pritchett",
        "playerUid": null
      },
      {
        "name": "Malik McClain",
        "playerUid": null
      }
    ]
  },
  "PHI": {
    "RB": [
      {
        "name": "Saquon Barkley",
        "playerUid": "saquonbarkley"
      },
      {
        "name": "Tank Bigsby",
        "playerUid": "tankbigsby"
      },
      {
        "name": "Jaydon Blue",
        "playerUid": "jaydonblue"
      },
      {
        "name": "Will Shipley",
        "playerUid": "willshipley"
      },
      {
        "name": "Dameon Pierce",
        "playerUid": "dameonpierce"
      },
      {
        "name": "Carson Steele",
        "playerUid": null
      }
    ],
    "WR": [
      {
        "name": "DeVonta Smith",
        "playerUid": "devontasmith"
      },
      {
        "name": "Makai Lemon",
        "playerUid": "makailemon"
      },
      {
        "name": "Dontayvion Wicks",
        "playerUid": "dontayvionwicks"
      },
      {
        "name": "Hollywood Brown",
        "playerUid": "hollywoodbrown"
      },
      {
        "name": "Elijah Moore",
        "playerUid": "elijahmoore"
      },
      {
        "name": "Darius Cooper",
        "playerUid": null
      },
      {
        "name": "Britain Covey",
        "playerUid": null
      },
      {
        "name": "Johnny Wilson",
        "playerUid": null
      },
      {
        "name": "Danny Gray",
        "playerUid": null
      }
    ]
  },
  "PIT": {
    "RB": [
      {
        "name": "Jaylen Warren",
        "playerUid": "jaylenwarren"
      },
      {
        "name": "Rico Dowdle",
        "playerUid": "ricodowdle"
      },
      {
        "name": "Eli Heidenreich",
        "playerUid": "eliheidenreich"
      },
      {
        "name": "Lew Nichols III",
        "playerUid": "lewnicholsiii"
      },
      {
        "name": "Travis Homer",
        "playerUid": "travishomer"
      }
    ],
    "WR": [
      {
        "name": "DK Metcalf",
        "playerUid": "dkmetcalf"
      },
      {
        "name": "Michael Pittman Jr.",
        "playerUid": "michaelpittmanjr"
      },
      {
        "name": "Germie Bernard",
        "playerUid": "germiebernard"
      },
      {
        "name": "Roman Wilson",
        "playerUid": "romanwilson"
      },
      {
        "name": "Kaden Wetjen",
        "playerUid": "kadenwetjen"
      },
      {
        "name": "Ben Skowronek",
        "playerUid": null
      },
      {
        "name": "Brandon Johnson",
        "playerUid": null
      },
      {
        "name": "Brandon Smith",
        "playerUid": null
      }
    ]
  },
  "SEA": {
    "RB": [
      {
        "name": "Jadarian Price",
        "playerUid": "jadarianprice"
      },
      {
        "name": "Zach Charbonnet",
        "playerUid": "zachcharbonnet"
      },
      {
        "name": "George Holani",
        "playerUid": "georgeholani"
      },
      {
        "name": "Emanuel Wilson",
        "playerUid": "emanuelwilson"
      },
      {
        "name": "Jacardia Wright",
        "playerUid": "jacardiawright"
      }
    ],
    "WR": [
      {
        "name": "Jaxon Smith-Njigba",
        "playerUid": "jaxonsmithnjigba"
      },
      {
        "name": "Rashid Shaheed",
        "playerUid": "rashidshaheed"
      },
      {
        "name": "Cooper Kupp",
        "playerUid": "cooperkupp"
      },
      {
        "name": "Tory Horton",
        "playerUid": "toryhorton"
      },
      {
        "name": "Montorie Foster Jr.",
        "playerUid": "montoriefosterjr"
      },
      {
        "name": "Jake Bobo",
        "playerUid": null
      },
      {
        "name": "Emmanuel Henderson Jr.",
        "playerUid": null
      },
      {
        "name": "Velus Jones Jr.",
        "playerUid": null
      },
      {
        "name": "Ricky White III",
        "playerUid": null
      },
      {
        "name": "Irv Charles",
        "playerUid": null
      },
      {
        "name": "Julian Hicks",
        "playerUid": null
      }
    ]
  },
  "SF": {
    "RB": [
      {
        "name": "Christian McCaffrey",
        "playerUid": "christianmccaffrey"
      },
      {
        "name": "Kaelon Black",
        "playerUid": "kaelonblack"
      },
      {
        "name": "Jordan James",
        "playerUid": "jordanjames"
      },
      {
        "name": "Isaac Guerendo",
        "playerUid": "isaacguerendo"
      },
      {
        "name": "Kyle Juszczyk",
        "playerUid": "kylejuszczyk"
      },
      {
        "name": "Sincere McCormick",
        "playerUid": "sinceremccormick"
      }
    ],
    "WR": [
      {
        "name": "Mike Evans",
        "playerUid": "mikeevans"
      },
      {
        "name": "De'Zhaun Stribling",
        "playerUid": "dezhaunstribling"
      },
      {
        "name": "Deebo Samuel",
        "playerUid": "deebosamuelsr"
      },
      {
        "name": "Christian Kirk",
        "playerUid": "christiankirk"
      },
      {
        "name": "Brandon Aiyuk",
        "playerUid": "brandonaiyuk"
      },
      {
        "name": "Demarcus Robinson",
        "playerUid": "demarcusrobinson"
      },
      {
        "name": "Jacob Cowing",
        "playerUid": "jacobcowing"
      },
      {
        "name": "Jordan Watkins",
        "playerUid": "jordanwatkins"
      },
      {
        "name": "KhaDarel Hodge",
        "playerUid": null
      },
      {
        "name": "Wesley Grimes",
        "playerUid": null
      }
    ]
  },
  "TB": {
    "RB": [
      {
        "name": "Bucky Irving",
        "playerUid": "buckyirving"
      },
      {
        "name": "Kenny Gainwell",
        "playerUid": "kennethgainwell"
      },
      {
        "name": "Sean Tucker",
        "playerUid": "seantucker"
      },
      {
        "name": "Josh Williams",
        "playerUid": null
      }
    ],
    "WR": [
      {
        "name": "Emeka Egbuka",
        "playerUid": "emekaegbuka"
      },
      {
        "name": "Chris Godwin",
        "playerUid": "chrisgodwinjr"
      },
      {
        "name": "Jalen McMillan",
        "playerUid": "jalenmcmillan"
      },
      {
        "name": "Ted Hurst",
        "playerUid": "tedhurstiii"
      },
      {
        "name": "Tez Johnson",
        "playerUid": "tezjohnson"
      },
      {
        "name": "Kameron Johnson",
        "playerUid": null
      },
      {
        "name": "David Sills V",
        "playerUid": "davidsillsv"
      },
      {
        "name": "Eric Rivers Jr.",
        "playerUid": null
      },
      {
        "name": "Dennis Houston",
        "playerUid": null
      },
      {
        "name": "Dean Patterson IV",
        "playerUid": null
      }
    ]
  },
  "TEN": {
    "RB": [
      {
        "name": "Tony Pollard",
        "playerUid": "tonypollard"
      },
      {
        "name": "Tyjae Spears",
        "playerUid": "tyjaespears"
      },
      {
        "name": "Nicholas Singleton",
        "playerUid": "nicholassingleton"
      },
      {
        "name": "Michael Carter",
        "playerUid": "michaelcarter"
      },
      {
        "name": "Julius Chestnut",
        "playerUid": null
      },
      {
        "name": "Kalel Mullings",
        "playerUid": "kalelmullings"
      }
    ],
    "WR": [
      {
        "name": "Carnell Tate",
        "playerUid": "carnelltate"
      },
      {
        "name": "Wan'Dale Robinson",
        "playerUid": "wandalerobinson"
      },
      {
        "name": "Calvin Ridley",
        "playerUid": "calvinridley"
      },
      {
        "name": "Elic Ayomanor",
        "playerUid": "elicayomanor"
      },
      {
        "name": "Chimere Dike",
        "playerUid": "chimeredike"
      },
      {
        "name": "Xavier Restrepo",
        "playerUid": "xavierrestrepo"
      },
      {
        "name": "K.J. Osborn",
        "playerUid": null
      },
      {
        "name": "Tyren Montgomery",
        "playerUid": null
      }
    ]
  },
  "WAS": {
    "RB": [
      {
        "name": "Jacory Croskey-Merritt",
        "playerUid": "jacorycroskeymerritt"
      },
      {
        "name": "Rachaad White",
        "playerUid": "rachaadwhite"
      },
      {
        "name": "Kaytron Allen",
        "playerUid": "kaytronallen"
      },
      {
        "name": "Jerome Ford",
        "playerUid": "jeromeford"
      },
      {
        "name": "Jeremy McNichols",
        "playerUid": "jeremymcnichols"
      },
      {
        "name": "Robert Henry Jr.",
        "playerUid": "roberthenryjr"
      },
      {
        "name": "Craig Reynolds",
        "playerUid": null
      },
      {
        "name": "Chase Edmonds",
        "playerUid": null
      }
    ],
    "WR": [
      {
        "name": "Terry McLaurin",
        "playerUid": "terrymclaurin"
      },
      {
        "name": "Stefon Diggs",
        "playerUid": "stefondiggs"
      },
      {
        "name": "Antonio Williams",
        "playerUid": "antoniowilliams"
      },
      {
        "name": "Luke McCaffrey",
        "playerUid": "lukemccaffrey"
      },
      {
        "name": "Treylon Burks",
        "playerUid": "treylonburks"
      },
      {
        "name": "Jaylin Lane",
        "playerUid": "jaylinlane"
      },
      {
        "name": "Dyami Brown",
        "playerUid": "dyamibrown"
      },
      {
        "name": "Van Jefferson",
        "playerUid": "vanjefferson"
      },
      {
        "name": "Jaden Bradley",
        "playerUid": null
      }
    ]
  }
};
