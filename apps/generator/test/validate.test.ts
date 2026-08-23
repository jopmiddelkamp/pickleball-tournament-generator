import { describe, expect, it } from "vitest";
import { parseCredentials, parsePlayerForm, parseTournamentForm } from "../lib/validate";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
}

describe("parseCredentials", () => {
  it("accepts an email and a password of at least 8 characters", () => {
    expect(parseCredentials(form({ email: " Org@Club.nl ", password: "longenough" }))).toEqual({
      email: "org@club.nl",
      password: "longenough",
    });
  });
  it.each([
    ["no at sign", { email: "org.club.nl", password: "longenough" }],
    ["short password", { email: "org@club.nl", password: "short" }],
    ["missing password", { email: "org@club.nl" }],
    ["overlong password", { email: "org@club.nl", password: "x".repeat(129) }],
  ])("rejects %s", (_label, fields) => {
    expect(parseCredentials(form(fields))).toBeNull();
  });
});

describe("parseTournamentForm", () => {
  const valid = {
    name: "Friday mix",
    startsAt: "2026-09-04T19:30",
    tzOffset: "-120",
    maxPlayers: "16",
    maxCourts: "4",
    rounds: "6",
    gameTarget: "11",
  };
  it("parses a valid form and applies the browser's timezone offset", () => {
    const input = parseTournamentForm(form(valid));
    expect(input).not.toBeNull();
    expect(input?.name).toBe("Friday mix");
    // 19:30 at UTC+2 is 17:30Z
    expect(input?.startsAt.toISOString()).toBe("2026-09-04T17:30:00.000Z");
    expect(input).toMatchObject({ maxPlayers: 16, maxCourts: 4, rounds: 6, gameTarget: 11 });
  });
  it.each([
    ["empty name", { name: "  " }],
    ["overlong name", { name: "x".repeat(81) }],
    ["bad date", { startsAt: "yesterday" }],
    ["too few players", { maxPlayers: "3" }],
    ["too many players", { maxPlayers: "65" }],
    ["zero courts", { maxCourts: "0" }],
    ["seven courts", { maxCourts: "7" }],
    ["zero rounds", { rounds: "0" }],
    ["game target of zero", { gameTarget: "0" }],
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
