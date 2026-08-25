"use server";

import { revalidatePath } from "next/cache";
import { cancelRegistration, updateRegistrationProfile } from "../db/registrations";
import { parseProfile } from "../validate";
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

/** Corrects a player's gender or level in place; their arrival position is untouched. */
export async function updateRegistrationAction(id: string, registrationId: string, profile: unknown): Promise<ActionResult> {
  const { frozen } = await ownedUnfrozen(id);
  if (frozen) return fail("frozen");
  const parsed = parseProfile(profile);
  if (typeof registrationId !== "string" || !parsed) return fail("invalid");
  if (!(await updateRegistrationProfile(id, registrationId, parsed))) return fail("not-found");
  revalidatePath(`/organiser/event/${id}`);
  return OK;
}
