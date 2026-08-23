/**
 * localStorage persistence.
 *
 * Anything read back is treated as input: it can be edited by hand, truncated,
 * or written by an older build. Everything goes through `parseState`, and a
 * roster that does not survive that is reported to the organiser rather than
 * half-loaded.
 */
import { ALGORITHMS, DEFAULT_ALGORITHM_ID, DEFAULT_GAME_TARGET } from "@ptg/core";
import {
  LIMITS,
  clamp,
  emptyState,
  maxRestSlots,
  type GameResult,
  type Player,
  type Schedule,
  type TournamentState,
} from "./state";

export const STORAGE_KEY = "ptg.tournament.v1";

export type LoadResult =
  | { status: "empty" }
  | { status: "loaded"; state: TournamentState }
  | { status: "unreadable"; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 || trimmed.length > maxLength ? null : trimmed;
}

function asInt(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null;
}

function parsePlayer(value: unknown): Player | null {
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

function parseSchedule(value: unknown, known: ReadonlySet<string>): Schedule | null {
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

export function parseState(raw: unknown): TournamentState | null {
  if (!isRecord(raw)) return null;
  if (raw.version !== 1) return null;
  if (!Array.isArray(raw.players) || raw.players.length > LIMITS.maxPlayers) return null;

  const players: Player[] = [];
  const seenIds = new Set<string>();
  for (const rawPlayer of raw.players) {
    const player = parsePlayer(rawPlayer);
    if (!player || seenIds.has(player.id)) return null;
    seenIds.add(player.id);
    players.push(player);
  }

  const rawConfig = isRecord(raw.config) ? raw.config : {};
  const config = {
    courts: clamp(asInt(rawConfig.courts) ?? 2, LIMITS.minCourts, LIMITS.maxCourts),
    rounds: clamp(asInt(rawConfig.rounds) ?? 6, LIMITS.minRounds, LIMITS.maxRounds),
    restSlots: clamp(asInt(rawConfig.restSlots) ?? 0, 0, maxRestSlots(players.length)),
    seed: (asInt(rawConfig.seed) ?? 1) >>> 0,
  };

  const algorithmId = asString(raw.algorithmId, 64) ?? DEFAULT_ALGORITHM_ID;
  const known = new Set(ALGORITHMS.map((a) => a.id));

  const schedule = raw.schedule == null ? null : parseSchedule(raw.schedule, seenIds);
  if (raw.schedule != null && schedule === null) return null;

  const games: GameResult[] = [];
  if (Array.isArray(raw.games)) {
    if (raw.games.length > LIMITS.maxRounds * LIMITS.maxCourts) return null;
    for (const rawGame of raw.games) {
      const game = parseGame(rawGame, seenIds);
      if (!game) return null;
      games.push(game);
    }
  }

  return {
    players,
    config,
    algorithmId: known.has(algorithmId) ? algorithmId : DEFAULT_ALGORITHM_ID,
    schedule,
    games,
    gameTarget: clamp(asInt(raw.gameTarget) ?? DEFAULT_GAME_TARGET, 1, LIMITS.maxPoints),
  };
}

export function loadState(): LoadResult {
  if (typeof window === "undefined") return { status: "empty" };
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return { status: "unreadable", message: "This browser is blocking storage, so nothing was restored." };
  }
  if (raw === null) return { status: "empty" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "unreadable", message: "The saved evening could not be read and was left untouched. Start a new one, or fix the browser storage entry." };
  }

  const state = parseState(parsed);
  if (!state) {
    return { status: "unreadable", message: "The saved evening does not match what this version expects. Start a new one, or fix the browser storage entry." };
  }
  return { status: "loaded", state };
}

export function saveState(state: TournamentState, serialise: (s: TournamentState) => unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialise(state)));
  } catch (error) {
    // A full or blocked store must not take the evening down mid-round.
    console.error("Could not save the evening", error);
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Could not clear the evening", error);
  }
}

export { emptyState };
