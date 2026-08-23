/**
 * Rule 0 quantities from SPEC-2 §2.
 *
 * Every target here comes from roster + config only, never from the schedule.
 * That is what stops an algorithm from lowering its own bar — benching all the
 * women does not shrink the mixed target.
 */
import type { Player, TournamentConfig } from "./types.js";

export interface Feasibility {
  /** roster size */
  N: number;
  /** men */
  M: number;
  /** women */
  W: number;
  /** courts */
  K: number;
  /** rounds */
  Rd: number;
  /** rest slots requested */
  Rest: number;
  /** players on court per round */
  Pplay: number;
  /** teams per round */
  T: number;
  /** mixed teams possible per round */
  feasMixed: number;
  /** mixed teams possible over the event */
  FM: number;
  /** same-gender teams forced per round */
  forcedSG: number;
  /** same-gender teams forced over the event */
  FSG: number;
  /** total byes over the event */
  B: number;
  /** allowed bye spread */
  sStar: number;
  /** size of the majority gender */
  maj: number;
  /** allowed same-gender-burden spread */
  bs: number;
  /** total team slots in the schedule */
  TT: number;
}

/** Players on court per round (BUILD-PROMPT "Rest selection everywhere"). */
export function playingCapacity(playerCount: number, config: TournamentConfig): number {
  const usable = Math.min(playerCount - config.restSlots, 4 * config.courts);
  if (usable < 4) return 0;
  return 4 * Math.floor(usable / 4);
}

export function computeFeasibility(
  players: readonly Player[],
  config: TournamentConfig,
): Feasibility {
  const N = players.length;
  let M = 0;
  for (const p of players) if (p.gender === "M") M += 1;
  const W = N - M;

  const K = config.courts;
  const Rd = config.rounds;
  const Rest = config.restSlots;

  const Pplay = playingCapacity(N, config);
  const T = Pplay / 2;

  const feasMixed = Math.min(M, W, T);
  const FM = Rd * feasMixed;
  const forcedSG = T - feasMixed;
  const FSG = Rd * forcedSG;

  const B = Rd * (N - Pplay);
  const sStar = N > 0 && B % N === 0 ? 0 : 1;

  const maj = Math.max(M, W);
  const bs = maj > 0 && (2 * FSG) % maj === 0 ? 0 : 1;

  const TT = Rd * T;

  return { N, M, W, K, Rd, Rest, Pplay, T, feasMixed, FM, forcedSG, FSG, B, sStar, maj, bs, TT };
}

/** Gender that carries the same-gender burden; ties resolve to "M" (SPEC-2 §2). */
export function majorityGender(f: Feasibility): "M" | "F" {
  return f.W > f.M ? "F" : "M";
}
