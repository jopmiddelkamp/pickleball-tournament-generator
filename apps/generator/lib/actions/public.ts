"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { LIMITS } from "../config";
import { addRegistration, addRegistrationGroup, cancelRegistration, countActiveRegistrations, findActiveRegistrationByToken, listActiveRegistrations, updateRegistrationProfile } from "../db/registrations";
import { isUniqueViolation } from "../db/errors";
import { findTournamentBySlug } from "../db/tournaments";
import { newParticipantToken } from "../ids";
import { PARTICIPANT_COOKIE, readParticipantToken } from "../participant";
import { tournamentStatus } from "../tournament";
import { parseGuestsForm, parsePlayerForm, parseProfile } from "../validate";
import type { PublicFormState } from "./publicState";

export async function registerAction(slug: string, _prev: PublicFormState, formData: FormData): Promise<PublicFormState> {
  const tournament = await findTournamentBySlug(slug);
  if (!tournament) notFound();

  if (tournamentStatus(tournament) !== "open") return { error: "closed" };

  const player = parsePlayerForm(formData);
  if (!player) return { error: "invalid" };
  const guests = parseGuestsForm(formData);
  if (guests === null) return { error: "invalid" };

  if ((await countActiveRegistrations(tournament.id)) + 1 + guests.length > LIMITS.maxRegistrations) return { error: "full" };

  const cookieStore = await cookies();
  const token = readParticipantToken(cookieStore) ?? newParticipantToken();

  try {
    await addRegistrationGroup(tournament.id, { ...player, participantToken: token }, guests);
  } catch (err) {
    // The partial unique index fired: this phone already has an active
    // registration for this evening. Re-render so a reload shows it.
    if (isUniqueViolation(err)) {
      revalidatePath(`/event/${tournament.slug}`);
      return { error: "already" };
    }
    console.error(`registerAction failed for tournament ${tournament.id}`, err);
    return { error: "failed" };
  }

  cookieStore.set(PARTICIPANT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath(`/event/${tournament.slug}`);
  return { error: null };
}

export async function addGuestAction(slug: string, _prev: PublicFormState, formData: FormData): Promise<PublicFormState> {
  const tournament = await findTournamentBySlug(slug);
  if (!tournament) notFound();

  if (tournamentStatus(tournament) !== "open") return { error: "closed" };

  const token = readParticipantToken(await cookies());
  const host = token ? await findActiveRegistrationByToken(tournament.id, token) : null;
  if (!host) return { error: "failed" };

  const player = parsePlayerForm(formData);
  if (!player) return { error: "invalid" };

  const active = await listActiveRegistrations(tournament.id);
  if (active.length >= LIMITS.maxRegistrations) return { error: "full" };
  if (active.filter((r) => r.guestOf === host.id).length >= LIMITS.maxGuests) return { error: "guestLimit" };

  try {
    await addRegistration(tournament.id, { ...player, participantToken: null, guestOf: host.id });
  } catch (err) {
    console.error(`addGuestAction failed for tournament ${tournament.id}`, err);
    return { error: "failed" };
  }
  revalidatePath(`/event/${tournament.slug}`);
  return { error: null };
}

export async function cancelGuestAction(slug: string, guestId: string): Promise<PublicFormState> {
  const tournament = await findTournamentBySlug(slug);
  if (!tournament) notFound();

  const token = readParticipantToken(await cookies());
  const host = token ? await findActiveRegistrationByToken(tournament.id, token) : null;
  if (!host) return { error: "failed" };

  if (tournament.schedule != null) return { error: "closed" };

  const guest = (await listActiveRegistrations(tournament.id)).find((r) => r.id === guestId && r.guestOf === host.id);
  if (!guest) return { error: "failed" };

  await cancelRegistration(tournament.id, guest.id);
  revalidatePath(`/event/${tournament.slug}`);
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

  // +1s exist only through this registration, so they leave with it.
  const guests = (await listActiveRegistrations(tournament.id)).filter((r) => r.guestOf === registration.id);
  await cancelRegistration(tournament.id, registration.id);
  for (const guest of guests) await cancelRegistration(tournament.id, guest.id);
  revalidatePath(`/event/${tournament.slug}`);
  return { error: null };
}

/**
 * Corrects gender or level for the visitor's own registration or one of
 * their +1s. The row is updated in place, so the player keeps their spot in
 * the queue; removing and re-adding would have sent them to the back.
 */
export async function updateProfileAction(slug: string, registrationId: string, profile: unknown): Promise<PublicFormState> {
  const tournament = await findTournamentBySlug(slug);
  if (!tournament) notFound();

  const token = readParticipantToken(await cookies());
  const host = token ? await findActiveRegistrationByToken(tournament.id, token) : null;
  if (!host) return { error: "failed" };

  // Same freeze rule as cancelling: the schedule was drawn from these levels.
  if (tournament.schedule != null) return { error: "closed" };

  const parsed = parseProfile(profile);
  if (!parsed) return { error: "invalid" };

  const own =
    registrationId === host.id ||
    (await listActiveRegistrations(tournament.id)).some((r) => r.id === registrationId && r.guestOf === host.id);
  if (!own) return { error: "failed" };

  if (!(await updateRegistrationProfile(tournament.id, registrationId, parsed))) return { error: "failed" };
  revalidatePath(`/event/${tournament.slug}`);
  return { error: null };
}
