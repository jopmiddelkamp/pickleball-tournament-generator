import { redirect } from "next/navigation";
import { AuthForm } from "../../../components/AuthForm";
import { signUpAction } from "../../../lib/actions/auth";
import { currentOrganiserId } from "../../../lib/auth";

export default async function SignUpPage() {
  if (await currentOrganiserId()) redirect("/organiser");
  return <AuthForm mode="sign-up" action={signUpAction} />;
}
