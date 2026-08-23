"use client";

import { ALGORITHMS, playingCapacity, type AlgorithmScore, type TournamentConfig } from "@ptg/core";
import { LIMITS, maxRestSlots } from "../lib/state";
import { EmptyState } from "./ui";

const COURT_OPTIONS = [1, 2, 3, 4, 5, 6];

export function SetupScreen({
  config,
  playerCount,
  algorithmId,
  gameTarget,
  score,
  onConfigChange,
  onAlgorithmChange,
  onGameTargetChange,
  onReroll,
  onGenerate,
  onClear,
}: {
  config: TournamentConfig;
  playerCount: number;
  algorithmId: string;
  gameTarget: number;
  score: AlgorithmScore | null;
  onConfigChange: (change: Partial<TournamentConfig>) => void;
  onAlgorithmChange: (id: string) => void;
  onGameTargetChange: (points: number) => void;
  onReroll: () => void;
  onGenerate: () => void;
  onClear: () => void;
}) {
  const algorithm = ALGORITHMS.find((a) => a.id === algorithmId) ?? ALGORITHMS[0];
  const capacity = playingCapacity(playerCount, config);
  const enoughPlayers = playerCount >= 4;
  const restCeiling = maxRestSlots(playerCount);

  return (
    <div>
      <h2 className="screen__heading">Set up the evening</h2>
      <p className="screen__lede">
        The same players, settings and seed always produce the same schedule. Reroll the seed for a
        different one.
      </p>

      <div className="card stack">
        <div>
          <span className="label" id="courts-label">
            Courts
          </span>
          <div className="segmented" role="group" aria-labelledby="courts-label">
            {COURT_OPTIONS.map((courts) => (
              <button
                key={courts}
                type="button"
                className="segmented__option"
                aria-pressed={config.courts === courts}
                onClick={() => onConfigChange({ courts })}
              >
                {courts}
              </button>
            ))}
          </div>
        </div>

        <div className="row">
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="rounds">
              Rounds
            </label>
            <input
              id="rounds"
              className="input"
              type="number"
              inputMode="numeric"
              min={LIMITS.minRounds}
              max={LIMITS.maxRounds}
              value={config.rounds}
              onChange={(event) => onConfigChange({ rounds: Number(event.target.value) })}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="rest">
              Rest slots
            </label>
            <input
              id="rest"
              className="input"
              type="number"
              inputMode="numeric"
              min={0}
              max={restCeiling}
              value={config.restSlots}
              onChange={(event) => onConfigChange({ restSlots: Number(event.target.value) })}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="algorithm">
            Scheduler
          </label>
          <select
            id="algorithm"
            className="select"
            value={algorithmId}
            onChange={(event) => onAlgorithmChange(event.target.value)}
          >
            {ALGORITHMS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <p className="standings__detail" style={{ marginTop: 6 }}>
            {algorithm?.description}
          </p>
        </div>

        <div>
          <label className="label" htmlFor="target">
            Games are played to
          </label>
          <select
            id="target"
            className="select"
            value={gameTarget}
            onChange={(event) => onGameTargetChange(Number(event.target.value))}
          >
            {[11, 16, 21].map((points) => (
              <option key={points} value={points}>
                {points} points
              </option>
            ))}
          </select>
        </div>

        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <span className="label" style={{ marginBottom: 2 }}>
              Seed
            </span>
            <strong style={{ fontVariantNumeric: "tabular-nums" }}>{config.seed}</strong>
          </div>
          <button type="button" className="button button--quiet button--small" onClick={onReroll}>
            Reroll
          </button>
        </div>
      </div>

      <p className="standings__detail" style={{ margin: "14px 0" }}>
        {enoughPlayers
          ? `${capacity} on court each round, ${playerCount - capacity} resting.`
          : "Add at least four players before generating."}
      </p>

      <button
        type="button"
        className="button button--accent button--full"
        disabled={!enoughPlayers || capacity === 0}
        onClick={onGenerate}
      >
        Generate schedule
      </button>

      <h3 className="screen__heading" style={{ fontSize: 18, marginTop: 30 }}>
        Schedule quality
      </h3>
      <p className="screen__lede" style={{ marginBottom: 10 }}>
        The algorithm score (SPEC-2). It judges the schedule, never a player, and is only shown here.
      </p>
      {score ? (
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="standings__total">{score.final.toFixed(1)}</span>
            <span className="roster__level">{score.grade}</span>
          </div>
          <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0 }}>
            {score.laws.map((law) => (
              <li key={law.id} className="standings__detail">
                {law.passed ? "✓" : "✗"} {law.id} {law.label} — {law.detail}
              </li>
            ))}
          </ul>
          <p className="standings__detail" style={{ marginTop: 8 }}>
            Max partner repeat {score.diagnostics.maxPartnerRepeat} · longest same-opponent streak{" "}
            {score.diagnostics.maxConsecutiveOpponentStreak} · bye spread {score.diagnostics.byeSpread} ·
            blowout share {Math.round(score.diagnostics.blowoutShare * 100)}%
          </p>
        </div>
      ) : (
        <EmptyState>Generate a schedule to see how it scores.</EmptyState>
      )}

      <button
        type="button"
        className="button button--danger button--full"
        style={{ marginTop: 30 }}
        onClick={onClear}
      >
        Start a new evening
      </button>
    </div>
  );
}
