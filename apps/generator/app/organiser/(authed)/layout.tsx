import { OrganiserHeader } from "../../../components/OrganiserHeader";
import { logoutAction } from "../../../lib/actions/auth";
import { requireOrganiserId } from "../../../lib/auth";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  await requireOrganiserId();
  return (
    <main className="app">
      <OrganiserHeader logoutAction={logoutAction} />
      <div className="app__main">{children}</div>
    </main>
  );
}
