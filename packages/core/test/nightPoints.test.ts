import { describe, expect, it } from "vitest";
import {
  DEFAULT_GAME_TARGET,
  GAME_TARGETS,
  computeNightPoints,
  type GameResult,
} from "../src/scoring/nightPoints.js";
import type { Player, Round } from "../src/types.js";
import { player, round } from "./fixtures.js";

const roster: Player[] = [
  player("m0", "M", 3),
  player("m1", "M", 4),
  player("w0", "F", 3),
  player("w1", "F", 4),
  player("m2", "M", 2),
  player("w2", "F", 5),
];

function game(overrides: Partial<GameResult> & Pick<GameResult, "round" | "court">): GameResult {
  return {
    teamA: ["m0", "w0"],
    teamB: ["m1", "w1"],
    pointsA: 21,
    pointsB: 14,
    voided: false,
    ...overrides,
  };
}

describe("SPEC-1 §1 game target", () => {
  it("defaults to 11 so an evening fits the time slot", () => {
    expect(DEFAULT_GAME_TARGET).toBe(11);
    expect(GAME_TARGETS).toContain(DEFAULT_GAME_TARGET);
  });
});

describe("SPEC-1 §1 base rule", () => {
  it("gives every player the points their own team scored", () => {
    const rounds: Round[] = [
      round(
        [
          ["m0", "w0"],
          ["m1", "w1"],
        ],
        ["m2", "w2"],
      ),
    ];
    const night = computeNightPoints(roster, rounds, [game({ round: 0, court: 1 })]);

    expect(night.byId["m0"]?.gamePoints).toBe(21);
    expect(night.byId["w0"]?.gamePoints).toBe(21);
    expect(night.byId["m1"]?.gamePoints).toBe(14);
    expect(night.byId["w1"]?.gamePoints).toBe(14);
  });
});

describe("SPEC-1 §2 compensation bonuses", () => {
  it("pays a bye the round mean of the playing players' points, rounded half up", () => {
    const rounds: Round[] = [
      round(
        [
          ["m0", "w0"],
          ["m1", "w1"],
        ],
        ["m2", "w2"],
      ),
    ];
    const night = computeNightPoints(roster, rounds, [game({ round: 0, court: 1 })]);

    // 21, 21, 14, 14 -> mean 17.5 -> 18
    expect(night.rounds[0]?.byeBonus).toBe(18);
    expect(night.byId["m2"]?.byeBonus).toBe(18);
    expect(night.byId["w2"]?.byeBonus).toBe(18);
    expect(night.byId["m2"]?.total).toBe(18);
  });

  it("pays nothing extra for a same-gender team; that is the scheduler's problem, not the players'", () => {
    const rounds: Round[] = [
      round(
        [
          ["m0", "m1"],
          ["w0", "w1"],
        ],
        ["m2", "w2"],
      ),
    ];
    const night = computeNightPoints(roster, rounds, [
      game({ round: 0, court: 1, teamA: ["m0", "m1"], teamB: ["w0", "w1"] }),
    ]);
    expect(night.byId["m0"]?.total).toBe(21);
    expect(night.byId["w0"]?.total).toBe(14);
  });
});

