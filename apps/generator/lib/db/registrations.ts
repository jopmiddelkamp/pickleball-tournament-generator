import type { Gender, Level } from "@ptg/core";
import { and, asc, count, eq, isNull } from "drizzle-orm";
import type { ActiveRegistration } from "../registrations";
import { db } from "./client";
import { registrations, type RegistrationRow } from "./schema";

function toActive(row: RegistrationRow): ActiveRegistration {
  return { id: row.id, name: row.name, gender: row.gender, level: row.level as Level, registeredAt: row.registeredAt };
}

export async function listActiveRegistrations(tournamentId: string): Promise<ActiveRegistration[]> {
  const rows = await db
    .select()
    .from(registrations)
    .where(and(eq(registrations.tournamentId, tournamentId), isNull(registrations.cancelledAt)))
    .orderBy(asc(registrations.registeredAt), asc(registrations.id));
  return rows.map(toActive);
}

export async function countActiveRegistrations(tournamentId: string): Promise<number> {
  const rows = await db
    .select({ n: count() })
    .from(registrations)
    .where(and(eq(registrations.tournamentId, tournamentId), isNull(registrations.cancelledAt)));
  return rows[0]?.n ?? 0;
}

/** The visitor's own active registration, matched by their `ptg_participant` cookie. */
export async function findActiveRegistrationByToken(tournamentId: string, token: string): Promise<RegistrationRow | null> {
  const rows = await db
    .select()
    .from(registrations)
    .where(
      and(
        eq(registrations.tournamentId, tournamentId),
        eq(registrations.participantToken, token),
        isNull(registrations.cancelledAt),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function addRegistration(
  tournamentId: string,
  input: { name: string; gender: Gender; level: Level; participantToken: string | null },
): Promise<ActiveRegistration> {
  const rows = await db.insert(registrations).values({ tournamentId, ...input }).returning();
  const row = rows[0];
  if (!row) throw new Error("insert returned no row");
  return toActive(row);
}

/** True when an active registration was cancelled; false when there was none to cancel. */
export async function cancelRegistration(tournamentId: string, registrationId: string): Promise<boolean> {
  const rows = await db
    .update(registrations)
    .set({ cancelledAt: new Date() })
    .where(
      and(eq(registrations.tournamentId, tournamentId), eq(registrations.id, registrationId), isNull(registrations.cancelledAt)),
    )
    .returning({ id: registrations.id });
  return rows.length === 1;
}
