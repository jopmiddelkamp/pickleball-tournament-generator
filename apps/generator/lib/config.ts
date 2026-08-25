import type { TournamentConfig } from "@ptg/core";

/** Bounds, enforced on entry and again when reading storage back. */
export const LIMITS = {
  maxPlayers: 64,
  maxNameLength: 60,
  minCourts: 1,
  maxCourts: 6,
  minRounds: 1,
  maxRounds: 20,
  maxPoints: 999,
  /** time limit per round, minutes */
  maxRoundMinutes: 60,
  /** spam guard per tournament, active registrations */
  maxRegistrations: 150,
  maxTournamentName: 80,
  maxLocation: 120,
  /** +1s one registration can bring */
  maxGuests: 3,
} as const;

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/**
 * Rest slots follow the roster: you cannot bench more people than you have, and
 * a round needs four players on court.
 */
export function maxRestSlots(playerCount: number): number {
  return Math.max(0, playerCount - 4);
}

export function normaliseConfig(config: TournamentConfig, playerCount: number): TournamentConfig {
  return {
    courts: clamp(config.courts, LIMITS.minCourts, LIMITS.maxCourts),
    rounds: clamp(config.rounds, LIMITS.minRounds, LIMITS.maxRounds),
    restSlots: clamp(config.restSlots, 0, maxRestSlots(playerCount)),
    seed: Math.trunc(config.seed) >>> 0,
  };
}
