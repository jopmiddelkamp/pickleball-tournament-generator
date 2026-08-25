import type { GameResult, Gender, Level, Player, Round } from "@ptg/core";
import { maxPlayersFor } from "@ptg/core";
import { LIMITS } from "./config";
import type { TournamentRow } from "./db/schema";
import { partitionRegistrations, toPlayer, type ActiveRegistration } from "./registrations";
import { tournamentStatus, type TournamentStatus } from "./tournament";
import { parseGames, parseSchedule } from "./validate";

/** One name on the public sign-up list, with its gender marker; never a level (SPEC-1 §5). */
export interface PublicSignup {
  id: string;
  name: string;
  gender: Gender;
  confirmed: boolean;
  /** 1-based waiting-list position; null when confirmed */
  position: number | null;
}

/**
 * A +1 holds its own place in the queue, described like any sign-up. The
 * level is here so the host can correct it; it never reaches the public list.
 */
export interface PublicGuest extends PublicSignup {
  level: Level;
}

export interface PublicYou {
  name: string;
  gender: Gender;
  level: Level;
  /** ISO, when this phone signed up */
  registeredAt: string;
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
  /** everyone signed up, confirmed first then the waiting list, both in arrival order */
  signedUp: PublicSignup[];
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

  const signedUp: PublicSignup[] = [
    ...confirmed.map((r) => ({ id: r.id, name: r.name, gender: r.gender, confirmed: true, position: null })),
    ...waiting.map((r, index) => ({ id: r.id, name: r.name, gender: r.gender, confirmed: false, position: index + 1 })),
  ];

  function placeOf(id: string): PublicSignup | null {
    return signedUp.find((s) => s.id === id) ?? null;
  }

  let you: PublicYou | null = null;
  if (registrationId != null) {
    const own = placeOf(registrationId);
    const ownRow = registrations.find((r) => r.id === registrationId);
    if (own && ownRow) {
      const guests = [...confirmed, ...waiting]
        .filter((r) => r.guestOf === registrationId)
        .flatMap((r) => {
          const place = placeOf(r.id);
          return place ? [{ ...place, level: r.level }] : [];
        });
      you = {
        name: own.name,
        gender: ownRow.gender,
        level: ownRow.level,
        registeredAt: ownRow.registeredAt.toISOString(),
        confirmed: own.confirmed,
        position: own.position,
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
    signedUp,
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
