"use client";

import type { NightPoints, Player } from "@ptg/core";
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
  const playerById = new Map(players.map((p) => [p.id, p]));

  return (
    <div>
      <h2 className="screen__heading">Standings</h2>
      <p className="screen__lede">
        Everyone scores the points their own team made. A bye pays the round&rsquo;s average, and a
        same-gender team pays two on top.
      </p>

      {!hasSchedule ? (
        <EmptyState>Generate a schedule first, then enter scores as the games finish.</EmptyState>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {night.standings.map((entry) => {
            const player = playerById.get(entry.playerId);
            const parts = [`${entry.gamesPlayed} played`];
            if (entry.byeBonus > 0) parts.push(`+${entry.byeBonus} bye`);
            if (entry.sameGenderBonus > 0) parts.push(`+${entry.sameGenderBonus} same gender`);
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
                <span className="standings__total">{entry.total}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
