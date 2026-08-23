"use client";

import { useSyncExternalStore } from "react";
import { MESSAGES, type Messages } from "./index";
import type { Locale } from "./locale";
import { getServerSnapshot, getSnapshot, setLocale, subscribe } from "./store";

export interface LocaleState {
  locale: Locale;
  /** messages for the current language */
  t: Messages;
  setLocale: (locale: Locale) => void;
}

export function useLocale(): LocaleState {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { locale, t: MESSAGES[locale], setLocale };
}
