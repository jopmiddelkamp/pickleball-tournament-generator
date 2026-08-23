import { describe, expect, it } from "vitest";
import { computeFeasibility } from "../src/feasibility.js";
import { scoreSchedule } from "../src/scoring/algorithmScore.js";
import type { Player, Round } from "../src/types.js";
import {
  config,
  men,
  round,
  women,
  workedExampleRoster,
  workedExampleRounds,
  workedExampleRoundsWithTwoWastedMixed,
} from "./fixtures.js";

function componentValue(
  score: ReturnType<typeof scoreSchedule>,
  id: string,
): number | null {
  const c = score.components.find((x) => x.id === id);
  if (!c) throw new Error(`no component ${id}`);
  return c.applied ? c.value : null;
}

describe("SPEC-2 §2 feasibility (Rule 0)", () => {
  it("derives the worked example's quantities", () => {
    const f = computeFeasibility(workedExampleRoster(), config());
    expect(f.Pplay).toBe(12);
    expect(f.T).toBe(6);
    expect(f.feasMixed).toBe(5);
    expect(f.FM).toBe(35);
    expect(Math.min(f.M * f.W, f.FM)).toBe(35);
    expect(f.B).toBe(0);
    expect(f.sStar).toBe(0);
    expect(f.FSG).toBe(7);
    expect(f.maj).toBe(7);
    expect(f.bs).toBe(0);
    expect(f.TT).toBe(42);
  });
});

describe("SPEC-2 §7 worked example", () => {
  it("33 mixed teams: C1 = 94.3, L1 fails, final capped at 60", () => {
    const players = workedExampleRoster();
    const score = scoreSchedule(workedExampleRoundsWithTwoWastedMixed(), players, config());

    expect(componentValue(score, "C1")).toBeCloseTo(94.3, 1);
    expect(componentValue(score, "C1")).toBeCloseTo((100 * 33) / 35, 10);
    expect(score.laws.find((l) => l.id === "L1")?.passed).toBe(false);
    expect(score.points).toBeGreaterThan(60);
    expect(score.final).toBe(60);
    expect(score.grade).toBe("fail");
  });

  it("35 mixed teams and 35 distinct M-F pairs: C1 = 100, C2 = 100", () => {
    const players = workedExampleRoster();
    const score = scoreSchedule(workedExampleRounds(), players, config());

    expect(componentValue(score, "C1")).toBe(100);
    expect(componentValue(score, "C2")).toBe(100);
    expect(score.laws.every((l) => l.passed)).toBe(true);
    expect(score.final).toBe(score.points);
  });
});

describe("SPEC-2 §3 the laws", () => {
  it("L2 fails on a third-time partnership and caps the final at 60", () => {
    // 8 players, 2 courts, 3 rounds. m0 + w0 partner in all three.
    const players: Player[] = [...men(4), ...women(4)];
    const rounds: Round[] = [
      round([
        ["m0", "w0"],
        ["m1", "w1"],
        ["m2", "w2"],
        ["m3", "w3"],
      ]),
      round([
        ["m0", "w0"],
        ["m1", "w2"],
        ["m2", "w3"],
        ["m3", "w1"],
      ]),
      round([
        ["m0", "w0"],
        ["m1", "w3"],
        ["m2", "w1"],
        ["m3", "w2"],
      ]),
    ];
    const score = scoreSchedule(rounds, players, config({ courts: 2, rounds: 3 }));

    expect(score.diagnostics.maxPartnerRepeat).toBe(3);
    expect(score.laws.find((l) => l.id === "L2")?.passed).toBe(false);
    expect(score.final).toBeLessThanOrEqual(60);
  });

  it("L3 fails when a pair faces each other three rounds running", () => {
    const players: Player[] = [...men(4), ...women(4)];
    // m0 and m1 are on opposing sides of court 1 in every round.
    const rounds: Round[] = [
      round([
        ["m0", "w0"],
        ["m1", "w1"],
        ["m2", "w2"],
        ["m3", "w3"],
      ]),
      round([
        ["m0", "w1"],
        ["m1", "w2"],
        ["m2", "w3"],
        ["m3", "w0"],
      ]),
      round([
        ["m0", "w2"],
        ["m1", "w3"],
        ["m2", "w0"],
        ["m3", "w1"],
      ]),
    ];
    const score = scoreSchedule(rounds, players, config({ courts: 2, rounds: 3 }));

    expect(score.diagnostics.maxConsecutiveOpponentStreak).toBeGreaterThanOrEqual(3);
    expect(score.laws.find((l) => l.id === "L3")?.passed).toBe(false);
    expect(score.final).toBeLessThanOrEqual(60);
  });

  it("L3 is waived below 8 players, where the repetition is forced", () => {
    const players: Player[] = [...men(2), ...women(2)];
    const rounds: Round[] = [
      round([
        ["m0", "w0"],
        ["m1", "w1"],
      ]),
      round([
        ["m0", "w1"],
        ["m1", "w0"],
      ]),
      round([
        ["m0", "w0"],
        ["m1", "w1"],
      ]),
    ];
    const score = scoreSchedule(rounds, players, config({ courts: 1, rounds: 3 }));
    const l3 = score.laws.find((l) => l.id === "L3");

    expect(score.diagnostics.maxConsecutiveOpponentStreak).toBeGreaterThanOrEqual(3);
    expect(l3?.waived).toBe(true);
    expect(l3?.passed).toBe(true);
  });
});

