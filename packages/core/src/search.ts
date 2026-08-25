/**
 * Best-of-N draw: generates `attempts` schedules from seeds derived from the
 * base seed, scores each with SPEC-2 and keeps the highest. Attempt zero is the
 * plain draw on the base seed itself, so one attempt equals generateSchedule
 * and the whole search is reproducible from that single number.
 */
import { generateSchedule, requireAlgorithm } from "./algorithms/registry.js";
import { deriveSeed } from "./rng.js";
import { scoreSchedule } from "./scoring/algorithmScore.js";
import type { Player, Schedule, TournamentConfig } from "./types.js";

export function searchSchedule(
  algorithmId: string,
  players: readonly Player[],
  config: TournamentConfig,
  attempts: number,
): Schedule {
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new Error(`attempts must be a positive integer, got ${attempts}.`);
  }
  // A deterministic algorithm ignores its seed, so every attempt would repeat the first.
  const count = requireAlgorithm(algorithmId).stochastic ? attempts : 1;

  let best: Schedule | null = null;
  let bestFinal = -Infinity;
  let bestPoints = -Infinity;
  for (let attempt = 0; attempt < count; attempt++) {
    const seed = attempt === 0 ? config.seed : deriveSeed(config.seed, attempt);
    const candidate = generateSchedule(algorithmId, players, { ...config, seed });
    const score = scoreSchedule(candidate.rounds, players, config);
    // Rank by final, then by uncapped points: a broken law flattens final to 60,
    // and among such draws the higher points is still the better evening.
    // Strict comparison keeps the earlier attempt on a tie, so the pick is stable.
    const better = score.final > bestFinal || (score.final === bestFinal && score.points > bestPoints);
    if (better) {
      bestFinal = score.final;
      bestPoints = score.points;
      best = candidate;
    }
  }
  return { ...(best as Schedule), seed: config.seed };
}
