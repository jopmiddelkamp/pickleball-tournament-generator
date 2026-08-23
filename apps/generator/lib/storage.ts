/**
 * localStorage persistence.
 *
 * Anything read back is treated as input: it can be edited by hand, truncated,
 * or written by an older build. Everything goes through `parseState`, and a
 * roster that does not survive that is reported to the organiser rather than
 * half-loaded.
 */
import { ALGORITHMS, DEFAULT_ALGORITHM_ID, DEFAULT_GAME_TARGET, type Player } from "@ptg/core";
import { LIMITS, clamp, maxRestSlots } from "./config";
import { emptyState, type TournamentState } from "./state";
import { asInt, asString, isRecord, parseGames, parsePlayer, parseSchedule } from "./validate";

export const STORAGE_KEY = "ptg.tournament.v1";

/** Why a saved evening could not be restored; the app words it for the organiser. */
export type StorageFailure = "blocked" | "corrupt" | "mismatch";

export type LoadResult =
  | { status: "empty" }
  | { status: "loaded"; state: TournamentState }
  | { status: "unreadable"; reason: StorageFailure };

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

  const games = Array.isArray(raw.games) ? parseGames(raw.games, seenIds) : [];
  if (games === null) return null;

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
    return { status: "unreadable", reason: "blocked" };
  }
  if (raw === null) return { status: "empty" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "unreadable", reason: "corrupt" };
  }

  const state = parseState(parsed);
  if (!state) {
    return { status: "unreadable", reason: "mismatch" };
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
