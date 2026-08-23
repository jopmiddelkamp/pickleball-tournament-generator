import { TournamentWorkspace } from "../../../../components/TournamentWorkspace";
import { loadOwnedWorkspace } from "../../../../lib/workspace";

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { view } = await loadOwnedWorkspace(id);
  return <TournamentWorkspace view={view} />;
}
