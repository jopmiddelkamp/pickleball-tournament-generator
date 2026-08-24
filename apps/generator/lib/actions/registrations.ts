"use server";

import { revalidatePath } from "next/cache";
import { cancelRegistration } from "../db/registrations";
import { updateTournament } from "../db/tournaments";
import { loadOwnedWorkspace, type OwnedWorkspace } from "../workspace";
import { fail, OK, type ActionResult } from "./result";

async function ownedUnfrozen(id: string): Promise<OwnedWorkspace & { frozen: boolean }> {
  const owner = await loadOwnedWorkspace(id);
  return { ...owner, frozen: owner.tournament.schedule != null };
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
