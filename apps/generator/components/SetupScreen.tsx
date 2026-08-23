"use client";

import { ALGORITHMS, playingCapacity, type AlgorithmScore, type TournamentConfig } from "@ptg/core";
import { useLocale } from "../lib/i18n/useLocale";
import { LIMITS, maxRestSlots } from "../lib/config";
import { EmptyState } from "./ui";

const ALL_COURT_OPTIONS = [1, 2, 3, 4, 5, 6];

export function SetupScreen({
  config,
  playerCount,
  maxCourts,
  usingSuggestion,
  algorithmId,
  gameTarget,
  score,
  generateBlocker,
  hasSchedule,
  onConfigChange,
  onUseSuggestion,
  onAlgorithmChange,
  onGameTargetChange,
  onReroll,
  onGenerate,
  onDiscard,
}: {
  config: TournamentConfig;
  playerCount: number;
  maxCourts: number;
  usingSuggestion: boolean;
  algorithmId: string;
  gameTarget: number;
  score: AlgorithmScore | null;
  generateBlocker: "open" | "players" | null;
  hasSchedule: boolean;
  onConfigChange: (change: Partial<TournamentConfig>) => void;
  onUseSuggestion: () => void;
  onAlgorithmChange: (id: string) => void;
  onGameTargetChange: (points: number) => void;
  onReroll: () => void;
  onGenerate: () => void;
  onDiscard: () => void;
}) {
  const { t } = useLocale();
  const algorithm = ALGORITHMS.find((a) => a.id === algorithmId) ?? ALGORITHMS[0];
  // Core's names are English; an algorithm the catalog does not know keeps them.
  const describe = (id: string, fallback: { name: string; description: string }) =>
    t.algorithms[id] ?? fallback;
  const capacity = playingCapacity(playerCount, config);
  const restCeiling = maxRestSlots(playerCount);
  const courtOptions = ALL_COURT_OPTIONS.filter((n) => n <= maxCourts);

  return (
    <div>
      <h2 className="screen__heading">{t.setup.heading}</h2>
      <p className="screen__lede">{t.setup.lede}</p>

      <div className="card stack">
        <div>
          <span className="label" id="courts-label">
            {t.setup.courts}
          </span>
          <div className="segmented" role="group" aria-labelledby="courts-label">
            {courtOptions.map((courts) => (
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
              {t.setup.rounds}
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
              {t.setup.restSlots}
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

        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="standings__detail">{usingSuggestion ? t.setup.suggested : null}</span>
          {usingSuggestion ? null : (
            <button type="button" className="button button--quiet button--small" onClick={onUseSuggestion}>
              {t.setup.useSuggestion}
            </button>
          )}
        </div>

        <div>
          <label className="label" htmlFor="algorithm">
            {t.setup.scheduler}
          </label>
          <select
            id="algorithm"
            className="select"
            value={algorithmId}
            onChange={(event) => onAlgorithmChange(event.target.value)}
          >
            {ALGORITHMS.map((option) => (
              <option key={option.id} value={option.id}>
                {describe(option.id, option).name}
              </option>
            ))}
          </select>
          <p className="standings__detail" style={{ marginTop: 6 }}>
            {algorithm ? describe(algorithm.id, algorithm).description : null}
          </p>
        </div>

        <div>
          <label className="label" htmlFor="target">
            {t.setup.gameTarget}
          </label>
          <select
            id="target"
            className="select"
            value={gameTarget}
            onChange={(event) => onGameTargetChange(Number(event.target.value))}
          >
            {[11, 16, 21].map((points) => (
              <option key={points} value={points}>
                {t.setup.points(points)}
              </option>
            ))}
          </select>
        </div>

        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <span className="label" style={{ marginBottom: 2 }}>
              {t.setup.seed}
            </span>
            <strong style={{ fontVariantNumeric: "tabular-nums" }}>{config.seed}</strong>
          </div>
          <button type="button" className="button button--quiet button--small" onClick={onReroll}>
            {t.setup.reroll}
          </button>
        </div>
      </div>

      <p className="standings__detail" style={{ margin: "14px 0" }}>
        {generateBlocker === "open"
          ? t.setup.closeFirst
          : generateBlocker === "players"
            ? t.setup.needPlayers
            : t.setup.capacity(capacity, playerCount - capacity)}
      </p>

      <button
        type="button"
        className="button button--accent button--full"
        disabled={generateBlocker !== null || capacity === 0}
        onClick={onGenerate}
      >
        {t.setup.generate}
      </button>

      <h3 className="screen__heading" style={{ fontSize: 18, marginTop: 30 }}>
        {t.setup.quality}
      </h3>
      <p className="screen__lede" style={{ marginBottom: 10 }}>
        {t.setup.qualityLede}
      </p>
      {score ? (
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="standings__total">{score.final.toFixed(1)}</span>
            <span className="roster__level">{t.grades[score.grade]}</span>
          </div>
          <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0 }}>
            {score.laws.map((law) => (
              <li key={law.id} className="standings__detail">
                {law.passed ? "✓" : "✗"} {law.id} {t.laws[law.id]}
                {law.waived ? ` (${t.setup.waived})` : ""}
              </li>
            ))}
          </ul>
          <p className="standings__detail" style={{ marginTop: 8 }}>
            {t.setup.diagnostics(
              score.diagnostics.maxPartnerRepeat,
              score.diagnostics.maxConsecutiveOpponentStreak,
              score.diagnostics.byeSpread,
              Math.round(score.diagnostics.blowoutShare * 100),
            )}
          </p>
        </div>
      ) : (
        <EmptyState>{t.setup.noScore}</EmptyState>
      )}

      {hasSchedule ? (
        <button
          type="button"
          className="button button--danger button--full"
          style={{ marginTop: 30 }}
          onClick={onDiscard}
        >
          {t.setup.discard}
        </button>
      ) : null}
    </div>
  );
}
