"use client";

import { useState, useTransition } from "react";
import { cancelMyRegistrationAction } from "../lib/actions/public";
import type { PublicFormState } from "../lib/actions/publicState";
import { useLocale } from "../lib/i18n/useLocale";
import type { PublicView } from "../lib/public";
import { LanguageSelect } from "./LanguageSelect";
import { PublicRegisterForm } from "./PublicRegisterForm";
import { Notice } from "./ui";

export function PublicTournament({ view }: { view: PublicView }) {
  const { t, locale } = useLocale();
  const [pending, startTransition] = useTransition();
  const [cancelError, setCancelError] = useState<PublicFormState["error"]>(null);

  const when = new Date(view.startsAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });

  function cancel() {
    startTransition(async () => {
      const result = await cancelMyRegistrationAction(view.slug);
      setCancelError(result.error);
    });
  }

  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">
          {t.title[0]} <span>{t.title[1]}</span>
        </h1>
        <LanguageSelect className="app__language" />
      </header>
      <div className="app__main">
        <h2 className="screen__heading">{view.name}</h2>
        <p className="screen__lede">{t.public.startsAt(when)}</p>

        {cancelError ? (
          <Notice tone="warn" onDismiss={() => setCancelError(null)}>
            {t.public.errors[cancelError]}
          </Notice>
        ) : null}

        {view.you ? (
          <div className="card stack">
            <Notice>{view.you.confirmed ? t.public.youAreIn : t.public.waiting(view.you.position ?? 0)}</Notice>
            {view.you.canCancel ? (
              <button type="button" className="button button--quiet" disabled={pending} onClick={cancel}>
                {t.public.cancel}
              </button>
            ) : (
              <p className="standings__detail">{t.public.frozen}</p>
            )}
          </div>
        ) : view.status === "open" && !view.full ? (
          <>
            <PublicRegisterForm slug={view.slug} waitlisted={view.confirmedCount >= view.capacity} />
            <p className="standings__detail">{t.public.spots(view.confirmedCount, view.capacity, view.waitingCount)}</p>
          </>
        ) : (
          <Notice>{view.full ? t.public.fullMessage : t.public.closed}</Notice>
        )}
      </div>
    </main>
  );
}
