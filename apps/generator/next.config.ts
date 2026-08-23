import type { NextConfig } from "next";

/**
 * Security headers. The browser only ever talks to this origin; Supabase and
 * Postgres are reached from server code, so everything is locked to `self`.
 * The script-src nonce is set per request in middleware.ts - this file only
 * carries the headers that are the same on every response.
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ptg/core"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
