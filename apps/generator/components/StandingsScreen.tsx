"use client";

import type { NightPoints, Player } from "@ptg/core";
import { useLocale } from "../lib/i18n/useLocale";
import { EmptyState, GenderChip } from "./ui";

/**
 * SPEC-1 §5: this screen is for fun. No lowest scores, no levels, no
 * "worst player" - just totals, shared ranks and where the points came from.
 */
export function StandingsScreen({
  night,
  players,
  hasSchedule,
}: {
  night: NightPoints;
  players: Player[];
  hasSchedule: boolean;
}) {
  const { t } = useLocale();
  const playerById = new Map(players.map((p) => [p.id, p]));

  return (
    <div>
      <h2 className="screen__heading">{t.standings.heading}</h2>
      <p className="screen__lede">{t.standings.lede}</p>

      {!hasSchedule ? (
        <EmptyState>{t.standings.empty}</EmptyState>
      ) : (
        <ul className="standings__list">
          {night.standings.map((entry) => {
            const player = playerById.get(entry.playerId);
            const parts = [t.standings.played(entry.gamesPlayed)];
            if (entry.byeBonus > 0) parts.push(t.standings.bye(entry.byeBonus));
            if (entry.sameGenderBonus > 0) parts.push(t.standings.sameGender(entry.sameGenderBonus));
            return (
              <li key={entry.playerId} className="standings__row">
                <span className="standings__rank">{entry.rank}</span>
                <span>
                  <span className="standings__name">
                    {player ? <GenderChip gender={player.gender} /> : null}
                    {player?.name ?? entry.playerId}
                  </span>
                  <span className="standings__detail">{parts.join(" · ")}</span>
                </span>
                <span className="standings__total">
                  {entry.total}
                  <span className="standings__difference">{entry.difference > 0 ? `+${entry.difference}` : entry.difference}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
