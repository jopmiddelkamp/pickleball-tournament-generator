import { describe, expect, it } from "vitest";
import { parseEventDefaults } from "../lib/eventDefaults";

const valid = { location: "Balanca", maxCourts: 4, playersPerCourt: 5, rounds: 6, gameTarget: 11, roundMinutes: null, algorithmId: "greedy" };

describe("parseEventDefaults", () => {
  it("accepts a round-tripped cookie", () => {
    expect(parseEventDefaults(JSON.stringify(valid))).toEqual(valid);
    expect(parseEventDefaults(JSON.stringify({ ...valid, location: null }))).toEqual({ ...valid, location: null });
    expect(parseEventDefaults(JSON.stringify({ ...valid, roundMinutes: 15 }))).toEqual({ ...valid, roundMinutes: 15 });
  });
  it("rejects a cookie from before time limits existed rather than guessing", () => {
    const { roundMinutes: _omit, ...older } = valid;
    expect(parseEventDefaults(JSON.stringify(older))).toBeNull();
  });
  it.each([
    ["missing cookie", undefined],
    ["garbage", "not json"],
    ["courts out of range", JSON.stringify({ ...valid, maxCourts: 9 })],
    ["spots out of range", JSON.stringify({ ...valid, playersPerCourt: 7 })],
    ["unknown algorithm", JSON.stringify({ ...valid, algorithmId: "quantum" })],
    ["overlong location", JSON.stringify({ ...valid, location: "x".repeat(121) })],
    ["time limit out of range", JSON.stringify({ ...valid, roundMinutes: 90 })],
  ])("rejects %s", (_label, raw) => {
    expect(parseEventDefaults(raw)).toBeNull();
  });
});
