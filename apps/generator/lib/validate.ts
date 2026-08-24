import {
  ALGORITHMS,
  DEFAULT_ALGORITHM_ID,
  DEFAULT_GAME_TARGET,
  MAX_PLAYERS_PER_COURT,
  MIN_PLAYERS_PER_COURT,
  PLAYERS_PER_COURT,
  type GameResult,
  type Player,
  type Schedule,
} from "@ptg/core";
import { LIMITS } from "./config";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 || trimmed.length > maxLength ? null : trimmed;
}

export function asInt(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null;
}

export interface SetupPatch {
  courts?: number;
  restSlots?: number;
  rounds?: number;
  algorithmId?: string;
  gameTarget?: number;
  useSuggestion?: boolean;
}

function intInRange(value: unknown, min: number, max: number): number | null {
  const n = asInt(value);
  return n === null || n < min || n > max ? null : n;
}

/** The organiser's Set up tab, one field at a time; an unknown or out-of-range field rejects the whole patch. */
export function parseSetupPatch(value: unknown): SetupPatch | null {
  if (!isRecord(value)) return null;
  const patch: SetupPatch = {};
  if ("courts" in value) {
    const courts = intInRange(value.courts, LIMITS.minCourts, LIMITS.maxCourts);
    if (courts === null) return null;
    patch.courts = courts;
  }
  if ("restSlots" in value) {
    const restSlots = intInRange(value.restSlots, 0, LIMITS.maxPlayers);
    if (restSlots === null) return null;
    patch.restSlots = restSlots;
  }
  if ("rounds" in value) {
    const rounds = intInRange(value.rounds, LIMITS.minRounds, LIMITS.maxRounds);
    if (rounds === null) return null;
    patch.rounds = rounds;
  }
  if ("gameTarget" in value) {
    const gameTarget = intInRange(value.gameTarget, 1, LIMITS.maxPoints);
    if (gameTarget === null) return null;
    patch.gameTarget = gameTarget;
  }
  if ("algorithmId" in value) {
    if (typeof value.algorithmId !== "string" || !ALGORITHMS.some((a) => a.id === value.algorithmId)) return null;
    patch.algorithmId = value.algorithmId;
  }
  if ("useSuggestion" in value) {
    if (value.useSuggestion !== true) return null;
    patch.useSuggestion = true;
  }
  return Object.keys(patch).length === 0 ? null : patch;
}

export function parsePlayer(value: unknown): Player | null {
  if (!isRecord(value)) return null;
  const id = asString(value.id, 64);
  const name = asString(value.name, LIMITS.maxNameLength);
  const level = asInt(value.level);
  if (!id || !name) return null;
  if (value.gender !== "M" && value.gender !== "F") return null;
  if (level === null || level < 1 || level > 6) return null;
  return { id, name, gender: value.gender, level: level as Player["level"] };
}

function parseTeam(value: unknown, known: ReadonlySet<string>): [string, string] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const a = asString(value[0], 64);
  const b = asString(value[1], 64);
  if (!a || !b || a === b || !known.has(a) || !known.has(b)) return null;
  return [a, b];
}

export function parseSchedule(value: unknown, known: ReadonlySet<string>): Schedule | null {
  if (!isRecord(value)) return null;
  const algorithmId = asString(value.algorithmId, 64);
  const seed = asInt(value.seed);
  if (!algorithmId || seed === null || !Array.isArray(value.rounds)) return null;
  if (value.rounds.length > LIMITS.maxRounds) return null;

  const rounds: Schedule["rounds"] = [];
  for (const rawRound of value.rounds) {
    if (!isRecord(rawRound) || !Array.isArray(rawRound.matches)) return null;
    if (rawRound.matches.length > LIMITS.maxCourts) return null;

    const matches: Schedule["rounds"][number]["matches"] = [];
    for (const rawMatch of rawRound.matches) {
      if (!isRecord(rawMatch)) return null;
      const court = asInt(rawMatch.court);
      const teamA = parseTeam(rawMatch.teamA, known);
      const teamB = parseTeam(rawMatch.teamB, known);
      if (court === null || court < 1 || court > LIMITS.maxCourts || !teamA || !teamB) return null;
      matches.push({ court, teamA, teamB });
    }

    const resting = Array.isArray(rawRound.resting)
      ? rawRound.resting.map((id) => asString(id, 64)).filter((id): id is string => !!id && known.has(id))
      : [];
    rounds.push({ matches, resting });
  }
  return { algorithmId, seed, rounds };
}

