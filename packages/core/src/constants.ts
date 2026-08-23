/**
 * Tuning constants for the scheduling algorithms, calibrated for the 1-6 level
 * scale. They live in one file so a tuning cycle is a one-place diff.
 *
 * SPEC-2's own weights are NOT here: those are spec-locked and stay in
 * scoring/algorithmScore.ts next to the components they belong to.
 */

/** Partner stage of `greedy` (BUILD-PROMPT "The four algorithms"). */
export const PARTNER = {
  /** a mixed team is worth far more than any same-gender team */
  mixedBonus: 100,
  /** baseline for a same-gender team */
  sameGenderBase: 40,
  /** ... minus this per same-gender team the two have already carried */
  sameGenderBurdenPenalty: 8,
  /** ... plus this per band of distance, so a forced pair is low+high */
  sameGenderBandBonus: 9,
  /** per previous partnership between the two */
  repeatPenalty: 30,
  /** hard guard for Law L2: never partner a third time */
  thirdTimeGuard: -1000,
  /** partnerships at or above this count trip the L2 guard */
  thirdTimeThreshold: 2,
  /** seeded tie-break noise, small next to the weights above */
  jitter: 1,
} as const;

/** Match stage of `greedy`. */
export const MATCH = {
  base: 60,
  /** per point of combined-level difference between the two teams */
  levelGapPenalty: 6,
  /** per previous meeting, summed over the four cross pairs */
  repeatOpponentPenalty: 20,
  /** hard guard for Law L3: a cross pair that met in both previous rounds */
  consecutiveGuard: -500,
  jitter: 1,
} as const;

/** Number of improvement sweeps the partner stage runs before giving up. */
export const PARTNER_TWO_OPT_PASSES = 8;