describe("SPEC-1 §4 edge cases", () => {
  it("leaves void games out of the standings and out of the bye average", () => {
    const rounds: Round[] = [
      round(
        [
          ["m0", "w0"],
          ["m1", "w1"],
        ],
        ["m2", "w2"],
      ),
    ];
    const night = computeNightPoints(roster, rounds, [
      game({ round: 0, court: 1, pointsA: 21, pointsB: 9, voided: true }),
    ]);

    expect(night.byId["m0"]?.gamePoints).toBe(0);
    expect(night.byId["m2"]?.byeBonus).toBe(0);
    expect(night.rounds[0]?.playedGames).toBe(0);
  });

  it("keeps the points of a player who leaves mid-evening", () => {
    const rounds: Round[] = [
      round(
        [
          ["m0", "w0"],
          ["m1", "w1"],
        ],
        ["m2", "w2"],
      ),
      round(
        [
          ["m1", "w1"],
          ["m2", "w2"],
        ],
        ["w0"],
      ),
    ];
    const night = computeNightPoints(roster, rounds, [
      game({ round: 0, court: 1 }),
      game({ round: 1, court: 1, teamA: ["m1", "w1"], teamB: ["m2", "w2"], pointsA: 21, pointsB: 18 }),
    ]);

    // m0 played round 0 only and is in neither the matches nor the rest list of round 1.
    expect(night.byId["m0"]?.gamePoints).toBe(21);
    expect(night.byId["m0"]?.gamesPlayed).toBe(1);
    expect(night.byId["m0"]?.byes).toBe(0);
  });
});

describe("SPEC-1 §3 standings", () => {
  it("ranks on total points descending and shares rank on a tie", () => {
    const rounds: Round[] = [
      round(
        [
          ["m0", "w0"],
          ["m1", "w1"],
        ],
        ["m2", "w2"],
      ),
    ];
    const night = computeNightPoints(roster, rounds, [game({ round: 0, court: 1 })]);
    const rankOf = (id: string) => night.byId[id]?.rank;

    expect(rankOf("m0")).toBe(1);
    expect(rankOf("w0")).toBe(1);
    expect(rankOf("m2")).toBe(3);
    expect(rankOf("w2")).toBe(3);
    expect(rankOf("m1")).toBe(5);
    expect(rankOf("w1")).toBe(5);
    expect(night.standings.map((s) => s.playerId).slice(0, 2).sort()).toEqual(["m0", "w0"]);
  });
});

describe("SPEC-1 §3 tiebreaker", () => {
  // Two courts, one round. m0+w0 win 11-5, m1+w1 win 11-9: both winning pairs
  // total 11, but m0 and w0 conceded fewer.
  const rounds: Round[] = [
    round([
      ["m0", "w0"],
      ["m2", "w2"],
      ["m1", "w1"],
      ["m3", "w3"],
    ]),
  ];
  const wide = [...roster, player("m3", "M", 3), player("w3", "F", 3)];
  const games = [
    game({ round: 0, court: 1, teamA: ["m0", "w0"], teamB: ["m2", "w2"], pointsA: 11, pointsB: 5 }),
    game({ round: 0, court: 2, teamA: ["m1", "w1"], teamB: ["m3", "w3"], pointsA: 11, pointsB: 9 }),
  ];
  const night = computeNightPoints(wide, rounds, games);

  it("reports points conceded and the difference", () => {
    expect(night.byId["m0"]).toMatchObject({ gamePoints: 11, pointsAgainst: 5, difference: 6 });
    expect(night.byId["m2"]).toMatchObject({ gamePoints: 5, pointsAgainst: 11, difference: -6 });
  });
  it("breaks a tie on total by difference, and still shares the rank when that is equal too", () => {
    const rankOf = (id: string) => night.byId[id]?.rank;
    expect(rankOf("m0")).toBe(1);
    expect(rankOf("w0")).toBe(1);
    expect(rankOf("m1")).toBe(3);
    expect(rankOf("w1")).toBe(3);
    expect(rankOf("m3")).toBe(5);
    expect(rankOf("m2")).toBe(7);
  });
  it("leaves byes and bonuses out of the difference", () => {
    const resting: Round[] = [round([["m0", "w0"], ["m1", "w1"]], ["m2", "w2"])];
    const one = computeNightPoints(roster, resting, [game({ round: 0, court: 1, pointsA: 11, pointsB: 7 })]);
    expect(one.byId["m2"]).toMatchObject({ pointsAgainst: 0, difference: 0 });
    expect(one.byId["m2"]?.byeBonus).toBeGreaterThan(0);
  });
});
