"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { LIMITS } from "../config";
import { addRegistration, cancelRegistration, countActiveRegistrations, findActiveRegistrationByToken, listActiveRegistrations } from "../db/registrations";
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
  } catch (err) {
    // The `postgres` driver exposes the postgres error code on `.code`; 23505 is the
    // partial unique index firing because this phone already has an active
    // registration for this evening. Anything else is a genuine failure.
    if (typeof err === "object" && err !== null && "code" in err && err.code === "23505") {
      return { error: "already" };
    }
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
  } catch {
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
