"use client";

import type { Gender, Player } from "@ptg/core";
import { useLocale } from "../lib/i18n/useLocale";

/**
 * A pickleball: a hollow ball, holes and all. The holes are punched out of the
 * disc with an even-odd fill rather than painted over, so the mark works on
 * any background it is dropped onto.
 */
export function PickleballMark() {
  const hole = (cx: number, cy: number): string =>
    `M${cx - 1.95},${cy}a1.95,1.95 0 1,0 3.9,0a1.95,1.95 0 1,0 -3.9,0Z`;

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" aria-hidden="true">
      <path
        d={[
          "M1,12a11,11 0 1,0 22,0a11,11 0 1,0 -22,0Z",
          hole(12, 12),
          hole(17.8, 12),
          hole(14.9, 17.02),
          hole(9.1, 17.02),
          hole(6.2, 12),
          hole(9.1, 6.98),
          hole(14.9, 6.98),
        ].join("")}
      />
    </svg>
  );
}

/**
 * The brand: the ball, then the name with its second word in ball yellow.
 * Callers supply the element it lives in - a heading on a screen someone
 * lands on, a link home in the organiser's header.
 */
export function Wordmark() {
  const { t } = useLocale();
  return (
    <>
      <PickleballMark />
      <span>
        {t.title[0]} <span className="app__titleAccent">{t.title[1]}</span>
      </span>
    </>
  );
}

/** A medal for a podium place: a disc on a short ribbon, coloured by the `--medal` token the caller sets. */
export function Medal({ place }: { place: 1 | 2 | 3 }) {
  return (
    <svg className={`medal medal--${place}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 2h3l1 4-2.5 4L6 4z" fill="var(--medal)" opacity="0.7" />
      <path d="M16 2h-3l-1 4 2.5 4L18 4z" fill="var(--medal)" opacity="0.7" />
      <circle cx="12" cy="15" r="6.5" fill="var(--medal)" />
      <circle cx="12" cy="15" r="4.5" fill="none" stroke="var(--color-surface)" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

export function GenderChip({ gender }: { gender: Gender }) {
  return (
    <span className={`gender gender--${gender}`} aria-hidden="true">
      {gender}
    </span>
  );
}

/** A name with its gender marker. Never carries a level: SPEC-1 §5. */
export function PlayerName({ player, className }: { player: Player; className?: string }) {
  return (
    <span className={className}>
      <GenderChip gender={player.gender} />
      <span>{player.name}</span>
    </span>
  );
}

export function Notice({
  children,
  tone = "info",
  onDismiss,
}: {
  children: React.ReactNode;
  tone?: "info" | "warn";
  onDismiss?: () => void;
}) {
  const { t } = useLocale();
  return (
    <div className={tone === "warn" ? "notice notice--warn" : "notice"} role="status">
      {children}
      {onDismiss ? (
        <>
          {" "}
          <button type="button" className="button button--quiet button--small" onClick={onDismiss}>
            {t.dismiss}
          </button>
        </>
      ) : null}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="empty">{children}</p>;
}
