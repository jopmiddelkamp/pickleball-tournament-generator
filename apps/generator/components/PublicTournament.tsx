"use client";

import { computeNightPoints } from "@ptg/core";
import { useState, useTransition } from "react";
import { cancelGuestAction, cancelMyRegistrationAction, updateProfileAction } from "../lib/actions/public";
import type { PublicFormState } from "../lib/actions/publicState";
import { useLocale } from "../lib/i18n/useLocale";
import type { PublicView } from "../lib/public";
import type { PlayerProfile } from "../lib/validate";
import { EventBanner } from "./EventBanner";
import { LanguageSelect } from "./LanguageSelect";
import { ProfileEditor } from "./ProfileEditor";
import { PublicRegisterForm } from "./PublicRegisterForm";
import { Segmented } from "./Segmented";
import { RoundView } from "./RoundView";
import { StandingsScreen } from "./StandingsScreen";
import { Notice, Wordmark } from "./ui";

type PublicTab = "now" | "standings";

export function PublicTournament({ view }: { view: PublicView }) {
  const { t, locale } = useLocale();
  const [pending, startTransition] = useTransition();
  const [cancelError, setCancelError] = useState<PublicFormState["error"]>(null);
  const [tab, setTab] = useState<PublicTab>("now");
  const [guestFormOpen, setGuestFormOpen] = useState(false);
  // registration id (own or a +1) whose gender/level is being corrected
  const [editingId, setEditingId] = useState<string | null>(null);
  // Which round the (finished-evening) chip strip is browsing; defaults to the last one played.
  const [browseIndex, setBrowseIndex] = useState(() => Math.max(0, (view.schedule?.rounds.length ?? 1) - 1));


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

  function saveProfile(id: string, profile: PlayerProfile) {
    startTransition(async () => {
      const result = await updateProfileAction(view.slug, id, profile);
      setCancelError(result.error);
      if (!result.error) setEditingId(null);
    });
  }

  function editButton(id: string) {
    return (
      <button type="button" className="button button--quiet button--small" disabled={pending} onClick={() => setEditingId(id)}>
        {t.roster.edit}
      </button>
    );
  }

  // you and yourId are set together: a matched cookie yields both.
  const { you, yourId } = view;
  const registeredWhen = view.you
    ? new Date(view.you.registeredAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })
    : null;
  const guestIds = new Set(view.you?.guests.map((guest) => guest.id) ?? []);

  const rounds = view.schedule?.rounds ?? [];
  const night = view.schedule ? computeNightPoints(view.players, view.schedule.rounds, view.games) : null;
  const liveRound = rounds[view.roundsStarted - 1];
  const browseRound = rounds[browseIndex];

  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">
          <Wordmark />
        </h1>
        <LanguageSelect />
      </header>
      <div className="app__main">
        <EventBanner name={view.name} startsAt={view.startsAt} location={view.location} />
        <p className="screen__lede">{t.public.playedTo(view.gameTarget)}</p>

        {cancelError ? (
          <Notice tone="warn" onDismiss={() => setCancelError(null)}>
            {t.public.errors[cancelError]}
          </Notice>
        ) : null}

        {view.status === "finished" && night ? (
          <>
            <h3 className="screen__section">
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
            {you && yourId ? (
              <div className="card stack">
                <Notice>
                  {you.confirmed ? t.public.youAreIn : t.public.waiting(you.position ?? 0)}
                  <br />
                  <span className="standings__detail">{t.public.registeredAs(you.name, registeredWhen ?? "")}</span>
                </Notice>
                <p className="standings__detail">{t.public.spots(view.confirmedCount, view.capacity, view.waitingCount)}</p>
                {you.canCancel ? (
                  editingId === yourId ? (
                    <ProfileEditor
                      name={you.name}
                      initial={{ gender: you.gender, level: you.level }}
                      pending={pending}
                      onSave={(profile) => saveProfile(yourId, profile)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="row row--split">
                      <span className="standings__detail">{t.public.editLede}</span>
                      {editButton(yourId)}
                    </div>
                  )
                ) : null}
                {you.guests.length > 0 ? (
                  <div>
                    <span className="label">{t.public.yourGuests}</span>
                    <ul className="plain-list">
                      {you.guests.map((guest) =>
                        editingId === guest.id ? (
                          <li key={guest.id}>
                            <ProfileEditor
                              name={guest.name}
                              initial={{ gender: guest.gender, level: guest.level }}
                              pending={pending}
                              onSave={(profile) => saveProfile(guest.id, profile)}
                              onCancel={() => setEditingId(null)}
                            />
                          </li>
                        ) : (
                          <li key={guest.id} className="roster__item">
                            <span className="roster__name">{guest.name}</span>
                            <span className="roster__level">
                              {guest.confirmed ? t.public.guestConfirmed : t.public.guestWaiting(guest.position ?? 0)}
                            </span>
                            {you.canCancel ? (
                              <>
                                {editButton(guest.id)}
                                <button
                                  type="button"
                                  className="button button--quiet button--small"
                                  disabled={pending}
                                  onClick={() => cancelGuest(guest.id)}
                                >
                                  {t.roster.remove}
                                </button>
                              </>
                            ) : null}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                ) : null}
                {you.canAddGuest ? (
                  guestFormOpen ? (
                    <PublicRegisterForm
                      key={you.guests.length}
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
                {you.canCancel ? (
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

            <section>
              <h3 className="screen__section">{t.public.signedUpHeading(view.signedUp.length)}</h3>
              {view.signedUp.length === 0 ? (
                <p className="standings__detail">{t.public.nobodyYet}</p>
              ) : (
                <ul className="plain-list">
                  {view.signedUp.map((entry) => {
                    const mine = entry.id === view.yourId || guestIds.has(entry.id);
                    return (
                      <li key={entry.id} className="roster__item" aria-current={mine || undefined}>
                        <span className="roster__name">
                          {entry.name}
                          {mine ? <span className="roster__you"> · {t.public.you}</span> : null}
                        </span>
                        <span className="roster__level">
                          {entry.confirmed ? t.public.guestConfirmed : t.public.guestWaiting(entry.position ?? 0)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {view.status === "live" && liveRound && night ? (
              <>
                <Segmented
                  options={["now", "standings"] as const}
                  value={tab}
                  onChange={setTab}
                  format={(option) => t.public.tabs[option]}
                  label={t.sections}
                />

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
