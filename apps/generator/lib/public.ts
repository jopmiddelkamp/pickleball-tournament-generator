import type { GameResult, Player, Schedule } from "@ptg/core";
import { maxPlayersFor } from "@ptg/core";
import { LIMITS } from "./config";
import type { TournamentRow } from "./db/schema";
import { partitionRegistrations, toPlayer, type ActiveRegistration } from "./registrations";
import { tournamentStatus, type TournamentStatus } from "./tournament";
import { parseGames, parseSchedule } from "./validate";

export interface PublicYou {
  name: string;
  confirmed: boolean;
  /** 1-based waiting-list position; null when confirmed */
  position: number | null;
  canCancel: boolean;
}

export interface PublicView {
  slug: string;
  name: string;
  startsAt: string; // ISO
  status: TournamentStatus;
  capacity: number;
  confirmedCount: number;
  waitingCount: number;
  /** the visitor's registration, matched by cookie; null when not registered */
  you: PublicYou | null;
  /** id of the visitor's registration, for highlighting their match */
  yourId: string | null;
  /** the hard spam cap is reached; the form is closed even while status is open */
  full: boolean;
  gameTarget: number;
  roundsStarted: number;
  players: Player[]; // confirmed only; empty until generated
  schedule: Schedule | null; // present when status is live or finished (readable)
  games: GameResult[];
}

export function buildPublicView(
  tournament: TournamentRow,
  registrations: readonly ActiveRegistration[],
  registrationId: string | null, // the visitor's active registration id, or null
): PublicView {
  const capacity = maxPlayersFor(tournament.maxCourts);
  const { confirmed, waiting } = partitionRegistrations(registrations, capacity);
  const status = tournamentStatus(tournament);
  // The roster is frozen (and cancelling no longer safe) once a schedule sits
  // on top of it, mirroring the organiser's own freeze rule.
  const canCancel = tournament.schedule == null;

  let you: PublicYou | null = null;
  if (registrationId != null) {
    const confirmedMatch = confirmed.find((r) => r.id === registrationId);
    if (confirmedMatch) {
      you = { name: confirmedMatch.name, confirmed: true, position: null, canCancel };
    } else {
      const waitingIndex = waiting.findIndex((r) => r.id === registrationId);
      const waitingMatch = waitingIndex === -1 ? null : waiting[waitingIndex];
      if (waitingMatch) {
        you = { name: waitingMatch.name, confirmed: false, position: waitingIndex + 1, canCancel };
      }
    }
  }

  const players = confirmed.map(toPlayer);
  const known = new Set(players.map((p) => p.id));

  // A generated-but-not-started schedule stays private so the organiser can
  // still discard/regenerate without players screenshotting a draft.
  const scheduleReadable = status === "live" || status === "finished";
  const schedule = scheduleReadable && tournament.schedule != null ? parseSchedule(tournament.schedule, known) : null;
  const games = schedule ? parseGames(tournament.games, known) : [];

  return {
    slug: tournament.slug,
    name: tournament.name,
    startsAt: tournament.startsAt.toISOString(),
    status,
    capacity,
    confirmedCount: confirmed.length,
    waitingCount: waiting.length,
    you,
    yourId: registrationId,
    full: registrations.length >= LIMITS.maxRegistrations,
    gameTarget: tournament.gameTarget,
    roundsStarted: tournament.roundsStarted,
    players,
    schedule,
    games: games ?? [],
  };
}
