/** The round clock as a pure function of wall time, so the UI only has to tick. */

export interface ClockState {
  remainingMs: number;
  expired: boolean;
}

/** null while no clock is running. */
export function clockState(startedAt: string | null, minutes: number, nowMs: number): ClockState | null {
  if (startedAt === null) return null;
  const endsAt = Date.parse(startedAt) + minutes * 60_000;
  const remainingMs = Math.max(0, endsAt - nowMs);
  return { remainingMs, expired: remainingMs === 0 };
}

/** m:ss, rounding up so the display reads 0:00 only at the bell itself. */
export function formatClock(remainingMs: number): string {
  const seconds = Math.ceil(remainingMs / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
