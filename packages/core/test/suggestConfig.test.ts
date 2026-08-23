import { describe, expect, it } from "vitest";
import { suggestConfig } from "../src/suggestConfig.js";

describe("suggestConfig", () => {
  it.each([
    [18, 4, { courts: 4, restSlots: 2 }],
    [22, 4, { courts: 4, restSlots: 6 }],
    [20, 5, { courts: 5, restSlots: 0 }],
    [7, 4, { courts: 1, restSlots: 3 }],
    [16, 6, { courts: 4, restSlots: 0 }],
  ])("%i players on %i courts", (players, maxCourts, expected) => {
    expect(suggestConfig(players, maxCourts)).toEqual(expected);
  });

  it("gives no courts below four players", () => {
    expect(suggestConfig(3, 4)).toEqual({ courts: 0, restSlots: 3 });
    expect(suggestConfig(0, 4)).toEqual({ courts: 0, restSlots: 0 });
  });

  it("never exceeds the venue", () => {
    expect(suggestConfig(40, 2)).toEqual({ courts: 2, restSlots: 32 });
  });
});
