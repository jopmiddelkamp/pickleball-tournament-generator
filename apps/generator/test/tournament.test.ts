import { DEFAULT_ALGORITHM_ID } from "@ptg/core";
import { describe, expect, it } from "vitest";
import type { TournamentRow } from "../lib/db/schema";
import type { ActiveRegistration } from "../lib/registrations";
import { buildWorkspaceView, effectiveConfig, tournamentStatus } from "../lib/tournament";

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

function row(overrides: Partial<TournamentRow> = {}): TournamentRow {
  return {
    id: "t1",
    organiserId: "org1",
    slug: "abcdefghijkl",
    name: "Tuesday night",
    startsAt: new Date("2026-09-01T18:00:00Z"),
    maxPlayers: 4,
    maxCourts: 2,
    rounds: 3,
    gameTarget: 11,
    algorithmId: "greedy",
    seed: 7,
    courts: null,
    restSlots: null,
    registrationClosedAt: null,
    schedule: null,
    games: [],
    createdAt: new Date("2026-08-01T00:00:00Z"),
    ...overrides,
  };
}

function reg(id: string, minute: number): ActiveRegistration {
  return { id, name: id, gender: "F", level: 3, registeredAt: new Date(Date.UTC(2026, 8, 1, 18, minute)) };
}

const registrations = [reg("p1", 1), reg("p2", 2), reg("p3", 3), reg("p4", 4), reg("p5", 5)];

describe("buildWorkspaceView", () => {
  it("splits confirmed/waiting, uses the suggestion, and has no schedule while open", () => {
    const t = row();
    const view = buildWorkspaceView(t, registrations);
    expect(view.status).toBe("open");
    expect(view.confirmed.map((p) => p.id)).toEqual(["p1", "p2", "p3", "p4"]);
    expect(view.waiting.map((p) => p.id)).toEqual(["p5"]);
    expect(view.usingSuggestion).toBe(true);
    expect(view.config).toEqual(effectiveConfig(t, 4));
    expect(view.schedule).toBeNull();
    expect(view.games).toEqual([]);
    expect(view.notice).toBeNull();
  });

  it("parses a valid stored schedule and games once registration is closed", () => {
    const schedule = {
      algorithmId: "greedy",
      seed: 7,
      rounds: [{ matches: [{ court: 1, teamA: ["p1", "p2"], teamB: ["p3", "p4"] }], resting: [] }],
    };
    const games = [
      { round: 0, court: 1, teamA: ["p1", "p2"], teamB: ["p3", "p4"], pointsA: 11, pointsB: 7, voided: false },
    ];
    const view = buildWorkspaceView(
      row({ registrationClosedAt: new Date("2026-09-01T17:00:00Z"), schedule, games }),
      registrations,
    );
    expect(view.status).toBe("generated");
    expect(view.schedule).toEqual(schedule);
    expect(view.games).toEqual(games);
    expect(view.notice).toBeNull();
  });

  it("marks an unreadable schedule with a notice instead of breaking the page", () => {
    const schedule = {
      algorithmId: "greedy",
      seed: 7,
      // p5 is only on the waiting list, not among the confirmed ids.
      rounds: [{ matches: [{ court: 1, teamA: ["p1", "p5"], teamB: ["p3", "p4"] }], resting: [] }],
    };
    const view = buildWorkspaceView(
      row({ registrationClosedAt: new Date("2026-09-01T17:00:00Z"), schedule, games: [] }),
      registrations,
    );
    expect(view.notice).toBe("unreadable");
    expect(view.schedule).toBeNull();
    expect(view.games).toEqual([]);
    // status is derived from the raw column, not the parsed value.
    expect(view.status).toBe("generated");
  });

  it("turns off usingSuggestion once the organiser overrides courts or rest slots", () => {
    const view = buildWorkspaceView(row({ courts: 1, restSlots: 0 }), registrations);
    expect(view.usingSuggestion).toBe(false);
    expect(view.config.courts).toBe(1);
  });

  it("falls back to the default algorithm when the stored id is unknown", () => {
    const view = buildWorkspaceView(row({ algorithmId: "magic" }), registrations);
    expect(view.algorithmId).toBe(DEFAULT_ALGORITHM_ID);
  });
});
