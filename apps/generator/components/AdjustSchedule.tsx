"use client";

import { playingCapacity, type AlgorithmScore, type TournamentConfig } from "@ptg/core";
import { useState } from "react";
import { maxRestSlots } from "../lib/config";
import { useLocale } from "../lib/i18n/useLocale";
import { Segmented } from "./Segmented";

const ALL_COURT_OPTIONS = [1, 2, 3, 4, 5, 6];

/**
 * Tweaks to a freshly drawn schedule, available until round 1 starts. Every
 * change regenerates the draw with the same seed; Reroll draws a new one.
 */
export function AdjustSchedule({ config, playerCount, maxCourts, usingSuggestion, score, onConfigChange, onUseSuggestion, onReroll }: {
  config: TournamentConfig;
  playerCount: number;
  maxCourts: number;
  usingSuggestion: boolean;
  score: AlgorithmScore | null;
  onConfigChange: (change: Partial<TournamentConfig>) => void;
  onUseSuggestion: () => void;
  onReroll: () => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const capacity = playingCapacity(playerCount, config);
  const restCeiling = maxRestSlots(playerCount);
  const courtOptions = ALL_COURT_OPTIONS.filter((n) => n <= maxCourts);

  return (
    <div className="card stack" style={{ marginBottom: 14 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <button type="button" className="button button--quiet button--small" aria-expanded={open} onClick={() => setOpen(!open)}>
          {t.schedule.adjust}
        </button>
        <button type="button" className="button button--quiet button--small" onClick={onReroll}>
          {t.setup.reroll}
        </button>
      </div>
      {open ? (
        <>
          <div>
            <span className="label" id="adjust-courts-label">
              {t.setup.courts}
            </span>
            <Segmented options={courtOptions} value={config.courts} onChange={(courts) => onConfigChange({ courts })} labelledBy="adjust-courts-label" />
          </div>
          <div>
            <label className="label" htmlFor="adjust-rest">
              {t.setup.restSlots}
            </label>
            <input
              id="adjust-rest"
              className="input"
              type="number"
              inputMode="numeric"
              min={0}
              max={restCeiling}
              value={config.restSlots}
              onChange={(event) => {
                // Cleared mid-typing: keep the last valid value rather than
                // firing an action for the transient "" (Number("") === 0).
                const value = event.target.value;
                if (/^\d+$/.test(value)) onConfigChange({ restSlots: Number(value) });
              }}
            />
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="standings__detail">
              {t.setup.capacity(capacity, playerCount - capacity)} {usingSuggestion ? t.setup.suggested : null}
            </span>
            {usingSuggestion ? null : (
              <button type="button" className="button button--quiet button--small" onClick={onUseSuggestion}>
                {t.setup.useSuggestion}
              </button>
            )}
          </div>
          <p className="standings__detail">
            {t.setup.seed} <strong style={{ fontVariantNumeric: "tabular-nums" }}>{config.seed}</strong>
          </p>
          {score ? (
            <div>
              <span className="label">{t.setup.quality}</span>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="standings__total">{score.final.toFixed(1)}</span>
                <span className="roster__level">{t.grades[score.grade]}</span>
              </div>
              <ul style={{ listStyle: "none", margin: "6px 0 0", padding: 0 }}>
                {score.laws.map((law) => (
                  <li key={law.id} className="standings__detail">
                    {law.passed ? "✓" : "✗"} {law.id} {t.laws[law.id]}
                    {law.waived ? ` (${t.setup.waived})` : ""}
                  </li>
                ))}
              </ul>
              <p className="standings__detail" style={{ marginTop: 6 }}>
                {t.setup.diagnostics(
                  score.diagnostics.maxPartnerRepeat,
                  score.diagnostics.maxConsecutiveOpponentStreak,
                  score.diagnostics.byeSpread,
                  Math.round(score.diagnostics.blowoutShare * 100),
                )}
              </p>
              <p className="standings__detail">{t.setup.qualityLede}</p>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
