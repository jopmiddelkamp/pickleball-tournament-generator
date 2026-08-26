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
import { RosterScreen } from "./RosterScreen";
import { RulesScreen } from "./RulesScreen";
import { ScheduleScreen } from "./ScheduleScreen";
import { StandingsScreen } from "./StandingsScreen";
import { TabBar } from "./TabBar";
import { GenderChip, Notice, Wordmark } from "./ui";

/** Same three sections as the organiser's workspace, once a schedule exists. */
const PUBLIC_TABS = ["roster", "schedule", "standings", "rules"] as const;
type PublicTab = (typeof PUBLIC_TABS)[number];

export function PublicTournament({ view }: { view: PublicView }) {
  const { t, locale } = useLocale();
  const [pending, startTransition] = useTransition();
  const [cancelError, setCancelError] = useState<PublicFormState["error"]>(null);
  const [tab, setTab] = useState<PublicTab>(view.status === "finished" ? "standings" : "schedule");
  const [guestFormOpen, setGuestFormOpen] = useState(false);
  // registration id (own or a +1) whose gender/level is being corrected
  const [editingId, setEditingId] = useState<string | null>(null);


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

  // The attendee list is the same roster screen the organiser sees, minus the controls.
  const mine: Record<string, "you" | "guest"> = {};
  if (view.yourId) mine[view.yourId] = "you";
  for (const id of guestIds) mine[id] = "guest";
  const roster = (
    <RosterScreen
      confirmed={view.signedUp.filter((entry) => entry.confirmed)}
      waiting={view.signedUp.filter((entry) => !entry.confirmed)}
      maxPlayers={view.capacity}
      guestHosts={{}}
      registrationOpen={view.status === "open"}
      mine={mine}
    />
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
        {view.schedule && rounds.length > 0 ? (
          <TabBar active={tab} onChange={setTab} tabs={PUBLIC_TABS} label={(option) => t.tabs[option]} />
        ) : null}
        <EventBanner name={view.name} startsAt={view.startsAt} location={view.location} />
        <p className="screen__lede">
          {t.public.playedTo(view.gameTarget)}
          {view.roundMinutes !== null ? ` ${t.public.timeLimit(view.roundMinutes)}` : null}
          {view.minLevel !== null ? ` ${t.public.minLevel(t.levels[view.minLevel])}` : null}
        </p>

        {cancelError ? (
          <Notice tone="warn" onDismiss={() => setCancelError(null)}>
            {t.public.errors[cancelError]}
          </Notice>
        ) : null}

        {!view.schedule || rounds.length === 0 ? (
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
                          minLevel={view.minLevel}
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
                        minLevel={view.minLevel}
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
                <PublicRegisterForm slug={view.slug} capacityLeft={Math.max(0, view.capacity - view.confirmedCount)} minLevel={view.minLevel} />
                <p className="standings__detail">{t.public.spots(view.confirmedCount, view.capacity, view.waitingCount)}</p>
              </>
            ) : (
              <Notice>{view.full ? t.public.fullMessage : t.public.closed}</Notice>
            )}
            {roster}
          </>
        ) : tab === "roster" ? (
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
                          minLevel={view.minLevel}
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
                        minLevel={view.minLevel}
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
                <PublicRegisterForm slug={view.slug} capacityLeft={Math.max(0, view.capacity - view.confirmedCount)} minLevel={view.minLevel} />
                <p className="standings__detail">{t.public.spots(view.confirmedCount, view.capacity, view.waitingCount)}</p>
              </>
            ) : (
              <Notice>{view.full ? t.public.fullMessage : t.public.closed}</Notice>
            )}
            {roster}
          </>
        ) : tab === "schedule" ? (
          <ScheduleScreen
            rounds={rounds}
            players={view.players}
            games={view.games}
            settledGames={settledGames}
            roundsStarted={view.roundsStarted}
            finished={view.status === "finished"}
            gameTarget={view.gameTarget}
            roundMinutes={view.roundMinutes}
            clockStartedAt={view.clockStartedAt}
            highlightId={view.yourId}
          />
        ) : tab === "rules" ? (
          <RulesScreen gameTarget={view.gameTarget} roundMinutes={view.roundMinutes} />
        ) : night ? (
          <>
            <StandingsScreen night={night} players={view.players} hasSchedule={true} />
          </>
        ) : null}
      </div>
    </main>
  );
}
