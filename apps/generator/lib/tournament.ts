import {
  ALGORITHMS,
  DEFAULT_ALGORITHM_ID,
  maxPlayersFor,
  suggestConfig,
  type GameResult,
  type Player,
  type Schedule,
  type TournamentConfig,
} from "@ptg/core";
import { LIMITS, clamp, normaliseConfig } from "./config";
import type { TournamentRow } from "./db/schema";
import { partitionRegistrations, toPlayer, type ActiveRegistration } from "./registrations";
import { parseGames, parseSchedule } from "./validate";

export type TournamentStatus = "open" | "closed" | "generated" | "live" | "finished";

export function tournamentStatus(t: {
  registrationClosedAt: Date | null;
  schedule: unknown | null;
  roundsStarted: number;
  finishedAt: Date | null;
}): TournamentStatus {
  if (t.schedule != null && t.finishedAt != null) return "finished";
  if (t.schedule != null && t.roundsStarted > 0) return "live";
  if (t.schedule != null) return "generated";
  return t.registrationClosedAt ? "closed" : "open";
}

/** Organiser override when set, otherwise the suggestion; always clamped for core. */
export function effectiveConfig(
  t: { maxCourts: number; rounds: number; seed: number; courts: number | null; restSlots: number | null },
  playerCount: number,
): TournamentConfig {
  const suggestion = suggestConfig(playerCount, t.maxCourts);
  return normaliseConfig(
    {
      courts: clamp(t.courts ?? suggestion.courts, LIMITS.minCourts, t.maxCourts),
      rounds: t.rounds,
      restSlots: t.restSlots ?? suggestion.restSlots,
      seed: t.seed,
    },
    playerCount,
  );
}

export interface WorkspaceView {
  id: string;
  slug: string;
  name: string;
  startsAt: string; // ISO, for the client
  status: TournamentStatus;
  registrationOpen: boolean;
  maxPlayers: number;
  maxCourts: number;
  roundsStarted: number;
  confirmed: Player[];
  waiting: Player[];
  config: TournamentConfig;
  usingSuggestion: boolean;
  algorithmId: string;
  gameTarget: number;
  schedule: Schedule | null;
  games: GameResult[];
  /** set when the stored schedule or games could not be validated */
  notice: "unreadable" | null;
}

export function buildWorkspaceView(tournament: TournamentRow, registrations: readonly ActiveRegistration[]): WorkspaceView {
  const maxPlayers = maxPlayersFor(tournament.maxCourts, tournament.playersPerCourt);
  const { confirmed, waiting } = partitionRegistrations(registrations, maxPlayers);
  const players = confirmed.map(toPlayer);
  const known = new Set(players.map((p) => p.id));

  const schedule = tournament.schedule == null ? null : parseSchedule(tournament.schedule, known);
  const games = schedule ? parseGames(tournament.games, known) : [];
  const unreadable = (tournament.schedule != null && schedule === null) || games === null;

  const algorithmId = ALGORITHMS.some((a) => a.id === tournament.algorithmId)
    ? tournament.algorithmId
    : DEFAULT_ALGORITHM_ID;

  return {
    id: tournament.id,
    slug: tournament.slug,
    name: tournament.name,
    startsAt: tournament.startsAt.toISOString(),
    status: tournamentStatus(tournament),
    registrationOpen: tournament.registrationClosedAt === null,
    maxPlayers,
    maxCourts: tournament.maxCourts,
    roundsStarted: tournament.roundsStarted,
    confirmed: players,
    waiting: waiting.map(toPlayer),
    config: effectiveConfig(tournament, players.length),
    usingSuggestion: tournament.courts === null && tournament.restSlots === null,
    algorithmId,
    gameTarget: tournament.gameTarget,
    schedule: unreadable ? null : schedule,
    games: unreadable || games === null ? [] : games,
    notice: unreadable ? "unreadable" : null,
  };
}
