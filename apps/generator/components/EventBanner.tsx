"use client";

import { useLocale } from "../lib/i18n/useLocale";

/**
 * The event's identity line: name as a tracked eyebrow with the ball dot,
 * date and location beneath, optional actions to the right. Context above
 * a screen, so it deliberately reads unlike a screen heading.
 */
export function EventBanner({ name, startsAt, location, actions }: {
  name: string;
  /** ISO */
  startsAt: string;
  location: string | null;
  actions?: React.ReactNode;
}) {
  const { locale } = useLocale();
  const when = new Date(startsAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
  return (
    <header className="event">
      <div className="event__text">
        <h2 className="event__name">{name}</h2>
        <p className="event__meta">
          {when}
          {location ? ` · ${location}` : ""}
        </p>
      </div>
      {actions ? <div className="row">{actions}</div> : null}
    </header>
  );
}
