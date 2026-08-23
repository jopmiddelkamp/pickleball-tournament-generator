"use client";

import type { AlgorithmScore, GameResult, Player, Schedule } from "@ptg/core";
import Link from "next/link";
import { useState } from "react";
import { features } from "../lib/features";
import { CourtCard } from "./CourtCard";
import { EmptyState, GenderChip } from "./ui";

/** Names the laws a swap has just broken, so the organiser sees the cost. */
function brokenLaws(score: AlgorithmScore): string {
  return score.laws
    .filter((law) => !law.passed)
    .map((law) => law.id)
    .join(" and ");
}

export function ScheduleScreen({
  schedule,
  players,
  games,
  score,
  onScoreChange,
  onVoidChange,
  onSwap,
}: {
  schedule: Schedule | null;
  players: Player[];
  games: GameResult[];
  /** SPEC-2 score of the schedule as it stands; shown only while swapping */
  score: AlgorithmScore | null;
  onScoreChange: (roundIndex: number, court: number, side: "A" | "B", points: number | null) => void;
  onVoidChange: (roundIndex: number, court: number, voided: boolean) => void;
  onSwap: (roundIndex: number, a: string, b: string) => void;
}) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [swapping, setSwapping] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  if (!schedule || schedule.rounds.length === 0) {
    return (
      <div>
        <h2 className="screen__heading">Tonight&rsquo;s courts</h2>
        <EmptyState>
          No schedule yet. Add your players, then generate one from the Set up tab.
        </EmptyState>
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

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 className="screen__heading">Tonight&rsquo;s courts</h2>
        <Link className="standings__detail" href="/print">
          Print
        </Link>
      </div>

      <nav className="rounds" aria-label="Rounds">
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
            R{index + 1}
          </button>
        ))}
      </nav>

      {features.manualSwap ? (
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
          <span className="standings__detail">
            {swapMode ? (
              <>
                {selected ? "Now tap who they change places with." : "Tap a player to move them."}
                {score ? (
                  <>
                    {" "}
                    Schedule scores {score.final.toFixed(1)}
                    {brokenLaws(score) ? `, ${brokenLaws(score)} now broken` : ""}.
                  </>
                ) : null}
              </>
            ) : (
              `Round ${current + 1} of ${schedule.rounds.length}`
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
            {swapMode ? "Done" : "Swap players"}
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
          <p className="bench__title">Sitting this one out</p>
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
