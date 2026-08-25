"use server";

import { DEFAULT_ALGORITHM_ID, getAlgorithm, maxPlayersFor, playingCapacity, searchSchedule, type Match } from "@ptg/core";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireOrganiserId } from "../auth";
import { createTournament, updateTournament, type TournamentPatch } from "../db/tournaments";
import { withScore, withVoided } from "../evening";
import { newSeed } from "../ids";
import { writeEventDefaults } from "../eventDefaults";
import { effectiveConfig, type WorkspaceView } from "../tournament";
import { parseSetupPatch, parseTournamentForm } from "../validate";
import { loadOwnedWorkspace, type OwnedWorkspace } from "../workspace";
import { fail, OK, type ActionResult } from "./result";
import type { CreateTournamentState, EditEventState } from "./tournamentState";

export async function createTournamentAction(_prev: CreateTournamentState, formData: FormData): Promise<CreateTournamentState> {
  const organiserId = await requireOrganiserId();
  const input = parseTournamentForm(formData);
  if (!input) return { error: "invalid" };
  writeEventDefaults(await cookies(), input);
  const created = await createTournament(organiserId, input);
  redirect(`/organiser/event/${created.id}`);
}

export async function updateEventDetailsAction(
  id: string,
  _prev: EditEventState,
  formData: FormData,
): Promise<EditEventState> {
  const owner = await loadOwnedWorkspace(id);
  // Once the event has started nothing about it changes any more; the edit
  // page is not offered, so a submission arriving here is stale.
  if (owner.tournament.schedule != null) redirect(`/organiser/event/${owner.tournament.id}`);
  const input = parseTournamentForm(formData);
  if (!input) return { error: "invalid", demoted: 0 };
  // Confirmed players a smaller capacity pushes onto the waiting list; the
  // organiser is told to announce it so everyone re-checks their spot.
  writeEventDefaults(await cookies(), input);
  const active = owner.view.confirmed.length + owner.view.waiting.length;
  const oldCapacity = maxPlayersFor(owner.tournament.maxCourts, owner.tournament.playersPerCourt);
  const newCapacity = maxPlayersFor(input.maxCourts, input.playersPerCourt);
  const demoted = Math.max(0, Math.min(active, oldCapacity) - Math.min(active, newCapacity));
  await updateTournament(owner.organiserId, owner.tournament.id, {
    name: input.name,
    startsAt: input.startsAt,
    location: input.location,
    gameTarget: input.gameTarget,
    roundMinutes: input.roundMinutes,
    algorithmId: input.algorithmId,
    maxCourts: input.maxCourts,
    playersPerCourt: input.playersPerCourt,
    rounds: input.rounds,
  });
  revalidatePath(`/organiser/event/${owner.tournament.id}`);
  revalidatePath(`/event/${owner.tournament.slug}`);
  redirect(`/organiser/event/${owner.tournament.id}${demoted > 0 ? `?demoted=${demoted}` : ""}`);
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
  // With a schedule on the table and nothing played yet, an adjustment regenerates it in place.
  if (owner.tournament.schedule != null && owner.tournament.roundsStarted === 0) {
    const adjusted = {
      ...owner,
      tournament: {
        ...owner.tournament,
        courts: update.courts === undefined ? owner.tournament.courts : update.courts,
        restSlots: update.restSlots === undefined ? owner.tournament.restSlots : update.restSlots,
        rounds: update.rounds ?? owner.tournament.rounds,
        algorithmId: update.algorithmId ?? owner.tournament.algorithmId,
        gameTarget: update.gameTarget ?? owner.tournament.gameTarget,
      },
    };
    const outcome = generateWith(adjusted, owner.tournament.seed);
    return isFailure(outcome) ? outcome : save(owner, { ...update, ...outcome });
  }
  return save(owner, update);
}

/**
 * Draws this many candidate schedules and keeps the SPEC-2 best. A thousand
 * greedy draws on a full roster take well under a second server-side.
 */
const SCHEDULE_DRAW_ATTEMPTS = 1000;

