"use client";

import type { GameResult, Player, Round } from "@ptg/core";
import { useLocale } from "../lib/i18n/useLocale";
import { CourtCard } from "./CourtCard";
import { GenderChip, Notice } from "./ui";

interface VisitorMatch {
  court: number;
  partnerId: string;
  opponentIds: [string, string];
}

/** Scans the round for the visitor, either playing (with a partner and two
 * opponents) or resting. Returns null when they are not in this round at all
 * (a stranger browsing, or highlightId belongs to an earlier round's roster). */
function findVisitor(round: Round, highlightId: string): VisitorMatch | "resting" | null {
  if (round.resting.includes(highlightId)) return "resting";
  for (const match of round.matches) {
    if (match.teamA.includes(highlightId)) {
      const partnerId = match.teamA.find((id) => id !== highlightId);
      if (partnerId) return { court: match.court, partnerId, opponentIds: match.teamB };
    }
    if (match.teamB.includes(highlightId)) {
      const partnerId = match.teamB.find((id) => id !== highlightId);
      if (partnerId) return { court: match.court, partnerId, opponentIds: match.teamA };
    }
  }
  return null;
}

/**
 * One round of the public live view: the visitor's own line first (SPEC-1 §5
 * still holds - no ranking, no levels), then every court read-only.
 */
export function RoundView({
  round,
  players,
  games,
  roundNumber,
  highlightId,
}: {
  round: Round;
  players: Player[];
  games: GameResult[];
  roundNumber: number;
  highlightId: string | null;
}) {
  const { t } = useLocale();
  const playerById = new Map(players.map((p) => [p.id, p]));
  const roundIndex = roundNumber - 1;
  const nameOf = (id: string) => playerById.get(id)?.name ?? id;

  const visitor = highlightId ? findVisitor(round, highlightId) : null;

  return (
    <div>
      <h3 className="screen__section">
        {t.public.round(roundNumber)}
      </h3>

      {visitor === "resting" ? (
        <Notice>{t.public.youRest}</Notice>
      ) : visitor ? (
        <Notice>
          {t.public.yourCourt(visitor.court, nameOf(visitor.partnerId), nameOf(visitor.opponentIds[0]), nameOf(visitor.opponentIds[1]))}
        </Notice>
      ) : null}

      <div className="courts">
        {round.matches.map((match) => (
          <CourtCard
            key={match.court}
            match={match}
            roundIndex={roundIndex}
            playerById={playerById}
            result={games.find((game) => game.round === roundIndex && game.court === match.court)}
            selectedPlayerId={highlightId}
          />
        ))}
      </div>

      {round.resting.length > 0 ? (
        <div className="bench">
          <p className="bench__title">{t.schedule.resting}</p>
          <div className="bench__names">
            {round.resting.map((id) => {
              const player = playerById.get(id);
              return (
                <span key={id} className="bench__name">
                  {player ? <GenderChip gender={player.gender} /> : null}
                  {player?.name ?? id}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
