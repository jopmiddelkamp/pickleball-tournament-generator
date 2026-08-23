import { redirect } from "next/navigation";
import { AuthForm } from "../../../components/AuthForm";
import { loginAction } from "../../../lib/actions/auth";
import { currentOrganiserId } from "../../../lib/auth";

export default async function LoginPage() {
  if (await currentOrganiserId()) redirect("/organiser");
  return <AuthForm mode="login" action={loginAction} />;
}
