import { describe, expect, it } from "vitest";
import { ALGORITHMS, generateSchedule } from "../src/algorithms/registry.js";
import { scoreSchedule } from "../src/scoring/algorithmScore.js";
import { searchSchedule } from "../src/search.js";
import { config, men, women } from "./fixtures.js";

const roster = [...men(9, 3), ...women(7, 4)];
const cfg = config({ courts: 3, rounds: 6, restSlots: 0, seed: 42 });

describe("searchSchedule", () => {
  it("is deterministic from the base seed", () => {
    const a = searchSchedule("greedy", roster, cfg, 20);
    const b = searchSchedule("greedy", roster, cfg, 20);
    expect(a).toEqual(b);
  });

  it("keeps the base seed on the returned schedule so a reroll story stays one number", () => {
    const schedule = searchSchedule("greedy", roster, cfg, 20);
    expect(schedule.seed).toBe(42);
    expect(schedule.algorithmId).toBe("greedy");
  });

  it("with one attempt is exactly the plain draw", () => {
    expect(searchSchedule("greedy", roster, cfg, 1)).toEqual(generateSchedule("greedy", roster, cfg));
  });

  it("never scores below the plain draw, since that draw is attempt zero", () => {
    const plain = scoreSchedule(generateSchedule("greedy", roster, cfg).rounds, roster, cfg).final;
    const best = scoreSchedule(searchSchedule("greedy", roster, cfg, 50).rounds, roster, cfg).final;
    expect(best).toBeGreaterThanOrEqual(plain);
  });

  it("finds a better draw than a single attempt on a roster with room to improve", () => {
    // Random breaks a law on nearly every draw, so final sits at the cap; the
    // search still separates them on the uncapped points.
    const plain = scoreSchedule(generateSchedule("random", roster, cfg).rounds, roster, cfg).points;
    const best = scoreSchedule(searchSchedule("random", roster, cfg, 50).rounds, roster, cfg).points;
    expect(best).toBeGreaterThan(plain);
  });

  it("draws a deterministic algorithm once, whatever the attempt count", () => {
    const fixed = ALGORITHMS.find((a) => !a.stochastic);
    expect(fixed).toBeDefined();
    const id = (fixed as (typeof ALGORITHMS)[number]).id;
    expect(searchSchedule(id, roster, cfg, 50)).toEqual(generateSchedule(id, roster, cfg));
  });

  it("rejects a non-positive attempt count", () => {
    expect(() => searchSchedule("greedy", roster, cfg, 0)).toThrow();
  });
});
