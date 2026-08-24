import { TournamentWorkspace } from "../../../../../components/TournamentWorkspace";
import { loadOwnedWorkspace } from "../../../../../lib/workspace";

export default async function TournamentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ demoted?: string }>;
}) {
  const { id } = await params;
  const { demoted } = await searchParams;
  const { view } = await loadOwnedWorkspace(id);
  const initialDemoted = /^\d+$/.test(demoted ?? "") ? Number(demoted) : 0;
  return <TournamentWorkspace view={view} initialDemoted={initialDemoted} />;
}
