/**
 * Benchmark engine: runs every algorithm over the scenario set and aggregates
 * SPEC-2 scores. Pure and deterministic - no clock, no filesystem, no I/O - so
 * the CLI, a test, or a future UI can all drive the same numbers.
 *
 * Runs are paired: every algorithm sees the same roster and the same seed for a
 * given scenario, so differences are the algorithm and nothing else.
 */
import { ALGORITHMS, requireAlgorithm } from "./algorithms/registry.js";
import { mulberry32, deriveSeed } from "./rng.js";
import { generateScenarios, type Scenario } from "./scenarios.js";
import {
  COMPONENT_IDS,
  scoreSchedule,
  type ComponentId,
  type LawId,
} from "./scoring/algorithmScore.js";
import type { Round } from "./types.js";

export const LAW_IDS: readonly LawId[] = ["L1", "L2", "L3"];
export const DEFAULT_TRIALS = 10;

export interface BenchmarkOptions {
  baseSeed?: number;
  rounds?: number;
  /** trials to average over for stochastic algorithms */
  trials?: number;
  algorithmIds?: readonly string[];
}

/** One algorithm on one scenario, already averaged over its trials. */
export interface ScenarioRun {
  scenarioId: string;
  algorithmId: string;
  trials: number;
  meanFinal: number;
  meanPoints: number;
  /** null where the component was dropped in every trial */
  componentMeans: Record<ComponentId, number | null>;
  /** share of trials that broke each law, 0..1 */
  lawFailRates: Record<LawId, number>;
  meanByeSpread: number;
  meanSgSpread: number;
  meanMatchGap: number;
  meanBlowoutShare: number;
  maxPartnerRepeat: number;
  maxConsecutiveOpponentStreak: number;
}

export interface AlgorithmReport {
  algorithmId: string;
  name: string;
  stochastic: boolean;
  meanFinal: number;
  meanPoints: number;
  componentMeans: Record<ComponentId, number | null>;
  /** expected number of scenarios breaking each law */
  lawFailures: Record<LawId, number>;
  meanByeSpread: number;
  meanSgSpread: number;
  meanMatchGap: number;
  meanBlowoutShare: number;
  /** share of scenarios won head to head; a tie counts half */
  winRate: Record<string, number>;
  /** meanFinal minus greedy's meanFinal */
  deltaVsGreedy: number;
}

export type DimensionName = "size" | "ratio" | "shape" | "courtSetting";

