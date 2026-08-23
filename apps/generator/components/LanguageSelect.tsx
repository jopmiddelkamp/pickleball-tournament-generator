"use client";

import { LOCALES, LOCALE_NAMES, isLocale } from "../lib/i18n";
import { useLocale } from "../lib/i18n/useLocale";

export function LanguageSelect({ className }: { className?: string }) {
  const { locale, t, setLocale } = useLocale();
  return (
    <select
      className={className}
      aria-label={t.language}
      value={locale}
      onChange={(event) => {
        if (isLocale(event.target.value)) setLocale(event.target.value);
      }}
    >
      {LOCALES.map((option) => (
        <option key={option} value={option} lang={option}>
          {LOCALE_NAMES[option]}
        </option>
      ))}
    </select>
  );
}
