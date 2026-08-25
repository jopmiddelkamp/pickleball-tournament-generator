import type { Match } from "@ptg/core";
import { describe, expect, it } from "vitest";
import { withScore, withVoided } from "../lib/evening";

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
