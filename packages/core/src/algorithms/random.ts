/**
 * `random` - the baseline every other algorithm has to beat.
 * Shuffle the playing players, then pair them off in that order.
 */
import { planRounds, withCourts } from "../roundBuilder.js";
import { shuffled } from "../rng.js";
import type { Match, Player, Round, SchedulingAlgorithm, TournamentConfig } from "../types.js";

function makeMatches(playing: readonly Player[]): Match[] {
  const teams: [Player, Player][] = [];
  for (let i = 0; i + 1 < playing.length; i += 2) {
    teams.push([playing[i] as Player, playing[i + 1] as Player]);
  }
  const pairings: [[Player, Player], [Player, Player]][] = [];
  for (let i = 0; i + 1 < teams.length; i += 2) {
    pairings.push([teams[i] as [Player, Player], teams[i + 1] as [Player, Player]]);
  }
  return withCourts(pairings);
}

export const randomAlgorithm: SchedulingAlgorithm = {
  id: "random",
  name: "Random",
  description: "Shuffles everyone each round and pairs them off. The baseline the others are measured against.",
  stochastic: true,

  generate(players: Player[], config: TournamentConfig, rng: () => number): Round[] {
    return planRounds(players, config, {
      order: () => shuffled(players, rng),
      makeMatches: (plan) => makeMatches(plan.playing),
    });
  },
};
