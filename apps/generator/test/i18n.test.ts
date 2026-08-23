import { ALGORITHMS } from "@ptg/core";
import { describe, expect, it } from "vitest";
import { LOCALES, MESSAGES, pickLocale, type Locale } from "../lib/i18n";

/** Every message, flattened to "path.to.key" → value. */
function flatten(value: unknown, path = ""): [string, unknown][] {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([key, child]) =>
      flatten(child, path ? `${path}.${key}` : key),
    );
  }
  return [[path, value]];
}

/** Calls a message function with placeholder arguments so its output can be checked. */
function render(value: unknown): string {
  if (typeof value === "function") {
    const args = Array.from({ length: value.length }, (_, i) => (i === 0 ? 3 : "x"));
    return (value as (...a: unknown[]) => string)(...args);
  }
  if (Array.isArray(value)) return value.join("");
  return String(value);
}

describe("choosing a language", () => {
  it.each<[readonly string[], Locale]>([
    [["en-GB", "nl"], "en"],
    [["zh-TW", "en"], "zh"],
    [["zh-Hans-CN"], "zh"],
    [["vi-VN"], "vi"],
    [["ja"], "ja"],
    [["ko-KR"], "ko"],
    [["es-MX", "en-US"], "es"],
    [["nl", "de"], "en"],
    [["nl", "ja"], "ja"],
    [[], "en"],
  ])("picks from %j", (preferred, expected) => {
    expect(pickLocale(preferred)).toBe(expected);
  });

  it("ignores garbage in the preference list", () => {
    expect(pickLocale(["", "-", "ZH"])).toBe("zh");
  });
});

describe("message catalogs", () => {
  const reference = flatten(MESSAGES.en).map(([key]) => key);

  it.each(LOCALES)("%s has every message English has, and nothing empty", (locale) => {
    const entries = flatten(MESSAGES[locale]);
    expect(entries.map(([key]) => key)).toEqual(reference);
    for (const [key, value] of entries) {
      expect(render(value).trim(), key).not.toBe("");
    }
  });

  it.each(LOCALES)("%s names every algorithm the registry has", (locale) => {
    for (const algorithm of ALGORITHMS) {
      const entry = MESSAGES[locale].algorithms[algorithm.id];
      expect(entry?.name, algorithm.id).toBeTruthy();
      expect(entry?.description, algorithm.id).toBeTruthy();
    }
  });

  it("keeps English matching what core says, so the two never drift", () => {
    for (const algorithm of ALGORITHMS) {
      expect(MESSAGES.en.algorithms[algorithm.id]).toEqual({
        name: algorithm.name,
        description: algorithm.description,
      });
    }
  });
});
