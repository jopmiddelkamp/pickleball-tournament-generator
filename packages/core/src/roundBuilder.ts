/**
 * The part of round construction that is identical for every algorithm:
 * capacity, rest selection, history bookkeeping. An algorithm supplies an
 * ordering for tie-breaks and a function that turns the playing players into
 * matches; everything else lives here so all four stay in step.
 */
import { computeFeasibility, playingCapacity } from "./feasibility.js";
import { byeCount, createHistory, recordRound, type History } from "./tracker.js";
import type { Gender, Match, Player, Round, TournamentConfig } from "./types.js";

export interface RoundPlan {
  /** 0-based round index */
  roundIndex: number;
  /** exactly `Pplay` players, in the order the algorithm asked for */
  playing: Player[];
  resting: string[];
  /** history of every round before this one */
  history: History;
}

/** How many players of each gender may be rested in one round. */
export type RestCaps = Readonly<Record<Gender, number>>;

/**
 * Rest selection, shared by every algorithm: the players who have rested least
 * rest next, so byes equalize over the event.
 *
 * `order` is the algorithm's own deterministic ordering (roster order for the
 * rotation algorithms, a seeded shuffle for the stochastic ones) and breaks
 * ties. The offset walks the tie-break window each round, so the same tied
 * players do not always draw the bye.
 *
 * `caps` keeps enough of each gender on court to still build `feasMixed` mixed
 * teams. Without it a gender-blind bench quietly destroys mixed capacity and
 * the schedule breaks Law L1 through no fault of the algorithm - and SPEC-2 §2
 * measures the mixed target against the whole roster, not against who was left
 * on court.
 */
export function selectResting(
  history: History,
  order: readonly Player[],
  restCount: number,
  roundIndex: number,
  caps: RestCaps,
): string[] {
  if (restCount <= 0) return [];
  const n = order.length;
  const ranked = order.map((player, i) => ({
    player,
    byes: byeCount(history, player.id),
    rank: (((i - roundIndex * restCount) % n) + n) % n,
  }));
  ranked.sort((a, b) => (a.byes !== b.byes ? a.byes - b.byes : a.rank - b.rank));

  const used: Record<Gender, number> = { M: 0, F: 0 };
  const chosen: string[] = [];
  const skipped: typeof ranked = [];
  for (const entry of ranked) {
    if (chosen.length === restCount) break;
    if (used[entry.player.gender] >= caps[entry.player.gender]) {
      skipped.push(entry);
      continue;
    }
    used[entry.player.gender] += 1;
    chosen.push(entry.player.id);
  }
  // Caps are derived so that they always leave room, but never hand back a
  // short bench if a caller passes something tighter.
  for (const entry of skipped) {
    if (chosen.length === restCount) break;
    chosen.push(entry.player.id);
  }
  return chosen;
}

export interface RoundBuilderOptions {
  /** Deterministic ordering used for rest tie-breaks and as the seat order. */
  order: (roundIndex: number, history: History) => readonly Player[];
  makeMatches: (plan: RoundPlan) => Match[];
}

/**
 * Runs `config.rounds` rounds, threading one History through all of them.
 * Returns [] when the roster cannot fill a single court.
 */
export function planRounds(
  players: readonly Player[],
  config: TournamentConfig,
  options: RoundBuilderOptions,
): Round[] {
  const capacity = playingCapacity(players.length, config);
  if (capacity === 0) return [];

  const f = computeFeasibility(players, config);
  const caps: RestCaps = {
    M: f.M - Math.min(f.M, f.feasMixed),
    F: f.W - Math.min(f.W, f.feasMixed),
  };

  const restCount = players.length - capacity;
  const history = createHistory(players.map((p) => p.id));
  const rounds: Round[] = [];

  for (let roundIndex = 0; roundIndex < config.rounds; roundIndex++) {
    const ordered = options.order(roundIndex, history);
    const resting = selectResting(history, ordered, restCount, roundIndex, caps);
    const restingSet = new Set(resting);
    const playing = ordered.filter((p) => !restingSet.has(p.id));

    const matches = options.makeMatches({ roundIndex, playing, resting, history });
    const round: Round = { matches, resting };
    recordRound(history, round, players);
    rounds.push(round);
  }

  return rounds;
}

/** Assigns court numbers 1..n in list order. */
export function withCourts(
  teamPairs: readonly [readonly [Player, Player], readonly [Player, Player]][],
): Match[] {
  return teamPairs.map(([a, b], i) => ({
    court: i + 1,
    teamA: [a[0].id, a[1].id] as [string, string],
    teamB: [b[0].id, b[1].id] as [string, string],
  }));
}
