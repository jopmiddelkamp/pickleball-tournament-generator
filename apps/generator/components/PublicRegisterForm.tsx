"use client";

import type { Gender, Level } from "@ptg/core";
import { useActionState, useState } from "react";
import { addGuestAction, registerAction } from "../lib/actions/public";
import { INITIAL_PUBLIC_STATE } from "../lib/actions/publicState";
import { LIMITS } from "../lib/config";
import { LevelPicker } from "./LevelPicker";
import { Segmented } from "./Segmented";
import { useLocale } from "../lib/i18n/useLocale";
import { Notice } from "./ui";

interface GuestDraft {
  key: number;
  name: string;
  gender: Gender;
  /** null while "Not sure" is picked; the form does not submit until every level is chosen */
  level: Level | null;
}

/**
 * Same fields as the organiser's roster form (name, gender, level), bound to
 * the public register Server Action instead. In the default mode the visitor
 * can attach up to LIMITS.maxGuests +1s, submitted with their own sign-up;
 * `guest` narrows the form to adding one +1 to an existing registration.
 * `capacityLeft` is how many confirmed places remain, for the waiting-list
 * warning.
 */
export function PublicRegisterForm({ slug, capacityLeft, minLevel, guest = false, onCancel }: {
  slug: string;
  capacityLeft: number;
  /** the organiser's minimum level; tiers below it are not offered */
  minLevel: Level | null;
  guest?: boolean;
  /** closes the form without submitting; rendered as a Cancel button when given */
  onCancel?: () => void;
}) {
  const { t } = useLocale();
  const [state, formAction, pending] = useActionState((guest ? addGuestAction : registerAction).bind(null, slug), INITIAL_PUBLIC_STATE);
  const [gender, setGender] = useState<Gender>("F");
  const lowest: Level = minLevel ?? 1;
  const defaultLevel: Level = lowest > 3 ? lowest : 3;
  const [level, setLevel] = useState<Level | null>(defaultLevel);
  const [guests, setGuests] = useState<GuestDraft[]>([]);
  const [nextKey, setNextKey] = useState(0);

  function addGuestDraft(): void {
    setGuests([...guests, { key: nextKey, name: "", gender: "F", level: defaultLevel }]);
    setNextKey(nextKey + 1);
  }

  function patchGuest(key: number, patch: Partial<GuestDraft>): void {
    setGuests(guests.map((g) => (g.key === key ? { ...g, ...patch } : g)));
  }

  const groupSize = guest ? 1 : 1 + guests.length;
  const waitlisted = groupSize > capacityLeft;
  // "Not sure" anywhere holds the form: the guide is one tap away instead.
  const unsure = level === null || guests.some((g) => g.level === null);

  const guideHint = (
    <p className="standings__detail levels__hint">
      {t.public.notSureHint}{" "}
      <a className="text-link" href="/levels" target="_blank" rel="noreferrer">
        {t.public.levelsLink}
      </a>
    </p>
  );

  return (
    <div>
      {guest ? (
        <>
          <h3 className="screen__section">{t.public.guestHeading}</h3>
          <p className="screen__lede">{t.public.guestLede}</p>
        </>
      ) : (
        <>
          <h2 className="screen__heading">{t.public.registerHeading}</h2>
          <p className="screen__lede">{t.public.registerLede}</p>
        </>
      )}

      {state.error ? <Notice tone="warn">{t.public.errors[state.error]}</Notice> : null}

      <form className={guest ? "stack" : "card stack"} action={formAction}>
        <div>
          <label className="label" htmlFor="public-name">
            {t.roster.name}
          </label>
          <input
            id="public-name"
            name="name"
            className="input"
            maxLength={LIMITS.maxNameLength}
            autoComplete="name"
            placeholder={t.roster.namePlaceholder}
          />
        </div>

        <div>
          <span className="label" id="public-gender-label">
            {t.roster.playsAs}
          </span>
          <Segmented
            options={["F", "M"] as const}
            value={gender}
            onChange={setGender}
            format={(option) => t.gender[option]}
            labelledBy="public-gender-label"
          />
          <input type="hidden" name="gender" value={gender} />
        </div>

        <div>
          <span className="label" id="public-level-label">
            {t.roster.level}
          </span>
          <LevelPicker value={level} onChange={setLevel} min={lowest} allowUnsure labelledBy="public-level-label" />
          {level === null ? guideHint : null}
          <input type="hidden" name="level" value={level ?? ""} />
        </div>

        {guests.map((draft, index) => (
          <div key={draft.key} className="guest">
            <div className="row row--split">
              <span className="label label--inline">{t.public.guestNumber(index + 1)}</span>
              <button
                type="button"
                className="button button--quiet button--small"
                onClick={() => setGuests(guests.filter((g) => g.key !== draft.key))}
              >
                {t.roster.remove}
              </button>
            </div>
            <input
              name={`guestName_${index}`}
              className="input"
              maxLength={LIMITS.maxNameLength}
              placeholder={t.roster.namePlaceholder}
              aria-label={t.roster.name}
              value={draft.name}
              onChange={(e) => patchGuest(draft.key, { name: e.target.value })}
            />
            <Segmented
              options={["F", "M"] as const}
              value={draft.gender}
              onChange={(option) => patchGuest(draft.key, { gender: option })}
              format={(option) => t.gender[option]}
              label={t.roster.playsAs}
            />
            <LevelPicker
              value={draft.level}
              onChange={(option) => patchGuest(draft.key, { level: option })}
              min={lowest}
              allowUnsure
              label={t.roster.level}
            />
            {draft.level === null ? guideHint : null}
            <input type="hidden" name={`guestGender_${index}`} value={draft.gender} />
            <input type="hidden" name={`guestLevel_${index}`} value={draft.level ?? ""} />
          </div>
        ))}

        {!guest && guests.length < LIMITS.maxGuests ? (
          <button type="button" className="button button--quiet" onClick={addGuestDraft}>
            {t.public.addGuest}
          </button>
        ) : null}

        {waitlisted ? <Notice tone="warn">{t.public.waitlistWarning}</Notice> : null}

        {guest ? (
          <div className="row">
            <button type="submit" className="button button--accent button--small" disabled={pending || unsure}>
              {t.public.addGuestSubmit}
            </button>
            {onCancel ? (
              <button type="button" className="button button--quiet button--small" disabled={pending} onClick={onCancel}>
                {t.roster.cancelEdit}
              </button>
            ) : null}
          </div>
        ) : (
          <button type="submit" className="button button--accent button--full" disabled={pending || unsure}>
            {guests.length > 0 ? t.public.registerGroup : t.public.register}
          </button>
        )}
      </form>
    </div>
  );
}
