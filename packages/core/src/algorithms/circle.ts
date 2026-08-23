/**
 * `circle` - the whist wheel.
 *
 * Seat everyone on a circle, keep the first seat fixed and rotate the rest by
 * one each round; seats opposite each other partner. Over a full cycle that
 * gives every player a different partner each round.
 *
 * Rest slots and odd counts are the wheel's ghost seats: the players the shared
 * rest rule picks are the ones drawn against a ghost, so they sit the round out
 * and the remaining seats close up. Teams then meet their neighbour in the
 * wheel, offset by the round number so opponents vary too.
 */
import { planRounds, withCourts } from "../roundBuilder.js";
import type { Match, Player, Round, SchedulingAlgorithm, TournamentConfig } from "../types.js";

/** Seat 0 stays put, seats 1..n-1 rotate by `by`. */
export function rotateSeats(players: readonly Player[], by: number): Player[] {
  if (players.length < 3) return players.slice();
  const first = players[0] as Player;
  const rest = players.slice(1);
  const n = rest.length;
  const shift = ((by % n) + n) % n;
  const out: Player[] = [first];
  for (let i = 0; i < n; i++) {
    out.push(rest[(i + shift) % n] as Player);
  }
  return out;
}

function makeMatches(playing: readonly Player[], roundIndex: number): Match[] {
  // Opposite seats pair: seat i faces seat (last - i) across the circle. Pairing
  // i with i + teamCount instead would keep a constant gap between the two
  // seats, and the rotation would hand the same two players to each other every
  // single round.
  const teamCount = playing.length / 2;
  const last = playing.length - 1;
  const teams: [Player, Player][] = [];
  for (let i = 0; i < teamCount; i++) {
    teams.push([playing[i] as Player, playing[last - i] as Player]);
  }

  // Consecutive teams meet, rotated by the round so opponents change too.
  const offset = ((roundIndex % teamCount) + teamCount) % teamCount;
  const rotated = teams.map((_, i) => teams[(i + offset) % teamCount] as [Player, Player]);

  const pairings: [[Player, Player], [Player, Player]][] = [];
  for (let i = 0; i + 1 < rotated.length; i += 2) {
    pairings.push([rotated[i] as [Player, Player], rotated[i + 1] as [Player, Player]]);
  }
  return withCourts(pairings);
}

export const circleAlgorithm: SchedulingAlgorithm = {
  id: "circle",
  name: "Circle",
  description: "The classic whist wheel: one seat fixed, the rest rotate each round, opposite seats partner.",
  stochastic: false,

  generate(players: Player[], config: TournamentConfig, _rng: () => number): Round[] {
    return planRounds(players, config, {
      order: (roundIndex) => rotateSeats(players, roundIndex),
      makeMatches: (plan) => makeMatches(plan.playing, plan.roundIndex),
    });
  },
};
