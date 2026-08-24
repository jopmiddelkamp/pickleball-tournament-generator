import { ALGORITHMS, MAX_PLAYERS_PER_COURT, MIN_PLAYERS_PER_COURT } from "@ptg/core";
import type { cookies } from "next/headers";
import { LIMITS } from "./config";
import type { TournamentInput } from "./validate";
import { isRecord } from "./validate";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

/** The reusable half of an event: everything except its name and start. */
export type EventDefaults = Omit<TournamentInput, "name" | "startsAt">;

const COOKIE = "ptg_event_defaults";

/** Cookies are client-controlled, so every field is re-checked like any other input. */
export function parseEventDefaults(raw: string | undefined): EventDefaults | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(value)) return null;
  const { location, maxCourts, playersPerCourt, rounds, gameTarget, algorithmId } = value;
  if (location !== null && (typeof location !== "string" || location.length === 0 || location.length > LIMITS.maxLocation)) return null;
  if (typeof maxCourts !== "number" || !Number.isInteger(maxCourts) || maxCourts < LIMITS.minCourts || maxCourts > LIMITS.maxCourts) return null;
  if (
    typeof playersPerCourt !== "number" ||
    !Number.isInteger(playersPerCourt) ||
    playersPerCourt < MIN_PLAYERS_PER_COURT ||
    playersPerCourt > MAX_PLAYERS_PER_COURT
  )
    return null;
  if (typeof rounds !== "number" || !Number.isInteger(rounds) || rounds < LIMITS.minRounds || rounds > LIMITS.maxRounds) return null;
  if (typeof gameTarget !== "number" || !Number.isInteger(gameTarget) || gameTarget < 1 || gameTarget > LIMITS.maxPoints) return null;
  if (typeof algorithmId !== "string" || !ALGORITHMS.some((a) => a.id === algorithmId)) return null;
  return { location, maxCourts, playersPerCourt, rounds, gameTarget, algorithmId };
}

export function readEventDefaults(store: CookieStore): EventDefaults | null {
  return parseEventDefaults(store.get(COOKIE)?.value);
}

/** Saved whenever an event is created or edited, so the next event starts from the same settings. */
export function writeEventDefaults(store: CookieStore, input: TournamentInput): void {
  const defaults: EventDefaults = {
    location: input.location,
    maxCourts: input.maxCourts,
    playersPerCourt: input.playersPerCourt,
    rounds: input.rounds,
    gameTarget: input.gameTarget,
    algorithmId: input.algorithmId,
  };
  store.set(COOKIE, JSON.stringify(defaults), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/organiser",
    maxAge: 60 * 60 * 24 * 365,
  });
}
