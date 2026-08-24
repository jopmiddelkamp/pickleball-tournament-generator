"use client";

import type { AlgorithmScore, GameResult, Player, Schedule } from "@ptg/core";
import Link from "next/link";
import { useState } from "react";
import { features } from "../lib/features";
import { useLocale } from "../lib/i18n/useLocale";
import { CourtCard } from "./CourtCard";
import { EmptyState, GenderChip, Notice } from "./ui";

/** Names the laws a swap has just broken, so the organiser sees the cost. */
function brokenLaws(score: AlgorithmScore, joiner: string): string {
  return score.laws
    .filter((law) => !law.passed)
    .map((law) => law.id)
    .join(joiner);
}

export function ScheduleScreen({
  schedule,
  players,
  games,
  score,
  printHref,
  roundsStarted,
  finished,
  onScoreChange,
  onVoidChange,
  onSwap,
  onStartRound,
  onEndEvening,
}: {
  schedule: Schedule | null;
  players: Player[];
  games: GameResult[];
  /** SPEC-2 score of the schedule as it stands; shown only while swapping */
  score: AlgorithmScore | null;
  printHref: string;
  roundsStarted: number;
  finished: boolean;
  onScoreChange: (roundIndex: number, court: number, side: "A" | "B", points: number | null) => void;
  onVoidChange: (roundIndex: number, court: number, voided: boolean) => void;
  onSwap: (roundIndex: number, a: string, b: string) => void;
  onStartRound: () => void;
  onEndEvening: () => void;
}) {
  const { t } = useLocale();
  const [roundIndex, setRoundIndex] = useState(() =>
    schedule ? Math.max(0, Math.min(roundsStarted - 1, schedule.rounds.length - 1)) : 0,
  );
  const [swapping, setSwapping] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

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

  function handleSelect(playerId: string) {
    if (!selected) {
      setSelected(playerId);
      return;
    }
    if (selected === playerId) {
      setSelected(null);
      return;
    }
    onSwap(current, selected, playerId);
    setSelected(null);
  }

  const swapMode = features.manualSwap && swapping;
  const broken = score ? brokenLaws(score, t.schedule.lawJoiner) : "";

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 className="screen__heading">{t.schedule.heading}</h2>
        <Link className="standings__detail" href={printHref}>
          {t.schedule.print}
        </Link>
      </div>
      {roundsStarted > 0 && !finished ? (
        <p className="standings__detail">{t.schedule.currentRound(roundsStarted)}</p>
      ) : null}

      {finished ? (
        <Notice>{t.schedule.ended}</Notice>
      ) : roundsStarted < schedule.rounds.length ? (
        <>
          {roundsStarted === 0 ? <p className="standings__detail">{t.schedule.notStarted}</p> : null}
          <button
            type="button"
            className="button button--accent button--full"
            style={{ marginBottom: 14 }}
            onClick={onStartRound}
          >
            {t.schedule.startRound(roundsStarted + 1)}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="button button--danger button--full"
          style={{ marginBottom: 14 }}
          onClick={onEndEvening}
        >
          {t.schedule.endEvening}
        </button>
      )}

      <nav className="rounds" aria-label={t.schedule.rounds}>
        {schedule.rounds.map((_, index) => (
          <button
            key={index}
            type="button"
            className="rounds__chip"
            aria-current={index === current}
            onClick={() => {
              setRoundIndex(index);
              setSelected(null);
            }}
          >
            {t.schedule.roundChip(index + 1)}
          </button>
        ))}
      </nav>

      {features.manualSwap ? (
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
          <span className="standings__detail">
            {swapMode ? (
              <>
                {selected ? t.schedule.tapTarget : t.schedule.tapToMove}
                {score
                  ? ` ${
                      broken
                        ? t.schedule.scoresBroken(score.final.toFixed(1), broken)
                        : t.schedule.scores(score.final.toFixed(1))
                    }`
                  : null}
              </>
            ) : (
              t.schedule.roundOf(current + 1, schedule.rounds.length)
            )}
          </span>
          <button
            type="button"
            className="button button--quiet button--small"
            aria-pressed={swapping}
            onClick={() => {
              setSwapping(!swapping);
              setSelected(null);
            }}
          >
            {swapMode ? t.schedule.done : t.schedule.swap}
          </button>
        </div>
      ) : null}

      {round.matches.map((match) => (
        <CourtCard
          key={match.court}
          match={match}
          roundIndex={current}
          playerById={playerById}
          result={games.find((g) => g.round === current && g.court === match.court)}
          {...(features.scoreEntry && !swapMode
            ? {
                onScoreChange: (side: "A" | "B", points: number | null) =>
                  onScoreChange(current, match.court, side, points),
                onVoidChange: (voided: boolean) => onVoidChange(current, match.court, voided),
              }
            : {})}
          {...(swapMode ? { selectedPlayerId: selected, onSelectPlayer: handleSelect } : {})}
        />
      ))}

      {round.resting.length > 0 ? (
        <div className="bench">
          <p className="bench__title">{t.schedule.resting}</p>
          <div className="bench__names">
            {round.resting.map((id) => {
              const player = playerById.get(id);
              const className = [
                "bench__name",
                swapMode ? "bench__name--selectable" : "",
                selected === id ? "bench__name--selected" : "",
              ]
                .filter(Boolean)
                .join(" ");
              if (!swapMode) {
                return (
                  <span key={id} className={className}>
                    {player ? <GenderChip gender={player.gender} /> : null}
                    {player?.name ?? id}
                  </span>
                );
              }
              return (
                <button
                  key={id}
                  type="button"
                  className={className}
                  aria-pressed={selected === id}
                  onClick={() => handleSelect(id)}
                >
                  {player ? <GenderChip gender={player.gender} /> : null}
                  {player?.name ?? id}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
