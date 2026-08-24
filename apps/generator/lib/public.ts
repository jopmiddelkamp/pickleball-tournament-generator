import type { GameResult, Player, Round } from "@ptg/core";
import { maxPlayersFor } from "@ptg/core";
import { LIMITS } from "./config";
import type { TournamentRow } from "./db/schema";
import { partitionRegistrations, toPlayer, type ActiveRegistration } from "./registrations";
import { tournamentStatus, type TournamentStatus } from "./tournament";
import { parseGames, parseSchedule } from "./validate";

export interface PublicGuest {
  id: string;
  name: string;
  confirmed: boolean;
  /** 1-based waiting-list position; null when confirmed */
  position: number | null;
}

export interface PublicYou {
  name: string;
  confirmed: boolean;
  /** 1-based waiting-list position; null when confirmed */
  position: number | null;
  canCancel: boolean;
  /** players this registration brought as +1s, in arrival order */
  guests: PublicGuest[];
  canAddGuest: boolean;
}

export interface PublicView {
  slug: string;
  name: string;
  startsAt: string; // ISO
  location: string | null;
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
  players: Player[]; // confirmed only; empty until status is live or finished
  /** rounds only, never the seed or algorithm id: present when status is live or finished (readable) */
  schedule: { rounds: Round[] } | null;
  games: GameResult[];
}

export function buildPublicView(
  tournament: TournamentRow,
  registrations: readonly ActiveRegistration[],
  registrationId: string | null, // the visitor's active registration id, or null
): PublicView {
  const capacity = maxPlayersFor(tournament.maxCourts, tournament.playersPerCourt);
  const { confirmed, waiting } = partitionRegistrations(registrations, capacity);
  const status = tournamentStatus(tournament);
  // The roster is frozen (and cancelling no longer safe) once a schedule sits
  // on top of it, mirroring the organiser's own freeze rule.
  const canCancel = tournament.schedule == null;

  const full = registrations.length >= LIMITS.maxRegistrations;

  function placeOf(id: string): { name: string; confirmed: boolean; position: number | null } | null {
    const confirmedMatch = confirmed.find((r) => r.id === id);
    if (confirmedMatch) return { name: confirmedMatch.name, confirmed: true, position: null };
    const waitingIndex = waiting.findIndex((r) => r.id === id);
    const waitingMatch = waitingIndex === -1 ? null : waiting[waitingIndex];
    return waitingMatch ? { name: waitingMatch.name, confirmed: false, position: waitingIndex + 1 } : null;
  }

  let you: PublicYou | null = null;
  if (registrationId != null) {
    const own = placeOf(registrationId);
    if (own) {
      const guests = [...confirmed, ...waiting]
        .filter((r) => r.guestOf === registrationId)
        .map((r) => ({ id: r.id, ...(placeOf(r.id) as NonNullable<ReturnType<typeof placeOf>>) }));
      you = {
        ...own,
        canCancel,
        guests,
        canAddGuest: status === "open" && !full && guests.length < LIMITS.maxGuests,
      };
    }
  }

  // Both the confirmed roster (levels included) and the schedule stay private
  // until the evening is live or finished: a generated-but-not-started
  // schedule is a draft the organiser can still discard/regenerate, and
  // nobody should be screenshotting levels or a draft matchup before then.
  const rosterReadable = status === "live" || status === "finished";
  let players: Player[] = [];
  let schedule: { rounds: Round[] } | null = null;
  let games: GameResult[] = [];

  if (rosterReadable && tournament.schedule != null) {
    const candidatePlayers = confirmed.map(toPlayer);
    const known = new Set(candidatePlayers.map((p) => p.id));
    const parsedSchedule = parseSchedule(tournament.schedule, known);
    const parsedGames = parsedSchedule ? parseGames(tournament.games, known) : null;
    // An unreadable schedule or games column behaves as "no schedule",
    // mirroring buildWorkspaceView; the roster comes down with it rather
    // than showing levels next to a broken or absent matchup.
    if (parsedSchedule && parsedGames) {
      players = candidatePlayers;
      schedule = { rounds: parsedSchedule.rounds };
      games = parsedGames;
    }
  }

  return {
    slug: tournament.slug,
    name: tournament.name,
    startsAt: tournament.startsAt.toISOString(),
    location: tournament.location,
    status,
    capacity,
    confirmedCount: confirmed.length,
    waitingCount: waiting.length,
    you,
    yourId: registrationId,
    full,
    gameTarget: tournament.gameTarget,
    roundsStarted: tournament.roundsStarted,
    players,
    schedule,
    games,
  };
}
