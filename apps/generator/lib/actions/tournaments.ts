"use server";

import { redirect } from "next/navigation";
import { requireOrganiserId } from "../auth";
import { createTournament } from "../db/tournaments";
import { parseTournamentForm } from "../validate";
import type { CreateTournamentState } from "./tournamentState";

export async function createTournamentAction(_prev: CreateTournamentState, formData: FormData): Promise<CreateTournamentState> {
  const organiserId = await requireOrganiserId();
  const input = parseTournamentForm(formData);
  if (!input) return { error: "invalid" };
  const created = await createTournament(organiserId, input);
  redirect(`/organiser/${created.id}`);
}
