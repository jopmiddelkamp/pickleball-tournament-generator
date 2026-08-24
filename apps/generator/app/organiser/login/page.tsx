import { redirect } from "next/navigation";
import { LoginScreen } from "../../../components/LoginScreen";
import { currentOrganiserId } from "../../../lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await currentOrganiserId()) redirect("/organiser");
  const { error } = await searchParams;
  return <LoginScreen failed={error != null} />;
}
