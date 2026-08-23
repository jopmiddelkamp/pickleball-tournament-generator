/**
 * Courts and rest slots for a head count: fill as many courts as the venue has
 * and the roster can staff, everyone left over rests. The organiser can still
 * override both (BUILD-PROMPT "Settings"); this is only the default.
 */
export interface ConfigSuggestion {
  courts: number;
  restSlots: number;
}

export function suggestConfig(playerCount: number, maxCourts: number): ConfigSuggestion {
  const players = Math.max(0, Math.trunc(playerCount));
  const venue = Math.max(0, Math.trunc(maxCourts));
  const courts = Math.min(venue, Math.floor(players / 4));
  return { courts, restSlots: players - 4 * courts };
}
