"use client";

import type { GameResult, Player, Round, Team } from "@ptg/core";
import { useLocale } from "../lib/i18n/useLocale";

function names(team: Team, playerById: ReadonlyMap<string, Player>, joiner: string): string {
  return team.map((id) => playerById.get(id)?.name ?? id).join(joiner);
}

/**
 * The whole evening in one table once it is over: every round, every court,
 * the teams and the score as it counted. Rows the visitor played in are
 * marked so they can find themselves; nothing else singles anyone out
 * (SPEC-1 §5).
 */
export function GamesTable({
  rounds,
  players,
  games,
  highlightId = null,
}: {
  rounds: Round[];
  players: Player[];
  /** games as scoring counts them */
  games: GameResult[];
  highlightId?: string | null;
}) {
  const { t } = useLocale();
  const playerById = new Map(players.map((p) => [p.id, p]));

  function score(roundIndex: number, court: number): string {
    const game = games.find((g) => g.round === roundIndex && g.court === court);
    if (!game) return "–";
    if (game.voided) return t.court.voided;
    return `${game.pointsA}–${game.pointsB}`;
  }

  return (
    <div className="games__scroll">
      <table className="games">
        <thead>
          <tr>
            <th scope="col">{t.schedule.rounds}</th>
            <th scope="col">{t.print.court}</th>
            <th scope="col">{t.print.team}</th>
            <th scope="col">{t.print.team}</th>
            <th scope="col">{t.print.score}</th>
          </tr>
        </thead>
        {rounds.map((round, index) => (
          <tbody key={index}>
            {round.matches.map((match, row) => {
              const mine = highlightId !== null && [...match.teamA, ...match.teamB].includes(highlightId);
              return (
                <tr key={match.court} aria-current={mine || undefined}>
                  {row === 0 ? (
                    <th scope="rowgroup" rowSpan={round.matches.length + (round.resting.length > 0 ? 1 : 0)}>
                      {index + 1}
                    </th>
                  ) : null}
                  <td>{match.court}</td>
                  <td>{names(match.teamA, playerById, t.print.nameJoiner)}</td>
                  <td>{names(match.teamB, playerById, t.print.nameJoiner)}</td>
                  <td className="games__score">{score(index, match.court)}</td>
                </tr>
              );
            })}
            {round.resting.length > 0 ? (
              <tr className="games__rest">
                <td colSpan={4}>
                  {t.print.resting}
                  {round.resting.map((id) => playerById.get(id)?.name ?? id).join(", ")}
                </td>
              </tr>
            ) : null}
          </tbody>
        ))}
      </table>
    </div>
  );
}
