"use client";

import { useLocale } from "../lib/i18n/useLocale";

export const TABS = ["roster", "schedule", "standings"] as const;
export type Tab = (typeof TABS)[number];

/** The fixed bottom bar both the organiser's workspace and the public live page navigate with. */
export function TabBar<T extends string>({
  active,
  onChange,
  tabs,
  label,
}: {
  active: T;
  onChange: (tab: T) => void;
  tabs: readonly T[];
  label: (tab: T) => string;
}) {
  const { t } = useLocale();
  return (
    <nav className="tabbar" aria-label={t.sections}>
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className="tabbar__button"
          aria-current={active === tab ? "page" : undefined}
          onClick={() => onChange(tab)}
        >
          <span className="tabbar__mark" aria-hidden="true" />
          {label(tab)}
        </button>
      ))}
    </nav>
  );
}
