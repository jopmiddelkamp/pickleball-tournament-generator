/**
 * SPEC-2 - Algorithm Score (Rule Set 2), v3.1a.
 *
 * Judges one generated schedule on paper. Internal only; players never see it.
 * Names follow the spec's own vocabulary (C1-C9, L1-L3, FM, byeSpread, ...) so
 * the code can be read against the spec line by line.
 */
import { computeFeasibility, majorityGender, type Feasibility } from "../feasibility.js";
import {
  buildHistory,
  gameCount,
  maxConsecutiveOpponentStreak,
  maxPartnerRepeat,
  spread,
  uniqueOpponentCount,
  type History,
} from "../tracker.js";
import { bandDistance } from "../types.js";
import type { Player, Round, TournamentConfig } from "../types.js";

export type ComponentId = "C1" | "C2" | "C3" | "C4" | "C5" | "C6" | "C7" | "C8" | "C9";
export type LawId = "L1" | "L2" | "L3";
export type Grade = "excellent" | "good" | "weak" | "fail";

/** SPEC-2 §4. Pillars: fresh people 35, mixed 30, close games 25, fair rest 10. */
export const COMPONENT_WEIGHTS: Readonly<Record<ComponentId, number>> = {
  C1: 18,
  C2: 12,
  C3: 18,
  C4: 5,
  C5: 20,
  C6: 5,
  C7: 12,
  C8: 5,
  C9: 5,
};

export const COMPONENT_LABELS: Readonly<Record<ComponentId, string>> = {
  C1: "Mixed share",
  C2: "M×F coverage",
  C3: "Partner freshness",
  C4: "Partner repeat cap",
  C5: "Close matches",
  C6: "SG band mixing",
  C7: "Opponent freshness",
  C8: "Bye fairness",
  C9: "SG burden fairness",
};

/** Order used everywhere a component list is rendered. */
export const COMPONENT_IDS: readonly ComponentId[] = [
  "C1",
  "C2",
  "C3",
  "C4",
  "C5",
  "C6",
  "C7",
  "C8",
  "C9",
];

/** SPEC-2 §4 formula constants, kept next to the components they belong to. */
const C4_REPEAT_PENALTY = 50;
const C5_GAP_PENALTY = 20;
const C8_SPREAD_PENALTY = 40;
const C9_SPREAD_PENALTY = 35;
/** Blowout threshold on the 1-6 scale (SPEC-2 §6, changed from 5 in v3.1a). */
const BLOWOUT_GAP = 3;
/**
 * SPEC-2 §3 L1 reads "mixed share ≥ 90% ...", but the §7 worked example fails a
 * schedule at 33/35 = 94.3%. The worked example is the binding unit test, and
 * §3's "waived only when mathematically unavoidable" says the same thing, so
 * the threshold is every mixed team that was actually available.
 */
const L1_MIXED_SHARE_THRESHOLD = 1;
const LAW_CAP = 60;

export interface ComponentResult {
  id: ComponentId;
  label: string;
  weight: number;
  /** 0-100, or null when the component was dropped */
  value: number | null;
  applied: boolean;
  /** why it was dropped (SPEC-2 §5) */
  droppedReason?: string;
}

export interface LawResult {
  id: LawId;
  label: string;
  passed: boolean;
  waived: boolean;
  detail: string;
}

export interface ScoreDiagnostics {
  maxPartnerRepeat: number;
  maxConsecutiveOpponentStreak: number;
  byeSpread: number;
  sgSpread: number;
  /** mean abs(sumSkill A - sumSkill B) over matches, on the 1-6 scale */
  avgMatchGap: number;
  /** share of matches with a gap of BLOWOUT_GAP or more */
  blowoutShare: number;
}

export interface AlgorithmScore {
  /** weighted mean of the applied components, 0-100 */
  points: number;
  /** points, capped at 60 when a law is broken */
  final: number;
  grade: Grade;
  components: ComponentResult[];
  /** sum of the weights that were actually applied */
  activeWeight: number;
  laws: LawResult[];
  diagnostics: ScoreDiagnostics;
  feasibility: Feasibility;
}

