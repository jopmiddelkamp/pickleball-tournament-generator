"use server";

import { revalidatePath } from "next/cache";
import { cancelRegistration } from "../db/registrations";
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
