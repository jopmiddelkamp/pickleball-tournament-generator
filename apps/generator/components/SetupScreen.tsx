"use client";

import { playingCapacity, type AlgorithmScore, type TournamentConfig } from "@ptg/core";
import { useLocale } from "../lib/i18n/useLocale";
import { LIMITS, maxRestSlots } from "../lib/config";
import { EmptyState } from "./ui";
import { Segmented } from "./Segmented";

const ALL_COURT_OPTIONS = [1, 2, 3, 4, 5, 6];

export function SetupScreen({
  config,
  playerCount,
  maxCourts,
  usingSuggestion,
  score,
  generateBlocker,
  hasSchedule,
  onConfigChange,
  onUseSuggestion,
  onReroll,
  onGenerate,
  onDiscard,
}: {
  config: TournamentConfig;
  playerCount: number;
  maxCourts: number;
  usingSuggestion: boolean;
  score: AlgorithmScore | null;
  generateBlocker: "open" | "players" | null;
  hasSchedule: boolean;
  onConfigChange: (change: Partial<TournamentConfig>) => void;
  onUseSuggestion: () => void;
  onReroll: () => void;
  onGenerate: () => void;
  onDiscard: () => void;
}) {
  const { t } = useLocale();
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
          <Segmented options={courtOptions} value={config.courts} onChange={(courts) => onConfigChange({ courts })} labelledBy="courts-label" />
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
              onChange={(event) => {
                // Cleared mid-typing: keep the last valid value rather than
                // firing an action for the transient "" (Number("") === 0).
                const value = event.target.value;
                if (/^\d+$/.test(value)) onConfigChange({ rounds: Number(value) });
              }}
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
              onChange={(event) => {
                const value = event.target.value;
                if (/^\d+$/.test(value)) onConfigChange({ restSlots: Number(value) });
              }}
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
        {hasSchedule
          ? t.setup.discardFirst
          : generateBlocker === "open"
            ? t.setup.closeFirst
            : generateBlocker === "players"
              ? t.setup.needPlayers
              : t.setup.capacity(capacity, playerCount - capacity)}
      </p>

      <button
        type="button"
        className="button button--accent button--full"
        disabled={hasSchedule || generateBlocker !== null || capacity === 0}
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
