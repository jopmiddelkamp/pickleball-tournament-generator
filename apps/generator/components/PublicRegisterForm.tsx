"use client";

import type { Gender, Level } from "@ptg/core";
import { useActionState, useState } from "react";
import { addGuestAction, registerAction } from "../lib/actions/public";
import { INITIAL_PUBLIC_STATE } from "../lib/actions/publicState";
import { LIMITS } from "../lib/config";
import { useLocale } from "../lib/i18n/useLocale";
import { Notice } from "./ui";

const LEVELS: Level[] = [1, 2, 3, 4, 5, 6];

/**
 * Same fields as the organiser's roster form (name, gender, level), bound to
 * the public register Server Action instead. `waitlisted` is true once the
 * confirmed roster is already full: registration itself is still open, but a
 * new sign-up here would land on the waiting list.
 */
export function PublicRegisterForm({ slug, waitlisted, guest = false }: { slug: string; waitlisted: boolean; guest?: boolean }) {
  const { t } = useLocale();
  const [state, formAction, pending] = useActionState((guest ? addGuestAction : registerAction).bind(null, slug), INITIAL_PUBLIC_STATE);
  const [gender, setGender] = useState<Gender>("F");
  const [level, setLevel] = useState<Level>(3);

  return (
    <div>
      {guest ? (
        <>
          <h3 className="screen__heading" style={{ fontSize: 18 }}>{t.public.guestHeading}</h3>
          <p className="screen__lede">{t.public.guestLede}</p>
        </>
      ) : (
        <>
          <h2 className="screen__heading">{t.public.registerHeading}</h2>
          <p className="screen__lede">{t.public.registerLede}</p>
        </>
      )}

      {state.error ? <Notice tone="warn">{t.public.errors[state.error]}</Notice> : null}

      <form className="card stack" action={formAction}>
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
          <div className="segmented" role="group" aria-labelledby="public-gender-label">
            {(["F", "M"] as const).map((option) => (
              <button
                key={option}
                type="button"
                className="segmented__option"
                aria-pressed={gender === option}
                onClick={() => setGender(option)}
              >
                {t.gender[option]}
              </button>
            ))}
          </div>
          <input type="hidden" name="gender" value={gender} />
        </div>

        <div>
          <span className="label" id="public-level-label">
            {t.roster.level}
          </span>
          <div className="levels" role="group" aria-labelledby="public-level-label">
            {LEVELS.map((option) => (
              <button
                key={option}
                type="button"
                className="levels__option"
                aria-pressed={level === option}
                onClick={() => setLevel(option)}
              >
                {t.levels[option]}
              </button>
            ))}
          </div>
          <input type="hidden" name="level" value={level} />
        </div>

        {waitlisted ? <Notice tone="warn">{t.public.waitlistWarning}</Notice> : null}

        <button type="submit" className="button button--accent button--full" disabled={pending}>
          {guest ? t.public.addGuest : t.public.register}
        </button>
      </form>
    </div>
  );
}
