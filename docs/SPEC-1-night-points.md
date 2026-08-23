# SPEC 1 — Night Points (Rule Set 1)

What players see during a real evening. Fun only. This system never judges anyone and never changes a skill rating.

Scope: rotating-partner, mixed-gender doubles round robin.
Source-of-truth order: this file > BUILD-PROMPT.md > code comments.
Status: v1.0. Frozen during build; change only with a written reason.

## 1. Base rule

- Every game is played to a fixed total of rally points. Default: 21. Configurable per event (11, 16, 21, or timed).
- A player's personal score for a game = the points their team scored. Example: game ends 21–14 → both winners +21, both losers +14.
- Standings for the evening = sum of personal points over all games and bonuses.
- Timed games: record the points as they stand at time; same rule applies.

## 2. Compensation bonuses

For players the schedule treated less well. Applied automatically after each round.

| Situation | Bonus | Rules |
|---|---|---|
| Resting this round (bye) | The mean of the personal points earned by all playing players this round, rounded half up | Computed after the round's games are entered. Resting never costs ranking position, and never beats playing |
| Playing in a same-gender team this round | +2 flat per such game | Applies to any same-gender team, forced or not. If the algorithm made an unforced same-gender team, the players still get the token; the algorithm is punished separately by Rule Set 2 |

## 3. Standings and ties

- Ranking: descending total points.
- Ties: shared rank. No tiebreaker games, no hidden criteria.
- Standings may later feed the Mexicano format (pairing by current standing). That is their only functional use.

## 4. Edge cases

- Abandoned game (injury, rain): the organizer either records the points as they stand, or marks the game void. Void games are excluded from bye-bonus averages.
- A player leaves mid-evening: their earned points stay in the list; they simply stop appearing in new rounds.
- First round has resting players like any other round; the bye bonus uses that same round's games, so it always has data.

## 5. Guardrails (product rules, not math)

- Never display "worst player", lowest-score highlights, or skill tiers next to names on the night screen.
- Optional fun prizes are encouraged: most different partners, closest game of the night.
- Compensation treats the symptom. Rule Set 2 (SPEC-2) removes the cause. If bonuses are frequent, the algorithm score should already be red.

## 6. Data model (minimum)

Per game: round number, court, teamA player ids, teamB player ids, pointsA, pointsB, voided flag.
Per round: resting player ids.
Everything else (standings, bonuses) is derived. Never store derived values as source data.

## 7. PARKED — night-outcome evaluation (do not build yet)

A third system, separate from both rule sets: judging whether a real evening succeeded, from real results.
Margin ratio r = |a − b| / (a + b). Targets: median r ≤ 0.20; blowouts (r > 0.35) ≤ 15% of games; every player with ≥ 3 games has ≥ 1 win; ≥ 80% of players end between 25–75% win share.
Needs score entry to exist first. Recorded here so it is not lost.
