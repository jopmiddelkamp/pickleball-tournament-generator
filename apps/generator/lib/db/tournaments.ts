import { and, desc, eq } from "drizzle-orm";
import { newSeed, newSlug } from "../ids";
import type { TournamentInput } from "../validate";
import { db } from "./client";
import { tournaments, type NewTournament, type TournamentRow } from "./schema";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[A-Za-z0-9_-]{1,32}$/;

export type TournamentPatch = Partial<
  Pick<
    NewTournament,
    | "name"
    | "startsAt"
    | "location"
    | "maxCourts"
    | "playersPerCourt"
    | "courts"
    | "restSlots"
    | "rounds"
    | "algorithmId"
    | "gameTarget"
    | "seed"
    | "registrationClosedAt"
    | "schedule"
    | "games"
    | "roundsStarted"
    | "finishedAt"
  >
>;

export async function listTournaments(organiserId: string): Promise<TournamentRow[]> {
  return db.select().from(tournaments).where(eq(tournaments.organiserId, organiserId)).orderBy(desc(tournaments.createdAt));
}

/** Scoped to the organiser: a tournament someone else owns is "not found", never "forbidden". */
export async function findTournament(organiserId: string, id: string): Promise<TournamentRow | null> {
  if (!UUID.test(id)) return null;
  const rows = await db
    .select()
    .from(tournaments)
    .where(and(eq(tournaments.id, id), eq(tournaments.organiserId, organiserId)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Public lookup by id, so a manage URL's id pasted into /event/<...> can be
 * forwarded to the canonical slug page. Unscoped like the slug lookup: both
 * identifiers are unguessable and the page is public by link.
 */
export async function findTournamentById(id: string): Promise<TournamentRow | null> {
  if (!UUID.test(id)) return null;
  const rows = await db.select().from(tournaments).where(eq(tournaments.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Public lookup for /event/<slug>: no organiser scope, since anyone with the link may read it. */
export async function findTournamentBySlug(slug: string): Promise<TournamentRow | null> {
  if (!SLUG.test(slug)) return null;
  const rows = await db.select().from(tournaments).where(eq(tournaments.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function createTournament(organiserId: string, input: TournamentInput): Promise<TournamentRow> {
  const rows = await db
    .insert(tournaments)
    .values({
      organiserId,
      slug: newSlug(),
      name: input.name,
      startsAt: input.startsAt,
      location: input.location,
      maxCourts: input.maxCourts,
      playersPerCourt: input.playersPerCourt,
      rounds: 6,
      gameTarget: input.gameTarget,
      algorithmId: input.algorithmId,
      seed: newSeed(),
    })
    .returning();
  const row = rows[0];
  if (!row) throw new Error("insert returned no row");
  return row;
}

export async function updateTournament(organiserId: string, id: string, patch: TournamentPatch): Promise<TournamentRow | null> {
  if (!UUID.test(id)) return null;
  const rows = await db
    .update(tournaments)
    .set(patch)
    .where(and(eq(tournaments.id, id), eq(tournaments.organiserId, organiserId)))
    .returning();
  return rows[0] ?? null;
}
