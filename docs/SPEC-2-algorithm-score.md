# SPEC 2 — Algorithm Score (Rule Set 2), v3.1a

Judges one generated schedule on paper, before anyone plays. Internal only; players never see this. Used to benchmark scheduling algorithms against each other.

Scope: rotating-partner, mixed-gender doubles round robin. One schedule in, one score out (0–100).
Source-of-truth order: this file > BUILD-PROMPT.md > code comments.
Status: FROZEN during algorithm tuning cycles. Revise only between cycles, with a written reason (Goodhart rule).

## 1. Inputs

- Roster: N players; gender M or F; skill = registration level mapped to 1–6:
  beginner = 1, beginner+ = 2, intermediate = 3, intermediate+ = 4, advanced = 5, advanced+ = 6.
- Bands: low = {1, 2}, mid = {3, 4}, high = {5, 6}. Band values 0, 1, 2.
- Levels are self-reported at registration. Expect miscalibration up to a full tier. Judgment logic therefore uses bands; future rating corrections move max 1 tier per session.
- Config: courts K, rounds Rd, rest slots Rest.
- Schedule: per round, matches (2 vs 2 by player id) and resting ids.

## 2. Feasibility (Rule 0)

All targets come from roster + config, never from the algorithm's own choices. This blocks gaming: benching all women does not shrink the mixed target.

- Pplay = 4 · floor( min(N − Rest, 4K) / 4 );  T = Pplay / 2 teams per round
- feasMixed = min(M, W, T);  FM = Rd · feasMixed;  forcedSG = T − feasMixed;  FSG = Rd · forcedSG
- B = Rd · (N − Pplay);  s* = 0 if B mod N = 0, else 1
- SG player-slots = 2·FSG, carried by the majority gender (size maj);  bs = 0 if (2·FSG) mod maj = 0, else 1
- TT = total team slots in the schedule

## 3. The Laws

Breaking a law caps the final score: final = min(points, 60). A fail grade. Each law is waived only when mathematically unavoidable for that roster and config; at club sizes (N ≥ 8) none is unavoidable.

| Law | Rule | Waiver |
|---|---|---|
| L1 | No wasted possible mixed teams: mixed share ≥ 90% of min(FM, slots until full M×F coverage). After every man has partnered every woman, fresh same-gender teams are allowed and not counted as waste | Single-gender roster |
| L2 | No pair partners a 3rd time | Only if a player must play more than 2·(N−1) games. Practically never |
| L3 | No player faces the same opponent in 3 consecutive rounds | N < 8, where small-group repetition is forced |

L3 source: user experience. Facing the same much stronger player 3 rounds in a row, and the same much weaker player 3 times, both killed the fun.

## 4. The Points

Pillar split (locked): Fresh people 35, Mixed 30, Close games 25, Fair rest 10.

| # | Component | Weight | Formula (0–100, clamp) |
|---|-----------|--------|------------------------|
| C1 | Mixed share | 18 | 100 · mixedTeams / FM |
| C2 | M×F coverage | 12 | 100 · distinctMFPairs / min(M·W, FM) |
| C3 | Partner freshness | 18 | 100 · distinctPartnerships / min(TT, C(N,2)) |
| C4 | Partner repeat-cap points | 5 | 100 − 50 · (pairs partnered ≥ 3×) |
| C7 | Opponent freshness | 12 | mean over players of 100 · uniqueOpponents / min(2·games, N−1) |
| C5 | Close matches | 20 | 100 − 20 · mean abs(sumSkill A − sumSkill B), on the 1–6 scale |
| C6 | SG band mixing | 5 | 100 · mean(bandDistance over same-gender teams) / 2 |
| C8 | Bye fairness | 5 | 100 if byeSpread ≤ s*, else 100 − 40·(byeSpread − s*) |
| C9 | SG burden fairness | 5 | 100 if sgSpread ≤ bs, else 100 − 35·(sgSpread − bs); measured within the majority gender when FSG > 0 |

Definitions: mixedTeams = team slots with different genders. distinctMFPairs = distinct (man, woman) partnerships used. distinctPartnerships = distinct unordered pairs that partnered. byeSpread = max byes per player − min. sgSpread = same, for same-gender-team counts. bandDistance = abs(band A − band B).

## 5. Not-applicable rule

Components that cannot apply are DROPPED and the remaining weights renormalized. Never gift a free 100 (it biases cross-roster averages).
- Single-gender roster: drop C1, C2, C6.
- No same-gender teams occurred AND FSG = 0: drop C6.

## 6. Aggregation

points = Σ(weight · component) / Σ(active weights)
final = min(points, 60) if any law is broken, else points.
Grades: ≥ 90 excellent, 75–89 good, 60–74 weak, fail = law broken or < 60.

Always report next to the score: law pass/fail each, max partner repeat, max consecutive same-opponent streak, byeSpread, sgSpread, avg match gap, blowout share (gap ≥ 3 on the 1–6 scale).

## 7. Worked example (unit test, must pass)

7M / 5F, 3 courts, Rest 0, 7 rounds → Pplay 12, T 6, feasMixed 5, FM 35, coverage denominator min(35, 35) = 35, B 0 → s* 0, FSG 7 → 14 SG slots over 7 men → bs 0.
A schedule with 33 mixed teams: C1 = 100 · 33/35 = 94.3 → breaks L1 (two avoidable same-gender teams) → final capped at 60.
A schedule with 35 mixed teams and 35 distinct M–F pairs: C1 = 100, C2 = 100.

## 8. Known limitations (accepted)

- C5's true optimum depends on the skill distribution; it is not feasibility-normalized. The benchmark is paired (same roster for every algorithm), so the bias cancels in comparisons.
- C3's feasible maximum ignores the mixed-first interaction on very long events. Irrelevant at club sizes; revisit if Rd · T approaches M·W.
- Weights encode the user's locked priorities. Opinion by design.
- Goodhart rule: never tune algorithms and this spec in the same cycle.

## 9. Change log

- v3 → v3.1: added L3 (consecutive opponents); C7 5 → 12, C3 15 → 18; C4 10 → 5; C1 25 → 18, C2 15 → 12, C5 15 → 20 to honor the locked pillar split 35/30/25/10.
- v3.1 → v3.1a: skill scale replaced by the 6 registration tiers (1–6). C5 constant 12 → 20, blowout threshold 5 → 3. Bands now a clean 2-2-2 mapping.

Benchmark protocol (scenario families, paired seeds, reporting) lives in BUILD-PROMPT.md under apps/bench.