function generateWith(owner: OwnedWorkspace, seed: number): ActionResult | TournamentPatch {
  if (owner.tournament.registrationClosedAt === null) return fail("open");
  const players = owner.view.confirmed;
  const config = { ...effectiveConfig(owner.tournament, players.length), seed };
  if (players.length < 4 || playingCapacity(players.length, config) === 0) return fail("players");
  const algorithmId = getAlgorithm(owner.tournament.algorithmId) ? owner.tournament.algorithmId : DEFAULT_ALGORITHM_ID;
  return { seed, schedule: searchSchedule(algorithmId, players, config, SCHEDULE_DRAW_ATTEMPTS), games: [] };
}

function isFailure(value: ActionResult | TournamentPatch): value is ActionResult {
  return "ok" in value;
}

/** Sign-ups over, play begins: closes registration and draws the schedule in one step. */
export async function startEventAction(id: string): Promise<ActionResult> {
  const owner = await owned(id);
  if (owner.tournament.schedule != null) return fail("frozen");
  const registrationClosedAt = owner.tournament.registrationClosedAt ?? new Date();
  const closed = { ...owner, tournament: { ...owner.tournament, registrationClosedAt } };
  const outcome = generateWith(closed, owner.tournament.seed);
  return isFailure(outcome) ? outcome : save(owner, { registrationClosedAt, ...outcome });
}

/** Undo of start, while nothing has been played: drops the draw and reopens sign-ups. */
export async function backToRegistrationAction(id: string): Promise<ActionResult> {
  const owner = await owned(id);
  if (owner.tournament.roundsStarted > 0) return fail("state");
  return save(owner, { schedule: null, games: [], roundsStarted: 0, finishedAt: null, registrationClosedAt: null });
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

/**
 * Round 1 goes on court, then each confirmation closes the round on court -
 * its scores become final - and puts the next one on. Confirming the last
 * round ends the evening.
 */
export async function advanceRoundAction(id: string): Promise<ActionResult> {
  const owner = await owned(id);
  const schedule = owner.view.schedule;
  if (!schedule || owner.tournament.finishedAt !== null) return fail("state");
  if (owner.tournament.roundsStarted < schedule.rounds.length) {
    return save(owner, { roundsStarted: owner.tournament.roundsStarted + 1, clockStartedAt: null });
  }
  return save(owner, { finishedAt: new Date(), clockStartedAt: null });
}

/** Starts the round clock; only meaningful while a round is on court and the event has a time limit. */
export async function startClockAction(id: string): Promise<ActionResult> {
  const owner = await owned(id);
  if (owner.tournament.roundMinutes === null || owner.tournament.roundsStarted === 0 || owner.tournament.finishedAt !== null) {
    return fail("state");
  }
  return save(owner, { clockStartedAt: new Date() });
}

/** Clears a clock started by mistake. */
export async function stopClockAction(id: string): Promise<ActionResult> {
  const owner = await owned(id);
  return save(owner, { clockStartedAt: null });
}

/** Scores can only be entered for the round on court; a confirmed round is final. */
function onCourt(owner: OwnedWorkspace, roundIndex: number): boolean {
  return owner.tournament.finishedAt === null && roundIndex === owner.tournament.roundsStarted - 1;
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
  if (!onCourt(owner, roundIndex)) return fail("state");
  // A game is played to the target, so no side can score past it.
  if (points !== null && (!Number.isInteger(points) || points < 0 || points > owner.tournament.gameTarget)) return fail("invalid");
  return save(owner, { games: withScore(owner.view.games, match, roundIndex, side, points) });
}

export async function setVoidedAction(id: string, roundIndex: number, court: number, voided: boolean): Promise<ActionResult> {
  const owner = await owned(id);
  const match = matchAt(owner.view, roundIndex, court);
  if (!match || typeof voided !== "boolean") return fail("invalid");
  if (!onCourt(owner, roundIndex)) return fail("state");
  return save(owner, { games: withVoided(owner.view.games, match, roundIndex, voided) });
}

