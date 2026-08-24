import { maxPlayersFor } from "@ptg/core";
import { TournamentList, type TournamentSummary } from "../../../../components/TournamentList";
import { requireOrganiserId } from "../../../../lib/auth";
import { countActiveRegistrations } from "../../../../lib/db/registrations";
import { listTournaments } from "../../../../lib/db/tournaments";
import { tournamentStatus } from "../../../../lib/tournament";

export default async function OrganiserHome() {
  const organiserId = await requireOrganiserId();
  const rows = await listTournaments(organiserId);
  const summaries: TournamentSummary[] = await Promise.all(
    rows.map(async (t) => {
      const maxPlayers = maxPlayersFor(t.maxCourts, t.playersPerCourt);
      return {
        id: t.id,
        slug: t.slug,
        name: t.name,
        startsAt: t.startsAt.toISOString(),
        status: tournamentStatus(t),
        players: Math.min(maxPlayers, await countActiveRegistrations(t.id)),
        maxPlayers,
      };
    }),
  );
  return <TournamentList tournaments={summaries} />;
}
