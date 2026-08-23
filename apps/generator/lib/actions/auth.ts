"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../supabase/server";
import { parseCredentials } from "../validate";
import type { AuthFormState } from "./authState";

export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const credentials = parseCredentials(formData);
  if (!credentials) return { error: "invalid", confirmEmail: false };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp(credentials);
  if (error) {
    return { error: error.code === "user_already_exists" ? "exists" : "failed", confirmEmail: false };
  }
  if (!data.session) return { error: null, confirmEmail: true };
  redirect("/organiser");
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const credentials = parseCredentials(formData);
  if (!credentials) return { error: "invalid", confirmEmail: false };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);
  if (error) return { error: "credentials", confirmEmail: false };
  redirect("/organiser");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/organiser/login");
}
