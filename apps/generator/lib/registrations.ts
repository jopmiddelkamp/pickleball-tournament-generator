import type { Gender, Level, Player } from "@ptg/core";

export interface ActiveRegistration {
  id: string;
  name: string;
  gender: Gender;
  level: Level;
  registeredAt: Date;
  /** id of the registration that brought this player as a +1, if any */
  guestOf: string | null;
}

/**
 * The waiting list is not stored (spec "Data model"): active registrations in
 * arrival order, the first `maxPlayers` are confirmed, the rest wait. A
 * cancellation promotes the next person with no write beyond `cancelled_at`.
 */
export function partitionRegistrations(
  registrations: readonly ActiveRegistration[],
  maxPlayers: number,
): { confirmed: ActiveRegistration[]; waiting: ActiveRegistration[] } {
  const ordered = [...registrations].sort(
    (a, b) => a.registeredAt.getTime() - b.registeredAt.getTime() || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
  const cap = Math.max(0, Math.trunc(maxPlayers));
  return { confirmed: ordered.slice(0, cap), waiting: ordered.slice(cap) };
}

export function toPlayer(r: ActiveRegistration): Player {
  return { id: r.id, name: r.name, gender: r.gender, level: r.level };
}

/** The organiser's minimum level, if any, admits that level and everything above it. */
export function meetsMinimumLevel(minLevel: Level | null, level: Level): boolean {
  return minLevel === null || level >= minLevel;
}
