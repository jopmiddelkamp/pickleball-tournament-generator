import { describe, expect, it } from "vitest";
import { runBenchmark } from "../src/benchmark.js";
import { generateScenarios } from "../src/scenarios.js";

describe("scenario set", () => {
  it("is deterministic from the base seed", () => {
    const a = generateScenarios(99);
    const b = generateScenarios(99);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("covers every size, ratio, level shape and court setting", () => {
    const scenarios = generateScenarios();
    expect(scenarios).toHaveLength(5 * 4 * 3 * 2);
    expect(new Set(scenarios.map((s) => s.size)).size).toBe(5);
    expect(new Set(scenarios.map((s) => s.ratio)).size).toBe(4);
    expect(new Set(scenarios.map((s) => s.shape)).size).toBe(3);
    expect(new Set(scenarios.map((s) => s.courtSetting)).size).toBe(2);
    for (const s of scenarios) {
      expect(s.players).toHaveLength(s.size);
      expect(s.config.restSlots).toBe(s.size - 4 * s.config.courts);
    }
  });
});

describe("benchmark", () => {
  // Three trials keeps the suite quick; the CLI defaults to ten.
  const report = runBenchmark({ trials: 3 });
  const of = (id: string) => {
    const r = report.algorithms.find((a) => a.algorithmId === id);
    if (!r) throw new Error(`no report for ${id}`);
    return r;
  };

  it("runs every algorithm over the whole scenario set", () => {
    expect(report.scenarioCount).toBe(120);
    expect(report.runs).toHaveLength(120 * report.algorithms.length);
  });

  it("gives greedy the best mean final score", () => {
    const greedy = of("greedy");
    expect(greedy.meanFinal).toBeGreaterThan(of("random").meanFinal);
    expect(greedy.meanFinal).toBeGreaterThan(of("circle").meanFinal);
    expect(greedy.meanFinal).toBeGreaterThan(of("latin").meanFinal);
  });

  it("gives greedy the head-to-head win rate too", () => {
    for (const opponent of ["random", "circle", "latin"]) {
      expect(of("greedy").winRate[opponent]).toBeGreaterThan(0.5);
    }
  });

  it("never lets greedy waste a mixed team or repeat a partnership", () => {
    const greedy = of("greedy");
    expect(greedy.lawFailures.L1).toBe(0);
    expect(greedy.lawFailures.L2).toBe(0);
  });

  it("keeps greedy's L3 failures far below every other algorithm", () => {
    // L3 cannot always be kept: with, say, 6 men and 2 women on one court both
    // women have to play every round to satisfy L1, and two women on two teams
    // are opponents every round. Those cases are small rosters, and they hit
    // every algorithm equally - what matters is that greedy is an order of
    // less than a third as often.
    const greedy = of("greedy");
    expect(greedy.lawFailures.L3).toBeLessThan(report.scenarioCount * 0.2);
    for (const opponent of ["random", "circle", "latin"]) {
      expect(greedy.lawFailures.L3).toBeLessThan(of(opponent).lawFailures.L3 / 3);
    }
  });

  it("leaves the forced L3 failures on the small rosters", () => {
    const weightForSize = (size: number) =>
      report.runs
        .filter((r) => r.algorithmId === "greedy" && r.scenarioId.startsWith(`${size}-`))
        .reduce((sum, r) => sum + r.lawFailRates.L3, 0);
    expect(weightForSize(8)).toBeGreaterThan(weightForSize(24));
  });

  it("is deterministic: the same base seed gives the same report", () => {
    const again = runBenchmark({ trials: 3 });
    expect(again.algorithms.map((a) => a.meanFinal)).toEqual(
      report.algorithms.map((a) => a.meanFinal),
    );
  });
});
