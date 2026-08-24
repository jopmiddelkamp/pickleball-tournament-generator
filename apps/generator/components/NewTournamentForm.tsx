"use client";

import { MAX_PLAYERS_PER_COURT, MIN_PLAYERS_PER_COURT, PLAYERS_PER_COURT, maxPlayersFor } from "@ptg/core";
import { useActionState, useState } from "react";
import { createTournamentAction } from "../lib/actions/tournaments";
import { INITIAL_CREATE_STATE } from "../lib/actions/tournamentState";
import { LIMITS } from "../lib/config";
import { useLocale } from "../lib/i18n/useLocale";
import { useTzOffset } from "../lib/useTzOffset";
import { DateTimeField } from "./DateTimeField";
import { Notice } from "./ui";

const COURT_OPTIONS = [1, 2, 3, 4, 5, 6];
const PER_COURT_OPTIONS = Array.from(
  { length: MAX_PLAYERS_PER_COURT - MIN_PLAYERS_PER_COURT + 1 },
  (_, i) => MIN_PLAYERS_PER_COURT + i,
);

export function NewTournamentForm() {
  const { t } = useLocale();
  const [state, formAction, pending] = useActionState(createTournamentAction, INITIAL_CREATE_STATE);
  const tzOffset = useTzOffset();
  const [courts, setCourts] = useState(4);
  const [perCourt, setPerCourt] = useState<number>(PLAYERS_PER_COURT);

  return (
    <div>
      <h2 className="screen__heading">{t.organiser.form.heading}</h2>
      {state.error ? <Notice tone="warn">{t.organiser.form.invalid}</Notice> : null}
      <form className="card stack" action={formAction}>
        <input type="hidden" name="tzOffset" value={tzOffset} />
        <input type="hidden" name="maxCourts" value={courts} />
        <input type="hidden" name="playersPerCourt" value={perCourt} />
        <div>
          <label className="label" htmlFor="name">{t.organiser.form.name}</label>
          <input id="name" name="name" className="input" maxLength={LIMITS.maxTournamentName} placeholder={t.organiser.form.namePlaceholder} required />
        </div>
        <div>
          <label className="label" htmlFor="startsAt">{t.organiser.form.startsAt}</label>
          <DateTimeField id="startsAt" name="startsAt" />
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
        </div>
        <div>
          <span className="label" id="per-court-label">{t.organiser.form.perCourt}</span>
          <div className="segmented" role="group" aria-labelledby="per-court-label">
            {PER_COURT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                className="segmented__option"
                aria-pressed={perCourt === n}
                onClick={() => setPerCourt(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="standings__detail">{t.organiser.form.capacity(courts, maxPlayersFor(courts, perCourt))}</p>
        </div>
        <button type="submit" className="button button--accent button--full" disabled={pending}>
          {t.organiser.form.create}
        </button>
      </form>
    </div>
  );
}
