/**
 * The registry is the only thing an app needs to know about algorithms.
 * Adding one is a new file here plus a line in ALGORITHMS; both apps pick it up
 * with no further changes.
 */
import { mulberry32 } from "../rng.js";
import type { Player, Schedule, SchedulingAlgorithm, TournamentConfig } from "../types.js";
import { circleAlgorithm } from "./circle.js";
import { greedyAlgorithm } from "./greedy.js";
import { latinAlgorithm } from "./latin.js";
import { randomAlgorithm } from "./random.js";

export const ALGORITHMS: readonly SchedulingAlgorithm[] = [
  greedyAlgorithm,
  circleAlgorithm,
  latinAlgorithm,
  randomAlgorithm,
];

export const DEFAULT_ALGORITHM_ID = greedyAlgorithm.id;

export function getAlgorithm(id: string): SchedulingAlgorithm | undefined {
  return ALGORITHMS.find((a) => a.id === id);
}

export function requireAlgorithm(id: string): SchedulingAlgorithm {
  const algorithm = getAlgorithm(id);
  if (!algorithm) {
    throw new Error(`Unknown algorithm "${id}". Known: ${ALGORITHMS.map((a) => a.id).join(", ")}.`);
  }
  return algorithm;
}

/**
 * The one entry point into scheduling. Builds the seeded RNG here so no caller
 * can accidentally hand an algorithm an unseeded source of randomness.
 */
export function generateSchedule(
  algorithmId: string,
  players: readonly Player[],
  config: TournamentConfig,
): Schedule {
  const algorithm = requireAlgorithm(algorithmId);
  const rng = mulberry32(config.seed);
  const rounds = algorithm.generate(players.slice(), config, rng);
  return { algorithmId, seed: config.seed, rounds };
}
