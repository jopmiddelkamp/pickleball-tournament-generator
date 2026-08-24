/**
 * How many players one evening can confirm, from the courts alone: four on
 * court and one resting per court, so everyone plays about four fifths of
 * the rounds. Registrations beyond this join the waiting list (design
 * amendment 2026-08-24). The constant is the only tuning knob.
 */
export const PLAYERS_PER_COURT = 5;

export function maxPlayersFor(courts: number): number {
  return PLAYERS_PER_COURT * Math.max(0, Math.trunc(courts));
}