function clamp100(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function ratio(numerator: number, denominator: number): number {
  return clamp100((100 * numerator) / denominator);
}

function combinations2(n: number): number {
  return (n * (n - 1)) / 2;
}

interface MatchStats {
  count: number;
  gapSum: number;
  blowouts: number;
}

function matchStats(rounds: readonly Round[], levelById: Map<string, number>): MatchStats {
  let count = 0;
  let gapSum = 0;
  let blowouts = 0;
  for (const round of rounds) {
    for (const match of round.matches) {
      const sumA = (levelById.get(match.teamA[0]) ?? 0) + (levelById.get(match.teamA[1]) ?? 0);
      const sumB = (levelById.get(match.teamB[0]) ?? 0) + (levelById.get(match.teamB[1]) ?? 0);
      const gap = Math.abs(sumA - sumB);
      count += 1;
      gapSum += gap;
      if (gap >= BLOWOUT_GAP) blowouts += 1;
    }
  }
  return { count, gapSum, blowouts };
}

interface SameGenderStats {
  teams: number;
  bandDistanceSum: number;
}

function sameGenderStats(rounds: readonly Round[], players: readonly Player[]): SameGenderStats {
  const byId = new Map(players.map((p) => [p.id, p]));
  let teams = 0;
  let bandDistanceSum = 0;
  for (const round of rounds) {
    for (const match of round.matches) {
      for (const team of [match.teamA, match.teamB]) {
        const a = byId.get(team[0]);
        const b = byId.get(team[1]);
        if (!a || !b || a.gender !== b.gender) continue;
        teams += 1;
        bandDistanceSum += bandDistance(a.level, b.level);
      }
    }
  }
  return { teams, bandDistanceSum };
}

/** SPEC-2 C7: mean over players who actually played. */
function opponentFreshness(h: History, playerIds: readonly string[], N: number): number | null {
  let sum = 0;
  let counted = 0;
  for (const id of playerIds) {
    const games = gameCount(h, id);
    if (games === 0) continue; // no games, no opponent freshness to measure
    const denominator = Math.min(2 * games, N - 1);
    if (denominator <= 0) continue;
    sum += ratio(uniqueOpponentCount(h, id), denominator);
    counted += 1;
  }
  return counted === 0 ? null : sum / counted;
}

function pairsPartneredAtLeast(h: History, times: number): number {
  let count = 0;
  for (const value of h.partnered.values()) {
    if (value >= times) count += 1;
  }
  return count;
}

function evaluateLaws(
  h: History,
  f: Feasibility,
  mixedTeams: number,
  distinctMixedPairs: number,
): LawResult[] {
  const singleGender = f.M === 0 || f.W === 0;

  // L1 - no wasted possible mixed teams.
  const coverageTarget = Math.min(f.M * f.W, f.FM);
  const mixedTarget = Math.ceil(L1_MIXED_SHARE_THRESHOLD * coverageTarget);
  const fullCoverage = coverageTarget > 0 && distinctMixedPairs >= coverageTarget;
  const l1Ok = singleGender || mixedTeams >= mixedTarget || fullCoverage;

  // L2 - no pair partners a third time.
  let maxGames = 0;
  for (const id of h.playerIds) maxGames = Math.max(maxGames, gameCount(h, id));
  const l2Waived = maxGames > 2 * (f.N - 1);
  const repeat = maxPartnerRepeat(h);

  // L3 - no player faces the same opponent in 3 consecutive rounds.
  const l3Waived = f.N < 8;
  const streak = maxConsecutiveOpponentStreak(h);

  return [
    {
      id: "L1",
      label: "No wasted mixed teams",
      passed: l1Ok,
      waived: singleGender,
      detail: singleGender
        ? "waived: single-gender roster"
        : `${mixedTeams} mixed teams of ${mixedTarget} available`,
    },
    {
      id: "L2",
      label: "No third-time partnership",
      passed: l2Waived || repeat < 3,
      waived: l2Waived,
      detail: l2Waived
        ? `waived: a player must play more than ${2 * (f.N - 1)} games`
        : `max partner repeat ${repeat}`,
    },
    {
      id: "L3",
      label: "No 3 consecutive rounds against the same opponent",
      passed: l3Waived || streak < 3,
      waived: l3Waived,
      detail: l3Waived
        ? "waived: fewer than 8 players, repetition is forced"
        : `longest same-opponent streak ${streak} rounds`,
    },
  ];
}

function gradeFor(final: number, lawBroken: boolean): Grade {
  if (lawBroken || final < 60) return "fail";
  if (final >= 90) return "excellent";
  if (final >= 75) return "good";
  return "weak";
}

export function scoreSchedule(
  rounds: readonly Round[],
  players: readonly Player[],
  config: TournamentConfig,
): AlgorithmScore {
  const f = computeFeasibility(players, config);
  const h = buildHistory(rounds, players);
  const levelById = new Map(players.map((p) => [p.id, p.level as number]));
  const singleGender = f.M === 0 || f.W === 0;

  const sg = sameGenderStats(rounds, players);
  const matches = matchStats(rounds, levelById);

  const raw: Record<ComponentId, number | null> = {
    C1: f.FM > 0 ? ratio(h.mixedTeams, f.FM) : null,
    C2: Math.min(f.M * f.W, f.FM) > 0 ? ratio(h.distinctMixedPairs.size, Math.min(f.M * f.W, f.FM)) : null,
    C3:
      Math.min(f.TT, combinations2(f.N)) > 0
        ? ratio(h.partnered.size, Math.min(f.TT, combinations2(f.N)))
        : null,
    C4: clamp100(100 - C4_REPEAT_PENALTY * pairsPartneredAtLeast(h, 3)),
    C5: matches.count > 0 ? clamp100(100 - C5_GAP_PENALTY * (matches.gapSum / matches.count)) : null,
    C6: sg.teams > 0 ? clamp100((100 * (sg.bandDistanceSum / sg.teams)) / 2) : null,
    C7: opponentFreshness(h, h.playerIds, f.N),
    C8: clamp100(100 - C8_SPREAD_PENALTY * Math.max(0, spread(h.byes, h.playerIds) - f.sStar)),
    C9: null,
  };

  // C9 is measured within the majority gender when same-gender teams are forced.
  const sgBurdenIds =
    f.FSG > 0
      ? players.filter((p) => p.gender === majorityGender(f)).map((p) => p.id)
      : h.playerIds.slice();
  const sgSpread = spread(h.sgTeams, sgBurdenIds);
  raw.C9 = clamp100(100 - C9_SPREAD_PENALTY * Math.max(0, sgSpread - f.bs));

  // SPEC-2 §5: drop what cannot apply, never gift a free 100.
  const dropped: Partial<Record<ComponentId, string>> = {};
  if (singleGender) {
    dropped.C1 = "single-gender roster";
    dropped.C2 = "single-gender roster";
    dropped.C6 = "single-gender roster";
  }
  if (sg.teams === 0 && f.FSG === 0) dropped.C6 = "no same-gender teams and none forced";

  const components: ComponentResult[] = COMPONENT_IDS.map((id) => {
    const value = raw[id];
    const reason = dropped[id] ?? (value === null ? "not measurable for this schedule" : undefined);
    const applied = value !== null && dropped[id] === undefined;
    return {
      id,
      label: COMPONENT_LABELS[id],
      weight: COMPONENT_WEIGHTS[id],
      value: applied ? value : null,
      applied,
      ...(applied ? {} : { droppedReason: reason ?? "not applicable" }),
    };
  });

  let weighted = 0;
  let activeWeight = 0;
  for (const c of components) {
    if (!c.applied || c.value === null) continue;
    weighted += c.weight * c.value;
    activeWeight += c.weight;
  }
  const points = activeWeight > 0 ? weighted / activeWeight : 0;

  const laws = evaluateLaws(h, f, h.mixedTeams, h.distinctMixedPairs.size);
  const lawBroken = laws.some((l) => !l.passed);
  const final = lawBroken ? Math.min(points, LAW_CAP) : points;

  return {
    points,
    final,
    grade: gradeFor(final, lawBroken),
    components,
    activeWeight,
    laws,
    diagnostics: {
      maxPartnerRepeat: maxPartnerRepeat(h),
      maxConsecutiveOpponentStreak: maxConsecutiveOpponentStreak(h),
      byeSpread: spread(h.byes, h.playerIds),
      sgSpread,
      avgMatchGap: matches.count > 0 ? matches.gapSum / matches.count : 0,
      blowoutShare: matches.count > 0 ? matches.blowouts / matches.count : 0,
    },
    feasibility: f,
  };
}
