import { describe, expect, it } from "vitest";
import { LIMITS, serialisableState } from "../lib/state";
import { emptyState, parseState } from "../lib/storage";

function validPayload() {
  const state = emptyState(7);
  state.players = [
    { id: "a", name: "Anouk", gender: "F", level: 4 },
    { id: "b", name: "Bram", gender: "M", level: 3 },
    { id: "c", name: "Chantal", gender: "F", level: 2 },
    { id: "d", name: "Daan", gender: "M", level: 5 },
  ];
  state.config = { courts: 1, rounds: 3, restSlots: 0, seed: 7 };
  state.schedule = {
    algorithmId: "greedy",
    seed: 7,
    rounds: [
      {
        matches: [{ court: 1, teamA: ["a", "b"], teamB: ["c", "d"] }],
        resting: [],
      },
    ],
  };
  state.games = [
    { round: 0, court: 1, teamA: ["a", "b"], teamB: ["c", "d"], pointsA: 21, pointsB: 14, voided: false },
  ];
  return serialisableState(state);
}

describe("reading a saved evening back", () => {
  it("round-trips an evening unchanged", () => {
    const parsed = parseState(validPayload());
    expect(parsed).not.toBeNull();
    expect(parsed?.players).toHaveLength(4);
    expect(parsed?.schedule?.rounds[0]?.matches[0]?.teamA).toEqual(["a", "b"]);
    expect(parsed?.games[0]?.pointsA).toBe(21);
  });

  it.each([
    ["a payload that is not an object", "nope"],
    ["a missing version", { players: [] }],
    ["a version this build does not know", { version: 2, players: [] }],
    ["a player with no name", { version: 1, players: [{ id: "a", name: "", gender: "F", level: 3 }] }],
    ["a level outside 1-6", { version: 1, players: [{ id: "a", name: "A", gender: "F", level: 9 }] }],
    ["an unknown gender", { version: 1, players: [{ id: "a", name: "A", gender: "X", level: 3 }] }],
    ["duplicate player ids", {
      version: 1,
      players: [
        { id: "a", name: "A", gender: "F", level: 3 },
        { id: "a", name: "B", gender: "M", level: 3 },
      ],
    }],
  ])("refuses %s", (_label, payload) => {
    expect(parseState(payload)).toBeNull();
  });

  it("refuses a roster larger than the limit rather than trying to schedule it", () => {
    const players = Array.from({ length: LIMITS.maxPlayers + 1 }, (_, i) => ({
      id: `p${i}`,
      name: `P${i}`,
      gender: "F",
      level: 3,
    }));
    expect(parseState({ version: 1, players })).toBeNull();
  });

  it("refuses a name long enough to be a paste accident", () => {
    const players = [{ id: "a", name: "x".repeat(LIMITS.maxNameLength + 1), gender: "F", level: 3 }];
    expect(parseState({ version: 1, players })).toBeNull();
  });

  it("refuses a schedule naming someone who is not on the roster", () => {
    const payload = validPayload() as Record<string, unknown>;
    const schedule = payload.schedule as { rounds: { matches: { teamA: string[] }[] }[] };
    schedule.rounds[0]!.matches[0]!.teamA = ["a", "ghost"];
    expect(parseState(payload)).toBeNull();
  });

  it("refuses impossible scores", () => {
    const payload = validPayload() as Record<string, unknown>;
    (payload.games as { pointsA: number }[])[0]!.pointsA = -5;
    expect(parseState(payload)).toBeNull();
  });

  it("clamps settings that drifted out of range instead of failing", () => {
    const payload = validPayload() as Record<string, unknown>;
    payload.config = { courts: 99, rounds: 0, restSlots: 500, seed: 3 };
    const parsed = parseState(payload);
    expect(parsed?.config.courts).toBe(LIMITS.maxCourts);
    expect(parsed?.config.rounds).toBe(LIMITS.minRounds);
    expect(parsed?.config.restSlots).toBe(0);
  });

  it("falls back to the default scheduler when the saved one no longer exists", () => {
    const payload = validPayload() as Record<string, unknown>;
    payload.algorithmId = "algorithm-we-removed";
    expect(parseState(payload)?.algorithmId).toBe("greedy");
  });

  it("keeps nothing but the fields it owns when writing", () => {
    const state = emptyState(7);
    const written = serialisableState({ ...state, secret: "leak" } as never) as Record<string, unknown>;
    expect(Object.keys(written).sort()).toEqual([
      "algorithmId",
      "config",
      "gameTarget",
      "games",
      "players",
      "schedule",
      "version",
    ]);
  });
});
