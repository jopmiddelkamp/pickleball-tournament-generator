/**
 * The chosen language, backed by localStorage and read through
 * `useSyncExternalStore` for the same reason the evening is (see lib/store.ts).
 * The server renders English; the browser snapshot is the saved choice, or
 * the first of the browser's own languages the app speaks.
 */
import { DEFAULT_LOCALE, isLocale, pickLocale, type Locale } from "./locale";

export const LOCALE_STORAGE_KEY = "ptg.locale";

let locale: Locale = DEFAULT_LOCALE;
let loaded = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function readSaved(): Locale | null {
  try {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(saved) ? saved : null;
  } catch {
    return null;
  }
}

/** Runs exactly once, on the first browser snapshot read. */
function ensureLoaded(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  locale = readSaved() ?? pickLocale(window.navigator.languages ?? [window.navigator.language]);
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): Locale {
  ensureLoaded();
  return locale;
}

export function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

export function setLocale(next: Locale): void {
  locale = next;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
  } catch (error) {
    // A blocked store only means the choice is forgotten on the next visit.
    console.error("Could not save the language", error);
  }
  emit();
}
