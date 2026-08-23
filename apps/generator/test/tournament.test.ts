import { describe, expect, it } from "vitest";
import { effectiveConfig, tournamentStatus } from "../lib/tournament";

describe("tournamentStatus", () => {
  it("is open until registration closes, then closed, then generated", () => {
    expect(tournamentStatus({ registrationClosedAt: null, schedule: null })).toBe("open");
    expect(tournamentStatus({ registrationClosedAt: new Date(), schedule: null })).toBe("closed");
    expect(tournamentStatus({ registrationClosedAt: new Date(), schedule: { rounds: [] } })).toBe("generated");
  });
});

describe("effectiveConfig", () => {
  const base = { maxCourts: 4, rounds: 6, seed: 7, courts: null, restSlots: null };
  it("uses the suggestion when the organiser has not overridden", () => {
    expect(effectiveConfig(base, 18)).toEqual({ courts: 4, rounds: 6, restSlots: 2, seed: 7 });
  });
  it("uses the override when set, still clamped to the roster", () => {
    expect(effectiveConfig({ ...base, courts: 3, restSlots: 6 }, 18)).toEqual({
      courts: 3,
      rounds: 6,
      restSlots: 6,
      seed: 7,
    });
    expect(effectiveConfig({ ...base, courts: 2, restSlots: 30 }, 8).restSlots).toBe(4);
  });
  it("never returns fewer than one court, so the form stays valid with a tiny roster", () => {
    expect(effectiveConfig(base, 3).courts).toBe(1);
  });
});
