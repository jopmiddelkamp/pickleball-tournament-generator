"use client";

import type { GameResult, Player, Round, Team } from "@ptg/core";
import { useLocale } from "../lib/i18n/useLocale";

/**
 * The whole evening as round cards: each round a card with its resting
 * players in the header and one court per row, laid out like the court
 * itself - team left, score in the middle, team right - with the winning
 * side in bold. Rows the visitor played in are marked so they can find
 * themselves; nothing else singles anyone out (SPEC-1 §5).
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
  const nameOf = (id: string) => playerById.get(id)?.name ?? id;

  function side(team: Team, won: boolean, half: "left" | "right", courtLabel: string | null) {
    const className = ["games__team", `games__team--${half}`, won ? "games__team--won" : ""].filter(Boolean).join(" ");
    return (
      <div className={className}>
        <span className="games__court">{courtLabel ?? " "}</span>
        {team.map((id) => (
          <span key={id} className="games__name">
            {nameOf(id)}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="games">
      {rounds.map((round, index) => (
        <section key={index} className="games__round">
          <div className="games__head">
            <span>{t.print.round(index + 1)}</span>
            {round.resting.length > 0 ? (
              <span className="games__rest">
                {t.print.resting}
                {round.resting.map(nameOf).join(", ")}
              </span>
            ) : null}
          </div>
          {round.matches.map((match) => {
            const game = games.find((g) => g.round === index && g.court === match.court);
            const played = game !== undefined && !game.voided;
            const aWon = played && game.pointsA > game.pointsB;
            const bWon = played && game.pointsB > game.pointsA;
            const mine = highlightId !== null && [...match.teamA, ...match.teamB].includes(highlightId);
            return (
              <div key={match.court} className="games__game" aria-current={mine || undefined}>
                {side(match.teamA, aWon, "left", t.court.label(match.court))}
                <span className="games__score">
                  {!game ? (
                    "–"
                  ) : game.voided ? (
                    t.court.voided
                  ) : (
                    <>
                      <span className={aWon ? "games__won" : undefined}>{game.pointsA}</span>–
                      <span className={bWon ? "games__won" : undefined}>{game.pointsB}</span>
                    </>
                  )}
                </span>
                {side(match.teamB, bWon, "right", null)}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
