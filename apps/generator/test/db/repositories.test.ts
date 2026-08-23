import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
// Type-only: erased at compile time, so this does not trigger the runtime
// import lib/db/client performs at module load. The real (runtime) import
// happens lazily inside beforeAll, guarded by describe.skipIf below.
import type * as TournamentsModule from "../../lib/db/tournaments";
import type * as RegistrationsModule from "../../lib/db/registrations";

type Tournaments = typeof TournamentsModule;
type Registrations = typeof RegistrationsModule;

describe.skipIf(!process.env.POSTGRES_URL)("repositories (local Supabase)", () => {
  let createTournament: Tournaments["createTournament"];
  let findTournament: Tournaments["findTournament"];
  let listTournaments: Tournaments["listTournaments"];
  let updateTournament: Tournaments["updateTournament"];
  let addRegistration: Registrations["addRegistration"];
  let cancelRegistration: Registrations["cancelRegistration"];
  let countActiveRegistrations: Registrations["countActiveRegistrations"];
  let listActiveRegistrations: Registrations["listActiveRegistrations"];
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    ({ createTournament, findTournament, listTournaments, updateTournament } = await import("../../lib/db/tournaments"));
    ({ addRegistration, cancelRegistration, countActiveRegistrations, listActiveRegistrations } = await import(
      "../../lib/db/registrations"
    ));
    const { db } = await import("../../lib/db/client");
    const { tournaments } = await import("../../lib/db/schema");
    const { eq } = await import("drizzle-orm");
    cleanup = async () => {
      await db.delete(tournaments).where(eq(tournaments.organiserId, organiser));
    };
  });

  const organiser = randomUUID();
  const stranger = randomUUID();
  const input = {
    name: "Test night",
    startsAt: new Date("2026-09-04T17:30:00Z"),
    maxPlayers: 8,
    maxCourts: 2,
    rounds: 5,
    gameTarget: 11,
  };

  afterAll(async () => {
    await cleanup();
  });

  it("creates a tournament with a slug and seed and scopes reads to the organiser", async () => {
    const created = await createTournament(organiser, input);
    expect(created.slug).toHaveLength(12);
    expect(created.seed).toBeGreaterThanOrEqual(0);
    expect(await findTournament(organiser, created.id)).toMatchObject({ name: "Test night" });
    expect(await findTournament(stranger, created.id)).toBeNull();
    expect(await findTournament(organiser, "not-a-uuid")).toBeNull();
    expect((await listTournaments(organiser)).map((t) => t.id)).toContain(created.id);
    expect(await listTournaments(stranger)).toEqual([]);
  });

  it("updates only the organiser's own tournament", async () => {
    const created = await createTournament(organiser, input);
    expect(await updateTournament(stranger, created.id, { rounds: 9 })).toBeNull();
    expect((await updateTournament(organiser, created.id, { rounds: 9 }))?.rounds).toBe(9);
  });

  it("lists active registrations in arrival order and drops cancelled ones", async () => {
    const created = await createTournament(organiser, input);
    const a = await addRegistration(created.id, { name: "A", gender: "F", level: 3, participantToken: null });
    const b = await addRegistration(created.id, { name: "B", gender: "M", level: 4, participantToken: "tok-b" });
    expect((await listActiveRegistrations(created.id)).map((r) => r.id)).toEqual([a.id, b.id]);
    expect(await countActiveRegistrations(created.id)).toBe(2);
    expect(await cancelRegistration(created.id, a.id)).toBe(true);
    expect(await cancelRegistration(created.id, a.id)).toBe(false);
    expect((await listActiveRegistrations(created.id)).map((r) => r.id)).toEqual([b.id]);
  });

  it("refuses a second active registration for the same cookie", async () => {
    const created = await createTournament(organiser, input);
    await addRegistration(created.id, { name: "A", gender: "F", level: 3, participantToken: "same" });
    await expect(
      addRegistration(created.id, { name: "A again", gender: "F", level: 3, participantToken: "same" }),
    ).rejects.toThrow();
  });
});
