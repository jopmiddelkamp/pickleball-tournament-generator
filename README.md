# Pickleball tournament generator

Schedules rotating-partner, mixed-gender pickleball doubles evenings at a club. A roster with
self-reported levels goes in, a round-by-round schedule comes out, and two scoring systems judge it:
night points for the players and an algorithm score for benchmarking schedulers against each other.

- [SPEC-1 — Night points](docs/SPEC-1-night-points.md): what players see during the evening. Fun
  only; it never judges anyone.
- [SPEC-2 — Algorithm score](docs/SPEC-2-algorithm-score.md): how a generated schedule is judged on
  paper, before anyone plays. Internal only.

The specs beat [BUILD-PROMPT.md](BUILD-PROMPT.md), which beats anyone's judgment. They are frozen
while algorithms are tuned: if the judge changes mid-cycle the benchmark numbers stop meaning
anything.

## Repo layout

```
packages/core       every algorithm and both scoring systems
packages/bench      the benchmark runner, as a CLI
apps/generator      the Next.js app used court-side on a phone
docs/               SPEC-1 and SPEC-2
```

`packages/core` is the single source of truth: pure TypeScript, zero runtime dependencies, no
framework imports, fully deterministic from a seed. It is written so a port to Dart or C# stays
mechanical. Everything else imports from it and nothing reimplements it.

## Commands

```sh
pnpm install
pnpm test        # vitest across the workspace
pnpm typecheck
pnpm lint
pnpm bench       # benchmark every algorithm over the scenario set
pnpm dev         # run the generator app
```

CI runs typecheck, lint and test on every push and pull request.

## Run it locally

The generator needs Postgres and Supabase Auth. Both run in Docker through the Supabase CLI.

Prerequisites: Docker Desktop, `brew install supabase/tap/supabase`.

```bash
pnpm install
pnpm db:start      # Postgres, Auth, Studio, Mailpit in Docker
pnpm db:env        # writes apps/generator/.env.local for the local stack
pnpm db:reset      # recreate the database, apply migrations, load dev data
pnpm dev           # http://localhost:3000
```

Dev login: `dev@example.com` / `password`. `pnpm db:studio` prints the Studio URL; `pnpm db:reset` is the one command to get back to a known state. Nothing on a laptop points at the cloud database unless you run `pnpm db:migrate:cloud` (see "Deploy").

## The generator app

`apps/generator` is what an organiser uses standing on a court. Enter the roster, pick courts,
rounds and rest slots, generate, and the evening is on screen as court cards. Scores go in per game
and the standings follow SPEC-1. Everything lives in `localStorage` on the device — there is no
backend and none is planned, and no roster data leaves the phone.

Two things to know:

- The seed is shown and can be rerolled. Same players + same settings + same seed always produce the
  same schedule.
- Levels appear on the roster screen only. During the evening nobody sees a tier next to a name
  (SPEC-1 §5).

## The benchmark

`pnpm bench` runs every algorithm over 120 seeded scenarios — 5 roster sizes × 4 gender ratios ×
3 level shapes × 2 court settings — scores each schedule with SPEC-2 and prints the comparison.
Runs are paired: every algorithm sees the same roster and the same seed, so a difference is the
algorithm and nothing else. Stochastic algorithms are averaged over 10 trials by default.

```sh
pnpm bench                                      # the standard report
pnpm bench --trials=20 --seed=7                 # a different scenario set
pnpm bench --json=out/bench.json --csv=out/bench.csv
pnpm bench --algorithms=greedy,circle
pnpm bench --help
```

Where the numbers currently land:

| algorithm | mean final | L1 fails | L2 fails | L3 fails |
| --------- | ---------- | -------- | -------- | -------- |
| greedy    | 82.7       | 0        | 0        | 18.7     |
| latin     | 60.3       | 0        | 45       | 102      |
| circle    | 57.9       | 106      | 21       | 103      |
| random    | 57.7       | 111      | 63       | 64       |

Greedy's remaining L3 failures are the cases where L1 and L3 genuinely conflict — with, say, six men
and two women on one court, both women have to play every round to use the available mixed teams,
and two women split across two teams face each other every round. They land on the small rosters and
they hit every algorithm equally.

## Adding an algorithm

One file plus one registry entry. Both the app and the bench pick it up with no further changes.

1. Write `packages/core/src/algorithms/yours.ts`, exporting a `SchedulingAlgorithm`. Use
   `planRounds` from `../roundBuilder.js` so you inherit capacity, the shared rest rule and history
   bookkeeping, and only decide how the playing players become matches.
2. Add it to `ALGORITHMS` in `packages/core/src/algorithms/registry.ts`.
3. Add its determinism hash to `packages/core/test/algorithms.test.ts`.

```ts
export const yoursAlgorithm: SchedulingAlgorithm = {
  id: "yours",
  name: "Yours",
  description: "One sentence an organiser can read in the app.",
  stochastic: false, // true if the output varies with the seed

  generate(players, config, rng) {
    return planRounds(players, config, {
      order: () => players,
      makeMatches: (plan) => /* plan.playing -> Match[] */,
    });
  },
};
```

All randomness must come from the `rng` argument. Nothing in core may read the clock or call
`Math.random`; a lint rule and the determinism tests both enforce it.

## Deployment

The generator deploys to Vercel from `apps/generator` with the Next.js preset and the repo root as
the build root, so the workspace resolves. Install command `pnpm install --frozen-lockfile`, build
command `pnpm --filter @ptg/generator build`.

The benchmark is a CLI, not a deployed app: it runs locally and in CI, and there is nothing internal
exposed on the web.
