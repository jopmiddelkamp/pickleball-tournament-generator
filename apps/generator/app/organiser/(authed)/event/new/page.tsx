import { cookies } from "next/headers";
import { NewTournamentForm } from "../../../../../components/NewTournamentForm";
import { readEventDefaults } from "../../../../../lib/eventDefaults";

export default async function NewTournamentPage() {
  const defaults = readEventDefaults(await cookies());
  return <NewTournamentForm defaults={defaults} />;
}
