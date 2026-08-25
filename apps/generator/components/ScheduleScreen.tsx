"use client";

import type { GameResult, Player, Round } from "@ptg/core";
import Link from "next/link";
import { useState } from "react";
import { features } from "../lib/features";
import { useLocale } from "../lib/i18n/useLocale";
import { CourtCard } from "./CourtCard";
import { GamesTable } from "./GamesTable";
import { RoundClock } from "./RoundClock";
import { EmptyState, GenderChip, Notice } from "./ui";

/** What the organiser can do on the courts screen; absent on the public page, where none of it is rendered. */
export interface ScheduleControls {
  printHref: string;
  /** round 1 on court, then confirm the round on court (scores final) and put the next one on; the last one ends the event */
  onAdvanceRound: () => void;
  onStartClock: () => void;
  onStopClock: () => void;
  onScoreChange: (roundIndex: number, court: number, side: "A" | "B", points: number | null) => void;
  onVoidChange: (roundIndex: number, court: number, voided: boolean) => void;
}

interface VisitorMatch {
  court: number;
  partnerId: string;
  opponentIds: [string, string];
}

/** Where the visitor is in a round: on a court with a partner and two opponents, resting, or not in it at all. */
function findVisitor(round: Round, highlightId: string): VisitorMatch | "resting" | null {
  if (round.resting.includes(highlightId)) return "resting";
  for (const match of round.matches) {
    for (const [own, other] of [
      [match.teamA, match.teamB],
      [match.teamB, match.teamA],
    ] as const) {
      if (!own.includes(highlightId)) continue;
      const partnerId = own.find((id) => id !== highlightId);
      if (partnerId) return { court: match.court, partnerId, opponentIds: other };
    }
  }
  return null;
}

/**
 * The courts, round by round. The organiser's workspace and the public page
 * render the same screen; only the organiser gets the round button, the
 * clock's start and the score inputs, and only a visitor gets their own line.
 */
export function ScheduleScreen({
  rounds,
  players,
  games,
  settledGames,
  roundsStarted,
  finished,
  gameTarget,
  roundMinutes,
  clockStartedAt,
  highlightId = null,
  controls,
}: {
  /** the schedule's rounds; the public page never sees its seed or algorithm */
  rounds: Round[];
  players: Player[];
  games: GameResult[];
  /** games as scoring counts them (round clock applied) */
  settledGames: GameResult[];
  roundsStarted: number;
  finished: boolean;
  /** the game target: scores cannot go past it */
  gameTarget: number;
  /** time limit per round; null when rounds are untimed */
  roundMinutes: number | null;
  clockStartedAt: string | null;
  /** the visitor's own id on the public page */
  highlightId?: string | null;
  controls?: ScheduleControls;
}) {
  const { t } = useLocale();
  const [roundIndex, setRoundIndex] = useState(() =>
    Math.max(0, Math.min(roundsStarted - 1, rounds.length - 1)),
  );

  if (rounds.length === 0) {
    return (
      <div>
        <h2 className="screen__heading">{t.schedule.heading}</h2>
        <EmptyState>{t.schedule.empty}</EmptyState>
      </div>
    );
  }

  const playerById = new Map(players.map((p) => [p.id, p]));
  const nameOf = (id: string) => playerById.get(id)?.name ?? id;
  const current = Math.min(roundIndex, rounds.length - 1);
  const round = rounds[current];
  if (!round) return null;
  const onCourt = !finished && current === roundsStarted - 1;
  const visitor = highlightId ? findVisitor(round, highlightId) : null;

  return (
    <div>
      <div className="row row--split row--baseline">
        <h2 className="screen__heading">{t.schedule.heading}</h2>
        {controls ? (
          <Link className="standings__detail" href={controls.printHref}>
            {t.schedule.print}
          </Link>
        ) : null}
      </div>
      {roundsStarted > 0 && !finished ? (
        <p className="standings__detail">{t.schedule.currentRound(roundsStarted)}</p>
      ) : null}
      {roundsStarted > 0 && !finished && roundMinutes !== null ? (
        <RoundClock
          minutes={roundMinutes}
          startedAt={clockStartedAt}
          {...(controls ? { onStart: controls.onStartClock, onStop: controls.onStopClock } : {})}
        />
      ) : null}

      {finished ? (
        <Notice>{t.schedule.ended}</Notice>
      ) : roundsStarted === 0 ? (
        <p className="standings__detail">{controls ? t.schedule.notStarted : t.public.notStarted}</p>
      ) : null}
      {controls && !finished ? (
        <button
          type="button"
          className="button button--accent button--full"
          style={{ marginBottom: "var(--space-md)" }}
          onClick={controls.onAdvanceRound}
        >
          {roundsStarted === 0 ? t.schedule.startRound(1) : t.schedule.confirmRound(roundsStarted)}
        </button>
      ) : null}

      {finished ? (
        <GamesTable rounds={rounds} players={players} games={settledGames} highlightId={highlightId} />
      ) : (
        <>
          <nav className="rounds" aria-label={t.schedule.rounds}>
            {rounds.map((_, index) => (
              <button
                key={index}
                type="button"
                className="rounds__chip"
                aria-current={index === current}
                onClick={() => setRoundIndex(index)}
              >
                {t.schedule.roundChip(index + 1)}
              </button>
            ))}
          </nav>

          <p className="standings__detail" style={{ marginBottom: "var(--space-md)" }}>
            {t.schedule.roundOf(current + 1, rounds.length)}
          </p>

          {visitor === "resting" ? (
            <Notice>{t.public.youRest}</Notice>
          ) : visitor ? (
            <Notice>
              {t.public.yourCourt(visitor.court, nameOf(visitor.partnerId), nameOf(visitor.opponentIds[0]), nameOf(visitor.opponentIds[1]))}
            </Notice>
          ) : null}

          <div className="courts">
            {round.matches.map((match) => (
              <CourtCard
                key={match.court}
                match={match}
                roundIndex={current}
                playerById={playerById}
                result={games.find((g) => g.round === current && g.court === match.court)}
                settled={settledGames.find((g) => g.round === current && g.court === match.court)}
                highlightPlayerId={highlightId}
                {...(controls && features.scoreEntry && onCourt
                  ? {
                      onScoreChange: (side: "A" | "B", points: number | null) =>
                        controls.onScoreChange(current, match.court, side, points),
                      maxPoints: gameTarget,
                      onVoidChange: (voided: boolean) => controls.onVoidChange(current, match.court, voided),
                    }
                  : {})}
              />
            ))}
          </div>

          {round.resting.length > 0 ? (
            <div className="bench">
              <p className="bench__title">{t.schedule.resting}</p>
              <div className="bench__names">
                {round.resting.map((id) => {
                  const player = playerById.get(id);
                  return (
                    <span key={id} className="bench__name">
                      {player ? <GenderChip gender={player.gender} /> : null}
                      {player?.name ?? id}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
