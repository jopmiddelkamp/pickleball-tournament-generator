import type { GameResult, Match } from "@ptg/core";
import { describe, expect, it } from "vitest";
import { closedRounds, settleForScoring, withScore, withVoided } from "../lib/evening";

const match: Match = { court: 1, teamA: ["a", "b"], teamB: ["c", "d"] };

describe("withScore", () => {
  it("creates a result on first entry and updates one side afterwards", () => {
    const first = withScore([], match, 0, "A", 11);
    expect(first).toEqual([{ round: 0, court: 1, teamA: ["a", "b"], teamB: ["c", "d"], pointsA: 11, pointsB: 0, voided: false }]);
    const second = withScore(first, match, 0, "B", 7);
    expect(second[0]).toMatchObject({ pointsA: 11, pointsB: 7 });
  });
  it("treats a cleared input as zero", () => {
    expect(withScore([], match, 0, "A", null)[0]?.pointsA).toBe(0);
  });
});

describe("withVoided", () => {
  it("creates a 0-0 voided result when none exists and toggles otherwise", () => {
    const voided = withVoided([], match, 0, true);
    expect(voided[0]).toMatchObject({ pointsA: 0, pointsB: 0, voided: true });
    expect(withVoided(voided, match, 0, false)[0]?.voided).toBe(false);
  });
});

describe("closedRounds", () => {
  it("is every round before the one on court, and all of them once the event is over", () => {
    expect(closedRounds("generated", 0, 5)).toBe(0);
    expect(closedRounds("live", 1, 5)).toBe(0);
    expect(closedRounds("live", 3, 5)).toBe(2);
    expect(closedRounds("finished", 5, 5)).toBe(5);
  });
});

describe("settleForScoring", () => {
  const games: GameResult[] = [
    { round: 0, court: 1, teamA: ["a", "b"], teamB: ["c", "d"], pointsA: 5, pointsB: 8, voided: false },
    { round: 1, court: 1, teamA: ["a", "c"], teamB: ["b", "d"], pointsA: 5, pointsB: 8, voided: false },
  ];
  const evening = { status: "live" as const, roundsStarted: 2, rounds: 3, gameTarget: 11 };

  it("rounds up closed rounds only when the event has a time limit", () => {
    const settled = settleForScoring(games, { ...evening, roundMinutes: 15 });
    expect(settled[0]).toMatchObject({ pointsA: 8, pointsB: 11 });
    expect(settled[1]).toMatchObject({ pointsA: 5, pointsB: 8 });
  });
  it("leaves everything as entered without a time limit", () => {
    expect(settleForScoring(games, { ...evening, roundMinutes: null })).toBe(games);
  });
});
