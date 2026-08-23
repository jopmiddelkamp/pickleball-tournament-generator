import { describe, expect, it } from "vitest";
import { ALGORITHMS, generateSchedule } from "../src/algorithms/registry.js";
import { playingCapacity } from "../src/feasibility.js";
import { scheduleFingerprint } from "../src/fingerprint.js";
import { scoreSchedule } from "../src/scoring/algorithmScore.js";
import { buildHistory, byeCount } from "../src/tracker.js";
import type { Player, TournamentConfig } from "../src/types.js";
import { men, women } from "./fixtures.js";

/** 16 players, mixed levels, 3 courts of 4 with the rest on the bench. */
const roster: Player[] = [
  ...men(9, 3).map((p, i) => ({ ...p, level: ((i % 6) + 1) as Player["level"] })),
  ...women(7, 3).map((p, i) => ({ ...p, level: (((i + 2) % 6) + 1) as Player["level"] })),
];
const cfg: TournamentConfig = { courts: 3, rounds: 7, restSlots: 4, seed: 4242 };

describe.each(ALGORITHMS.map((a) => [a.id, a] as const))("%s", (_id, algorithm) => {
  it("is deterministic: same players, config and seed give the same schedule", () => {
    const a = generateSchedule(algorithm.id, roster, cfg);
    const b = generateSchedule(algorithm.id, roster, cfg);
    expect(scheduleFingerprint(a.rounds)).toBe(scheduleFingerprint(b.rounds));
  });

  it("fills every court and rests exactly the players it cannot seat", () => {
    const capacity = playingCapacity(roster.length, cfg);
    const schedule = generateSchedule(algorithm.id, roster, cfg);

    expect(schedule.rounds).toHaveLength(cfg.rounds);
    for (const round of schedule.rounds) {
      expect(round.matches).toHaveLength(capacity / 4);
      expect(round.resting).toHaveLength(roster.length - capacity);

      const playing = round.matches.flatMap((m) => [...m.teamA, ...m.teamB]);
      expect(new Set(playing).size).toBe(playing.length);
      for (const id of round.resting) expect(playing).not.toContain(id);
      expect(round.matches.map((m) => m.court)).toEqual(
        Array.from({ length: capacity / 4 }, (_, i) => i + 1),
      );
    }
  });

  it("shares the byes evenly within each gender", () => {
    // Across genders the spread can be wider: this roster has only 7 women and
    // needs 6 of them on court every round to keep the mixed teams available,
    // so the men carry the byes. Within a gender the least-rested always go
    // first, so that spread stays at 1.
    const schedule = generateSchedule(algorithm.id, roster, cfg);
    const history = buildHistory(schedule.rounds, roster);
    for (const gender of ["M", "F"] as const) {
      const counts = roster.filter((p) => p.gender === gender).map((p) => byeCount(history, p.id));
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    }
  });
});

describe("determinism hashes", () => {
  // Pinned so an accidental change in output is a failing test, not a surprise
  // in the bench numbers. Update deliberately when an algorithm changes.
  const expected: Record<string, string> = {
    greedy: "87fcbfd5",
    circle: "dc5d5fe9",
    latin: "111c8231",
    random: "5eb0c08d",
  };

  it.each(ALGORITHMS.map((a) => [a.id] as const))("%s hashes to its pinned value", (id) => {
    const schedule = generateSchedule(id, roster, cfg);
    expect(scheduleFingerprint(schedule.rounds)).toBe(expected[id]);
  });
});

describe("greedy quality", () => {
  it("keeps every law on a normal club roster", () => {
    const schedule = generateSchedule("greedy", roster, cfg);
    const score = scoreSchedule(schedule.rounds, roster, cfg);
    const broken = score.laws.filter((l) => !l.passed).map((l) => `${l.id}: ${l.detail}`);
    expect(broken).toEqual([]);
  });

  it("beats random and circle on the same roster and seed", () => {
    const scoreOf = (id: string) =>
      scoreSchedule(generateSchedule(id, roster, cfg).rounds, roster, cfg).final;
    expect(scoreOf("greedy")).toBeGreaterThan(scoreOf("random"));
    expect(scoreOf("greedy")).toBeGreaterThan(scoreOf("circle"));
  });
});
