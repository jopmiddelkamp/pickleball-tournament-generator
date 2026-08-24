"use client";

import { maxPlayersFor } from "@ptg/core";
import { useActionState, useState, useSyncExternalStore } from "react";
import { createTournamentAction } from "../lib/actions/tournaments";
import { INITIAL_CREATE_STATE } from "../lib/actions/tournamentState";
import { LIMITS } from "../lib/config";
import { useLocale } from "../lib/i18n/useLocale";
import { Notice } from "./ui";

const COURT_OPTIONS = [1, 2, 3, 4, 5, 6];

function noopSubscribe(): () => void {
  return () => {};
}

function getTzOffset(): number {
  return new Date().getTimezoneOffset();
}

function getServerTzOffset(): number {
  return 0;
}

export function NewTournamentForm() {
  const { t } = useLocale();
  const [state, formAction, pending] = useActionState(createTournamentAction, INITIAL_CREATE_STATE);
  // The browser's zone, so "19:30" means 19:30 where the organiser is. The server
  // renders 0 (UTC); the client snapshot corrects it after mount, so SSR and the
  // hydrated markup agree before the correction lands.
  const tzOffset = useSyncExternalStore(noopSubscribe, getTzOffset, getServerTzOffset);
  const [courts, setCourts] = useState(4);

  return (
    <div>
      <h2 className="screen__heading">{t.organiser.form.heading}</h2>
      {state.error ? <Notice tone="warn">{t.organiser.form.invalid}</Notice> : null}
      <form className="card stack" action={formAction}>
        <input type="hidden" name="tzOffset" value={tzOffset} />
        <input type="hidden" name="maxCourts" value={courts} />
        <div>
          <label className="label" htmlFor="name">{t.organiser.form.name}</label>
          <input id="name" name="name" className="input" maxLength={LIMITS.maxTournamentName} placeholder={t.organiser.form.namePlaceholder} required />
        </div>
        <div>
          <label className="label" htmlFor="startsAt">{t.organiser.form.startsAt}</label>
          <input id="startsAt" name="startsAt" className="input" type="datetime-local" required />
        </div>
        <div>
          <span className="label" id="courts-label">{t.organiser.form.maxCourts}</span>
          <div className="segmented" role="group" aria-labelledby="courts-label">
            {COURT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                className="segmented__option"
                aria-pressed={courts === n}
                onClick={() => setCourts(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="standings__detail">{t.organiser.form.capacity(courts, maxPlayersFor(courts))}</p>
        </div>
        <button type="submit" className="button button--accent button--full" disabled={pending}>
          {t.organiser.form.create}
        </button>
      </form>
    </div>
  );
}
