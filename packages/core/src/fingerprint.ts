/**
 * Stable fingerprint of a schedule. Used by the determinism tests and by the
 * apps to tell two generated schedules apart.
 *
 * FNV-1a over a canonical rendering: 32-bit integer maths only, so the same
 * schedule hashes to the same value in every language this package is ported to.
 */
import type { Round } from "./types.js";

export function canonicalScheduleText(rounds: readonly Round[]): string {
  return rounds
    .map((round) => {
      const matches = round.matches
        .map((m) => `${m.court}:${m.teamA.join("+")}v${m.teamB.join("+")}`)
        .join(",");
      return `${matches}|rest=${round.resting.join(",")}`;
    })
    .join(";");
}

export function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function scheduleFingerprint(rounds: readonly Round[]): string {
  return fnv1a(canonicalScheduleText(rounds));
}
