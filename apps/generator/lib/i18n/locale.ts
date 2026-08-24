/**
 * The languages the app speaks. `zh` is Simplified Chinese; Traditional
 * readers still get Chinese rather than English because matching is on the
 * primary language subtag only.
 */
export const LOCALES = ["en", "zh", "vi", "ja", "ko", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * Flag shorthand for the compact header picker. A language is not a country,
 * but on a phone-width header the flag is the smallest symbol everyone at the
 * club recognises; the picker keeps the language's own name as its label.
 */
export const LOCALE_FLAGS: Readonly<Record<Locale, string>> = {
  en: "\u{1F1EC}\u{1F1E7}",
  zh: "\u{1F1E8}\u{1F1F3}",
  vi: "\u{1F1FB}\u{1F1F3}",
  ja: "\u{1F1EF}\u{1F1F5}",
  ko: "\u{1F1F0}\u{1F1F7}",
  es: "\u{1F1EA}\u{1F1F8}",
};

/** Each language named in itself, so anyone can find their own in the list. */
export const LOCALE_NAMES: Readonly<Record<Locale, string>> = {
  en: "English",
  zh: "中文",
  vi: "Tiếng Việt",
  ja: "日本語",
  ko: "한국어",
  es: "Español",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * First supported language in a browser's preference list (BCP 47 tags, most
 * preferred first), or English when none of them is.
 */
export function pickLocale(preferred: readonly string[]): Locale {
  for (const tag of preferred) {
    const primary = tag.split("-")[0]?.toLowerCase();
    if (isLocale(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}
