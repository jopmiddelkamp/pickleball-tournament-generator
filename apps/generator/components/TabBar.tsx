"use client";

export const TABS = ["roster", "setup", "schedule", "standings"] as const;
export type Tab = (typeof TABS)[number];

const LABELS: Record<Tab, string> = {
  roster: "Roster",
  setup: "Set up",
  schedule: "Courts",
  standings: "Standings",
};

export function TabBar({
  active,
  onChange,
  tabs,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
  tabs: readonly Tab[];
}) {
  return (
    <nav className="tabbar" aria-label="Sections">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className="tabbar__button"
          aria-current={active === tab ? "page" : undefined}
          onClick={() => onChange(tab)}
        >
          <span className="tabbar__mark" aria-hidden="true" />
          {LABELS[tab]}
        </button>
      ))}
    </nav>
  );
}
