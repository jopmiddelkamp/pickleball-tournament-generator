/**
 * How many players one evening can confirm, from the courts alone: four on
 * court plus the resting spots the organiser allows. The default is one
 * resting spot per court, so everyone plays about four fifths of the rounds;
 * an evening can pick anywhere from none (everyone always plays) to two.
 * Registrations beyond the cap join the waiting list.
 */
export const PLAYERS_PER_COURT = 5;
export const MIN_PLAYERS_PER_COURT = 4;
export const MAX_PLAYERS_PER_COURT = 6;

export function maxPlayersFor(courts: number, playersPerCourt: number = PLAYERS_PER_COURT): number {
  const spots = Math.min(MAX_PLAYERS_PER_COURT, Math.max(MIN_PLAYERS_PER_COURT, Math.trunc(playersPerCourt)));
  return spots * Math.max(0, Math.trunc(courts));
}
