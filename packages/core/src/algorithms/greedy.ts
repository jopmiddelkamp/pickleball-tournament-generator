/**
 * `greedy` - weighted matching, the flagship.
 *
 * Two stages per round. The partner stage scores every possible pair of playing
 * players, takes the best pairs greedily and then improves them with 2-opt
 * swaps. The match stage scores every possible team-vs-team meeting and picks
 * greedily from that.
 *
 * Both stages carry a hard guard for the laws they can break: a third
 * partnership (L2) and a third consecutive meeting (L3) are priced so far below
 * everything else that they only happen when nothing else is left.
 *
 * Weights live in ../constants.ts.
 */
import { MATCH, PARTNER, PARTNER_TWO_OPT_PASSES } from "../constants.js";
import { planRounds, withCourts } from "../roundBuilder.js";
import {
  metInBothPreviousRounds,
  sgCount,
  timesOpposed,
  timesPartnered,
  type History,
} from "../tracker.js";
import { bandDistance } from "../types.js";
import type { Match, Player, Round, SchedulingAlgorithm, TournamentConfig } from "../types.js";

/** Upper triangular weight matrix; `at` reads it in either index order. */
interface WeightMatrix {
  at(i: number, j: number): number;
}

function symmetric(size: number, fill: (i: number, j: number) => number): WeightMatrix {
  const values: number[] = new Array<number>(size * size).fill(0);
  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      const w = fill(i, j);
      values[i * size + j] = w;
      values[j * size + i] = w;
    }
  }
  return { at: (i, j) => values[i * size + j] as number };
}

export function partnerWeight(a: Player, b: Player, history: History): number {
  let w: number;
  if (a.gender !== b.gender) {
    w = PARTNER.mixedBonus;
  } else {
    w =
      PARTNER.sameGenderBase -
      PARTNER.sameGenderBurdenPenalty * (sgCount(history, a.id) + sgCount(history, b.id)) +
      PARTNER.sameGenderBandBonus * bandDistance(a.level, b.level);
  }

  const together = timesPartnered(history, a.id, b.id);
  w -= PARTNER.repeatPenalty * together;
  if (together >= PARTNER.thirdTimeThreshold) w += PARTNER.thirdTimeGuard;
  return w;
}

export function matchWeight(
  teamA: readonly [Player, Player],
  teamB: readonly [Player, Player],
  history: History,
): number {
  const sumA = teamA[0].level + teamA[1].level;
  const sumB = teamB[0].level + teamB[1].level;
  let w = MATCH.base - MATCH.levelGapPenalty * Math.abs(sumA - sumB);

  let met = 0;
  let consecutive = false;
  for (const a of teamA) {
    for (const b of teamB) {
      met += timesOpposed(history, a.id, b.id);
      if (metInBothPreviousRounds(history, a.id, b.id)) consecutive = true;
    }
  }
  w -= MATCH.repeatOpponentPenalty * met;
  if (consecutive) w += MATCH.consecutiveGuard;
  return w;
}

/** Best-weight-first pairing over indices 0..size-1. */
function greedyPairing(size: number, weights: WeightMatrix): [number, number][] {
  const edges: { i: number; j: number; w: number }[] = [];
  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      edges.push({ i, j, w: weights.at(i, j) });
    }
  }
  edges.sort((x, y) => (x.w !== y.w ? y.w - x.w : x.i !== y.i ? x.i - y.i : x.j - y.j));

  const used = new Array<boolean>(size).fill(false);
  const pairs: [number, number][] = [];
  for (const e of edges) {
    if (used[e.i] || used[e.j]) continue;
    used[e.i] = true;
    used[e.j] = true;
    pairs.push([e.i, e.j]);
  }
  return pairs;
}

/**
 * 2-opt: for every two teams, try the two other ways of splitting those four
 * players and keep the better one. Repeats until a full sweep finds nothing.
 */
function twoOptImprove(pairs: [number, number][], weights: WeightMatrix): void {
  for (let pass = 0; pass < PARTNER_TWO_OPT_PASSES; pass++) {
    let improved = false;
    for (let x = 0; x < pairs.length; x++) {
      for (let y = x + 1; y < pairs.length; y++) {
        const [a, b] = pairs[x] as [number, number];
        const [c, d] = pairs[y] as [number, number];
        const current = weights.at(a, b) + weights.at(c, d);
        const swapC = weights.at(a, c) + weights.at(b, d);
        const swapD = weights.at(a, d) + weights.at(b, c);

        if (swapC > current && swapC >= swapD) {
          pairs[x] = [a, c];
          pairs[y] = [b, d];
          improved = true;
        } else if (swapD > current) {
          pairs[x] = [a, d];
          pairs[y] = [b, c];
          improved = true;
        }
      }
    }
    if (!improved) return;
  }
}

function makeMatches(playing: readonly Player[], history: History, rng: () => number): Match[] {
  const partnerWeights = symmetric(playing.length, (i, j) =>
    partnerWeight(playing[i] as Player, playing[j] as Player, history) + rng() * PARTNER.jitter,
  );

  const pairs = greedyPairing(playing.length, partnerWeights);
  twoOptImprove(pairs, partnerWeights);

  const teams: [Player, Player][] = pairs.map(([i, j]) => [playing[i] as Player, playing[j] as Player]);

  const matchWeights = symmetric(teams.length, (i, j) =>
    matchWeight(teams[i] as [Player, Player], teams[j] as [Player, Player], history) + rng() * MATCH.jitter,
  );
  const matchups = greedyPairing(teams.length, matchWeights);

  return withCourts(
    matchups.map(([i, j]) => [teams[i] as [Player, Player], teams[j] as [Player, Player]]),
  );
}

export const greedyAlgorithm: SchedulingAlgorithm = {
  id: "greedy",
  name: "Greedy matching",
  description:
    "Scores every possible pair and every possible match on freshness, mix and level, then picks the best fit each round.",
  stochastic: true,

  generate(players: Player[], config: TournamentConfig, rng: () => number): Round[] {
    return planRounds(players, config, {
      order: () => players,
      makeMatches: (plan) => makeMatches(plan.playing, plan.history, rng),
    });
  },
};
