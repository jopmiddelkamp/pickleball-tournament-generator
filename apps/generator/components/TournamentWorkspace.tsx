"use client";

import { computeNightPoints, scoreSchedule, type GameResult, type Player } from "@ptg/core";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { addWalkInAction, removeRegistrationAction, setRegistrationOpenAction } from "../lib/actions/registrations";
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
import { CopyEventLink } from "./CopyEventLink";
import { RosterScreen } from "./RosterScreen";
import { ScheduleScreen } from "./ScheduleScreen";
import { SetupScreen } from "./SetupScreen";
import { StandingsScreen } from "./StandingsScreen";
import { TabBar, TABS, type Tab } from "./TabBar";
import { Notice } from "./ui";

export function TournamentWorkspace({ view }: { view: WorkspaceView }) {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>(view.status === "finished" ? "standings" : view.schedule ? "schedule" : "roster");
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
        <CopyEventLink slug={view.slug} />
      </div>
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
          onAdd={(player) => run(() => addWalkInAction(view.id, player))}
          onRemove={(id) => run(() => removeRegistrationAction(view.id, id))}
          onToggleRegistration={(open) => run(() => setRegistrationOpenAction(view.id, open))}
        />
      ) : null}

      {tab === "setup" ? (
        <SetupScreen
          config={view.config}
          playerCount={players.length}
          maxCourts={view.maxCourts}
          usingSuggestion={view.usingSuggestion}
          algorithmId={view.algorithmId}
          gameTarget={view.gameTarget}
          score={score}
          generateBlocker={generateBlocker}
          hasSchedule={scheduleStored}
          onConfigChange={(change) => run(() => updateSetupAction(view.id, change))}
          onUseSuggestion={() => run(() => updateSetupAction(view.id, { useSuggestion: true }))}
          onAlgorithmChange={(algorithmId) => run(() => updateSetupAction(view.id, { algorithmId }))}
          onGameTargetChange={(gameTarget) => run(() => updateSetupAction(view.id, { gameTarget }))}
          onReroll={() => run(() => rerollAction(view.id))}
          onGenerate={() => run(() => generateAction(view.id), () => setTab("schedule"))}
          onDiscard={() => run(() => discardScheduleAction(view.id), () => setTab("roster"))}
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

      <TabBar active={tab} onChange={setTab} tabs={visibleTabs} />
    </>
  );
}
