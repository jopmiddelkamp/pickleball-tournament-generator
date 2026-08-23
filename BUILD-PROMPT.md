# BUILD PROMPT — Mixed Doubles Tournament Platform

Paste this into Claude Code at the root of the repo. The files `docs/SPEC-1-night-points.md` and `docs/SPEC-2-algorithm-score.md` must be in the repo before you start.

Source-of-truth order: SPEC files > this prompt > your own judgment. If you must deviate from a SPEC, stop and ask first.

## Goal

One TypeScript monorepo containing:

1. `packages/core` — all scheduling algorithms and both scoring systems. Pure TypeScript, zero runtime dependencies, framework-free, fully deterministic via seeded RNG. This package is the single source of truth. It must stay portable (future ports to Dart or C# should be mechanical).
2. `apps/generator` — Next.js app for running a real tournament evening. Single brand, mobile-first.
3. `apps/bench` — Next.js app (internal) to benchmark algorithms against each other using SPEC-2.

Both apps import everything algorithmic from `packages/core`. Apps never reimplement algorithm or scoring logic. Adding a new algorithm = one new file in core + one registry entry; both apps must pick it up with zero further changes.

## Repo layout

```
.
├── docs/
│   ├── SPEC-1-night-points.md
│   └── SPEC-2-algorithm-score.md
├── packages/
│   └── core/
│       └── src/
│           ├── types.ts
│           ├── rng.ts              # mulberry32 seeded RNG
│           ├── tracker.ts          # partner/opponent/bye/sg history
│           ├── feasibility.ts      # Rule 0 quantities from SPEC-2 §2
│           ├── algorithms/
│           │   ├── registry.ts
│           │   ├── random.ts
│           │   ├── circle.ts
│           │   ├── latin.ts
│           │   └── greedy.ts
│           ├── scoring/
│           │   ├── algorithmScore.ts   # SPEC-2
│           │   └── nightPoints.ts      # SPEC-1
│           └── scenarios.ts        # roster generator for the bench
├── apps/
│   ├── generator/
│   └── bench/
├── turbo.json
└── pnpm-workspace.yaml
```

Tooling: pnpm workspaces, Turborepo, TypeScript strict, Vitest, ESLint, GitHub Actions CI (typecheck + lint + test).

## Core contracts (do not change without asking)

```ts
type Gender = "M" | "F";
// Registration tiers: 1 beginner, 2 beginner+, 3 intermediate,
// 4 intermediate+, 5 advanced, 6 advanced+
type Level = 1 | 2 | 3 | 4 | 5 | 6;

interface Player { id: string; name: string; gender: Gender; level: Level; }
function band(level: Level): 0 | 1 | 2; // {1,2}->0  {3,4}->1  {5,6}->2

interface TournamentConfig { courts: number; rounds: number; restSlots: number; seed: number; }

type Team = [string, string];
interface Match { court: number; teamA: Team; teamB: Team; }
interface Round { matches: Match[]; resting: string[]; }
interface Schedule { algorithmId: string; seed: number; rounds: Round[]; }

interface SchedulingAlgorithm {
  id: string;
  name: string;
  description: string;
  stochastic: boolean;
  generate(players: Player[], config: TournamentConfig, rng: () => number): Round[];
}
```

Determinism rule: same players + config + seed must produce an identical schedule. Add a hash test for this.

## The four algorithms to implement

Rest selection everywhere: the players who have rested least, rest next (equalizes over the event). Capacity per round: `Pplay = 4 * floor(min(N - restSlots, 4 * courts) / 4)`.

1. `random` — baseline. Shuffle playing players, pair sequentially into teams and matches.
2. `circle` — whist wheel. Fixed first seat, rotate the rest each round; opposite seats pair. Rest slots and odd counts become ghost seats in the wheel (ghost partner = that player rests). Consecutive pairs meet, with a rotation offset per round for opponent variety.
3. `latin` — mixed rotation. Playing men and women; man i partners woman (i + r) mod n. The majority gender rotates through the mixed core so surplus duty is shared. Surplus same-gender players pair lowest level with highest level.
4. `greedy` — weighted matching, the flagship. Two stages per round:
   - Partner stage. Edge weight between players a, b:
     mixed gender: +100. Same gender: +40 − 8·(sgCount(a) + sgCount(b)) + 9·bandDistance(a, b).
     Always: −30·timesPartnered(a, b); −1000 if timesPartnered ≥ 2 (Law L2 guard); + small seeded jitter.
     Greedy pick by weight, then 2-opt improvement swaps.
   - Match stage. Team-vs-team weight: 60 − 6·|sumLevelA − sumLevelB| − 20·Σ timesOpposed(cross pairs) − 500 if any cross pair already met in BOTH of the previous two rounds (Law L3 guard) + jitter. Greedy pick.

Constants above are calibrated for the 1–6 level scale. Keep them as named constants in one file.

## Scoring modules

- `scoring/algorithmScore.ts`: implement SPEC-2 exactly — feasibility quantities, components C1–C9 with the given weights, drop-and-renormalize rule, the three laws (including max consecutive same-opponent streak detection), cap at 60, and the diagnostics list from SPEC-2 §6. Return `{ final, points, components, laws, diagnostics }`.
- `scoring/nightPoints.ts`: implement SPEC-1 exactly — per-game personal points, bye bonus (round mean, rounded half up), +2 same-gender token, void-game handling, standings with shared ranks.

Required tests (Vitest):
- SPEC-2 §7 worked example passes to the decimal.
- A schedule containing one 3rd-time partnership → final ≤ 60, L2 = fail.
- A schedule with the same opponent 3 consecutive rounds → L3 = fail.
- Determinism hash test per algorithm.
- Feasibility anti-cheat: benching all women does not raise the mixed score.

## apps/generator (player-facing)

Must:
- Roster entry: name, gender toggle, level picker with the six named tiers.
- Settings: courts (1–6), rounds, rest slots. Seed visible with a reroll button.
- Algorithm select fed from the core registry (default: greedy). Show name + description.
- Generate → schedule view: rounds, court cards, resting line, same-gender badge showing bands (for example "same gender · low+high").
- Persistence in localStorage (this is a normal web app; localStorage is fine here).
- Mobile-first layout: this is used court-side on phones. Also a print-friendly view.

Should (feature-flagged is fine):
- Score entry per game and a live standings tab per SPEC-1.
- Manual swap of two players in a generated round, with the schedule re-scored live via core.

Theming: all colors and typography constants in one `theme.ts` file. Single brand. Suggested palette: court green #2C6B4F, dark #20503B, paper #F3F4EE, accent #DCE64A, blue #2B5FA8 for men, plum #A64A78 for women. No tenant machinery, no runtime theming.

## apps/bench (internal)

- Scenario generation from `core/scenarios.ts`: sizes {8, 12, 16, 20, 24} × gender ratios {equal, +1, +2, 2:1} × level shapes {uniform, clustered mid, bimodal low/high} → about 100 seeded scenarios.
- Paired runs: every algorithm runs on the same scenario with the same seed index. Stochastic algorithms average over N trials (default 10, configurable).
- Report per algorithm: mean final score, law-failure count per law, per-component means, win rate against each other algorithm, delta versus greedy. Drill-down per scenario family. Export JSON and CSV.
- Everything re-runnable and deterministic from a base seed.

## Working style

Build in phases, small commits, simplest first:
- Phase 0: scaffold monorepo, CI, empty packages.
- Phase 1: core types, rng, tracker, feasibility, `circle`, `algorithmScore`, all tests green.
- Phase 2: remaining algorithms (`random`, `latin`, `greedy`) + their tests.
- Phase 3: apps/bench.
- Phase 4: apps/generator (Must scope first, then Should behind flags).
- Phase 5: deployment.

Stop and ask when: a SPEC is ambiguous, a SPEC conflicts with this prompt, or a constant seems wrong in practice. Do not silently "fix" specs.

## Phase 5 — deployment via Vercel MCP

Use the connected Vercel MCP server tools to:
1. Create two Vercel projects from this repo: root directory `apps/generator` and root directory `apps/bench`, framework Next.js.
2. Deploy both.
3. Enable Vercel deployment protection on the bench project (internal tool).
If Vercel MCP tools are not available in the session, fall back to the `vercel` CLI and say so.

## Definition of done

1. `pnpm test` green, including the SPEC-2 worked example and all law tests.
2. Bench runs 100 scenarios and shows greedy beating random and circle on final score, with law-failure counts visible.
3. Generator produces a schedule on a phone screen in under 30 seconds of user effort, and survives a page refresh.
4. Both apps deployed on Vercel; bench protected.
5. README with: repo layout, how to add an algorithm (one file + registry entry), how to run the bench, link to both specs.
