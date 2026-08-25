/**
 * Feature flags. Everything here is finished and on; the switches exist so a
 * screen can be taken out of an evening without a code change.
 */
export const features = {
  /** Score entry per game and the SPEC-1 standings tab. */
  scoreEntry: true,
} as const;
