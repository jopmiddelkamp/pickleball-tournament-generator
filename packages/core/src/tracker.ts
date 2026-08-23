/**
 * Partner / opponent / bye / same-gender history over a schedule.
 *
 * Two consumers with the same needs: `greedy` builds one round by round while
 * scheduling, `algorithmScore` replays a finished schedule into one. Plain data
 * plus functions, so a port stays mechanical.
 */
import type { Gender, Player, Round, Team } from "./types.js";

export interface History {
  readonly playerIds: readonly string[];
  /** pair key -> times these two partnered */
  readonly partnered: Map<string, number>;
  /** pair key -> times these two were on opposite sides */
  readonly opposed: Map<string, number>;
  /** per round index, the set of pair keys that faced each other that round */
  readonly opposedByRound: Set<string>[];
  readonly byes: Map<string, number>;
  /** same-gender team appearances per player */
  readonly sgTeams: Map<string, number>;
  readonly games: Map<string, number>;
  readonly partnersOf: Map<string, Set<string>>;
  readonly opponentsOf: Map<string, Set<string>>;
  /** team slots seen so far, and how many of them were mixed */
  teamSlots: number;
  mixedTeams: number;
  /** distinct (man, woman) partnerships used */
  readonly distinctMixedPairs: Set<string>;
  roundsRecorded: number;
}

/** Order-independent key for an unordered pair of player ids. */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function createHistory(playerIds: readonly string[]): History {
  const byes = new Map<string, number>();
  const sgTeams = new Map<string, number>();
  const games = new Map<string, number>();
  const partnersOf = new Map<string, Set<string>>();
  const opponentsOf = new Map<string, Set<string>>();
  for (const id of playerIds) {
    byes.set(id, 0);
    sgTeams.set(id, 0);
    games.set(id, 0);
    partnersOf.set(id, new Set());
    opponentsOf.set(id, new Set());
  }
  return {
    playerIds: playerIds.slice(),
    partnered: new Map(),
    opposed: new Map(),
    opposedByRound: [],
    byes,
    sgTeams,
    games,
    partnersOf,
    opponentsOf,
    teamSlots: 0,
    mixedTeams: 0,
    distinctMixedPairs: new Set(),
    roundsRecorded: 0,
  };
}

export function timesPartnered(h: History, a: string, b: string): number {
  return h.partnered.get(pairKey(a, b)) ?? 0;
}

export function timesOpposed(h: History, a: string, b: string): number {
  return h.opposed.get(pairKey(a, b)) ?? 0;
}

export function byeCount(h: History, id: string): number {
  return h.byes.get(id) ?? 0;
}

export function sgCount(h: History, id: string): number {
  return h.sgTeams.get(id) ?? 0;
}

export function gameCount(h: History, id: string): number {
  return h.games.get(id) ?? 0;
}

export function uniqueOpponentCount(h: History, id: string): number {
  return h.opponentsOf.get(id)?.size ?? 0;
}

/** Distinct unordered pairs that partnered at least once (SPEC-2 C3). */
export function distinctPartnerships(h: History): number {
  return h.partnered.size;
}

function bump(map: Map<string, number>, key: string, by = 1): void {
  map.set(key, (map.get(key) ?? 0) + by);
}

function link(map: Map<string, Set<string>>, from: string, to: string): void {
  let set = map.get(from);
  if (!set) {
    set = new Set();
    map.set(from, set);
  }
  set.add(to);
}

function recordTeam(h: History, team: Team, genderOf: (id: string) => Gender | undefined): void {
  const [a, b] = team;
  h.teamSlots += 1;
  bump(h.partnered, pairKey(a, b));
  link(h.partnersOf, a, b);
  link(h.partnersOf, b, a);
  bump(h.games, a);
  bump(h.games, b);

  const ga = genderOf(a);
  const gb = genderOf(b);
  if (ga === undefined || gb === undefined) return;
  if (ga === gb) {
    bump(h.sgTeams, a);
    bump(h.sgTeams, b);
  } else {
    h.mixedTeams += 1;
    h.distinctMixedPairs.add(pairKey(a, b));
  }
}

/**
 * Folds one round into the history. Players in `allIds` that appear in no match
 * count as resting, whether or not the round listed them — the schedule's own
 * `resting` array is a convenience for display, not the source of truth.
 */
export function recordRound(h: History, round: Round, players: readonly Player[]): void {
  const genderById = new Map<string, Gender>();
  for (const p of players) genderById.set(p.id, p.gender);
  const genderOf = (id: string): Gender | undefined => genderById.get(id);

  const playing = new Set<string>();
  const opposedThisRound = new Set<string>();

  for (const match of round.matches) {
    recordTeam(h, match.teamA, genderOf);
    recordTeam(h, match.teamB, genderOf);
    for (const id of [...match.teamA, ...match.teamB]) playing.add(id);

    for (const a of match.teamA) {
      for (const b of match.teamB) {
        const key = pairKey(a, b);
        bump(h.opposed, key);
        opposedThisRound.add(key);
        link(h.opponentsOf, a, b);
        link(h.opponentsOf, b, a);
      }
    }
  }

  for (const id of h.playerIds) {
    if (!playing.has(id)) bump(h.byes, id);
  }

  h.opposedByRound.push(opposedThisRound);
  h.roundsRecorded += 1;
}

export function buildHistory(rounds: readonly Round[], players: readonly Player[]): History {
  const h = createHistory(players.map((p) => p.id));
  for (const round of rounds) recordRound(h, round, players);
  return h;
}

/**
 * Longest run of consecutive rounds in which some pair of players faced each
 * other. Drives Law L3 and the diagnostics line in SPEC-2 §6.
 */
export function maxConsecutiveOpponentStreak(h: History): number {
  const current = new Map<string, number>();
  let best = 0;
  for (const round of h.opposedByRound) {
    const next = new Map<string, number>();
    for (const key of round) {
      const run = (current.get(key) ?? 0) + 1;
      next.set(key, run);
      if (run > best) best = run;
    }
    current.clear();
    for (const [key, run] of next) current.set(key, run);
  }
  return best;
}

/** Highest number of times any single pair partnered (SPEC-2 §6 diagnostics). */
export function maxPartnerRepeat(h: History): number {
  let best = 0;
  for (const count of h.partnered.values()) {
    if (count > best) best = count;
  }
  return best;
}

/** max - min over the given ids; 0 when the list is empty. */
export function spread(map: Map<string, number>, ids: readonly string[]): number {
  if (ids.length === 0) return 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const id of ids) {
    const v = map.get(id) ?? 0;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return max - min;
}

/**
 * True when these two faced each other in both of the last two recorded rounds.
 * A third meeting now would break Law L3, so `greedy` guards against it.
 */
export function metInBothPreviousRounds(h: History, a: string, b: string): boolean {
  const n = h.opposedByRound.length;
  if (n < 2) return false;
  const key = pairKey(a, b);
  return (h.opposedByRound[n - 1] as Set<string>).has(key) && (h.opposedByRound[n - 2] as Set<string>).has(key);
}
