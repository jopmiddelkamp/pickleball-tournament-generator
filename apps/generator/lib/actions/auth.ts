"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../supabase/server";

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/organiser/login");
}
