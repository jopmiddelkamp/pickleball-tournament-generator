---
name: owasp
description: Security controls for this repo's actual surface — two client-side Next.js apps on Vercel with localStorage persistence, roster import, CSV/JSON export, a print view, and GitHub Actions CI. Use when adding or changing anything that parses input (roster import, URL/query state, localStorage reads), produces output others open (CSV/JSON export, print, shared links), touches next.config/security headers, adds a dependency or third-party script, or edits CI/deploy configuration. Not needed for pure algorithm or scoring work in packages/core.
---

# Security for a client-only web app

There is no backend, no accounts, and no server-side data. What remains is still worth getting right: the generator runs on an organiser's phone with real people's names in it, the bench exports files people open in spreadsheets, and both apps ship through a supply chain. ASVS 5.0 Level 1 is the bar; the items below are the ones that actually apply. `references/owasp.md` holds the concrete header values and sources.

## Personal data stays on the device

Rosters contain names, gender and a self-reported level. That is personal data under the GDPR even for a club evening, so the apps keep it local: no analytics, error trackers, or fonts fetched from third parties that would see page contents or URLs, and nothing from the roster in query strings or share links (they land in logs and browser history). If a share feature is ever wanted, share the schedule, not the roster, and say so in the UI.

## Treat stored and imported data as input

localStorage can be edited, corrupted, or written by an older version of the app. Parse it through the same schema (`zod` or a hand-written guard in core's types) that roster import uses; on failure, fall back to an empty state with a visible message rather than crashing or half-loading. Version the storage key so migrations are explicit. Bound sizes (players, rounds, name length) at the schema so a pasted file cannot hang the scheduler.

## Output that other programs open

- CSV export: prefix any cell starting with `=`, `+`, `-`, `@`, tab or CR with a single quote, and quote fields containing delimiters. A player named `=HYPERLINK(...)` must open as text in Excel.
- JSON export: serialise explicit fields, never spread whole state objects (keeps internal flags and future secrets out of files).
- Rendering: React's default escaping is the control. `dangerouslySetInnerHTML` needs a reviewer-visible reason; the print view is plain components, not injected HTML.

## Headers and delivery

Set the security headers from the reference on every response via `next.config` `headers()`: HSTS, a CSP without `unsafe-inline` scripts, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, a minimal `Permissions-Policy`. Self-host all scripts and fonts. The bench is internal: Vercel deployment protection stays on and its URL is not linked from the generator.

## Supply chain and CI

`pnpm-lock.yaml` is committed and installs run with `--frozen-lockfile` in CI. Dependency updates arrive as reviewed PRs (Renovate or Dependabot); `pnpm audit` runs in CI and blocks on known-exploited criticals. GitHub Actions are pinned to a commit SHA, run with `permissions: contents: read` unless a step needs more, and never echo secrets. Vercel credentials live only in Vercel/GitHub secrets, never in the repo; the client bundle contains no secrets at all because everything in it is public.

## Errors

Production builds show a generic message and keep details in the console; no stack traces or state dumps in the UI. An unexpected state in core (infeasible config, impossible pairing) is a typed result the apps render, not an exception that unmounts the page mid-evening.

## When a change knowingly deviates

Say so in the PR description with the reason. There is no risk register here; the PR is the record.
