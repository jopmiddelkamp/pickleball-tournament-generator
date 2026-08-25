"use client";

import { computeNightPoints } from "@ptg/core";
import { settleForScoring } from "../lib/evening";
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
import { GenderChip, Notice, Wordmark } from "./ui";

type PublicTab = "now" | "standings" | "coming";

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

  // The card shows one form at a time: the editor and the +1 form replace each other.
  function openEditor(id: string) {
    setGuestFormOpen(false);
    setEditingId(id);
  }

  function openGuestForm() {
    setEditingId(null);
    setGuestFormOpen(true);
  }

  function editButton(id: string) {
    return (
      <button type="button" className="button button--quiet button--small" disabled={pending} onClick={() => openEditor(id)}>
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
  // Gender/level for the rows the visitor may correct: their own and their +1s.
  const editable = new Map<string, PlayerProfile>();
  if (you && yourId) {
    editable.set(yourId, { gender: you.gender, level: you.level });
    for (const guest of you.guests) editable.set(guest.id, { gender: guest.gender, level: guest.level });
  }
  // The visitor's own rows (self first, then +1s), in the same shape as the public list.
  const mineRows = view.signedUp
    .filter((entry) => editable.has(entry.id))
    .map((entry) => ({ entry, self: entry.id === yourId }))
    .sort((a, b) => Number(b.self) - Number(a.self));
  // The row being corrected; its editor renders in the visitor's card.
  const editingEntry = editingId ? view.signedUp.find((entry) => entry.id === editingId) : undefined;
  const editingProfile = editingId ? editable.get(editingId) : undefined;
  const editing = editingEntry && editingProfile ? { id: editingEntry.id, profile: editingProfile } : null;

  const rounds = view.schedule?.rounds ?? [];
  const settledGames = settleForScoring(view.games, {
    status: view.status,
    roundsStarted: view.roundsStarted,
    rounds: rounds.length,
    gameTarget: view.gameTarget,
    roundMinutes: view.roundMinutes,
  });
  const night = view.schedule ? computeNightPoints(view.players, view.schedule.rounds, settledGames) : null;
  const liveRound = rounds[view.roundsStarted - 1];
  const browseRound = rounds[browseIndex];

  // The attendee list: a tab of its own once the evening is live, a section before that.
  const signedUp = (
    <section className="screen__block">
      <h3 className="screen__section">{t.public.signedUpHeading(view.signedUp.length)}</h3>
      {view.signedUp.length === 0 ? (
        <p className="standings__detail">{t.public.nobodyYet}</p>
      ) : (
        <ul className="plain-list">
          {view.signedUp.map((entry, index) => {
            const self = entry.id === view.yourId;
            const mine = self || guestIds.has(entry.id);
            return (
              <li key={entry.id} className="roster__item" aria-current={mine || undefined}>
                <span className="standings__rank roster__number">{index + 1}</span>
                <GenderChip gender={entry.gender} />
                <span className="roster__name">
                  {entry.name}
                  {mine ? <span className="roster__you"> · {self ? t.public.you : t.public.yourGuest}</span> : null}
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
  );

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
        <p className="screen__lede">
          {t.public.playedTo(view.gameTarget)}
          {view.roundMinutes !== null ? ` ${t.public.timeLimit(view.roundMinutes)}` : null}
        </p>

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
                    settledGames={settledGames}
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
                <ul className="plain-list">
                  {mineRows.map(({ entry, self }) => (
                    <li key={entry.id} className={editing?.id === entry.id ? "form-under" : undefined}>
                      <div className="roster__item">
                      <GenderChip gender={entry.gender} />
                      <span className="roster__name">
                        {entry.name}
                        <span className="roster__you"> · {self ? t.public.you : t.public.yourGuest}</span>
                      </span>
                      <span className="roster__level">
                        {entry.confirmed ? t.public.guestConfirmed : t.public.guestWaiting(entry.position ?? 0)}
                      </span>
                      {you.canCancel ? (
                        <>
                          {editButton(entry.id)}
                          {!self ? (
                            <button
                              type="button"
                              className="button button--quiet button--small"
                              disabled={pending}
                              onClick={() => cancelGuest(entry.id)}
                            >
                              {t.roster.remove}
                            </button>
                          ) : null}
                        </>
                      ) : null}
                      </div>
                      {editing?.id === entry.id ? (
                        <ProfileEditor
                          key={entry.id}
                          initial={editing.profile}
                          pending={pending}
                          onSave={(next) => saveProfile(entry.id, next)}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
                {you.canAddGuest ? (
                  guestFormOpen ? (
                    <div className="form-under">
                      <PublicRegisterForm
                        key={you.guests.length}
                        slug={view.slug}
                        capacityLeft={Math.max(0, view.capacity - view.confirmedCount)}
                        guest
                        onCancel={() => setGuestFormOpen(false)}
                      />
                    </div>
                  ) : (
                    <button type="button" className="button button--quiet" onClick={openGuestForm}>
                      {t.public.addGuest}
                    </button>
                  )
                ) : null}
                {you.canCancel ? (
                  <button type="button" className="button button--quiet" disabled={pending} onClick={cancel}>
                    {you.guests.length > 0 ? t.public.cancelGroup : t.public.cancel}
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
              <div className="screen__block stack">
                <Segmented
                  options={["now", "standings", "coming"] as const}
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
                    settledGames={settledGames}
                    roundNumber={view.roundsStarted}
                    highlightId={view.yourId}
                  />
                ) : tab === "standings" ? (
                  <StandingsScreen night={night} players={view.players} hasSchedule={true} />
                ) : (
                  signedUp
                )}
              </div>
            ) : (
              signedUp
            )}
          </>
        )}
      </div>
    </main>
  );
}
