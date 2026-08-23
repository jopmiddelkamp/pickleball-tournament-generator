import type { Level, Match, Player, Round, TournamentConfig } from "../src/types.js";

export function player(id: string, gender: "M" | "F", level: Level): Player {
  return { id, name: id.toUpperCase(), gender, level };
}

/** `men(3, 4)` -> m0, m1, m2 all at level 4. */
export function men(count: number, level: Level = 3, prefix = "m"): Player[] {
  return Array.from({ length: count }, (_, i) => player(`${prefix}${i}`, "M", level));
}

export function women(count: number, level: Level = 3, prefix = "w"): Player[] {
  return Array.from({ length: count }, (_, i) => player(`${prefix}${i}`, "F", level));
}

export function config(overrides: Partial<TournamentConfig> = {}): TournamentConfig {
  return { courts: 3, rounds: 7, restSlots: 0, seed: 1, ...overrides };
}

/** Turns a flat list of teams into matches: teams 0v1, 2v3, ... */
export function matchesFromTeams(teams: readonly (readonly [string, string])[]): Match[] {
  const out: Match[] = [];
  for (let i = 0; i + 1 < teams.length; i += 2) {
    out.push({
      court: out.length + 1,
      teamA: [...(teams[i] as readonly [string, string])] as [string, string],
      teamB: [...(teams[i + 1] as readonly [string, string])] as [string, string],
    });
  }
  return out;
}

export function round(
  teams: readonly (readonly [string, string])[],
  resting: readonly string[] = [],
): Round {
  return { matches: matchesFromTeams(teams), resting: [...resting] };
}

/**
 * The SPEC-2 §7 roster: 7 men, 5 women, 3 courts, 7 rounds, no rest.
 *
 * Round r pairs man (r - j) mod 7 with woman j for j = 0..4, which is a Latin
 * square: every man partners every woman exactly once over the 7 rounds. The
 * two men left over each round form the one forced same-gender team.
 */
export function workedExampleRoster(): Player[] {
  return [...men(7), ...women(5)];
}

export function workedExampleRounds(): Round[] {
  const rounds: Round[] = [];
  for (let r = 0; r < 7; r++) {
    const teams: [string, string][] = [];
    for (let j = 0; j < 5; j++) {
      teams.push([`m${(((r - j) % 7) + 7) % 7}`, `w${j}`]);
    }
    teams.push([`m${(((r - 5) % 7) + 7) % 7}`, `m${(((r - 6) % 7) + 7) % 7}`]);

    // Teams meet their neighbour, except every third round, where the first two
    // matches cross over. Without that the same players would face each other
    // every round and the fixture would break L3 on its own.
    const pairing: [number, number][] =
      r % 3 === 2
        ? [
            [0, 2],
            [1, 3],
            [4, 5],
          ]
        : [
            [0, 1],
            [2, 3],
            [4, 5],
          ];
    rounds.push({
      matches: pairing.map(([a, b], court) => ({
        court: court + 1,
        teamA: teams[a] as [string, string],
        teamB: teams[b] as [string, string],
      })),
      resting: [],
    });
  }
  return rounds;
}

/**
 * The same schedule with two mixed teams in round 0 recombined into one MM and
 * one FF team: 33 mixed teams instead of 35, so two same-gender teams are
 * avoidable and L1 fails.
 */
export function workedExampleRoundsWithTwoWastedMixed(): Round[] {
  const rounds = workedExampleRounds();
  const r0 = rounds[0] as Round;
  const teams = r0.matches.flatMap((m) => [m.teamA, m.teamB] as [string, string][]);
  const [a0, b0] = teams[0] as [string, string];
  const [a1, b1] = teams[1] as [string, string];
  teams[0] = [a0, a1];
  teams[1] = [b0, b1];
  rounds[0] = round(teams);
  return rounds;
}
