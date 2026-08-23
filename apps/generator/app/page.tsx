"use client";

import {
  computeNightPoints,
  generateSchedule,
  scoreSchedule,
  type AlgorithmScore,
  type GameResult,
  type Player,
  type Round,
} from "@ptg/core";
import { useMemo, useState } from "react";
import { RosterScreen } from "../components/RosterScreen";
import { ScheduleScreen } from "../components/ScheduleScreen";
import { SetupScreen } from "../components/SetupScreen";
import { StandingsScreen } from "../components/StandingsScreen";
import { TabBar, TABS, type Tab } from "../components/TabBar";
import { Notice } from "../components/ui";
import { features } from "../lib/features";
import { normaliseConfig, type TournamentState } from "../lib/state";
import { newSeed } from "../lib/store";
import { useTournament } from "../lib/useTournament";

/** Swaps two players wherever they appear in one round. */
function swapInRound(round: Round, a: string, b: string): Round {
  const swap = (id: string) => (id === a ? b : id === b ? a : id);
  return {
    matches: round.matches.map((match) => ({
      court: match.court,
      teamA: [swap(match.teamA[0]), swap(match.teamA[1])] as [string, string],
      teamB: [swap(match.teamB[0]), swap(match.teamB[1])] as [string, string],
    })),
    resting: round.resting.map(swap),
  };
}

/** Keeps the entered result pointing at whoever is on that court now. */
function realignGames(games: GameResult[], roundIndex: number, rounds: Round[]): GameResult[] {
  const round = rounds[roundIndex];
  if (!round) return games;
  return games.map((game) => {
    if (game.round !== roundIndex) return game;
    const match = round.matches.find((m) => m.court === game.court);
    return match ? { ...game, teamA: match.teamA, teamB: match.teamB } : game;
  });
}

export default function Page() {
  const { state, update, startOver, notice, dismissNotice } = useTournament();
  const [tab, setTab] = useState<Tab>("roster");

  const visibleTabs = useMemo(
    () => TABS.filter((t) => t !== "standings" || features.scoreEntry),
    [],
  );

  const score: AlgorithmScore | null = useMemo(() => {
    if (!state?.schedule || state.schedule.rounds.length === 0) return null;
    return scoreSchedule(state.schedule.rounds, state.players, state.config);
  }, [state]);

  const night = useMemo(
    () =>
      state
        ? computeNightPoints(state.players, state.schedule?.rounds ?? [], state.games)
        : computeNightPoints([], [], []),
    [state],
  );

  if (!state) {
    return (
      <main className="app">
        <div className="app__main">
          <p className="empty">Loading tonight&rsquo;s evening…</p>
        </div>
      </main>
    );
  }

  function addPlayer(player: Omit<Player, "id">) {
    update((previous) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `p${previous.players.length}-${previous.config.seed}`;
      const players = [...previous.players, { ...player, id }];
      return { ...previous, players, config: normaliseConfig(previous.config, players.length) };
    });
  }

  function removePlayer(playerId: string) {
    update((previous) => {
      const players = previous.players.filter((p) => p.id !== playerId);
      // A schedule that still names someone who left is not a schedule.
      return {
        ...previous,
        players,
        config: normaliseConfig(previous.config, players.length),
        schedule: null,
        games: [],
      };
    });
  }

  function generate() {
    update((previous) => {
      const config = normaliseConfig(previous.config, previous.players.length);
      return {
        ...previous,
        config,
        schedule: generateSchedule(previous.algorithmId, previous.players, config),
        games: [],
      };
    });
    setTab("schedule");
  }

  function setScore(roundIndex: number, court: number, side: "A" | "B", points: number | null) {
    update((previous) => {
      const match = previous.schedule?.rounds[roundIndex]?.matches.find((m) => m.court === court);
      if (!match) return previous;
      const existing = previous.games.find((g) => g.round === roundIndex && g.court === court);
      const base: GameResult = existing ?? {
        round: roundIndex,
        court,
        teamA: match.teamA,
        teamB: match.teamB,
        pointsA: 0,
        pointsB: 0,
        voided: false,
      };
      const updated: GameResult = {
        ...base,
        teamA: match.teamA,
        teamB: match.teamB,
        [side === "A" ? "pointsA" : "pointsB"]: points ?? 0,
      };
      const games = existing
        ? previous.games.map((g) => (g === existing ? updated : g))
        : [...previous.games, updated];
      return { ...previous, games };
    });
  }

  function setVoided(roundIndex: number, court: number, voided: boolean) {
    update((previous) => {
      const match = previous.schedule?.rounds[roundIndex]?.matches.find((m) => m.court === court);
      if (!match) return previous;
      const existing = previous.games.find((g) => g.round === roundIndex && g.court === court);
      if (!existing) {
        return {
          ...previous,
          games: [
            ...previous.games,
            {
              round: roundIndex,
              court,
              teamA: match.teamA,
              teamB: match.teamB,
              pointsA: 0,
              pointsB: 0,
              voided,
            },
          ],
        };
      }
      return {
        ...previous,
        games: previous.games.map((g) => (g === existing ? { ...g, voided } : g)),
      };
    });
  }

  function swapPlayers(roundIndex: number, a: string, b: string) {
    update((previous) => {
      if (!previous.schedule) return previous;
      const rounds = previous.schedule.rounds.map((round, index) =>
        index === roundIndex ? swapInRound(round, a, b) : round,
      );
      return {
        ...previous,
        schedule: { ...previous.schedule, rounds },
        games: realignGames(previous.games, roundIndex, rounds),
      };
    });
  }

  function resetEvening() {
    startOver();
    setTab("roster");
  }

  const current: TournamentState = state;

  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">
          Mixed doubles <span>night</span>
        </h1>
        <span className="app__meta">
          {current.players.length}p · {current.config.courts}
          {current.config.courts === 1 ? " court" : " courts"}
        </span>
      </header>

      <div className="app__main">
        {notice ? (
          <Notice tone="warn" onDismiss={dismissNotice}>
            {notice}
          </Notice>
        ) : null}

        {tab === "roster" ? (
          <RosterScreen players={current.players} onAdd={addPlayer} onRemove={removePlayer} />
        ) : null}

        {tab === "setup" ? (
          <SetupScreen
            config={current.config}
            playerCount={current.players.length}
            algorithmId={current.algorithmId}
            gameTarget={current.gameTarget}
            score={score}
            onConfigChange={(change) =>
              update((previous) => ({
                ...previous,
                config: normaliseConfig({ ...previous.config, ...change }, previous.players.length),
              }))
            }
            onAlgorithmChange={(algorithmId) => update((previous) => ({ ...previous, algorithmId }))}
            onGameTargetChange={(gameTarget) => update((previous) => ({ ...previous, gameTarget }))}
            onReroll={() =>
              update((previous) => ({
                ...previous,
                config: {
                  ...previous.config,
                  seed: newSeed(),
                },
              }))
            }
            onGenerate={generate}
            onClear={resetEvening}
          />
        ) : null}

        {tab === "schedule" ? (
          <ScheduleScreen
            schedule={current.schedule}
            players={current.players}
            games={current.games}
            score={score}
            onScoreChange={setScore}
            onVoidChange={setVoided}
            onSwap={swapPlayers}
          />
        ) : null}

        {tab === "standings" && features.scoreEntry ? (
          <StandingsScreen
            night={night}
            players={current.players}
            hasSchedule={current.schedule !== null}
          />
        ) : null}
      </div>

      <TabBar active={tab} onChange={setTab} tabs={visibleTabs} />
    </main>
  );
}
