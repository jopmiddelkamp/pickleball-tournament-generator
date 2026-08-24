import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cssVariables, lightScheme, typeScale } from "../lib/theme";

/**
 * The design system's own guard rail.
 *
 * `--white` once lived in globals.css and never in `cssVariables`, so eleven
 * backgrounds resolved to transparent and the gender chips lost their white
 * letters - a whole class of bug that no type check or build catches, because
 * an undefined custom property is legal CSS. These tests close it from both
 * sides: every property a stylesheet reads is emitted, and every property
 * emitted is read by something.
 */

const STYLESHEETS = ["app/globals.css", "app/design/design.css"] as const;

/** Injected by next/font in app/layout.tsx, not by the theme. */
const FONT_VARIABLES = new Set(["--font-display", "--font-body"]);

/** Comments explain the token pattern in prose; only real CSS is scanned. */
const read = (path: string): string =>
  readFileSync(join(__dirname, "..", path), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

const referencedIn = (css: string): Set<string> =>
  new Set([...css.matchAll(/var\((--[a-z0-9-]+)\s*[,)]/g)].map((match) => match[1] as string));

const declaredIn = (css: string): Set<string> =>
  new Set([...css.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map((match) => match[1] as string));

describe("design tokens", () => {
  const emitted = new Set(Object.keys(cssVariables));

  it.each(STYLESHEETS)("%s only reads custom properties that exist", (path) => {
    const css = read(path);
    const available = new Set([...emitted, ...declaredIn(css), ...FONT_VARIABLES]);
    const missing = [...referencedIn(css)].filter((name) => !available.has(name));

    expect(missing).toEqual([]);
  });

  it("emits no token that nothing uses", () => {
    // A token counts as used when a stylesheet reads it or another token
    // builds on it - `--elevation-1` is what gives `--color-shadow` its job.
    const referenced = referencedIn([...STYLESHEETS.map(read), ...Object.values(cssVariables)].join("\n"));
    // The reference page builds token names by interpolation, so a static scan
    // cannot see them. These are the ones only it draws.
    const drawnOnlyByTheReferencePage = new Set([
      ...Object.keys(cssVariables).filter((name) => name.startsWith("--brand-")),
      "--elevation-0",
    ]);
    const unused = [...emitted].filter((name) => !referenced.has(name) && !drawnOnlyByTheReferencePage.has(name));

    expect(unused).toEqual([]);
  });

  it("gives every colour role a value the browser can parse", () => {
    for (const [role, value] of Object.entries(lightScheme)) {
      expect(value, role).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it("gives every type role all five properties", () => {
    for (const role of Object.keys(typeScale)) {
      const prefix = `--text-${role.replace(/[A-Z0-9]+/g, (match) => `-${match.toLowerCase()}`)}`;
      for (const property of ["font", "size", "weight", "line", "tracking"]) {
        expect(cssVariables, `${prefix}-${property}`).toHaveProperty(`${prefix}-${property}`);
      }
    }
  });
});
