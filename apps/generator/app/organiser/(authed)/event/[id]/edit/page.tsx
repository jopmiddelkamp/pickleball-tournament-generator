import { EditEventForm } from "../../../../../../components/EditEventForm";
import { loadOwnedWorkspace } from "../../../../../../lib/workspace";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { view } = await loadOwnedWorkspace(id);
  const scheduleStored = view.status === "generated" || view.status === "live" || view.status === "finished";
  return (
    <EditEventForm
      view={view}
      registered={view.confirmed.length + view.waiting.length}
      frozen={scheduleStored}
    />
  );
}
