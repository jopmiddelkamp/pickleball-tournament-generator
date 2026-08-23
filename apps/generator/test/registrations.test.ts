import { describe, expect, it } from "vitest";
import { partitionRegistrations, type ActiveRegistration } from "../lib/registrations";

function reg(id: string, minute: number): ActiveRegistration {
  return { id, name: id, gender: "F", level: 3, registeredAt: new Date(Date.UTC(2026, 8, 1, 18, minute)) };
}

describe("partitionRegistrations", () => {
  it("confirms the first maxPlayers by registration time, the rest wait in order", () => {
    const { confirmed, waiting } = partitionRegistrations([reg("c", 3), reg("a", 1), reg("b", 2)], 2);
    expect(confirmed.map((r) => r.id)).toEqual(["a", "b"]);
    expect(waiting.map((r) => r.id)).toEqual(["c"]);
  });
  it("promotes the next in line when a confirmed player is gone", () => {
    const before = partitionRegistrations([reg("a", 1), reg("b", 2), reg("c", 3)], 2);
    const after = partitionRegistrations([reg("b", 2), reg("c", 3)], 2);
    expect(before.waiting.map((r) => r.id)).toEqual(["c"]);
    expect(after.confirmed.map((r) => r.id)).toEqual(["b", "c"]);
    expect(after.waiting).toEqual([]);
  });
  it("breaks equal timestamps by id so the order is stable", () => {
    const { confirmed } = partitionRegistrations([reg("b", 1), reg("a", 1)], 1);
    expect(confirmed[0]?.id).toBe("a");
  });
  it("handles an empty list and a zero cap", () => {
    expect(partitionRegistrations([], 4)).toEqual({ confirmed: [], waiting: [] });
    expect(partitionRegistrations([reg("a", 1)], 0).waiting.map((r) => r.id)).toEqual(["a"]);
  });
});
