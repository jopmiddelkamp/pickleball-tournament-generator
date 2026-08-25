"use client";

import type { GameResult, Player, Schedule } from "@ptg/core";
import Link from "next/link";
import { useState } from "react";
import { features } from "../lib/features";
import { useLocale } from "../lib/i18n/useLocale";
import { CourtCard } from "./CourtCard";
import { RoundClock } from "./RoundClock";
import { EmptyState, GenderChip, Notice } from "./ui";

export function ScheduleScreen({
  schedule,
  players,
  games,
  settledGames,
  printHref,
  roundsStarted,
  finished,
  roundMinutes,
  clockStartedAt,
  onStartClock,
  onStopClock,
  onScoreChange,
  gameTarget,
  onVoidChange,
  onStartRound,
  onEndEvening,
}: {
  schedule: Schedule | null;
  players: Player[];
  games: GameResult[];
  /** games as scoring counts them (round clock applied) */
  settledGames: GameResult[];
  printHref: string;
  roundsStarted: number;
  finished: boolean;
  /** time limit per round; null when rounds are untimed */
  roundMinutes: number | null;
  clockStartedAt: string | null;
  onStartClock: () => void;
  onStopClock: () => void;
  onScoreChange: (roundIndex: number, court: number, side: "A" | "B", points: number | null) => void;
  /** the game target: scores cannot go past it */
  gameTarget: number;
  onVoidChange: (roundIndex: number, court: number, voided: boolean) => void;
  onStartRound: () => void;
  onEndEvening: () => void;
}) {
  const { t } = useLocale();
  const [roundIndex, setRoundIndex] = useState(() =>
    schedule ? Math.max(0, Math.min(roundsStarted - 1, schedule.rounds.length - 1)) : 0,
  );

  if (!schedule || schedule.rounds.length === 0) {
    return (
      <div>
        <h2 className="screen__heading">{t.schedule.heading}</h2>
        <EmptyState>{t.schedule.empty}</EmptyState>
      </div>
    );
  }

  const playerById = new Map(players.map((p) => [p.id, p]));
  const current = Math.min(roundIndex, schedule.rounds.length - 1);
  const round = schedule.rounds[current];
  if (!round) return null;

  return (
    <div>
      <div className="row row--split row--baseline">
        <h2 className="screen__heading">{t.schedule.heading}</h2>
        <Link className="standings__detail" href={printHref}>
          {t.schedule.print}
        </Link>
      </div>
      {roundsStarted > 0 && !finished ? (
        <p className="standings__detail">{t.schedule.currentRound(roundsStarted)}</p>
      ) : null}
      {roundsStarted > 0 && !finished && roundMinutes !== null ? (
        <RoundClock minutes={roundMinutes} startedAt={clockStartedAt} onStart={onStartClock} onStop={onStopClock} />
      ) : null}

      {finished ? (
        <Notice>{t.schedule.ended}</Notice>
      ) : roundsStarted < schedule.rounds.length ? (
        <>
          {roundsStarted === 0 ? <p className="standings__detail">{t.schedule.notStarted}</p> : null}
          <button
            type="button"
            className="button button--accent button--full"
            style={{ marginBottom: "var(--space-md)" }}
            onClick={onStartRound}
          >
            {t.schedule.startRound(roundsStarted + 1)}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="button button--danger button--full"
          style={{ marginBottom: "var(--space-md)" }}
          onClick={onEndEvening}
        >
          {t.schedule.endEvent}
        </button>
      )}

      <nav className="rounds" aria-label={t.schedule.rounds}>
        {schedule.rounds.map((_, index) => (
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
        {t.schedule.roundOf(current + 1, schedule.rounds.length)}
      </p>

      <div className="courts">
        {round.matches.map((match) => (
        <CourtCard
          key={match.court}
          match={match}
          roundIndex={current}
          playerById={playerById}
          result={games.find((g) => g.round === current && g.court === match.court)}
          settled={settledGames.find((g) => g.round === current && g.court === match.court)}
          {...(features.scoreEntry
            ? {
                onScoreChange: (side: "A" | "B", points: number | null) =>
                  onScoreChange(current, match.court, side, points),
                maxPoints: gameTarget,
                onVoidChange: (voided: boolean) => onVoidChange(current, match.court, voided),
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
    </div>
  );
}
