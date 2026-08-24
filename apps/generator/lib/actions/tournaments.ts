"use server";

import { DEFAULT_ALGORITHM_ID, generateSchedule, getAlgorithm, playingCapacity, type Match } from "@ptg/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrganiserId } from "../auth";
import { LIMITS } from "../config";
import { createTournament, updateTournament, type TournamentPatch } from "../db/tournaments";
import { realignGames, swapInRound, withScore, withVoided } from "../evening";
import { newSeed } from "../ids";
import { effectiveConfig, type WorkspaceView } from "../tournament";
import { parseSetupPatch, parseTournamentForm } from "../validate";
import { loadOwnedWorkspace, type OwnedWorkspace } from "../workspace";
import { fail, OK, type ActionResult } from "./result";
import type { CreateTournamentState } from "./tournamentState";

export async function createTournamentAction(_prev: CreateTournamentState, formData: FormData): Promise<CreateTournamentState> {
  const organiserId = await requireOrganiserId();
  const input = parseTournamentForm(formData);
  if (!input) return { error: "invalid" };
  const created = await createTournament(organiserId, input);
  redirect(`/organiser/event/${created.id}`);
}

export async function updateEventDetailsAction(
  id: string,
  _prev: CreateTournamentState,
  formData: FormData,
): Promise<CreateTournamentState> {
  const owner = await loadOwnedWorkspace(id);
  const input = parseTournamentForm(formData);
  if (!input) return { error: "invalid" };
  // Capacity is frozen together with the roster once a schedule exists; the
  // form disables those fields, so a change arriving here is stale.
  const scheduleStored = owner.tournament.schedule != null;
  if (
    scheduleStored &&
    (input.maxCourts !== owner.tournament.maxCourts || input.playersPerCourt !== owner.tournament.playersPerCourt)
  ) {
    return { error: "invalid" };
  }
  await updateTournament(owner.organiserId, owner.tournament.id, {
    name: input.name,
    startsAt: input.startsAt,
    ...(scheduleStored ? {} : { maxCourts: input.maxCourts, playersPerCourt: input.playersPerCourt }),
  });
  revalidatePath(`/organiser/event/${owner.tournament.id}`);
  revalidatePath(`/event/${owner.tournament.slug}`);
  return { error: null };
}

/** Ownership check shared by every workspace action; a stranger's id is a 404. */
async function owned(id: string): Promise<OwnedWorkspace> {
  return loadOwnedWorkspace(id);
}

async function save(owner: OwnedWorkspace, patch: TournamentPatch): Promise<ActionResult> {
  await updateTournament(owner.organiserId, owner.tournament.id, patch);
  revalidatePath(`/organiser/event/${owner.tournament.id}`);
  return OK;
}

export async function updateSetupAction(id: string, rawPatch: unknown): Promise<ActionResult> {
  const owner = await owned(id);
  const patch = parseSetupPatch(rawPatch);
  if (!patch) return fail("invalid");
  const update: TournamentPatch = {};
  if (patch.useSuggestion) {
    update.courts = null;
    update.restSlots = null;
  }
  if (patch.courts !== undefined) update.courts = patch.courts;
  if (patch.restSlots !== undefined) update.restSlots = patch.restSlots;
  if (patch.rounds !== undefined) update.rounds = patch.rounds;
  if (patch.algorithmId !== undefined) update.algorithmId = patch.algorithmId;
  if (patch.gameTarget !== undefined) update.gameTarget = patch.gameTarget;
  return save(owner, update);
}

function generateWith(owner: OwnedWorkspace, seed: number): ActionResult | TournamentPatch {
  if (owner.tournament.registrationClosedAt === null) return fail("open");
  const players = owner.view.confirmed;
  const config = { ...effectiveConfig(owner.tournament, players.length), seed };
  if (players.length < 4 || playingCapacity(players.length, config) === 0) return fail("players");
  const algorithmId = getAlgorithm(owner.tournament.algorithmId) ? owner.tournament.algorithmId : DEFAULT_ALGORITHM_ID;
  return { seed, schedule: generateSchedule(algorithmId, players, config), games: [] };
}

