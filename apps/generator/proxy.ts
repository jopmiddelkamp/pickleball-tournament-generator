import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "./lib/env";

/**
 * Two jobs per request:
 *
 * 1. CSP nonce (unchanged from before): Next inlines a hydration script on
 *    every page, so a policy without `unsafe-inline` needs a nonce that both
 *    the header and that script carry. The policy goes on the request headers
 *    as well; that is how Next learns the nonce.
 * 2. Organiser session: refresh Supabase's auth cookies if the access token
 *    expired, and bounce unauthenticated visitors off /organiser/*. This is an
 *    optimistic check only; every Server Action and page verifies again.
 */
const PUBLIC_ORGANISER_PATHS = new Set(["/organiser/login", "/organiser/auth/login", "/organiser/auth/callback"]);

function contentSecurityPolicy(nonce: string): string {
  const devEval = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${devEval}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request: { headers: requestHeaders } });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
    // No createBrowserClient exists in this app, so the browser never needs
    // to read these cookies; keep them server-only and off plain HTTP.
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" },
  });
  const { data } = await supabase.auth.getClaims();
  const signedIn = data?.claims != null;

  const path = request.nextUrl.pathname;
  if (path.startsWith("/organiser") && !PUBLIC_ORGANISER_PATHS.has(path) && !signedIn) {
    const login = request.nextUrl.clone();
    login.pathname = "/organiser/login";
    login.search = "";
    const redirectResponse = NextResponse.redirect(login);
    redirectResponse.headers.set("Content-Security-Policy", csp);
    return redirectResponse;
  }

  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|icon.svg).*)",
      missing: [{ type: "header", key: "next-router-prefetch" }],
    },
  ],
};
