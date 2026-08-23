import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

/** Verified against Supabase, not just the cookie: this is the check actions rely on. */
export async function currentOrganiserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function requireOrganiserId(): Promise<string> {
  const id = await currentOrganiserId();
  if (!id) redirect("/organiser/login");
  return id;
}
