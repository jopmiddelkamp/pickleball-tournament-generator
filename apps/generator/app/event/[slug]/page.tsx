import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { PublicTournament } from "../../../components/PublicTournament";
import { findActiveRegistrationByToken, listActiveRegistrations } from "../../../lib/db/registrations";
import { findTournamentBySlug } from "../../../lib/db/tournaments";
import { readParticipantToken } from "../../../lib/participant";
import { buildPublicView } from "../../../lib/public";

export default async function PublicTournamentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tournament = await findTournamentBySlug(slug);
  if (!tournament) notFound();

  const registrations = await listActiveRegistrations(tournament.id);
  const token = readParticipantToken(await cookies());
  const registration = token ? await findActiveRegistrationByToken(tournament.id, token) : null;

  return <PublicTournament view={buildPublicView(tournament, registrations, registration?.id ?? null)} />;
}
