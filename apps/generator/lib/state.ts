import {
  DEFAULT_ALGORITHM_ID,
  DEFAULT_GAME_TARGET,
  type GameResult,
  type Player,
  type Schedule,
  type TournamentConfig,
} from "@ptg/core";

export { LIMITS, clamp, maxRestSlots, normaliseConfig } from "./config";

export interface TournamentState {
  players: Player[];
  config: TournamentConfig;
  algorithmId: string;
  /** null until the organiser presses Generate */
  schedule: Schedule | null;
  games: GameResult[];
  /** rally points a game is played to (SPEC-1 §1) */
  gameTarget: number;
}

export function emptyState(seed = 1): TournamentState {
  return {
    players: [],
    config: { courts: 2, rounds: 6, restSlots: 0, seed },
    algorithmId: DEFAULT_ALGORITHM_ID,
    schedule: null,
    games: [],
    gameTarget: DEFAULT_GAME_TARGET,
  };
}

export function gameKey(round: number, court: number): string {
  return `${round}#${court}`;
}

export function findGame(
  games: readonly GameResult[],
  round: number,
  court: number,
): GameResult | undefined {
  return games.find((g) => g.round === round && g.court === court);
}

/** Only the fields we own, so nothing internal ever reaches storage or a file. */
export function serialisableState(state: TournamentState): unknown {
  return {
    version: 1,
    players: state.players.map((p) => ({
      id: p.id,
      name: p.name,
      gender: p.gender,
      level: p.level,
    })),
    config: {
      courts: state.config.courts,
      rounds: state.config.rounds,
      restSlots: state.config.restSlots,
      seed: state.config.seed,
    },
    algorithmId: state.algorithmId,
    gameTarget: state.gameTarget,
    schedule: state.schedule
      ? {
          algorithmId: state.schedule.algorithmId,
          seed: state.schedule.seed,
          rounds: state.schedule.rounds.map((round) => ({
            matches: round.matches.map((m) => ({
              court: m.court,
              teamA: [m.teamA[0], m.teamA[1]],
              teamB: [m.teamB[0], m.teamB[1]],
            })),
            resting: [...round.resting],
          })),
        }
      : null,
    games: state.games.map((g) => ({
      round: g.round,
      court: g.court,
      teamA: [g.teamA[0], g.teamA[1]],
      teamB: [g.teamB[0], g.teamB[1]],
      pointsA: g.pointsA,
      pointsB: g.pointsB,
      voided: g.voided,
    })),
  };
}

export type { GameResult, Player, Schedule, TournamentConfig };
