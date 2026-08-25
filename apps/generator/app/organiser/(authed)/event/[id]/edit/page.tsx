import { redirect } from "next/navigation";
import { EditEventForm } from "../../../../../../components/EditEventForm";
import { loadOwnedWorkspace } from "../../../../../../lib/workspace";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { view } = await loadOwnedWorkspace(id);
  // A started event is not edited any more.
  if (view.status === "generated" || view.status === "live" || view.status === "finished") redirect(`/organiser/event/${id}`);
  return <EditEventForm view={view} registered={view.confirmed.length + view.waiting.length} />;
}
