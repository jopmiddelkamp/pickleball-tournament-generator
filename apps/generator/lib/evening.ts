import type { GameResult, Match, Round } from "@ptg/core";

/** Swaps two players wherever they appear in one round. */
export function swapInRound(round: Round, a: string, b: string): Round {
  const swap = (id: string) => (id === a ? b : id === b ? a : id);
  return {
    matches: round.matches.map((match) => ({
      court: match.court,
      teamA: [swap(match.teamA[0]), swap(match.teamA[1])] as [string, string],
      teamB: [swap(match.teamB[0]), swap(match.teamB[1])] as [string, string],
    })),
    resting: round.resting.map(swap),
  };
}

/** Keeps the entered result pointing at whoever is on that court now. */
export function realignGames(games: GameResult[], roundIndex: number, rounds: Round[]): GameResult[] {
  const round = rounds[roundIndex];
  if (!round) return games;
  return games.map((game) => {
    if (game.round !== roundIndex) return game;
    const match = round.matches.find((m) => m.court === game.court);
    return match ? { ...game, teamA: match.teamA, teamB: match.teamB } : game;
  });
}

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

/** Records one side's points; the teams are refreshed from the match in case of a swap. */
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
