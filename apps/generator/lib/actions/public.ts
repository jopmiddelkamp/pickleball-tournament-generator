"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { LIMITS } from "../config";
import { addRegistration, cancelRegistration, countActiveRegistrations, findActiveRegistrationByToken } from "../db/registrations";
import { findTournamentBySlug } from "../db/tournaments";
import { newParticipantToken } from "../ids";
import { tournamentStatus } from "../tournament";
import { parsePlayerForm } from "../validate";
import type { PublicFormState } from "./publicState";

const PARTICIPANT_COOKIE = "ptg_participant";
const TOKEN = /^[A-Za-z0-9_-]{1,64}$/;

export async function registerAction(slug: string, _prev: PublicFormState, formData: FormData): Promise<PublicFormState> {
  const tournament = await findTournamentBySlug(slug);
  if (!tournament) notFound();

  if (tournamentStatus(tournament) !== "open") return { error: "closed" };

  const player = parsePlayerForm(formData);
  if (!player) return { error: "invalid" };

  if ((await countActiveRegistrations(tournament.id)) >= LIMITS.maxRegistrations) return { error: "full" };

  const cookieStore = await cookies();
  const existing = cookieStore.get(PARTICIPANT_COOKIE)?.value;
  const token = existing && TOKEN.test(existing) ? existing : newParticipantToken();

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

  const token = (await cookies()).get(PARTICIPANT_COOKIE)?.value;
  const registration = token ? await findActiveRegistrationByToken(tournament.id, token) : null;
  if (!registration) return { error: "failed" };

  // The schedule is generated from the roster; once it exists, cancelling
  // would silently desync it from who is actually on court.
  if (tournament.schedule != null) return { error: "closed" };

  await cancelRegistration(tournament.id, registration.id);
  revalidatePath(`/t/${tournament.slug}`);
  return { error: null };
}