export interface BenchmarkReport {
  baseSeed: number;
  rounds: number;
  trials: number;
  scenarioCount: number;
  algorithms: AlgorithmReport[];
  runs: ScenarioRun[];
  /** mean final per algorithm, sliced by one scenario property at a time */
  byDimension: Record<DimensionName, Record<string, Record<string, number>>>;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

function meanOrNull(values: readonly number[]): number | null {
  return values.length === 0 ? null : mean(values);
}

function emptyComponentLists(): Record<ComponentId, number[]> {
  const out = {} as Record<ComponentId, number[]>;
  for (const id of COMPONENT_IDS) out[id] = [];
  return out;
}

function runScenario(scenario: Scenario, algorithmId: string, trials: number): ScenarioRun {
  const algorithm = requireAlgorithm(algorithmId);
  const trialCount = algorithm.stochastic ? Math.max(1, trials) : 1;

  const finals: number[] = [];
  const points: number[] = [];
  const components = emptyComponentLists();
  const lawFails: Record<LawId, number> = { L1: 0, L2: 0, L3: 0 };
  const byeSpreads: number[] = [];
  const sgSpreads: number[] = [];
  const gaps: number[] = [];
  const blowouts: number[] = [];
  let maxRepeat = 0;
  let maxStreak = 0;

  for (let trial = 0; trial < trialCount; trial++) {
    // Trial 0 uses the scenario's own seed, so a single-trial run and the first
    // trial of a multi-trial run are the same schedule.
    const seed = trial === 0 ? scenario.config.seed : deriveSeed(scenario.config.seed, trial);
    const config = { ...scenario.config, seed };
    const rounds: Round[] = algorithm.generate(scenario.players.slice(), config, mulberry32(seed));
    const score = scoreSchedule(rounds, scenario.players, config);

    finals.push(score.final);
    points.push(score.points);
    for (const c of score.components) {
      if (c.applied && c.value !== null) components[c.id].push(c.value);
    }
    for (const law of score.laws) {
      if (!law.passed) lawFails[law.id] += 1;
    }
    byeSpreads.push(score.diagnostics.byeSpread);
    sgSpreads.push(score.diagnostics.sgSpread);
    gaps.push(score.diagnostics.avgMatchGap);
    blowouts.push(score.diagnostics.blowoutShare);
    maxRepeat = Math.max(maxRepeat, score.diagnostics.maxPartnerRepeat);
    maxStreak = Math.max(maxStreak, score.diagnostics.maxConsecutiveOpponentStreak);
  }

  const componentMeans = {} as Record<ComponentId, number | null>;
  for (const id of COMPONENT_IDS) componentMeans[id] = meanOrNull(components[id]);

  return {
    scenarioId: scenario.id,
    algorithmId,
    trials: trialCount,
    meanFinal: mean(finals),
    meanPoints: mean(points),
    componentMeans,
    lawFailRates: {
      L1: lawFails.L1 / trialCount,
      L2: lawFails.L2 / trialCount,
      L3: lawFails.L3 / trialCount,
    },
    meanByeSpread: mean(byeSpreads),
    meanSgSpread: mean(sgSpreads),
    meanMatchGap: mean(gaps),
    meanBlowoutShare: mean(blowouts),
    maxPartnerRepeat: maxRepeat,
    maxConsecutiveOpponentStreak: maxStreak,
  };
}

function dimensionValue(scenario: Scenario, dimension: DimensionName): string {
  switch (dimension) {
    case "size":
      return String(scenario.size);
    case "ratio":
      return scenario.ratio;
    case "shape":
      return scenario.shape;
    case "courtSetting":
      return scenario.courtSetting;
  }
}

export function runBenchmark(options: BenchmarkOptions = {}): BenchmarkReport {
  const baseSeed = options.baseSeed ?? 20240101;
  const trials = options.trials ?? DEFAULT_TRIALS;
  const scenarios = generateScenarios(baseSeed, options.rounds);
  const rounds = scenarios[0]?.config.rounds ?? 0;
  const algorithmIds = options.algorithmIds ?? ALGORITHMS.map((a) => a.id);

  const runs: ScenarioRun[] = [];
  const byScenario = new Map<string, Map<string, ScenarioRun>>();
  for (const scenario of scenarios) {
    const perAlgorithm = new Map<string, ScenarioRun>();
    for (const id of algorithmIds) {
      const run = runScenario(scenario, id, trials);
      runs.push(run);
      perAlgorithm.set(id, run);
    }
    byScenario.set(scenario.id, perAlgorithm);
  }

  const reports: AlgorithmReport[] = algorithmIds.map((id) => {
    const algorithm = requireAlgorithm(id);
    const own = runs.filter((r) => r.algorithmId === id);

    const componentMeans = {} as Record<ComponentId, number | null>;
    for (const componentId of COMPONENT_IDS) {
      const values = own
        .map((r) => r.componentMeans[componentId])
        .filter((v): v is number => v !== null);
      componentMeans[componentId] = meanOrNull(values);
    }

    const winRate: Record<string, number> = {};
    for (const otherId of algorithmIds) {
      if (otherId === id) continue;
      let score = 0;
      for (const perAlgorithm of byScenario.values()) {
        const a = perAlgorithm.get(id);
        const b = perAlgorithm.get(otherId);
        if (!a || !b) continue;
        if (a.meanFinal > b.meanFinal) score += 1;
        else if (a.meanFinal === b.meanFinal) score += 0.5;
      }
      winRate[otherId] = scenarios.length === 0 ? 0 : score / scenarios.length;
    }

    return {
      algorithmId: id,
      name: algorithm.name,
      stochastic: algorithm.stochastic,
      meanFinal: mean(own.map((r) => r.meanFinal)),
      meanPoints: mean(own.map((r) => r.meanPoints)),
      componentMeans,
      lawFailures: {
        L1: own.reduce((sum, r) => sum + r.lawFailRates.L1, 0),
        L2: own.reduce((sum, r) => sum + r.lawFailRates.L2, 0),
        L3: own.reduce((sum, r) => sum + r.lawFailRates.L3, 0),
      },
      meanByeSpread: mean(own.map((r) => r.meanByeSpread)),
      meanSgSpread: mean(own.map((r) => r.meanSgSpread)),
      meanMatchGap: mean(own.map((r) => r.meanMatchGap)),
      meanBlowoutShare: mean(own.map((r) => r.meanBlowoutShare)),
      winRate,
      deltaVsGreedy: 0,
    };
  });

  const greedy = reports.find((r) => r.algorithmId === "greedy");
  if (greedy) {
    for (const report of reports) report.deltaVsGreedy = report.meanFinal - greedy.meanFinal;
  }

  const dimensions: DimensionName[] = ["size", "ratio", "shape", "courtSetting"];
  const byDimension = {} as Record<DimensionName, Record<string, Record<string, number>>>;
  for (const dimension of dimensions) {
    const buckets: Record<string, Record<string, number[]>> = {};
    for (const scenario of scenarios) {
      const key = dimensionValue(scenario, dimension);
      const bucket = (buckets[key] ??= {});
      for (const id of algorithmIds) {
        const run = byScenario.get(scenario.id)?.get(id);
        if (!run) continue;
        (bucket[id] ??= []).push(run.meanFinal);
      }
    }
    const out: Record<string, Record<string, number>> = {};
    for (const [key, bucket] of Object.entries(buckets)) {
      const row: Record<string, number> = {};
      for (const [id, values] of Object.entries(bucket)) row[id] = mean(values);
      out[key] = row;
    }
    byDimension[dimension] = out;
  }

  return {
    baseSeed,
    rounds,
    trials,
    scenarioCount: scenarios.length,
    algorithms: reports,
    runs,
    byDimension,
  };
}