function parseGame(value: unknown, known: ReadonlySet<string>): GameResult | null {
  if (!isRecord(value)) return null;
  const round = asInt(value.round);
  const court = asInt(value.court);
  const pointsA = asInt(value.pointsA);
  const pointsB = asInt(value.pointsB);
  const teamA = parseTeam(value.teamA, known);
  const teamB = parseTeam(value.teamB, known);
  if (round === null || round < 0 || round >= LIMITS.maxRounds) return null;
  if (court === null || court < 1 || court > LIMITS.maxCourts) return null;
  if (pointsA === null || pointsB === null) return null;
  if (pointsA < 0 || pointsB < 0 || pointsA > LIMITS.maxPoints || pointsB > LIMITS.maxPoints) return null;
  if (!teamA || !teamB) return null;
  return { round, court, teamA, teamB, pointsA, pointsB, voided: value.voided === true };
}

export function parseGames(value: unknown, known: ReadonlySet<string>): GameResult[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length > LIMITS.maxRounds * LIMITS.maxCourts) return null;
  const games: GameResult[] = [];
  for (const raw of value) {
    const game = parseGame(raw, known);
    if (!game) return null;
    games.push(game);
  }
  return games;
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}


export interface TournamentInput {
  name: string;
  startsAt: Date;
  location: string | null;
  maxCourts: number;
  playersPerCourt: number;
  gameTarget: number;
  algorithmId: string;
}

function intField(formData: FormData, name: string): number | null {
  const raw = field(formData, name).trim();
  if (!/^-?\d+$/.test(raw)) return null;
  return Number(raw);
}

/**
 * `startsAt` arrives from an <input type="datetime-local"> as local wall time
 * without a zone; `tzOffset` is the browser's `getTimezoneOffset()` in minutes.
 */
function parseLocalDateTime(raw: string, tzOffsetMinutes: number): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(raw);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number) as [number, number, number, number, number, number];
  const utc = Date.UTC(y, mo - 1, d, h, mi) + tzOffsetMinutes * 60_000;
  const date = new Date(utc);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseTournamentForm(formData: FormData): TournamentInput | null {
  const name = asString(field(formData, "name"), LIMITS.maxTournamentName);
  const location = asString(field(formData, "location"), LIMITS.maxLocation);
  const tzOffset = intField(formData, "tzOffset") ?? 0;
  const startsAt = parseLocalDateTime(field(formData, "startsAt"), tzOffset);
  const maxCourts = intField(formData, "maxCourts");
  const playersPerCourt = intField(formData, "playersPerCourt") ?? PLAYERS_PER_COURT;
  if (!name || !startsAt) return null;
  if (maxCourts === null || maxCourts < LIMITS.minCourts || maxCourts > LIMITS.maxCourts) return null;
  if (playersPerCourt < MIN_PLAYERS_PER_COURT || playersPerCourt > MAX_PLAYERS_PER_COURT) return null;
  const gameTarget = intField(formData, "gameTarget") ?? DEFAULT_GAME_TARGET;
  if (gameTarget < 1 || gameTarget > LIMITS.maxPoints) return null;
  const rawAlgorithm = field(formData, "algorithmId");
  const algorithmId = rawAlgorithm === "" ? DEFAULT_ALGORITHM_ID : rawAlgorithm;
  if (!ALGORITHMS.some((a) => a.id === algorithmId)) return null;
  return { name, startsAt, location, maxCourts, playersPerCourt, gameTarget, algorithmId };
}

/**
 * The +1s posted with a public sign-up as guestName_i / guestGender_i /
 * guestLevel_i. Empty slots are skipped; a half-filled one rejects the form.
 */
export function parseGuestsForm(formData: FormData): Omit<Player, "id">[] | null {
  const guests: Omit<Player, "id">[] = [];
  for (let i = 0; i < LIMITS.maxGuests; i++) {
    const name = field(formData, `guestName_${i}`);
    const gender = field(formData, `guestGender_${i}`);
    const level = field(formData, `guestLevel_${i}`);
    if (name.trim() === "" && gender === "" && level === "") continue;
    const guest = parsePlayer({ id: "form", name, gender, level: /^\d+$/.test(level) ? Number(level) : null });
    if (!guest) return null;
    guests.push({ name: guest.name, gender: guest.gender, level: guest.level });
  }
  return guests;
}

export function parsePlayerForm(formData: FormData): Omit<Player, "id"> | null {
  const player = parsePlayer({
    id: "form",
    name: field(formData, "name"),
    gender: field(formData, "gender"),
    level: intField(formData, "level"),
  });
  return player ? { name: player.name, gender: player.gender, level: player.level } : null;
}
