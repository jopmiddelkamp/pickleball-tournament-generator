/**
 * Core domain contracts. Frozen by BUILD-PROMPT.md "Core contracts"; changing a
 * shape here is a conversation, not a refactor.
 */

export type Gender = "M" | "F";

/**
 * Registration tiers (SPEC-2 §1):
 * 1 beginner, 2 beginner+, 3 intermediate, 4 intermediate+, 5 advanced, 6 advanced+.
 */
export type Level = 1 | 2 | 3 | 4 | 5 | 6;

/** Skill band (SPEC-2 §1): low = {1,2} -> 0, mid = {3,4} -> 1, high = {5,6} -> 2. */
export type Band = 0 | 1 | 2;

export interface Player {
  id: string;
  name: string;
  gender: Gender;
  level: Level;
}

export interface TournamentConfig {
  courts: number;
  rounds: number;
  restSlots: number;
  seed: number;
}

/** A doubles team, as a pair of player ids. */
export type Team = [string, string];

export interface Match {
  court: number;
  teamA: Team;
  teamB: Team;
}

export interface Round {
  matches: Match[];
  resting: string[];
}

export interface Schedule {
  algorithmId: string;
  seed: number;
  rounds: Round[];
}

export interface SchedulingAlgorithm {
  id: string;
  name: string;
  description: string;
  stochastic: boolean;
  generate(players: Player[], config: TournamentConfig, rng: () => number): Round[];
}

/** SPEC-2 §1: levels are self-reported, so judgment logic works on bands. */
export function band(level: Level): Band {
  if (level <= 2) return 0;
  if (level <= 4) return 1;
  return 2;
}

export function bandDistance(a: Level, b: Level): 0 | 1 | 2 {
  const d = band(a) - band(b);
  return (d < 0 ? -d : d) as 0 | 1 | 2;
}

export const LEVEL_NAMES: Readonly<Record<Level, string>> = {
  1: "Beginner",
  2: "Beginner+",
  3: "Intermediate",
  4: "Intermediate+",
  5: "Advanced",
  6: "Advanced+",
};

export const BAND_NAMES: Readonly<Record<Band, string>> = {
  0: "low",
  1: "mid",
  2: "high",
};
