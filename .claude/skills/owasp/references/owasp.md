# Concrete parameters and sources

Editions this skill is based on (verified 2026-07): OWASP Top 10 2025, ASVS 5.0.0 (Level 1 target for this repo), Proactive Controls 2024, Cheat Sheet Series (CSV Injection, Content Security Policy, HTTP Headers, Secrets Management, CI/CD Security).

## Security headers (every response, via `next.config` `headers()`)

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` — tighten `style-src` if Next.js's inline styles can be nonced in the chosen version |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `X-Frame-Options` | `DENY` (legacy browsers; CSP `frame-ancestors` is the control) |
| Remove | `X-Powered-By` (`poweredByHeader: false` in `next.config`) |

## CSV injection

Escape cells that start with `=`, `+`, `-`, `@`, `\t`, `\r` by prefixing `'`; wrap fields containing `,`, `"`, or newlines in double quotes and double any inner quotes. Apply to every string field, including player names and algorithm descriptions.

## Storage

One versioned key per app, e.g. `ptg:v1:state`. Parse on read with the shared schema; on parse failure keep the raw value under `ptg:v1:state.corrupt` for recovery and start empty. Cap roster at the maximum the scheduler supports and names at 64 characters.

## CI

- `pnpm install --frozen-lockfile`; `pnpm audit --audit-level=critical` as a blocking step.
- Actions pinned to full commit SHAs with a version comment; top-level `permissions: contents: read`.
- Branch protection on `master`: required CI, required review for changes under `.github/` and `packages/core/src/scoring/`.
