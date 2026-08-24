import { PrintSheet } from "../../../../../../components/PrintSheet";
import { loadOwnedWorkspace } from "../../../../../../lib/workspace";

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tournament, view } = await loadOwnedWorkspace(id);
  return <PrintSheet view={view} backHref={`/organiser/event/${tournament.id}`} />;
}
