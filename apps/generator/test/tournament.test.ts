import { DEFAULT_ALGORITHM_ID, maxPlayersFor } from "@ptg/core";
import { describe, expect, it } from "vitest";
import type { TournamentRow } from "../lib/db/schema";
import type { ActiveRegistration } from "../lib/registrations";
import { buildWorkspaceView, effectiveConfig, tournamentStatus } from "../lib/tournament";

describe("tournamentStatus", () => {
  it("is open until registration closes, then closed, then generated, then live, then finished", () => {
    expect(tournamentStatus({ registrationClosedAt: null, schedule: null, roundsStarted: 0, finishedAt: null })).toBe(
      "open",
    );
    expect(
      tournamentStatus({ registrationClosedAt: new Date(), schedule: null, roundsStarted: 0, finishedAt: null }),
    ).toBe("closed");
    expect(
      tournamentStatus({
        registrationClosedAt: new Date(),
        schedule: { rounds: [] },
        roundsStarted: 0,
        finishedAt: null,
      }),
    ).toBe("generated");
    expect(
      tournamentStatus({
        registrationClosedAt: new Date(),
        schedule: { rounds: [] },
        roundsStarted: 2,
        finishedAt: null,
      }),
    ).toBe("live");
    expect(
      tournamentStatus({
        registrationClosedAt: new Date(),
        schedule: { rounds: [] },
        roundsStarted: 2,
        finishedAt: new Date(),
      }),
    ).toBe("finished");
  });

  it("does not report live without a schedule, even if roundsStarted was left set", () => {
    expect(
      tournamentStatus({ registrationClosedAt: new Date(), schedule: null, roundsStarted: 2, finishedAt: null }),
    ).toBe("closed");
  });

  it("does not report finished without a schedule, even if finishedAt was left set", () => {
    expect(
      tournamentStatus({ registrationClosedAt: new Date(), schedule: null, roundsStarted: 0, finishedAt: new Date() }),
    ).toBe("closed");
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
  it("carries the minimum level through to the view", () => {
    expect(buildWorkspaceView(row({ minLevel: 4 }), []).minLevel).toBe(4);
    expect(buildWorkspaceView(row(), []).minLevel).toBeNull();
  });
  it("carries the round clock through to the view", () => {
    expect(buildWorkspaceView(row({ roundMinutes: 15 }), []).roundMinutes).toBe(15);
    expect(buildWorkspaceView(row(), []).roundMinutes).toBeNull();
  });
  it("hands the running clock to the client as an ISO string", () => {
    const started = new Date("2026-09-01T19:00:00Z");
    expect(buildWorkspaceView(row({ clockStartedAt: started }), []).clockStartedAt).toBe("2026-09-01T19:00:00.000Z");
    expect(buildWorkspaceView(row(), []).clockStartedAt).toBeNull();
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
    location: null,
    startsAt: new Date("2026-09-01T18:00:00Z"),
    maxCourts: 2,
    playersPerCourt: 5,
    rounds: 3,
    gameTarget: 11,
    roundMinutes: null,
    minLevel: null,
    algorithmId: "greedy",
    seed: 7,
    courts: null,
    restSlots: null,
    registrationClosedAt: null,
    schedule: null,
    games: [],
    roundsStarted: 0,
    finishedAt: null,
    clockStartedAt: null,
    createdAt: new Date("2026-08-01T00:00:00Z"),
    ...overrides,
  };
}

function reg(id: string, minute: number): ActiveRegistration {
  return { id, name: id, gender: "F", level: 3, registeredAt: new Date(Date.UTC(2026, 8, 1, 18, minute)), guestOf: null };
}

const registrations = [
  reg("p1", 1),
  reg("p2", 2),
  reg("p3", 3),
  reg("p4", 4),
  reg("p5", 5),
  reg("p6", 6),
  reg("p7", 7),
];

describe("buildWorkspaceView", () => {
  it("splits confirmed/waiting per the derived cap, uses the suggestion, and has no schedule while open", () => {
    const t = row({ maxCourts: 1 });
    const view = buildWorkspaceView(t, registrations);
    expect(view.status).toBe("open");
    expect(view.maxPlayers).toBe(maxPlayersFor(t.maxCourts));
    expect(view.confirmed.map((p) => p.id)).toEqual(["p1", "p2", "p3", "p4", "p5"]);
    expect(view.waiting.map((p) => p.id)).toEqual(["p6", "p7"]);
    expect(view.usingSuggestion).toBe(true);
    expect(view.config).toEqual(effectiveConfig(t, 5));
    expect(view.schedule).toBeNull();
    expect(view.games).toEqual([]);
    expect(view.notice).toBeNull();
    expect(view.roundsStarted).toBe(0);
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
      // p5 was never registered, so it is not among the confirmed ids.
      rounds: [{ matches: [{ court: 1, teamA: ["p1", "p5"], teamB: ["p3", "p4"] }], resting: [] }],
    };
    const view = buildWorkspaceView(
      row({ registrationClosedAt: new Date("2026-09-01T17:00:00Z"), schedule, games: [] }),
      registrations.slice(0, 4),
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
