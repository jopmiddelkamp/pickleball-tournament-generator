import { DEFAULT_ALGORITHM_ID } from "@ptg/core";
import { and, desc, eq } from "drizzle-orm";
import { newSeed, newSlug } from "../ids";
import type { TournamentInput } from "../validate";
import { db } from "./client";
import { tournaments, type NewTournament, type TournamentRow } from "./schema";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type TournamentPatch = Partial<
  Pick<NewTournament, "courts" | "restSlots" | "rounds" | "algorithmId" | "gameTarget" | "seed" | "registrationClosedAt" | "schedule" | "games">
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

export async function createTournament(organiserId: string, input: TournamentInput): Promise<TournamentRow> {
  const rows = await db
    .insert(tournaments)
    .values({
      organiserId,
      slug: newSlug(),
      name: input.name,
      startsAt: input.startsAt,
      maxPlayers: input.maxPlayers,
      maxCourts: input.maxCourts,
      rounds: input.rounds,
      gameTarget: input.gameTarget,
      algorithmId: DEFAULT_ALGORITHM_ID,
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
