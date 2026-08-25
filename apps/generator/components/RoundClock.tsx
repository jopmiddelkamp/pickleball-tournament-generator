"use client";

import { useEffect, useRef, useState } from "react";
import { clockState, formatClock } from "../lib/clock";
import { useLocale } from "../lib/i18n/useLocale";

/**
 * The round clock. Runs from a server-stored start so every phone that loads
 * the page agrees on the time left. Only the organiser's copy (the one with
 * onStart) rings at the bell and keeps the screen awake: players come and
 * report their score in person, nothing happens by itself when time is up.
 */
export function RoundClock({
  minutes,
  startedAt,
  onStart,
  onStop,
}: {
  minutes: number;
  startedAt: string | null;
  onStart?: () => void;
  onStop?: () => void;
}) {
  const { t } = useLocale();
  const [now, setNow] = useState(() => Date.now());
  const audio = useRef<AudioContext | null>(null);
  const rungFor = useRef<string | null>(null);
  const state = clockState(startedAt, minutes, now);
  const running = state !== null && !state.expired;
  const expired = state?.expired ?? false;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running, startedAt]);

  // Organiser only: keep the phone awake while the clock runs, so the bell is heard.
  useEffect(() => {
    if (!onStart || !running) return;
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock
      ?.request("screen")
      .then((sentinel) => {
        lock = sentinel;
      })
      .catch(() => {
        // Not granted (background tab, low battery): the clock still runs.
      });
    return () => {
      lock?.release().catch(() => {});
    };
  }, [onStart, running, startedAt]);

  // Organiser only: ring once per start.
  useEffect(() => {
    if (!onStart || !expired || !startedAt || rungFor.current === startedAt) return;
    rungFor.current = startedAt;
    const context = audio.current;
    if (!context) return;
    const at = context.currentTime;
    for (let i = 0; i < 3; i++) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.4, at + i * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, at + i * 0.35 + 0.25);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(at + i * 0.35);
      oscillator.stop(at + i * 0.35 + 0.25);
    }
  }, [onStart, expired, startedAt]);

  function start() {
    // Browsers only let audio play after a gesture; the tap on Start is that gesture.
    if (!audio.current && typeof AudioContext !== "undefined") audio.current = new AudioContext();
    audio.current?.resume().catch(() => {});
    onStart?.();
  }

  if (!state) {
    if (!onStart) return null;
    return (
      <div className="clock">
        <button type="button" className="button button--quiet button--full" onClick={start}>
          {t.clock.start(minutes)}
        </button>
      </div>
    );
  }

  return (
    <div className={state.expired ? "clock clock--up" : "clock"} role="timer" aria-live="off" aria-label={t.clock.label}>
      <span className="clock__time">{formatClock(state.remainingMs)}</span>
      <span className="clock__caption">{state.expired ? t.clock.timeUp : t.clock.running(minutes)}</span>
      {onStop ? (
        <button type="button" className="button button--quiet button--small" onClick={onStop}>
          {state.expired ? t.clock.reset : t.clock.stop}
        </button>
      ) : null}
    </div>
  );
}
