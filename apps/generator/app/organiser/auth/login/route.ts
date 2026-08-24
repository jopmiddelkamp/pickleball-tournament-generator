import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

/**
 * Starts the Google sign-in. A GET route rather than a Server Action because
 * the CSP's `form-action 'self'` would block a form submission from being
 * redirected to accounts.google.com; a plain link navigation is exempt.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin = request.nextUrl.origin;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/organiser/auth/callback` },
  });
  if (error || !data.url) return NextResponse.redirect(`${origin}/organiser/login?error=oauth`);
  return NextResponse.redirect(data.url);
}
