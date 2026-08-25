"use client";

import { MAX_PLAYERS_PER_COURT, MIN_PLAYERS_PER_COURT, PLAYERS_PER_COURT, maxPlayersFor } from "@ptg/core";
import { useActionState, useState } from "react";
import { createTournamentAction } from "../lib/actions/tournaments";
import { INITIAL_CREATE_STATE } from "../lib/actions/tournamentState";
import { LIMITS } from "../lib/config";
import type { EventDefaults } from "../lib/eventDefaults";
import { useLocale } from "../lib/i18n/useLocale";
import { useTzOffset } from "../lib/useTzOffset";
import { DateTimeField } from "./DateTimeField";
import { PlayStyleFields } from "./PlayStyleFields";
import { Segmented } from "./Segmented";
import { Notice } from "./ui";

const COURT_OPTIONS = [1, 2, 3, 4, 5, 6];
const PER_COURT_OPTIONS = Array.from(
  { length: MAX_PLAYERS_PER_COURT - MIN_PLAYERS_PER_COURT + 1 },
  (_, i) => MIN_PLAYERS_PER_COURT + i,
);

export function NewTournamentForm({ defaults }: { defaults: EventDefaults | null }) {
  const { t } = useLocale();
  const [state, formAction, pending] = useActionState(createTournamentAction, INITIAL_CREATE_STATE);
  const tzOffset = useTzOffset();
  const [courts, setCourts] = useState(defaults?.maxCourts ?? 4);
  const [perCourt, setPerCourt] = useState<number>(defaults?.playersPerCourt ?? PLAYERS_PER_COURT);

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
          <label className="label" htmlFor="location">{t.organiser.form.location}</label>
          <input
            id="location"
            name="location"
            className="input"
            defaultValue={defaults?.location ?? ""}
            maxLength={LIMITS.maxLocation}
            placeholder={t.organiser.form.locationPlaceholder}
          />
        </div>
        <div>
          <label className="label" htmlFor="startsAt">{t.organiser.form.startsAt}</label>
          <DateTimeField id="startsAt" name="startsAt" />
        </div>
        <div>
          <span className="label" id="courts-label">{t.organiser.form.maxCourts}</span>
          <Segmented options={COURT_OPTIONS} value={courts} onChange={setCourts} labelledBy="courts-label" />
        </div>
        <div>
          <span className="label" id="per-court-label">{t.organiser.form.perCourt}</span>
          <Segmented options={PER_COURT_OPTIONS} value={perCourt} onChange={setPerCourt} labelledBy="per-court-label" />
          <p className="standings__detail">{t.organiser.form.capacity(courts, maxPlayersFor(courts, perCourt))}</p>
        </div>
        <PlayStyleFields
          initialRounds={defaults?.rounds ?? 6}
          initialGameTarget={defaults?.gameTarget ?? 11}
          initialRoundMinutes={defaults?.roundMinutes ?? null}
          initialAlgorithmId={defaults?.algorithmId ?? "greedy"}
        />
        <button type="submit" className="button button--accent button--full" disabled={pending}>
          {t.organiser.form.create}
        </button>
      </form>
    </div>
  );
}
