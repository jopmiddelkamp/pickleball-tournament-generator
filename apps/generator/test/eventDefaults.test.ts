import { describe, expect, it } from "vitest";
import { parseEventDefaults } from "../lib/eventDefaults";

const valid = { location: "Balanca", maxCourts: 4, playersPerCourt: 5, rounds: 6, gameTarget: 11, algorithmId: "greedy" };

describe("parseEventDefaults", () => {
  it("accepts a round-tripped cookie", () => {
    expect(parseEventDefaults(JSON.stringify(valid))).toEqual(valid);
    expect(parseEventDefaults(JSON.stringify({ ...valid, location: null }))).toEqual({ ...valid, location: null });
  });
  it.each([
    ["missing cookie", undefined],
    ["garbage", "not json"],
    ["courts out of range", JSON.stringify({ ...valid, maxCourts: 9 })],
    ["spots out of range", JSON.stringify({ ...valid, playersPerCourt: 7 })],
    ["unknown algorithm", JSON.stringify({ ...valid, algorithmId: "quantum" })],
    ["overlong location", JSON.stringify({ ...valid, location: "x".repeat(121) })],
  ])("rejects %s", (_label, raw) => {
    expect(parseEventDefaults(raw)).toBeNull();
  });
});
