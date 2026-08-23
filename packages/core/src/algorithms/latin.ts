/**
 * `latin` - mixed rotation.
 *
 * Line the playing men up against the playing women and shift by one each
 * round: man i partners woman (i + r) mod n. That is a Latin square, so over n
 * rounds every man meets every woman once.
 *
 * The majority gender is rotated through the mixed core, so whoever falls
 * outside it - and has to take a same-gender team - changes every round.
 * Those surplus players are paired lowest level with highest level, which is
 * the least bad same-gender team you can build.
 */
import { planRounds, withCourts } from "../roundBuilder.js";
import type { Match, Player, Round, SchedulingAlgorithm, TournamentConfig } from "../types.js";

/** Sorted by level, then paired from both ends inward. */
export function pairLowWithHigh(players: readonly Player[]): [Player, Player][] {
  const sorted = players.slice().sort((a, b) => (a.level !== b.level ? a.level - b.level : a.id < b.id ? -1 : 1));
  const teams: [Player, Player][] = [];
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo < hi) {
    teams.push([sorted[lo] as Player, sorted[hi] as Player]);
    lo += 1;
    hi -= 1;
  }
  return teams;
}

function makeMatches(playing: readonly Player[], roundIndex: number): Match[] {
  const men = playing.filter((p) => p.gender === "M");
  const women = playing.filter((p) => p.gender === "F");
  const mixedCount = Math.min(men.length, women.length);

  const majority = men.length >= women.length ? men : women;
  const minority = men.length >= women.length ? women : men;

  // Rotate the majority so a different slice of it sits outside the mixed core
  // each round; surplus duty is shared instead of always falling on the same
  // few players.
  const majLen = majority.length;
  const rotatedMajority =
    majLen === 0
      ? []
      : majority.map((_, i) => majority[(i + roundIndex) % majLen] as Player);

  const teams: [Player, Player][] = [];
  for (let i = 0; i < mixedCount; i++) {
    const partner = minority[(i + roundIndex) % mixedCount] as Player;
    teams.push([rotatedMajority[i] as Player, partner]);
  }
  teams.push(...pairLowWithHigh(rotatedMajority.slice(mixedCount)));

  const teamCount = teams.length;
  const offset = teamCount === 0 ? 0 : ((roundIndex % teamCount) + teamCount) % teamCount;
  const rotated = teams.map((_, i) => teams[(i + offset) % teamCount] as [Player, Player]);

  const pairings: [[Player, Player], [Player, Player]][] = [];
  for (let i = 0; i + 1 < rotated.length; i += 2) {
    pairings.push([rotated[i] as [Player, Player], rotated[i + 1] as [Player, Player]]);
  }
  return withCourts(pairings);
}

export const latinAlgorithm: SchedulingAlgorithm = {
  id: "latin",
  name: "Latin rotation",
  description: "Men and women in two rows, shifted one place each round, so every mixed pair comes up once.",
  stochastic: false,

  generate(players: Player[], config: TournamentConfig, _rng: () => number): Round[] {
    return planRounds(players, config, {
      order: () => players,
      makeMatches: (plan) => makeMatches(plan.playing, plan.roundIndex),
    });
  },
};
