import { describe, expect, it } from "vitest";
import { PLAYERS_PER_COURT, maxPlayersFor } from "../src/maxPlayers.js";

describe("maxPlayersFor", () => {
  it.each([
    [1, 6],
    [2, 12],
    [4, 24],
    [6, 36],
  ])("%i courts hold %i players", (courts, cap) => {
    expect(maxPlayersFor(courts)).toBe(cap);
  });
  it("is defensive about junk input", () => {
    expect(maxPlayersFor(0)).toBe(0);
    expect(maxPlayersFor(-2)).toBe(0);
    expect(maxPlayersFor(2.9)).toBe(12);
  });
  it("exposes the constant so the UI can explain the rule", () => {
    expect(PLAYERS_PER_COURT).toBe(6);
  });
});
