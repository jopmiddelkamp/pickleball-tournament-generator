"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "../lib/i18n/useLocale";

const MINUTES = [0, 15, 30, 45] as const;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
/** 2024-01-01 was a Monday; the header runs Monday-first. */
const WEEK = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i));

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local wall time in the shape <input type="datetime-local"> posts, so the Server Action is unchanged. */
function toFieldValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Cached so useSyncExternalStore sees a stable snapshot. The server snapshot
 * is null: the default depends on the visitor's clock, which the server
 * render cannot know.
 */
let cachedDefault: Date | null = null;

function noopSubscribe(): () => void {
  return () => {};
}

function getDefaultStart(): Date {
  if (!cachedDefault) {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(19, 30, 0, 0);
    cachedDefault = d;
  }
  return cachedDefault;
}

function getServerStart(): null {
  return null;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Six Monday-first weeks around the viewed month, like a printed calendar page. */
function monthGrid(year: number, month: number): Date[] {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => new Date(year, month, 1 - lead + i));
}

function CalendarGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

/**
 * Brand-styled replacement for <input type="datetime-local">: the native
 * popup cannot be themed, so the calendar and time pills are our own. Posts
 * the same value format through a hidden input.
 */
export function DateTimeField({ id, name }: { id: string; name: string }) {
  const { t, locale } = useLocale();
  const fallback = useSyncExternalStore(noopSubscribe, getDefaultStart, getServerStart);
  const [picked, setPicked] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<{ year: number; month: number } | null>(null);
  const value = picked ?? fallback;

  const monthTitle = useMemo(() => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }), [locale]);
  const weekday = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short" }), [locale]);
  const fieldLabel = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }), [locale]);

  const current = view ?? (value ? { year: value.getFullYear(), month: value.getMonth() } : null);

  function pickDay(day: Date): void {
    if (!value) return;
    setPicked(new Date(day.getFullYear(), day.getMonth(), day.getDate(), value.getHours(), value.getMinutes()));
    setView({ year: day.getFullYear(), month: day.getMonth() });
  }

  function pickTime(hours: number, minutes: number): void {
    if (!value) return;
    setPicked(new Date(value.getFullYear(), value.getMonth(), value.getDate(), hours, minutes));
  }

  function moveMonth(delta: number): void {
    if (!current) return;
    const d = new Date(current.year, current.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  }

  // Centre the chosen hour in its column whenever the panel opens.
  const hourListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const list = hourListRef.current;
    const chosen = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (list && chosen) list.scrollTop = chosen.offsetTop - list.clientHeight / 2 + chosen.clientHeight / 2;
  }, [open]);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const viewingCurrentMonth =
    current !== null && current.year === today.getFullYear() && current.month === today.getMonth();
  return (
    <div
      className="picker"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <input type="hidden" name={name} value={value ? toFieldValue(value) : ""} />
      <button type="button" id={id} className="input picker__field" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>{value ? fieldLabel.format(value) : " "}</span>
        <CalendarGlyph />
      </button>
      {open && value && current ? (
        <div className="picker__panel">
          <div className="picker__head">
            <span className="picker__month">{monthTitle.format(new Date(current.year, current.month, 1))}</span>
            <div className="picker__nav">
              <button
                type="button"
                className="picker__navbtn"
                aria-label={t.picker.prevMonth}
                disabled={viewingCurrentMonth}
                onClick={() => moveMonth(-1)}
              >
                ‹
              </button>
              <button type="button" className="picker__navbtn" aria-label={t.picker.nextMonth} onClick={() => moveMonth(1)}>
                ›
              </button>
            </div>
          </div>
          <div className="picker__grid">
            {WEEK.map((d) => (
              <span key={d.getDay()} className="picker__dow">
                {weekday.format(d)}
              </span>
            ))}
            {monthGrid(current.year, current.month).map((day) => (
              <button
                key={day.getTime()}
                type="button"
                className={[
                  "picker__day",
                  day.getMonth() === current.month ? "" : "picker__day--muted",
                  sameDay(day, today) ? "picker__day--today" : "",
                ].join(" ")}
                aria-pressed={sameDay(day, value)}
                disabled={day < todayStart}
                onClick={() => pickDay(day)}
              >
                {day.getDate()}
              </button>
            ))}
          </div>
          <div className="picker__time">
            <div className="picker__col">
              <span className="label">{t.picker.hour}</span>
              <div className="picker__list" ref={hourListRef}>
                {HOURS.map((h) => (
                  <button key={h} type="button" className="picker__slot" aria-pressed={h === value.getHours()} onClick={() => pickTime(h, value.getMinutes())}>
                    {pad(h)}
                  </button>
                ))}
              </div>
            </div>
            <div className="picker__col">
              <span className="label">{t.picker.minutes}</span>
              <div className="picker__list">
                {MINUTES.map((m) => (
                  <button key={m} type="button" className="picker__slot" aria-pressed={m === value.getMinutes()} onClick={() => pickTime(value.getHours(), m)}>
                    {pad(m)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button type="button" className="button button--small picker__done" onClick={() => setOpen(false)}>
            {t.picker.done}
          </button>
        </div>
      ) : null}
    </div>
  );
}
