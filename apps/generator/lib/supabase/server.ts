import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "../env";

/**
 * Auth-only client. Data never goes through Supabase's API (see lib/db);
 * this exists so Server Actions and server components can read the organiser
 * session from its cookies.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called during a server component render, where cookies are read-only.
          // proxy.ts refreshes sessions, so nothing is lost.
        }
      },
    },
    // No createBrowserClient exists in this app, so the browser never needs
    // to read these cookies; keep them server-only and off plain HTTP.
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" },
  });
}
