import { notFound } from "next/navigation";
import { requireOrganiserId } from "./auth";
import { listActiveRegistrations } from "./db/registrations";
import type { TournamentRow } from "./db/schema";
import { findTournament } from "./db/tournaments";
import { buildWorkspaceView, type WorkspaceView } from "./tournament";

export interface OwnedWorkspace {
  organiserId: string;
  tournament: TournamentRow;
  view: WorkspaceView;
}

/**
 * Ownership check shared by every workspace action and page: a stranger's id
 * is a 404, never a 403, so this never leaks that a tournament id exists.
 */
export async function loadOwnedWorkspace(id: string): Promise<OwnedWorkspace> {
  const organiserId = await requireOrganiserId();
  const tournament = await findTournament(organiserId, id);
  if (!tournament) notFound();
  const registrations = await listActiveRegistrations(tournament.id);
  return { organiserId, tournament, view: buildWorkspaceView(tournament, registrations) };
}
