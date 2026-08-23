"use client";

import { useActionState, useSyncExternalStore } from "react";
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

  return (
    <div>
      <h2 className="screen__heading">{t.organiser.form.heading}</h2>
      {state.error ? <Notice tone="warn">{t.organiser.form.invalid}</Notice> : null}
      <form className="card stack" action={formAction}>
        <input type="hidden" name="tzOffset" value={tzOffset} />
        <div>
          <label className="label" htmlFor="name">{t.organiser.form.name}</label>
          <input id="name" name="name" className="input" maxLength={LIMITS.maxTournamentName} placeholder={t.organiser.form.namePlaceholder} required />
        </div>
        <div>
          <label className="label" htmlFor="startsAt">{t.organiser.form.startsAt}</label>
          <input id="startsAt" name="startsAt" className="input" type="datetime-local" required />
        </div>
        <div className="row">
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="maxPlayers">{t.organiser.form.maxPlayers}</label>
            <input id="maxPlayers" name="maxPlayers" className="input" type="number" inputMode="numeric" min={4} max={LIMITS.maxPlayers} defaultValue={16} required />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="rounds">{t.organiser.form.rounds}</label>
            <input id="rounds" name="rounds" className="input" type="number" inputMode="numeric" min={LIMITS.minRounds} max={LIMITS.maxRounds} defaultValue={6} required />
          </div>
        </div>
        <p className="standings__detail">{t.organiser.form.maxPlayersHint}</p>
        <div>
          <label className="label" htmlFor="maxCourts">{t.organiser.form.maxCourts}</label>
          <select id="maxCourts" name="maxCourts" className="select" defaultValue={4}>
            {COURT_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="gameTarget">{t.organiser.form.gameTarget}</label>
          <select id="gameTarget" name="gameTarget" className="select" defaultValue={11}>
            {[11, 16, 21].map((points) => <option key={points} value={points}>{t.setup.points(points)}</option>)}
          </select>
        </div>
        <button type="submit" className="button button--accent button--full" disabled={pending}>
          {t.organiser.form.create}
        </button>
      </form>
    </div>
  );
}
