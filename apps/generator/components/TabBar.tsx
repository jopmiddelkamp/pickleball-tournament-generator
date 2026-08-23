"use client";

import { useLocale } from "../lib/i18n/useLocale";

export const TABS = ["roster", "setup", "schedule", "standings"] as const;
export type Tab = (typeof TABS)[number];

export function TabBar({
  active,
  onChange,
  tabs,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
  tabs: readonly Tab[];
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
          {t.tabs[tab]}
        </button>
      ))}
    </nav>
  );
}
