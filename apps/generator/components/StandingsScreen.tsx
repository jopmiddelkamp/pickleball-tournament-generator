"use client";

import type { NightPoints, Player, PlayerNightPoints } from "@ptg/core";
import { useLocale } from "../lib/i18n/useLocale";
import { EmptyState, GenderChip } from "./ui";

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

/**
 * SPEC-1 §3 and §5: the evening celebrates the best woman and the best man,
 * so three podiums lead, then everyone in rank order with their level. No
 * lowest scores, no "worst player".
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
  const nameOf = (entry: PlayerNightPoints) => playerById.get(entry.playerId)?.name ?? entry.playerId;

  const podiums = [
    { title: t.standings.top.overall, entries: night.standings },
    { title: t.standings.top.women, entries: night.standings.filter((e) => playerById.get(e.playerId)?.gender === "F") },
    { title: t.standings.top.men, entries: night.standings.filter((e) => playerById.get(e.playerId)?.gender === "M") },
  ].map((group) => ({ ...group, entries: group.entries.slice(0, 3) }));

  return (
    <div>
      <h2 className="screen__heading">{t.standings.heading}</h2>
      <p className="screen__lede">{t.standings.lede}</p>

      {!hasSchedule ? (
        <EmptyState>{t.standings.empty}</EmptyState>
      ) : (
        <>
          <div className="podiums">
            {podiums.map((group) => (
              <section key={group.title} className="podium">
                <h3 className="podium__title">{group.title}</h3>
                <ol className="plain-list">
                  {group.entries.map((entry, index) => (
                    <li key={entry.playerId} className="podium__row">
                      <span className="podium__place">{index + 1}</span>
                      <span className="podium__name">{nameOf(entry)}</span>
                      <span className="podium__total">{entry.total}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>

          <ul className="standings__list">
            {night.standings.map((entry) => {
              const player = playerById.get(entry.playerId);
              const parts = [t.standings.played(entry.gamesPlayed)];
              if (entry.byeBonus > 0) parts.push(t.standings.bye(entry.byeBonus));
              if (player) parts.push(t.levels[player.level]);
              return (
                <li key={entry.playerId} className="standings__row">
                  <span className="standings__rank">{entry.rank}</span>
                  <span>
                    <span className="standings__name">
                      {player ? <GenderChip gender={player.gender} /> : null}
                      {nameOf(entry)}
                    </span>
                    <span className="standings__detail">{parts.join(" · ")}</span>
                  </span>
                  <span className="standings__total">
                    {entry.total}
                    <span className="standings__difference">{signed(entry.difference)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
