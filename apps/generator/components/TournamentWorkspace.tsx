"use client";

import { computeNightPoints, scoreSchedule, type GameResult, type Player } from "@ptg/core";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { removeRegistrationAction } from "../lib/actions/registrations";
import type { ActionError, ActionResult } from "../lib/actions/result";
import {
  backToRegistrationAction,
  endEventAction,
  recordScoreAction,
  rerollAction,
  setVoidedAction,
  startEventAction,
  startRoundAction,
  swapPlayersAction,
  updateSetupAction,
} from "../lib/actions/tournaments";
import { withScore, withVoided } from "../lib/evening";
import { features } from "../lib/features";
import { useLocale } from "../lib/i18n/useLocale";
import type { WorkspaceView } from "../lib/tournament";
import Link from "next/link";
import { AdjustSchedule } from "./AdjustSchedule";
import { CopyButton } from "./CopyButton";
import { CopyEventLink } from "./CopyEventLink";
import { RosterScreen } from "./RosterScreen";
import { ScheduleScreen } from "./ScheduleScreen";
import { StandingsScreen } from "./StandingsScreen";
import { TabBar, TABS, type Tab } from "./TabBar";
import { Notice } from "./ui";

export function TournamentWorkspace({ view, initialDemoted = 0 }: { view: WorkspaceView; initialDemoted?: number }) {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>(view.status === "finished" ? "standings" : view.schedule ? "schedule" : "roster");
  const [demotedNotice, setDemotedNotice] = useState(initialDemoted);
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

  // Derived from the raw column via view.status, not the parsed view.schedule: an unreadable
  // schedule still needs to freeze the roster and offer Discard, so the organiser has a way out.
  const scheduleStored = view.status === "generated" || view.status === "live" || view.status === "finished";

  return (
    <>
      <TabBar active={tab} onChange={setTab} tabs={visibleTabs} />
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 className="screen__heading">{view.name}</h2>
        <div className="row">
          <Link href={`/organiser/event/${view.id}/edit`} className="button button--quiet button--small">
            {t.organiser.edit.open}
          </Link>
          <CopyEventLink slug={view.slug} name={view.name} startsAt={view.startsAt} location={view.location} />
        </div>
      </div>
      {demotedNotice > 0 ? (
        <Notice
          tone="warn"
          onDismiss={() => {
            setDemotedNotice(0);
            window.history.replaceState(null, "", `/organiser/event/${view.id}`);
          }}
        >
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

      {view.notice ? <Notice tone="warn">{t.workspace.unreadable}</Notice> : null}
      {error ? (
        <Notice tone="warn" onDismiss={() => setError(null)}>
          {t.workspace.errors[error]}
        </Notice>
      ) : null}

      {tab === "roster" ? (
        <RosterScreen
          confirmed={view.confirmed}
          waiting={view.waiting}
          maxPlayers={view.maxPlayers}
          guestHosts={view.guestHosts}
          registrationOpen={view.registrationOpen}
          frozen={scheduleStored}
          canStart={players.length >= 4}
          canGoBack={view.roundsStarted === 0}
          onStart={() => run(() => startEventAction(view.id), () => setTab("schedule"))}
          onBackToRegistration={() => run(() => backToRegistrationAction(view.id))}
          onRemove={(id) => {
            // Removing a confirmed player while others wait silently promotes
            // the first waiter; the organiser should announce that.
            const promotes = view.waiting.length > 0 && view.confirmed.some((p) => p.id === id);
            run(() => removeRegistrationAction(view.id, id), () => {
              if (promotes) setPromotedNotice(true);
            });
          }}
        />
      ) : null}

      {tab === "schedule" && view.schedule && view.roundsStarted === 0 && view.status !== "finished" ? (
        <AdjustSchedule
          config={view.config}
          playerCount={players.length}
          maxCourts={view.maxCourts}
          usingSuggestion={view.usingSuggestion}
          score={score}
          onConfigChange={(change) => run(() => updateSetupAction(view.id, change))}
          onUseSuggestion={() => run(() => updateSetupAction(view.id, { useSuggestion: true }))}
          onReroll={() => run(() => rerollAction(view.id))}
        />
      ) : null}

      {tab === "schedule" ? (
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
    </>
  );
}
