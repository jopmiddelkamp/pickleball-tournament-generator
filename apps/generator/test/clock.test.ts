import { describe, expect, it } from "vitest";
import { clockState, formatClock } from "../lib/clock";

const startedAt = "2026-08-25T19:00:00.000Z";

describe("clockState", () => {
  it("counts down from the full limit at the moment it starts", () => {
    expect(clockState(startedAt, 15, Date.parse(startedAt))).toEqual({ remainingMs: 15 * 60_000, expired: false });
  });
  it("is expired at the bell and never goes negative", () => {
    expect(clockState(startedAt, 15, Date.parse(startedAt) + 15 * 60_000)).toEqual({ remainingMs: 0, expired: true });
    expect(clockState(startedAt, 15, Date.parse(startedAt) + 20 * 60_000)).toEqual({ remainingMs: 0, expired: true });
  });
  it("is idle without a start", () => {
    expect(clockState(null, 15, Date.parse(startedAt))).toBeNull();
  });
});

describe("formatClock", () => {
  it("renders minutes and zero-padded seconds, rounding up so 0:00 means the bell", () => {
    expect(formatClock(15 * 60_000)).toBe("15:00");
    expect(formatClock(9 * 60_000 + 5_000)).toBe("9:05");
    expect(formatClock(400)).toBe("0:01");
    expect(formatClock(0)).toBe("0:00");
  });
});
