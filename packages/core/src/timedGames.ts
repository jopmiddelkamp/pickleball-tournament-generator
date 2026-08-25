/**
 * Timed rounds. When a round has a clock, a game that is still going at the
 * bell is scored as if it had been played out: the leader is lifted to the
 * target and the trailer gets the same lift, so the margin stands. Without
 * this, "the points your team made" (SPEC-1) would punish everyone on a slow
 * court and drag the bye average down with them. The recorded score stays as
 * it was told to the organiser; this is applied on the way into scoring.
 */
import type { GameResult } from "./scoring/nightPoints.js";

/** A finished game (either side at or past the target) comes back unchanged. */
export function roundUpToTarget(pointsA: number, pointsB: number, target: number): [number, number] {
  if (pointsA >= target || pointsB >= target) return [pointsA, pointsB];
  const lift = target - Math.max(pointsA, pointsB);
  return [pointsA + lift, pointsB + lift];
}

/**
 * Rounds up every non-voided game in a closed round (index below
 * `closedRounds`); the round on court and anything later is left as entered.
 */
export function settleTimedGames(games: readonly GameResult[], closedRounds: number, target: number): GameResult[] {
  return games.map((game) => {
    if (game.voided || game.round >= closedRounds) return game;
    const [pointsA, pointsB] = roundUpToTarget(game.pointsA, game.pointsB, target);
    return { ...game, pointsA, pointsB };
  });
}
