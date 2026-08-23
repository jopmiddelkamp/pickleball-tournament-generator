---
paths:
  - "packages/core/**"
---

# packages/core

Core is the single source of truth for scheduling and scoring, and it has to stay portable to Dart and C#. That shapes the code:

- No runtime dependencies and no framework imports. Plain functions and data over class hierarchies; skip TypeScript-only constructs that do not translate (elaborate conditional types, decorators, prototype patching).
- All randomness comes from the `rng: () => number` argument (seeded mulberry32). Nothing else in core may vary between runs: no `Math.random`, no `Date`, no iteration order that depends on unsorted input. Each algorithm has a hash test that pins this down.
- Rest selection is shared by every algorithm: the players who have rested least rest next. Capacity per round is `Pplay = 4 * floor(min(N - restSlots, 4 * courts) / 4)`.
- Weights and constants (greedy edge weights, law guards, jitter) are calibrated for the 1–6 level scale. Keep them as named constants in one file so tuning is a one-place diff.
- Scoring modules implement SPEC-1 and SPEC-2 exactly and in the specs' own vocabulary (C1–C9, L1–L3, `feasMixed`, `FM`, `byeSpread`, …) so code can be checked against the spec line by line. Feasibility targets derive from roster and config only, never from the schedule, so an algorithm cannot lower its own bar by benching players. Components that cannot apply are dropped and the remaining weights renormalised; a free 100 would bias cross-roster averages.
- Tests that always exist: the SPEC-2 §7 worked example to the decimal, one test per law, a determinism hash test per algorithm, and the anti-cheat case (benching all women does not raise the mixed score). When you touch a formula, add the spec-derived case that proves it.
