# Engineering standards

## Quality bar

Everything that lands is production-grade: clean structure, real error handling, no debug leftovers or hardcoded test values in real code paths. Unfinished is fine — an incomplete feature lives behind a flag that is off, with TODOs marking what is left. Sloppy is not: `packages/core` is meant to be ported mechanically to other languages, and rough edges multiply with every port.

## Reuse

- Mechanisms (registries, error handling, theme constants, test helpers): when a pattern has a reasonable chance of recurring, build the seam the first time and make the current task its first consumer. The second consumer should be a registration, not a copy. The algorithm registry is the model.
- Domain logic: extract when two places share *knowledge* — the same rule, changing for the same reason — and the extraction has a clean name without "and"/"or", no boolean mode flags, and both callers would change together. Shape similarity alone is never a reason to extract, at any count, and one-liners are never worth the indirection. When unsure whether it is knowledge or coincidence, leave the duplication until a change request makes it clear. The "Rule of Three" is deliberately not used here; the criterion is knowledge, never a count.
- Rosters are 8–24 players and evenings are a handful of rounds. Prefer clear code over micro-optimisation; the bench runs thousands of schedules and that is still cheap.

## Skills in this repo

Each skill's description says when it applies. In short:

- `superpowers:test-driven-development` for features and bugfixes; `superpowers:systematic-debugging` when something fails unexpectedly.
- `decision-matrix` when choosing between implementation approaches with real trade-offs.
- `owasp` when app code parses input (import, localStorage, URL state), writes files others open (CSV/JSON, print), or touches headers, dependencies, CI or deploy config.
- `dry-principles`, `kiss-principles`, `solid-principles` are the reference material behind the reuse rules above. Their examples are in Dart from an earlier project; the principles transfer.
