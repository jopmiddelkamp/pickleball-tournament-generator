"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { LIMITS } from "../config";
import { addRegistration, cancelRegistration, countActiveRegistrations, findActiveRegistrationByToken } from "../db/registrations";
import { findTournamentBySlug } from "../db/tournaments";
import { newParticipantToken } from "../ids";
import { PARTICIPANT_COOKIE, readParticipantToken } from "../participant";
import { tournamentStatus } from "../tournament";
import { parsePlayerForm } from "../validate";
import type { PublicFormState } from "./publicState";

export async function registerAction(slug: string, _prev: PublicFormState, formData: FormData): Promise<PublicFormState> {
  const tournament = await findTournamentBySlug(slug);
  if (!tournament) notFound();

  if (tournamentStatus(tournament) !== "open") return { error: "closed" };

  const player = parsePlayerForm(formData);
  if (!player) return { error: "invalid" };

  if ((await countActiveRegistrations(tournament.id)) >= LIMITS.maxRegistrations) return { error: "full" };

  const cookieStore = await cookies();
  const token = readParticipantToken(cookieStore) ?? newParticipantToken();

  try {
    await addRegistration(tournament.id, { ...player, participantToken: token });
  } catch {
    // Most likely the partial unique index (postgres 23505): this phone
    // already has an active registration for this evening.
    return { error: "already" };
  }

  cookieStore.set(PARTICIPANT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath(`/t/${tournament.slug}`);
  return { error: null };
}

export async function cancelMyRegistrationAction(slug: string): Promise<PublicFormState> {
  const tournament = await findTournamentBySlug(slug);
  if (!tournament) notFound();

  const token = readParticipantToken(await cookies());
  const registration = token ? await findActiveRegistrationByToken(tournament.id, token) : null;
  if (!registration) return { error: "failed" };

  // The schedule is generated from the roster; once it exists, cancelling
  // would silently desync it from who is actually on court.
  if (tournament.schedule != null) return { error: "closed" };

  await cancelRegistration(tournament.id, registration.id);
  revalidatePath(`/t/${tournament.slug}`);
  return { error: null };
}
