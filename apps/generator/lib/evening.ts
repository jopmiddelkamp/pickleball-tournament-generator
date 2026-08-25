import { settleTimedGames, type GameResult, type Match } from "@ptg/core";
import type { TournamentStatus } from "./tournament";

/** Rounds whose scores are final: all before the one on court, or all of them once the event is over. */
export function closedRounds(status: TournamentStatus, roundsStarted: number, rounds: number): number {
  if (status === "finished") return rounds;
  return Math.max(0, Math.min(roundsStarted - 1, rounds));
}

export interface TimedEvening {
  status: TournamentStatus;
  roundsStarted: number;
  /** rounds in the schedule */
  rounds: number;
  gameTarget: number;
  roundMinutes: number | null;
}

/**
 * The games as scoring sees them. With a clock on the round, a game left
 * unfinished when the round closed is rounded up to the target; the stored
 * score stays as entered. Without a clock, the same array comes back.
 */
export function settleForScoring(games: GameResult[], evening: TimedEvening): GameResult[] {
  if (evening.roundMinutes === null) return games;
  return settleTimedGames(games, closedRounds(evening.status, evening.roundsStarted, evening.rounds), evening.gameTarget);
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
