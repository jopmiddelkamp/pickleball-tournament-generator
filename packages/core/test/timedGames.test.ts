import { describe, expect, it } from "vitest";
import type { GameResult } from "../src/scoring/nightPoints.js";
import { roundUpToTarget, settleTimedGames } from "../src/timedGames.js";

function game(round: number, pointsA: number, pointsB: number, voided = false): GameResult {
  return { round, court: 1, teamA: ["a", "b"], teamB: ["c", "d"], pointsA, pointsB, voided };
}

describe("roundUpToTarget", () => {
  it("lifts the leader to the target and gives the trailer the same lift", () => {
    expect(roundUpToTarget(5, 8, 11)).toEqual([8, 11]);
    expect(roundUpToTarget(2, 7, 11)).toEqual([6, 11]);
    expect(roundUpToTarget(8, 5, 11)).toEqual([11, 8]);
  });
  it("rounds a tie to target all", () => {
    expect(roundUpToTarget(7, 7, 11)).toEqual([11, 11]);
  });
  it("leaves a finished game alone, including a win by two past the target", () => {
    expect(roundUpToTarget(11, 7, 11)).toEqual([11, 7]);
    expect(roundUpToTarget(13, 11, 11)).toEqual([13, 11]);
  });
});

describe("settleTimedGames", () => {
  const games = [game(0, 5, 8), game(1, 2, 7), game(2, 3, 3)];

  it("rounds up unfinished games in closed rounds and leaves the round on court alone", () => {
    const settled = settleTimedGames(games, 2, 11);
    expect(settled.map((g) => [g.pointsA, g.pointsB])).toEqual([
      [8, 11],
      [6, 11],
      [3, 3],
    ]);
  });
  it("skips a voided game", () => {
    expect(settleTimedGames([game(0, 5, 8, true)], 1, 11)[0]).toMatchObject({ pointsA: 5, pointsB: 8, voided: true });
  });
  it("does not touch the input", () => {
    settleTimedGames(games, 3, 11);
    expect(games[0]).toMatchObject({ pointsA: 5, pointsB: 8 });
  });
  it("with no closed rounds returns the games unchanged", () => {
    expect(settleTimedGames(games, 0, 11)).toEqual(games);
  });
});