function isFailure(value: ActionResult | TournamentPatch): value is ActionResult {
  return "ok" in value;
}

export async function generateAction(id: string): Promise<ActionResult> {
  const owner = await owned(id);
  // A schedule already exists: generating over it would silently wipe any
  // scores entered so far. Reroll is the explicit, sanctioned way to redo it.
  if (owner.tournament.schedule != null) return fail("frozen");
  const outcome = generateWith(owner, owner.tournament.seed);
  return isFailure(outcome) ? outcome : save(owner, outcome);
}

/** New seed; with a schedule on the table it is regenerated right away (spec "Setup"). Scores go with it. */
export async function rerollAction(id: string): Promise<ActionResult> {
  const owner = await owned(id);
  if (owner.tournament.roundsStarted > 0) return fail("state");
  const seed = newSeed();
  if (!owner.view.schedule) return save(owner, { seed });
  const outcome = generateWith(owner, seed);
  return isFailure(outcome) ? outcome : save(owner, outcome);
}

export async function discardScheduleAction(id: string): Promise<ActionResult> {
  return save(await owned(id), { schedule: null, games: [], roundsStarted: 0, finishedAt: null });
}

/** Opens the next round for play; the organiser calls this once the players for it are on court. */
export async function startRoundAction(id: string): Promise<ActionResult> {
  const owner = await owned(id);
  const schedule = owner.view.schedule;
  if (!schedule || owner.tournament.roundsStarted >= schedule.rounds.length || owner.tournament.finishedAt !== null) {
    return fail("state");
  }
  return save(owner, { roundsStarted: owner.tournament.roundsStarted + 1 });
}

/** Closes the evening; standings become final. Requires at least one round to have started. */
export async function endEventAction(id: string): Promise<ActionResult> {
  const owner = await owned(id);
  if (owner.tournament.roundsStarted === 0 || owner.tournament.finishedAt !== null) return fail("state");
  return save(owner, { finishedAt: new Date() });
}

function matchAt(view: WorkspaceView, roundIndex: number, court: number): Match | null {
  const round = view.schedule?.rounds[roundIndex];
  return round?.matches.find((m) => m.court === court) ?? null;
}

export async function recordScoreAction(
  id: string,
  roundIndex: number,
  court: number,
  side: "A" | "B",
  points: number | null,
): Promise<ActionResult> {
  const owner = await owned(id);
  const match = matchAt(owner.view, roundIndex, court);
  if (!match || (side !== "A" && side !== "B")) return fail("invalid");
  if (points !== null && (!Number.isInteger(points) || points < 0 || points > LIMITS.maxPoints)) return fail("invalid");
  return save(owner, { games: withScore(owner.view.games, match, roundIndex, side, points) });
}

export async function setVoidedAction(id: string, roundIndex: number, court: number, voided: boolean): Promise<ActionResult> {
  const owner = await owned(id);
  const match = matchAt(owner.view, roundIndex, court);
  if (!match || typeof voided !== "boolean") return fail("invalid");
  return save(owner, { games: withVoided(owner.view.games, match, roundIndex, voided) });
}

export async function swapPlayersAction(id: string, roundIndex: number, a: string, b: string): Promise<ActionResult> {
  const owner = await owned(id);
  const schedule = owner.view.schedule;
  const round = schedule?.rounds[roundIndex];
  if (!schedule || !round || typeof a !== "string" || typeof b !== "string" || a === b) return fail("invalid");
  const inRound = new Set([...round.resting, ...round.matches.flatMap((m) => [...m.teamA, ...m.teamB])]);
  if (!inRound.has(a) || !inRound.has(b)) return fail("invalid");
  const rounds = schedule.rounds.map((r, i) => (i === roundIndex ? swapInRound(r, a, b) : r));
  return save(owner, { schedule: { ...schedule, rounds }, games: realignGames(owner.view.games, roundIndex, rounds) });
}
