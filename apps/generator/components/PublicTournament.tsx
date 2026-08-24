"use client";

import { computeNightPoints } from "@ptg/core";
import { useState, useTransition } from "react";
import { cancelGuestAction, cancelMyRegistrationAction } from "../lib/actions/public";
import type { PublicFormState } from "../lib/actions/publicState";
import { useLocale } from "../lib/i18n/useLocale";
import type { PublicView } from "../lib/public";
import { LanguageSelect } from "./LanguageSelect";
import { PublicRegisterForm } from "./PublicRegisterForm";
import { RoundView } from "./RoundView";
import { StandingsScreen } from "./StandingsScreen";
import { Notice } from "./ui";

type PublicTab = "now" | "standings";

export function PublicTournament({ view }: { view: PublicView }) {
  const { t, locale } = useLocale();
  const [pending, startTransition] = useTransition();
  const [cancelError, setCancelError] = useState<PublicFormState["error"]>(null);
  const [tab, setTab] = useState<PublicTab>("now");
  const [guestFormOpen, setGuestFormOpen] = useState(false);
  // Which round the (finished-evening) chip strip is browsing; defaults to the last one played.
  const [browseIndex, setBrowseIndex] = useState(() => Math.max(0, (view.schedule?.rounds.length ?? 1) - 1));

  const when = new Date(view.startsAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });

  function cancel() {
    startTransition(async () => {
      const result = await cancelMyRegistrationAction(view.slug);
      setCancelError(result.error);
    });
  }

  function cancelGuest(id: string) {
    startTransition(async () => {
      const result = await cancelGuestAction(view.slug, id);
      setCancelError(result.error);
    });
  }

  const rounds = view.schedule?.rounds ?? [];
  const night = view.schedule ? computeNightPoints(view.players, view.schedule.rounds, view.games) : null;
  const liveRound = rounds[view.roundsStarted - 1];
  const browseRound = rounds[browseIndex];

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
        <p className="screen__lede">
          {view.location ? <>{"\u{1F4CD}"} {view.location} · </> : null}
          {t.public.startsAt(when)} · {t.public.playedTo(view.gameTarget)}
        </p>

        {cancelError ? (
          <Notice tone="warn" onDismiss={() => setCancelError(null)}>
            {t.public.errors[cancelError]}
          </Notice>
        ) : null}

        {view.status === "finished" && night ? (
          <>
            <h3 className="screen__heading" style={{ fontSize: 18 }}>
              {t.public.finalHeading}
            </h3>
            <StandingsScreen night={night} players={view.players} hasSchedule={true} />

            {rounds.length > 0 ? (
              <>
                <nav className="rounds" aria-label={t.schedule.rounds}>
                  {rounds.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      className="rounds__chip"
                      aria-current={index === browseIndex}
                      onClick={() => setBrowseIndex(index)}
                    >
                      {t.schedule.roundChip(index + 1)}
                    </button>
                  ))}
                </nav>
                {browseRound ? (
                  <RoundView
                    round={browseRound}
                    players={view.players}
                    games={view.games}
                    roundNumber={browseIndex + 1}
                    highlightId={view.yourId}
                  />
                ) : null}
              </>
            ) : null}
          </>
        ) : (
          <>
            {view.you ? (
              <div className="card stack">
                <Notice>{view.you.confirmed ? t.public.youAreIn : t.public.waiting(view.you.position ?? 0)}</Notice>
                {view.you.guests.length > 0 ? (
                  <div>
                    <span className="label">{t.public.yourGuests}</span>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                      {view.you.guests.map((guest) => (
                        <li key={guest.id} className="roster__item">
                          <span className="roster__name">{guest.name}</span>
                          <span className="roster__level">
                            {guest.confirmed ? t.public.guestConfirmed : t.public.guestWaiting(guest.position ?? 0)}
                          </span>
                          {view.you?.canCancel ? (
                            <button
                              type="button"
                              className="button button--quiet button--small"
                              disabled={pending}
                              onClick={() => cancelGuest(guest.id)}
                            >
                              {t.roster.remove}
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {view.you.canAddGuest ? (
                  guestFormOpen ? (
                    <PublicRegisterForm
                      key={view.you.guests.length}
                      slug={view.slug}
                      capacityLeft={Math.max(0, view.capacity - view.confirmedCount)}
                      guest
                    />
                  ) : (
                    <button type="button" className="button button--quiet" onClick={() => setGuestFormOpen(true)}>
                      {t.public.addGuest}
                    </button>
                  )
                ) : null}
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
                <PublicRegisterForm slug={view.slug} capacityLeft={Math.max(0, view.capacity - view.confirmedCount)} />
                <p className="standings__detail">{t.public.spots(view.confirmedCount, view.capacity, view.waitingCount)}</p>
              </>
            ) : (
              <Notice>{view.full ? t.public.fullMessage : t.public.closed}</Notice>
            )}

            {view.status === "generated" ? <p className="standings__detail">{t.public.notStarted}</p> : null}

            {view.status === "live" && liveRound && night ? (
              <>
                <div className="segmented" role="group" aria-label={t.sections}>
                  <button
                    type="button"
                    className="segmented__option"
                    aria-pressed={tab === "now"}
                    onClick={() => setTab("now")}
                  >
                    {t.public.tabs.now}
                  </button>
                  <button
                    type="button"
                    className="segmented__option"
                    aria-pressed={tab === "standings"}
                    onClick={() => setTab("standings")}
                  >
                    {t.public.tabs.standings}
                  </button>
                </div>

                {tab === "now" ? (
                  <RoundView
                    round={liveRound}
                    players={view.players}
                    games={view.games}
                    roundNumber={view.roundsStarted}
                    highlightId={view.yourId}
                  />
                ) : (
                  <StandingsScreen night={night} players={view.players} hasSchedule={true} />
                )}
              </>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
