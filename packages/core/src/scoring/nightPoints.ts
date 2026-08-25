/**
 * SPEC-1 - Night Points (Rule Set 1).
 *
 * What players see during a real evening. Fun only: it never judges anyone and
 * never feeds back into a skill rating.
 *
 * Source data is the schedule plus entered game results (SPEC-1 §6). Everything
 * here - standings, bonuses, ranks - is derived on the fly and must never be
 * written back as source data.
 */
import type { Player, Round, Team } from "../types.js";

/**
 * Rally-point totals a game is played to (SPEC-1 §1). Timed games record the score as it stands.
 * The default is 11: longer games make an evening overrun its slot.
 */
export const GAME_TARGETS = [11, 16, 21] as const;
export const DEFAULT_GAME_TARGET = 11;

export interface GameResult {
  /** 0-based index into the schedule's rounds */
  round: number;
  court: number;
  teamA: Team;
  teamB: Team;
  pointsA: number;
  pointsB: number;
  /** abandoned game: excluded from standings and from bye averages (SPEC-1 §4) */
  voided: boolean;
}

export interface PlayerNightPoints {
  playerId: string;
  gamePoints: number;
  /** points the opposing team made in the player's games; byes and voided games count nothing */
  pointsAgainst: number;
  /** gamePoints - pointsAgainst: the SPEC-1 §3 tiebreaker */
  difference: number;
  byeBonus: number;
  total: number;
  gamesPlayed: number;
  byes: number;
  /** 1-based; ties share a rank (SPEC-1 §3) */
  rank: number;
}

export interface RoundNightSummary {
  roundIndex: number;
  /** non-void games with a result entered */
  playedGames: number;
  /** mean personal points of the playing players, rounded half up */
  byeBonus: number;
  resting: string[];
}

export interface NightPoints {
  standings: PlayerNightPoints[];
  byId: Record<string, PlayerNightPoints | undefined>;
  rounds: RoundNightSummary[];
}

/** Half-up rounding, spelled out because language defaults differ (SPEC-1 §2). */
export function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

function gameKey(round: number, court: number): string {
  return `${round}#${court}`;
}

/**
 * Night standings from the schedule and whatever results have been entered.
 *
 * Points come from entered, non-void results. Byes and same-gender tokens come
 * from the schedule: they compensate for how the schedule treated a player, so
 * they do not wait for a score to be typed in.
 */
export function computeNightPoints(
  players: readonly Player[],
  rounds: readonly Round[],
  games: readonly GameResult[],
): NightPoints {
  const totals = new Map<string, PlayerNightPoints>();
  for (const p of players) {
    totals.set(p.id, {
      playerId: p.id,
      gamePoints: 0,
      pointsAgainst: 0,
      difference: 0,
      byeBonus: 0,
      total: 0,
      gamesPlayed: 0,
      byes: 0,
      rank: 0,
    });
  }
  const entryFor = (id: string): PlayerNightPoints | undefined => totals.get(id);

  const resultByKey = new Map<string, GameResult>();
  for (const g of games) resultByKey.set(gameKey(g.round, g.court), g);

  const roundSummaries: RoundNightSummary[] = [];

  for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
    const round = rounds[roundIndex] as Round;
    let personalPointsSum = 0;
    let playingWithResult = 0;
    let playedGames = 0;

    for (const match of round.matches) {
      const result = resultByKey.get(gameKey(roundIndex, match.court));
      if (!result || result.voided) continue;

      playedGames += 1;
      const sides: [Team, number, number][] = [
        [result.teamA, result.pointsA, result.pointsB],
        [result.teamB, result.pointsB, result.pointsA],
      ];
      for (const [team, points, against] of sides) {
        for (const id of team) {
          const entry = entryFor(id);
          if (entry) {
            entry.gamePoints += points;
            entry.pointsAgainst += against;
            entry.gamesPlayed += 1;
          }
          personalPointsSum += points;
          playingWithResult += 1;
        }
      }
    }

    const byeBonus = playingWithResult === 0 ? 0 : roundHalfUp(personalPointsSum / playingWithResult);
    for (const id of round.resting) {
      const entry = entryFor(id);
      if (!entry) continue;
      entry.byes += 1;
      entry.byeBonus += byeBonus;
    }

    roundSummaries.push({
      roundIndex,
      playedGames,
      byeBonus,
      resting: [...round.resting],
    });
  }

  const standings = [...totals.values()];
  for (const entry of standings) {
    entry.total = entry.gamePoints + entry.byeBonus;
    entry.difference = entry.gamePoints - entry.pointsAgainst;
  }
  standings.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b.difference !== a.difference) return b.difference - a.difference;
    return a.playerId < b.playerId ? -1 : 1;
  });

  // Shared ranks: the same total and the same difference share a rank, and
  // the next distinct pair skips the places used up (SPEC-1 §3).
  let rank = 0;
  let seen = 0;
  let previous: PlayerNightPoints | null = null;
  for (const entry of standings) {
    seen += 1;
    if (previous === null || entry.total !== previous.total || entry.difference !== previous.difference) {
      rank = seen;
      previous = entry;
    }
    entry.rank = rank;
  }

  const byId: Record<string, PlayerNightPoints | undefined> = {};
  for (const entry of standings) byId[entry.playerId] = entry;

  return { standings, byId, rounds: roundSummaries };
}
