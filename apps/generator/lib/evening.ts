import type { GameResult, Match } from "@ptg/core";

export type Side = "A" | "B";

function upsert(games: readonly GameResult[], next: GameResult): GameResult[] {
  const index = games.findIndex((g) => g.round === next.round && g.court === next.court);
  if (index === -1) return [...games, next];
  return games.map((g, i) => (i === index ? next : g));
}

function existing(games: readonly GameResult[], match: Match, roundIndex: number): GameResult {
  return (
    games.find((g) => g.round === roundIndex && g.court === match.court) ?? {
      round: roundIndex,
      court: match.court,
      teamA: match.teamA,
      teamB: match.teamB,
      pointsA: 0,
      pointsB: 0,
      voided: false,
    }
  );
}

/** Records one side's points; the teams are taken from the match so a result always names its court. */
export function withScore(
  games: readonly GameResult[],
  match: Match,
  roundIndex: number,
  side: Side,
  points: number | null,
): GameResult[] {
  const current = existing(games, match, roundIndex);
  return upsert(games, {
    ...current,
    teamA: match.teamA,
    teamB: match.teamB,
    [side === "A" ? "pointsA" : "pointsB"]: points ?? 0,
  });
}

export function withVoided(games: readonly GameResult[], match: Match, roundIndex: number, voided: boolean): GameResult[] {
  const current = existing(games, match, roundIndex);
  return upsert(games, { ...current, teamA: match.teamA, teamB: match.teamB, voided });
}
