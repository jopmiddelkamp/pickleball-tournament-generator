import type { Gender, Level } from "@ptg/core";
import { and, asc, count, eq, isNull, sql, type SQL } from "drizzle-orm";
import type { ActiveRegistration } from "../registrations";
import { db, type Db } from "./client";
import { registrations, type RegistrationRow } from "./schema";

type Executor = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];
type NewPlayer = { name: string; gender: Gender; level: Level };

function toActive(row: RegistrationRow): ActiveRegistration {
  return { id: row.id, name: row.name, gender: row.gender, level: row.level as Level, registeredAt: row.registeredAt, guestOf: row.guestOf };
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
  input: NewPlayer & { participantToken: string | null; guestOf?: string | null; registeredAt?: SQL },
  executor: Executor = db,
): Promise<ActiveRegistration> {
  const rows = await executor.insert(registrations).values({ tournamentId, ...input }).returning();
  const row = rows[0];
  if (!row) throw new Error("insert returned no row");
  return toActive(row);
}

/**
 * A visitor and their +1s sign up as one group: either every row is stored
 * or none is. Without the transaction a failing guest insert would leave a
 * host row whose token no phone holds, and the visitor's retry would run
 * into it. `now()` is frozen for the whole transaction, so the rows are
 * stamped with `clock_timestamp()` to keep the host ahead of their +1s in
 * arrival order. Returns the host.
 */
export async function addRegistrationGroup(
  tournamentId: string,
  host: NewPlayer & { participantToken: string },
  guests: NewPlayer[],
): Promise<ActiveRegistration> {
  return db.transaction(async (tx) => {
    const registeredAt = sql`clock_timestamp()`;
    const stored = await addRegistration(tournamentId, { ...host, registeredAt }, tx);
    for (const guest of guests) {
      await addRegistration(tournamentId, { ...guest, participantToken: null, guestOf: stored.id, registeredAt }, tx);
    }
    return stored;
  });
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
