# Pickleball tournament generator

<!-- Maintainer note (stripped before Claude sees this file). Written the way Anthropic recommends for
Claude 5-generation models: context and reasons instead of emphatic rules, gotchas instead of things the
model can derive from the code, no "verify/double-check" scaffolding, scoped delegation. Sources:
https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5
https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models
https://code.claude.com/docs/en/memory -->

Schedules rotating-partner, mixed-gender pickleball doubles evenings at a club. A roster with self-reported levels goes in, a round-by-round schedule comes out, and two scoring systems judge it: night points for the players (SPEC-1) and an algorithm score for benchmarking schedulers against each other (SPEC-2).

TypeScript monorepo (pnpm workspaces, Turborepo, TypeScript strict, Vitest):

- `packages/core` — every algorithm and both scoring systems. Pure, framework-free, zero runtime dependencies, deterministic from a seed, written so a port to Dart or C# stays mechanical.
- `apps/generator` — Next.js app used court-side on phones during a real evening. Single brand. Organisers log in (Supabase Auth); tournaments and registrations live in Supabase Postgres behind Drizzle, reached only from server code. Players register themselves through a public `/event/<slug>` link, remembered by a cookie, no account; once the organiser starts rounds they see their own court, partner and opponents for the current round live, plus standings and the final scoreboard. Local development runs the stack in Docker via the Supabase CLI (`pnpm db:start`, `pnpm db:reset`).
- `apps/bench` — internal Next.js app that runs every algorithm over ~100 seeded scenarios and reports SPEC-2 scores.

Apps import all algorithm and scoring logic from core and never reimplement it. A new algorithm is one file in `packages/core/src/algorithms/` plus one registry entry; both apps pick it up without further changes. Conventions for core live in `.claude/rules/core-package.md`; it loads when you read core files, so read it yourself when creating core from scratch.

The generator's visual language is a Material 3 -shaped token system: `apps/generator/lib/theme.ts` holds every colour role, type style, shape, elevation and duration and emits them as CSS custom properties, and `app/globals.css` is written entirely in those. Nothing in the UI carries a raw hex, type size or shadow. `.claude/rules/design-system.md` loads when you read generator UI files; `docs/DESIGN-SYSTEM.md` has the tables and the reasoning, and `/design` renders a live specimen of every token.

## Source of truth

`docs/SPEC-1-night-points.md` and `docs/SPEC-2-algorithm-score.md` beat `BUILD-PROMPT.md`, which beats your own judgment. The specs are frozen while algorithms are tuned — if the judge changes during tuning, the benchmark numbers stop meaning anything — and a hook blocks edits to them, so a spec change is something you describe to the user. When a spec is ambiguous, conflicts with the build prompt, or a constant looks wrong in practice, stop and ask rather than quietly working around it. The same applies to the core contracts in `BUILD-PROMPT.md` (`Player`, `TournamentConfig`, `Schedule`, `SchedulingAlgorithm`).

`BUILD-PROMPT.md` holds the full build plan: algorithms and their weights, app scope, phases, definition of done. Read it before starting a phase.

## Commands

`pnpm test`, `pnpm typecheck`, `pnpm lint` at the root; CI runs the same three. Production is a manual Vercel CLI upload, not a Git integration — pushing to `master` deploys nothing; the `deploy-vercel` skill has the procedure.

## Easy to get wrong

- Determinism: same players + config + seed gives an identical schedule. The apps show the seed and offer a reroll precisely because of this, so every path into core carries the seed through.
- Never store derived values. Standings and bonuses are computed from games and rounds (SPEC-1 §6); persist only the source data.
- The night screen is for fun: no "worst player", no lowest-score highlights, no skill tiers next to names (SPEC-1 §5).
- Levels are self-reported and can be a full tier off, so judgment logic works on bands (low/mid/high), not raw levels.
- Confirmed vs waiting is derived from `registered_at` order beyond `maxPlayersFor(maxCourts)` (5 per court, from core; `lib/registrations.ts`), never stored.
- Every Server Action re-checks the organiser owns the tournament; a stranger gets 404.

## How to work here

Deliver what was asked at the scope intended; make routine calls yourself and check in only when different readings of the request would lead to materially different work. Prefer the simplest change that fully does the job and touches only what it needs to. For algorithm and scoring work, write the spec's worked examples and law cases as Vitest tests first; they are the clearest statement of intent we have. Build in small commits in the phase order from `BUILD-PROMPT.md`. Delegate to subagents only for sizeable independent work such as a wide investigation, not for things a few tool calls finish or to double-check your own output.
