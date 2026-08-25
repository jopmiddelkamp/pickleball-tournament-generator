import { maxPlayersFor } from "@ptg/core";
import { describe, expect, it } from "vitest";
import { LIMITS } from "../lib/config";
import type { TournamentRow } from "../lib/db/schema";
import { buildPublicView } from "../lib/public";
import type { ActiveRegistration } from "../lib/registrations";

function row(overrides: Partial<TournamentRow> = {}): TournamentRow {
  return {
    id: "t1",
    organiserId: "org1",
    slug: "abcdefghijkl",
    name: "Tuesday night",
    location: null,
    startsAt: new Date("2026-09-01T18:00:00Z"),
    maxCourts: 1,
    playersPerCourt: 5,
    rounds: 3,
    gameTarget: 11,
    roundMinutes: null,
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
  return { id, name: `Player ${id}`, gender: "F", level: 3, registeredAt: new Date(Date.UTC(2026, 8, 1, 18, minute)), guestOf: null };
}

// maxCourts: 1 -> maxPlayersFor(1) confirmed slots; the rest wait.
const cap = maxPlayersFor(1);
const registrations = Array.from({ length: cap + 2 }, (_, i) => reg(`p${i + 1}`, i + 1));

describe("buildPublicView", () => {
  it("tells visitors about the round clock", () => {
    expect(buildPublicView(row({ roundMinutes: 15 }), registrations, null).roundMinutes).toBe(15);
  });
  it("recognises a confirmed visitor with no waiting-list position", () => {
    const view = buildPublicView(row(), registrations, "p1");
    expect(view.you).toEqual({
      name: "Player p1",
      registeredAt: "2026-09-01T18:01:00.000Z",
      gender: "F",
      level: 3,
      confirmed: true,
      position: null,
      canCancel: true,
      guests: [],
      canAddGuest: true,
    });
    expect(view.yourId).toBe("p1");
  });

  it("lists everyone signed up by name and gender, never level, in arrival order, confirmed before waiting", () => {
    const shuffled = [...registrations].reverse();
    const view = buildPublicView(row(), shuffled, null);
    expect(view.signedUp.map((s) => s.id)).toEqual(registrations.map((r) => r.id));
    expect(view.signedUp[0]).toEqual({ id: "p1", name: "Player p1", gender: "F", confirmed: true, position: null });
    const last = view.signedUp[view.signedUp.length - 1]!;
    expect(last).toEqual({ id: `p${cap + 2}`, name: `Player p${cap + 2}`, gender: "F", confirmed: false, position: 2 });
    for (const entry of view.signedUp) expect(entry).not.toHaveProperty("level");
  });

  it("lists sign-ups for a stranger before the evening is live, and for a finished evening too", () => {
    expect(buildPublicView(row(), registrations, null).signedUp).toHaveLength(registrations.length);
    expect(buildPublicView(row({ finishedAt: new Date() }), registrations, null).signedUp).toHaveLength(registrations.length);
  });

  it("gives a waiting visitor their 1-based position", () => {
    const lastId = registrations[registrations.length - 1]!.id;
    const view = buildPublicView(row(), registrations, lastId);
    expect(view.you).toEqual({
      name: `Player ${lastId}`,
      registeredAt: `2026-09-01T18:${String(cap + 2).padStart(2, "0")}:00.000Z`,
      gender: "F",
      level: 3,
      confirmed: false,
      position: 2,
      canCancel: true,
      guests: [],
      canAddGuest: true,
    });
  });

  it("lists the visitor's +1s with their own places in the queue", () => {
    // The cap is 5, so p1's late-arriving guests p6 and p7 hold the two waiting spots.
    const withGuests = registrations.map((r) => (r.id === "p6" || r.id === "p7" ? { ...r, guestOf: "p1" } : r));
    const view = buildPublicView(row(), withGuests, "p1");
    expect(view.you?.guests).toEqual([
      { id: "p6", name: "Player p6", gender: "F", level: 3, confirmed: false, position: 1 },
      { id: "p7", name: "Player p7", gender: "F", level: 3, confirmed: false, position: 2 },
    ]);
    expect(view.you?.canAddGuest).toBe(true);
  });

  it("stops the +1 form at the guest limit", () => {
    const withGuests = registrations.map((r) => (["p5", "p6", "p7"].includes(r.id) ? { ...r, guestOf: "p1" } : r));
    const view = buildPublicView(row(), withGuests, "p1");
    expect(view.you?.guests).toHaveLength(3);
    expect(view.you?.canAddGuest).toBe(false);
  });

  it("has no you for a stranger", () => {
    const view = buildPublicView(row(), registrations, null);
    expect(view.you).toBeNull();
    expect(view.yourId).toBeNull();
  });

  it("allows cancelling until a schedule exists", () => {
    const withSchedule = row({
      registrationClosedAt: new Date("2026-09-01T17:00:00Z"),
      schedule: { algorithmId: "greedy", seed: 7, rounds: [] },
    });
    const view = buildPublicView(withSchedule, registrations, "p1");
    expect(view.you?.canCancel).toBe(false);

    const noSchedule = buildPublicView(row(), registrations, "p1");
    expect(noSchedule.you?.canCancel).toBe(true);
  });

  it("hides a generated schedule and roster but exposes both once a round has started", () => {
    const confirmedIds = registrations.slice(0, cap).map((r) => r.id);
    const schedule = {
      algorithmId: "greedy",
      seed: 7,
      rounds: [{ matches: [{ court: 1, teamA: [confirmedIds[0]!, confirmedIds[1]!], teamB: [confirmedIds[2]!, confirmedIds[3]!] }], resting: [] }],
    };
    const generated = row({ registrationClosedAt: new Date("2026-09-01T17:00:00Z"), schedule, roundsStarted: 0 });
    const generatedView = buildPublicView(generated, registrations, null);
    expect(generatedView.status).toBe("generated");
    expect(generatedView.schedule).toBeNull();
    expect(generatedView.games).toEqual([]);
    expect(generatedView.players).toEqual([]);

    const live = row({ registrationClosedAt: new Date("2026-09-01T17:00:00Z"), schedule, roundsStarted: 1 });
    const liveView = buildPublicView(live, registrations, null);
    expect(liveView.status).toBe("live");
    expect(liveView.schedule?.rounds).toEqual(schedule.rounds);
    expect(liveView.schedule && "seed" in liveView.schedule).toBe(false);
    expect(liveView.schedule && "algorithmId" in liveView.schedule).toBe(false);
    expect(liveView.players.map((p) => p.id)).toEqual(confirmedIds);
  });

  it("treats corrupt games as no schedule too, and hides the roster along with it", () => {
    const confirmedIds = registrations.slice(0, cap).map((r) => r.id);
    const schedule = {
      algorithmId: "greedy",
      seed: 7,
      rounds: [{ matches: [{ court: 1, teamA: [confirmedIds[0]!, confirmedIds[1]!], teamB: [confirmedIds[2]!, confirmedIds[3]!] }], resting: [] }],
    };
    // "not-a-list" is not an array, so parseGames returns null: the schedule
    // itself parses fine, but the games column next to it does not.
    const live = row({
      registrationClosedAt: new Date("2026-09-01T17:00:00Z"),
      schedule,
      games: "not-a-list",
      roundsStarted: 1,
    });
    const view = buildPublicView(live, registrations, null);
    expect(view.status).toBe("live");
    expect(view.schedule).toBeNull();
    expect(view.games).toEqual([]);
    expect(view.players).toEqual([]);
  });

  it("never carries a seed, algorithm id or organiser id at the top level", () => {
    const view = buildPublicView(row(), registrations, null);
    expect("seed" in view).toBe(false);
    expect("algorithmId" in view).toBe(false);
    expect("organiserId" in view).toBe(false);
  });

  it("is full once active registrations reach the spam cap", () => {
    const many = Array.from({ length: LIMITS.maxRegistrations }, (_, i) => reg(`q${i + 1}`, i + 1));
    expect(buildPublicView(row(), many, null).full).toBe(true);
    expect(buildPublicView(row(), many.slice(0, -1), null).full).toBe(false);
  });
});
