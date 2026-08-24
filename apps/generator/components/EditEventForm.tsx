"use client";

import { MAX_PLAYERS_PER_COURT, MIN_PLAYERS_PER_COURT, maxPlayersFor } from "@ptg/core";
import { useActionState, useState } from "react";
import { updateEventDetailsAction } from "../lib/actions/tournaments";
import { INITIAL_EDIT_STATE, type EditEventState } from "../lib/actions/tournamentState";
import { LIMITS } from "../lib/config";
import { useLocale } from "../lib/i18n/useLocale";
import type { WorkspaceView } from "../lib/tournament";
import { useTzOffset } from "../lib/useTzOffset";
import { DateTimeField } from "./DateTimeField";
import { PlayStyleFields } from "./PlayStyleFields";
import { Notice } from "./ui";

const COURT_OPTIONS = [1, 2, 3, 4, 5, 6];
const PER_COURT_OPTIONS = Array.from(
  { length: MAX_PLAYERS_PER_COURT - MIN_PLAYERS_PER_COURT + 1 },
  (_, i) => MIN_PLAYERS_PER_COURT + i,
);

/**
 * The creation fields again, prefilled. Capacity (courts and spots per court)
 * freezes together with the roster once a schedule is generated; name and
 * start time stay editable.
 */
export function EditEventForm({ view, registered, frozen, onClose, onSaved }: {
  view: WorkspaceView;
  /** active registrations, confirmed + waiting */
  registered: number;
  /** a schedule is stored, so capacity cannot move */
  frozen: boolean;
  onClose: () => void;
  onSaved: (demoted: number) => void;
}) {
  const { t } = useLocale();
  const tzOffset = useTzOffset();
  const [courts, setCourts] = useState(view.maxCourts);
  const [perCourt, setPerCourt] = useState(view.playersPerCourt);
  const [state, formAction, pending] = useActionState(
    async (prev: EditEventState, formData: FormData) => {
      const result = await updateEventDetailsAction(view.id, prev, formData);
      if (result.error === null) onSaved(result.demoted);
      return result;
    },
    INITIAL_EDIT_STATE,
  );

  const capacity = maxPlayersFor(courts, perCourt);
  const demoted = Math.max(0, registered - capacity);

  return (
    <div>
      <h2 className="screen__heading">{t.organiser.edit.heading}</h2>
      {state.error ? <Notice tone="warn">{t.organiser.form.invalid}</Notice> : null}
      <form className="card stack" action={formAction}>
        <input type="hidden" name="tzOffset" value={tzOffset} />
        <input type="hidden" name="maxCourts" value={courts} />
        <input type="hidden" name="playersPerCourt" value={perCourt} />
        <div>
          <label className="label" htmlFor="edit-name">{t.organiser.form.name}</label>
          <input
            id="edit-name"
            name="name"
            className="input"
            defaultValue={view.name}
            maxLength={LIMITS.maxTournamentName}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="edit-startsAt">{t.organiser.form.startsAt}</label>
          <DateTimeField id="edit-startsAt" name="startsAt" initial={view.startsAt} />
        </div>
        <div>
          <span className="label" id="edit-courts-label">{t.organiser.form.maxCourts}</span>
          <div className="segmented" role="group" aria-labelledby="edit-courts-label">
            {COURT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                className="segmented__option"
                aria-pressed={courts === n}
                disabled={frozen}
                onClick={() => setCourts(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="label" id="edit-per-court-label">{t.organiser.form.perCourt}</span>
          <div className="segmented" role="group" aria-labelledby="edit-per-court-label">
            {PER_COURT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                className="segmented__option"
                aria-pressed={perCourt === n}
                disabled={frozen}
                onClick={() => setPerCourt(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="standings__detail">
            {t.organiser.form.capacity(courts, capacity)} {t.organiser.edit.signedUp(registered)}
          </p>
          {frozen ? <p className="standings__detail">{t.organiser.edit.frozen}</p> : null}
        </div>
        <PlayStyleFields initialGameTarget={view.gameTarget} initialAlgorithmId={view.algorithmId} />
        {demoted > 0 && !frozen ? <Notice tone="warn">{t.organiser.edit.demote(demoted)}</Notice> : null}
        <button type="submit" className="button button--accent button--full" disabled={pending}>
          {t.organiser.edit.save}
        </button>
        <button type="button" className="button button--quiet button--full" onClick={onClose}>
          {t.organiser.edit.cancel}
        </button>
      </form>
    </div>
  );
}
