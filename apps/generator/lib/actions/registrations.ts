"use server";

import { revalidatePath } from "next/cache";
import { LIMITS } from "../config";
import { addRegistration, cancelRegistration, countActiveRegistrations } from "../db/registrations";
import { updateTournament } from "../db/tournaments";
import { isRecord, parsePlayer } from "../validate";
import { loadOwnedWorkspace, type OwnedWorkspace } from "../workspace";
import { fail, OK, type ActionResult } from "./result";

async function ownedUnfrozen(id: string): Promise<OwnedWorkspace & { frozen: boolean }> {
  const owner = await loadOwnedWorkspace(id);
  return { ...owner, frozen: owner.tournament.schedule != null };
}

/** A player the organiser adds by hand; no cookie, so never matched on the public page. */
export async function addWalkInAction(id: string, input: unknown): Promise<ActionResult> {
  const { tournament, frozen } = await ownedUnfrozen(id);
  if (frozen) return fail("frozen");
  const player = isRecord(input) ? parsePlayer({ ...input, id: "walk-in" }) : null;
  if (!player) return fail("invalid");
  if ((await countActiveRegistrations(id)) >= LIMITS.maxRegistrations) return fail("full");
  await addRegistration(tournament.id, { name: player.name, gender: player.gender, level: player.level, participantToken: null });
  revalidatePath(`/organiser/event/${id}`);
  return OK;
}

export async function removeRegistrationAction(id: string, registrationId: string): Promise<ActionResult> {
  const { frozen } = await ownedUnfrozen(id);
  if (frozen) return fail("frozen");
  if (typeof registrationId !== "string") return fail("invalid");
  await cancelRegistration(id, registrationId);
  revalidatePath(`/organiser/event/${id}`);
  return OK;
}

export async function setRegistrationOpenAction(id: string, open: boolean): Promise<ActionResult> {
  const { organiserId, frozen } = await ownedUnfrozen(id);
  if (frozen) return fail("frozen");
  await updateTournament(organiserId, id, { registrationClosedAt: open ? null : new Date() });
  revalidatePath(`/organiser/event/${id}`);
  return OK;
}
