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
          <span className="event__fact">
            <CalendarIcon />
            {when}
          </span>
          {location ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="event__fact">
                <PinIcon />
                {location}
              </span>
            </>
          ) : null}
        </p>
      </div>
      {actions ? <div className="row">{actions}</div> : null}
    </header>
  );
}

function CalendarIcon() {
  return (
    <svg className="event__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="event__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
