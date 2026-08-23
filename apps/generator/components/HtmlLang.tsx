"use client";

import { useEffect } from "react";
import { useLocale } from "../lib/i18n/useLocale";

/**
 * Keeps `<html lang>` and the tab title in step with the chosen language. Both
 * are rendered in English on the server; the browser corrects them once it
 * knows the real choice, so screen readers and hyphenation follow the language.
 */
export function HtmlLang() {
  const { locale, t } = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t.title.join(" ");
  }, [locale, t]);
  return null;
}
