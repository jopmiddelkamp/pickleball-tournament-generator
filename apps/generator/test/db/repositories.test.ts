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
  let findTournamentBySlug: Tournaments["findTournamentBySlug"];
  let listTournaments: Tournaments["listTournaments"];
  let updateTournament: Tournaments["updateTournament"];
  let addRegistration: Registrations["addRegistration"];
  let addRegistrationGroup: Registrations["addRegistrationGroup"];
  let cancelRegistration: Registrations["cancelRegistration"];
  let updateRegistrationProfile: Registrations["updateRegistrationProfile"];
  let countActiveRegistrations: Registrations["countActiveRegistrations"];
  let listActiveRegistrations: Registrations["listActiveRegistrations"];
  let findActiveRegistrationByToken: Registrations["findActiveRegistrationByToken"];
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    ({ createTournament, findTournament, findTournamentBySlug, listTournaments, updateTournament } = await import(
      "../../lib/db/tournaments"
    ));
    ({ addRegistration, addRegistrationGroup, cancelRegistration, updateRegistrationProfile, countActiveRegistrations, listActiveRegistrations, findActiveRegistrationByToken } =
      await import("../../lib/db/registrations"));
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
    location: null,
    startsAt: new Date("2026-09-04T17:30:00Z"),
    maxCourts: 2,
    playersPerCourt: 5,
    rounds: 6,
    gameTarget: 11,
    roundMinutes: 15,
    algorithmId: "greedy",
  };

  afterAll(async () => {
    await cleanup();
  });

  it("creates a tournament with a slug and seed and scopes reads to the organiser", async () => {
    const created = await createTournament(organiser, input);
    expect(created.slug).toHaveLength(12);
    expect(created.seed).toBeGreaterThanOrEqual(0);
    expect(created.rounds).toBe(6);
    expect(created.gameTarget).toBe(11);
    expect(created.roundMinutes).toBe(15);
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

  it("corrects gender and level in place, keeping the arrival position", async () => {
    const created = await createTournament(organiser, input);
    const a = await addRegistration(created.id, { name: "A", gender: "F", level: 3, participantToken: null });
    const b = await addRegistration(created.id, { name: "B", gender: "M", level: 4, participantToken: null });
    expect(await updateRegistrationProfile(created.id, a.id, { gender: "M", level: 5 })).toBe(true);
    const active = await listActiveRegistrations(created.id);
    expect(active.map((r) => r.id)).toEqual([a.id, b.id]);
    expect(active[0]).toMatchObject({ name: "A", gender: "M", level: 5, registeredAt: a.registeredAt });
    await cancelRegistration(created.id, a.id);
    expect(await updateRegistrationProfile(created.id, a.id, { gender: "F", level: 1 })).toBe(false);
    expect(await updateRegistrationProfile(randomUUID(), b.id, { gender: "F", level: 1 })).toBe(false);
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

  it("registers a host with +1s as one group, guests linked to the host", async () => {
    const created = await createTournament(organiser, input);
    const host = await addRegistrationGroup(
      created.id,
      { name: "Host", gender: "F", level: 3, participantToken: "tok-host" },
      [{ name: "Plus one", gender: "M", level: 2 }],
    );
    const active = await listActiveRegistrations(created.id);
    expect(active.map((r) => [r.name, r.guestOf])).toEqual([
      ["Host", null],
      ["Plus one", host.id],
    ]);
  });

  it("leaves nothing behind when a +1 in the group cannot be stored", async () => {
    const created = await createTournament(organiser, input);
    const broken = { name: null as unknown as string, gender: "M" as const, level: 2 as const };
    await expect(
      addRegistrationGroup(created.id, { name: "Host", gender: "F", level: 3, participantToken: "tok-host" }, [broken]),
    ).rejects.toThrow();
    expect(await listActiveRegistrations(created.id)).toEqual([]);
  });

  it("finds a tournament by slug with no organiser scope, and rejects garbage slugs before querying", async () => {
    const created = await createTournament(organiser, input);
    expect(await findTournamentBySlug(created.slug)).toMatchObject({ id: created.id });
    expect(await findTournamentBySlug("not-a-real-slug")).toBeNull();
    expect(await findTournamentBySlug("has a space")).toBeNull();
    expect(await findTournamentBySlug("x".repeat(33))).toBeNull();
  });

  it("finds an active registration by token but not a cancelled one", async () => {
    const created = await createTournament(organiser, input);
    const a = await addRegistration(created.id, { name: "A", gender: "F", level: 3, participantToken: "tok-a" });
    expect(await findActiveRegistrationByToken(created.id, "tok-a")).toMatchObject({ id: a.id });
    expect(await findActiveRegistrationByToken(created.id, "no-such-token")).toBeNull();
    await cancelRegistration(created.id, a.id);
    expect(await findActiveRegistrationByToken(created.id, "tok-a")).toBeNull();
  });
});
