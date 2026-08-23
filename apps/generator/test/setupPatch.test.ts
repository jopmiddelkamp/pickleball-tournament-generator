import { describe, expect, it } from "vitest";
import { parseSetupPatch } from "../lib/validate";

describe("parseSetupPatch", () => {
  it("keeps known integer fields and the algorithm id", () => {
    expect(parseSetupPatch({ courts: 3, restSlots: 2, rounds: 7, algorithmId: "greedy", gameTarget: 16 })).toEqual({
      courts: 3,
      restSlots: 2,
      rounds: 7,
      algorithmId: "greedy",
      gameTarget: 16,
    });
  });
  it("accepts useSuggestion alone", () => {
    expect(parseSetupPatch({ useSuggestion: true })).toEqual({ useSuggestion: true });
  });
  it.each([
    ["a non-object", 3],
    ["an unknown algorithm", { algorithmId: "magic" }],
    ["courts out of range", { courts: 9 }],
    ["negative rest slots", { restSlots: -1 }],
    ["a string where a number goes", { rounds: "6" }],
    ["an empty patch", {}],
  ])("rejects %s", (_label, value) => {
    expect(parseSetupPatch(value)).toBeNull();
  });
});