describe("SPEC-2 §2 anti-cheat", () => {
  it("benching all the women does not raise the mixed score", () => {
    // 8 men, 4 women, 2 courts, 4 rest slots: the women exactly fill the bench.
    const players: Player[] = [...men(8), ...women(4)];
    const cfg = config({ courts: 2, rounds: 4, restSlots: 4 });
    const restingWomen = ["w0", "w1", "w2", "w3"];

    const benched: Round[] = Array.from({ length: 4 }, (_, r) =>
      round(
        [
          [`m${r % 8}`, `m${(r + 1) % 8}`],
          [`m${(r + 2) % 8}`, `m${(r + 3) % 8}`],
          [`m${(r + 4) % 8}`, `m${(r + 5) % 8}`],
          [`m${(r + 6) % 8}`, `m${(r + 7) % 8}`],
        ],
        restingWomen,
      ),
    );

    const mixed: Round[] = Array.from({ length: 4 }, (_, r) =>
      round(
        [
          [`m${r % 8}`, `w0`],
          [`m${(r + 1) % 8}`, `w1`],
          [`m${(r + 2) % 8}`, `w2`],
          [`m${(r + 3) % 8}`, `w3`],
        ],
        [`m${(r + 4) % 8}`, `m${(r + 5) % 8}`, `m${(r + 6) % 8}`, `m${(r + 7) % 8}`],
      ),
    );

    const benchedScore = scoreSchedule(benched, players, cfg);
    const mixedScore = scoreSchedule(mixed, players, cfg);

    expect(componentValue(benchedScore, "C1")).toBe(0);
    expect(componentValue(benchedScore, "C2")).toBe(0);
    expect(componentValue(mixedScore, "C1")).toBe(100);
    expect(mixedScore.points).toBeGreaterThan(benchedScore.points);
  });
});

describe("SPEC-2 §5 not-applicable rule", () => {
  it("drops C1, C2 and C6 for a single-gender roster instead of gifting 100", () => {
    const players: Player[] = men(8);
    const rounds: Round[] = [
      round([
        ["m0", "m1"],
        ["m2", "m3"],
        ["m4", "m5"],
        ["m6", "m7"],
      ]),
    ];
    const score = scoreSchedule(rounds, players, config({ courts: 2, rounds: 1 }));
    const dropped = score.components.filter((c) => !c.applied).map((c) => c.id);

    expect(dropped).toContain("C1");
    expect(dropped).toContain("C2");
    expect(dropped).toContain("C6");
    expect(score.activeWeight).toBe(100 - 18 - 12 - 5);
  });
});
