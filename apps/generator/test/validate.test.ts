import { describe, expect, it } from "vitest";
import { parseGuestsForm, parsePlayerForm, parseTournamentForm } from "../lib/validate";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
}

describe("parseTournamentForm", () => {
  const valid = {
    name: "Friday mix",
    startsAt: "2026-09-04T19:30",
    tzOffset: "-120",
    maxCourts: "4",
  };
  it("parses a valid form and applies the browser's timezone offset", () => {
    const input = parseTournamentForm(form(valid));
    expect(input).not.toBeNull();
    expect(input?.name).toBe("Friday mix");
    // 19:30 at UTC+2 is 17:30Z
    expect(input?.startsAt.toISOString()).toBe("2026-09-04T17:30:00.000Z");
    expect(input).toMatchObject({ maxCourts: 4, playersPerCourt: 5 });
  });
  it("ignores extra fields the form still posts", () => {
    const input = parseTournamentForm(form({ ...valid, maxPlayers: "16", rounds: "6", gameTarget: "11" }));
    expect(input).toEqual({ name: "Friday mix", startsAt: new Date("2026-09-04T17:30:00.000Z"), maxCourts: 4, playersPerCourt: 5 });
  });
  it.each([
    ["empty name", { name: "  " }],
    ["overlong name", { name: "x".repeat(81) }],
    ["bad date", { startsAt: "yesterday" }],
    ["zero courts", { maxCourts: "0" }],
    ["seven courts", { maxCourts: "7" }],
  ])("rejects %s", (_label, patch) => {
    expect(parseTournamentForm(form({ ...valid, ...patch }))).toBeNull();
  });
  it("tolerates a missing timezone offset", () => {
    const { tzOffset: _omit, ...rest } = valid;
    expect(parseTournamentForm(form(rest))?.startsAt.toISOString()).toBe("2026-09-04T19:30:00.000Z");
  });
});

describe("parsePlayerForm", () => {
  it("parses name, gender and level", () => {
    expect(parsePlayerForm(form({ name: " Ana ", gender: "F", level: "4" }))).toEqual({
      name: "Ana",
      gender: "F",
      level: 4,
    });
  });
  it.each([
    ["unknown gender", { name: "Ana", gender: "X", level: "4" }],
    ["level 7", { name: "Ana", gender: "F", level: "7" }],
    ["empty name", { name: "", gender: "F", level: "4" }],
  ])("rejects %s", (_label, fields) => {
    expect(parsePlayerForm(form(fields))).toBeNull();
  });
});

describe("parseGuestsForm", () => {
  it("returns no guests for a plain sign-up", () => {
    expect(parseGuestsForm(form({ name: "Linh" }))).toEqual([]);
  });
  it("collects the filled +1 slots", () => {
    expect(
      parseGuestsForm(form({ guestName_0: " Jop ", guestGender_0: "M", guestLevel_0: "4" })),
    ).toEqual([{ name: "Jop", gender: "M", level: 4 }]);
  });
  it("rejects the whole form on a half-filled +1", () => {
    expect(parseGuestsForm(form({ guestName_0: "Jop" }))).toBeNull();
    expect(parseGuestsForm(form({ guestName_1: "Jop", guestGender_1: "M", guestLevel_1: "9" }))).toBeNull();
  });
});
