"use client";

import { computeNightPoints, scoreSchedule, type GameResult, type Player } from "@ptg/core";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { removeRegistrationAction, setRegistrationOpenAction } from "../lib/actions/registrations";
import type { ActionError, ActionResult } from "../lib/actions/result";
import {
  discardScheduleAction,
  endEventAction,
  generateAction,
  recordScoreAction,
  rerollAction,
  setVoidedAction,
  startRoundAction,
  swapPlayersAction,
  updateSetupAction,
} from "../lib/actions/tournaments";
import { withScore, withVoided } from "../lib/evening";
import { features } from "../lib/features";
import { useLocale } from "../lib/i18n/useLocale";
import type { WorkspaceView } from "../lib/tournament";
import { CopyButton } from "./CopyButton";
import { CopyEventLink } from "./CopyEventLink";
import { EditEventForm } from "./EditEventForm";
import { RosterScreen } from "./RosterScreen";
import { ScheduleScreen } from "./ScheduleScreen";
import { SetupScreen } from "./SetupScreen";
import { StandingsScreen } from "./StandingsScreen";
import { TabBar, TABS, type Tab } from "./TabBar";
import { Notice } from "./ui";

export function TournamentWorkspace({ view }: { view: WorkspaceView }) {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>(view.status === "finished" ? "standings" : view.schedule ? "schedule" : "roster");
  const [editing, setEditing] = useState(false);
  const [demotedNotice, setDemotedNotice] = useState(0);
  const [promotedNotice, setPromotedNotice] = useState(false);
  const [error, setError] = useState<ActionError | null>(null);
  const [, startTransition] = useTransition();
  // Score entry is per keystroke; show it immediately, the server confirms.
  const [games, showGames] = useOptimistic(view.games, (_current: GameResult[], next: GameResult[]) => next);

  const visibleTabs = useMemo(() => TABS.filter((tab) => tab !== "standings" || features.scoreEntry), []);
  const players: Player[] = view.confirmed;

  const score = useMemo(
    () => (view.schedule && view.schedule.rounds.length > 0 ? scoreSchedule(view.schedule.rounds, players, view.config) : null),
    [view.schedule, players, view.config],
  );
  const night = useMemo(() => computeNightPoints(players, view.schedule?.rounds ?? [], games), [players, view.schedule, games]);

  function run(action: () => Promise<ActionResult>, onOk?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setError(null);
        onOk?.();
      } else {
        setError(result.error);
      }
    });
  }

  const generateBlocker = view.registrationOpen ? "open" : players.length < 4 ? "players" : null;
  // Derived from the raw column via view.status, not the parsed view.schedule: an unreadable
  // schedule still needs to freeze the roster and offer Discard, so the organiser has a way out.
  const scheduleStored = view.status === "generated" || view.status === "live" || view.status === "finished";

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 className="screen__heading">{view.name}</h2>
        <div className="row">
          <button type="button" className="button button--quiet button--small" onClick={() => setEditing(!editing)}>
            {t.organiser.edit.open}
          </button>
          <CopyEventLink slug={view.slug} name={view.name} startsAt={view.startsAt} />
        </div>
      </div>
      {demotedNotice > 0 ? (
        <Notice tone="warn" onDismiss={() => setDemotedNotice(0)}>
          {t.organiser.edit.notify(demotedNotice)}{" "}
          <CopyButton
            label={t.organiser.edit.copyUpdate}
            copiedLabel={t.organiser.copied}
            buildText={() => t.organiser.edit.updateDemoted(view.name, `${window.location.origin}/event/${view.slug}`)}
          />
        </Notice>
      ) : null}
      {promotedNotice ? (
        <Notice tone="warn" onDismiss={() => setPromotedNotice(false)}>
          {t.organiser.edit.notifyPromoted}{" "}
          <CopyButton
            label={t.organiser.edit.copyUpdate}
            copiedLabel={t.organiser.copied}
            buildText={() => t.organiser.edit.updatePromoted(view.name, `${window.location.origin}/event/${view.slug}`)}
          />
        </Notice>
      ) : null}
      {editing ? (
        <EditEventForm
          view={view}
          registered={view.confirmed.length + view.waiting.length}
          frozen={scheduleStored}
          onClose={() => setEditing(false)}
          onSaved={(demoted) => {
            setEditing(false);
            setDemotedNotice(demoted);
          }}
        />
      ) : null}
      {view.notice ? <Notice tone="warn">{t.workspace.unreadable}</Notice> : null}
      {error ? (
        <Notice tone="warn" onDismiss={() => setError(null)}>
          {t.workspace.errors[error]}
        </Notice>
      ) : null}

      {!editing && tab === "roster" ? (
        <RosterScreen
          confirmed={view.confirmed}
          waiting={view.waiting}
          maxPlayers={view.maxPlayers}
          guestHosts={view.guestHosts}
          registrationOpen={view.registrationOpen}
          frozen={scheduleStored}
          onRemove={(id) => {
            // Removing a confirmed player while others wait silently promotes
            // the first waiter; the organiser should announce that.
            const promotes = view.waiting.length > 0 && view.confirmed.some((p) => p.id === id);
            run(() => removeRegistrationAction(view.id, id), () => {
              if (promotes) setPromotedNotice(true);
            });
          }}
          onToggleRegistration={(open) => run(() => setRegistrationOpenAction(view.id, open))}
        />
      ) : null}

      {!editing && tab === "setup" ? (
        <SetupScreen
          config={view.config}
          playerCount={players.length}
          maxCourts={view.maxCourts}
          usingSuggestion={view.usingSuggestion}
          score={score}
          generateBlocker={generateBlocker}
          hasSchedule={scheduleStored}
          onConfigChange={(change) => run(() => updateSetupAction(view.id, change))}
          onUseSuggestion={() => run(() => updateSetupAction(view.id, { useSuggestion: true }))}
          onReroll={() => run(() => rerollAction(view.id))}
          onGenerate={() => run(() => generateAction(view.id), () => setTab("schedule"))}
          onDiscard={() => run(() => discardScheduleAction(view.id), () => setTab("roster"))}
        />
      ) : null}

      {!editing && tab === "schedule" ? (
        <ScheduleScreen
          // Remount when a new round starts: roundIndex is seeded once from useState and
          // otherwise never follows roundsStarted, so without this the screen would stay
          // on the old round after the organiser taps "Start round".
          key={view.roundsStarted}
          schedule={view.schedule}
          players={players}
          games={games}
          score={score}
          printHref={`/organiser/event/${view.id}/print`}
          roundsStarted={view.roundsStarted}
          finished={view.status === "finished"}
          onStartRound={() => run(() => startRoundAction(view.id))}
          onEndEvening={() => run(() => endEventAction(view.id))}
          onScoreChange={(roundIndex, court, side, points) => {
            const match = view.schedule?.rounds[roundIndex]?.matches.find((m) => m.court === court);
            if (!match) return;
            startTransition(async () => {
              showGames(withScore(games, match, roundIndex, side, points));
              const result = await recordScoreAction(view.id, roundIndex, court, side, points);
              if (!result.ok) setError(result.error);
            });
          }}
          onVoidChange={(roundIndex, court, voided) => {
            const match = view.schedule?.rounds[roundIndex]?.matches.find((m) => m.court === court);
            if (!match) return;
            startTransition(async () => {
              showGames(withVoided(games, match, roundIndex, voided));
              const result = await setVoidedAction(view.id, roundIndex, court, voided);
              if (!result.ok) setError(result.error);
            });
          }}
          onSwap={(roundIndex, a, b) => run(() => swapPlayersAction(view.id, roundIndex, a, b))}
        />
      ) : null}

      {tab === "standings" && features.scoreEntry ? (
        <StandingsScreen night={night} players={players} hasSchedule={view.schedule !== null} />
      ) : null}

      <TabBar active={tab} onChange={setTab} tabs={visibleTabs} />
    </>
  );
}
