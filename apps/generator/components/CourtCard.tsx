"use client";

import { band, type GameResult, type Match, type Player, type Team } from "@ptg/core";
import { useLocale } from "../lib/i18n/useLocale";
import type { Messages } from "../lib/i18n";
import { GenderChip } from "./ui";

export interface CourtCardProps {
  match: Match;
  roundIndex: number;
  playerById: ReadonlyMap<string, Player>;
  result: GameResult | undefined;
  /** the same game as scoring counts it, when a round clock rounded it up */
  settled?: GameResult | undefined;
  onScoreChange?: (side: "A" | "B", points: number | null) => void;
  /** the game target: typed points are clamped to it */
  maxPoints?: number;
  onVoidChange?: (voided: boolean) => void;
  /** the visitor's own id on the public page, so they spot themselves at a glance */
  highlightPlayerId?: string | null;
}

/**
 * SPEC-2 C6 talks about band distance; SPEC-1 §2 pays a token for any
 * same-gender team. The badge says which bands were put together - "low+high"
 * is the good version of a forced pair - without ever printing a level next to
 * a name (SPEC-1 §5).
 */
function sameGenderBadge(
  team: Team,
  playerById: ReadonlyMap<string, Player>,
  t: Messages,
): string | null {
  const a = playerById.get(team[0]);
  const b = playerById.get(team[1]);
  if (!a || !b || a.gender !== b.gender) return null;
  const bands = [band(a.level), band(b.level)].sort((x, y) => x - y);
  const [low, high] = bands as [0 | 1 | 2, 0 | 1 | 2];
  const pair = low === high ? t.bands[low] : `${t.bands[low]}+${t.bands[high]}`;
  return t.court.sameGender(pair);
}

function Side({
  team,
  half,
  playerById,
  highlightPlayerId,
}: {
  team: Team;
  half: "left" | "right";
  playerById: ReadonlyMap<string, Player>;
  highlightPlayerId: string | null | undefined;
}) {
  const { t } = useLocale();
  const badge = sameGenderBadge(team, playerById, t);
  return (
    <div className={`court__side court__side--${half}`}>
      {team.map((id) => {
        const player = playerById.get(id);
        const label = player?.name ?? id;
        const className = highlightPlayerId === id ? "court__player court__player--highlight" : "court__player";
        return (
          <span key={id} className={className}>
            {player ? <GenderChip gender={player.gender} /> : null}
            <span>{label}</span>
          </span>
        );
      })}
      {badge ? <span className="court__badge">{badge}</span> : null}
    </div>
  );
}

export function CourtCard({
  match,
  roundIndex,
  playerById,
  result,
  settled,
  onScoreChange,
  maxPoints,
  onVoidChange,
  highlightPlayerId,
}: CourtCardProps) {
  const { t } = useLocale();
  const scoreId = `r${roundIndex}c${match.court}`;
  const roundedUp = result && settled && (settled.pointsA !== result.pointsA || settled.pointsB !== result.pointsB) ? settled : null;
  const shown = roundedUp ?? result;
  return (
    <section className="court" aria-label={t.court.label(match.court)}>
      <div className="court__label">
        <span>{t.court.label(match.court)}</span>
        {result?.voided ? <span>{t.court.voided}</span> : null}
      </div>
      <div className="court__surface">
        <Side team={match.teamA} half="left" playerById={playerById} highlightPlayerId={highlightPlayerId} />
        <Side team={match.teamB} half="right" playerById={playerById} highlightPlayerId={highlightPlayerId} />
      </div>

      {onScoreChange && onVoidChange ? (
        <div className="court__score">
          <label className="label visually-hidden" htmlFor={`${scoreId}a`}>
            {t.court.pointsLeft(match.court)}
          </label>
          <input
            id={`${scoreId}a`}
            className="court__scoreInput"
            inputMode="numeric"
            pattern="[0-9]*"
            value={result && !Number.isNaN(result.pointsA) ? String(result.pointsA) : ""}
            placeholder="–"
            disabled={result?.voided ?? false}
            onChange={(event) => onScoreChange("A", parsePoints(event.target.value, maxPoints))}
          />
          <span className="court__scoreDash" aria-hidden="true">
            –
          </span>
          <label className="label visually-hidden" htmlFor={`${scoreId}b`}>
            {t.court.pointsRight(match.court)}
          </label>
          <input
            id={`${scoreId}b`}
            className="court__scoreInput"
            inputMode="numeric"
            pattern="[0-9]*"
            value={result && !Number.isNaN(result.pointsB) ? String(result.pointsB) : ""}
            placeholder="–"
            disabled={result?.voided ?? false}
            onChange={(event) => onScoreChange("B", parsePoints(event.target.value, maxPoints))}
          />
          <label className="court__void">
            <input
              type="checkbox"
              checked={result?.voided ?? false}
              onChange={(event) => onVoidChange(event.target.checked)}
            />
            {t.court.void}
          </label>
        </div>
      ) : shown && !Number.isNaN(shown.pointsA) && !Number.isNaN(shown.pointsB) ? (
        // Read-only view (public page): the score as it counts, with no input to edit it.
        <div className="court__score">
          <span className="court__scoreValue">{shown.pointsA}</span>
          <span className="court__scoreDash" aria-hidden="true">
            –
          </span>
          <span className="court__scoreValue">{shown.pointsB}</span>
        </div>
      ) : null}
      {roundedUp && result ? (
        <p className="court__scoreNote">
          {onScoreChange
            ? t.court.countsAs(`${roundedUp.pointsA}–${roundedUp.pointsB}`)
            : t.court.roundedFrom(`${result.pointsA}–${result.pointsB}`)}
        </p>
      ) : null}
    </section>
  );
}

function parsePoints(raw: string, max?: number): number | null {
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 3);
  if (digits.length === 0) return null;
  const points = Number(digits);
  return max === undefined ? points : Math.min(points, max);
}
