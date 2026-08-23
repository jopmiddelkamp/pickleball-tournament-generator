/**
 * Benchmark runner. Runs every algorithm over the whole scenario set, scores
 * each schedule with SPEC-2 and prints the comparison.
 *
 *   pnpm bench
 *   pnpm bench --trials=20 --seed=7 --json=out/bench.json --csv=out/bench.csv
 *
 * The engine itself lives in @ptg/core; this file is argument parsing, a table
 * or two and file output.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { argv, exit, stdout } from "node:process";
import {
  ALGORITHMS,
  COMPONENT_IDS,
  COMPONENT_LABELS,
  LAW_IDS,
  runBenchmark,
  type BenchmarkReport,
  type DimensionName,
} from "@ptg/core";

interface Options {
  trials: number;
  seed: number;
  rounds: number | undefined;
  algorithmIds: string[] | undefined;
  jsonPath: string | undefined;
  csvPath: string | undefined;
}

const USAGE = `Usage: pnpm bench [options]

  --trials=N         trials to average stochastic algorithms over (default 10)
  --seed=N           base seed for the scenario set (default 20240101)
  --rounds=N         rounds per scenario (default 7)
  --algorithms=a,b   only run these algorithm ids (default: all)
  --json=PATH        write the full report as JSON
  --csv=PATH         write one row per scenario and algorithm as CSV
  --help             show this message
`;

function parseNumber(flag: string, raw: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${flag} needs a number, got "${raw}"`);
  return value;
}

function parseOptions(args: readonly string[]): Options {
  const options: Options = {
    trials: 10,
    seed: 20240101,
    rounds: undefined,
    algorithmIds: undefined,
    jsonPath: undefined,
    csvPath: undefined,
  };

  for (const arg of args) {
    const [flag = "", raw = ""] = arg.includes("=") ? [arg.slice(0, arg.indexOf("=")), arg.slice(arg.indexOf("=") + 1)] : [arg, ""];
    switch (flag) {
      case "--help":
        stdout.write(USAGE);
        exit(0);
        break;
      case "--trials":
        options.trials = Math.max(1, Math.floor(parseNumber(flag, raw)));
        break;
      case "--seed":
        options.seed = Math.floor(parseNumber(flag, raw));
        break;
      case "--rounds":
        options.rounds = Math.max(1, Math.floor(parseNumber(flag, raw)));
        break;
      case "--algorithms": {
        const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
        const known = new Set(ALGORITHMS.map((a) => a.id));
        const unknown = ids.filter((id) => !known.has(id));
        if (unknown.length > 0) {
          throw new Error(`unknown algorithm(s): ${unknown.join(", ")}. Known: ${[...known].join(", ")}`);
        }
        options.algorithmIds = ids;
        break;
      }
      case "--json":
        options.jsonPath = raw;
        break;
      case "--csv":
        options.csvPath = raw;
        break;
      default:
        throw new Error(`unknown option "${arg}"\n\n${USAGE}`);
    }
  }
  return options;
}

function pad(text: string, width: number, align: "left" | "right" = "left"): string {
  return align === "left" ? text.padEnd(width) : text.padStart(width);
}

function table(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)),
  );
  const line = (cells: readonly string[]) =>
    cells.map((c, i) => pad(c, widths[i] as number, i === 0 ? "left" : "right")).join("  ");
  return [
    line(headers),
    widths.map((w) => "-".repeat(w)).join("  "),
    ...rows.map(line),
  ].join("\n");
}

const n1 = (v: number) => v.toFixed(1);
const n2 = (v: number) => v.toFixed(2);

function summaryTable(report: BenchmarkReport): string {
  const ids = report.algorithms.map((a) => a.algorithmId);
  const headers = [
    "algorithm",
    "mean final",
    "mean points",
    "Δ greedy",
    ...LAW_IDS.map((l) => `${l} fails`),
    ...ids.filter((id) => id !== "greedy").map((id) => `vs ${id}`),
  ];
  const rows = report.algorithms.map((a) => [
    a.algorithmId + (a.stochastic ? " *" : ""),
    n2(a.meanFinal),
    n2(a.meanPoints),
    a.algorithmId === "greedy" ? "-" : n2(a.deltaVsGreedy),
    ...LAW_IDS.map((l) => n1(a.lawFailures[l])),
    ...ids
      .filter((id) => id !== "greedy")
      .map((id) => (id === a.algorithmId ? "-" : `${Math.round((a.winRate[id] ?? 0) * 100)}%`)),
  ]);
  return table(headers, rows);
}

function componentTable(report: BenchmarkReport): string {
  const headers = ["component", ...report.algorithms.map((a) => a.algorithmId)];
  const rows = COMPONENT_IDS.map((id) => [
    `${id} ${COMPONENT_LABELS[id]}`,
    ...report.algorithms.map((a) => {
      const value = a.componentMeans[id];
      return value === null ? "n/a" : n1(value);
    }),
  ]);
  return table(headers, rows);
}

function diagnosticsTable(report: BenchmarkReport): string {
  const headers = ["algorithm", "bye spread", "sg spread", "match gap", "blowout share"];
  const rows = report.algorithms.map((a) => [
    a.algorithmId,
    n2(a.meanByeSpread),
    n2(a.meanSgSpread),
    n2(a.meanMatchGap),
    `${Math.round(a.meanBlowoutShare * 100)}%`,
  ]);
  return table(headers, rows);
}

function dimensionTable(report: BenchmarkReport, dimension: DimensionName): string {
  const headers = [dimension, ...report.algorithms.map((a) => a.algorithmId)];
  const rows = Object.entries(report.byDimension[dimension]).map(([key, byAlgorithm]) => [
    key,
    ...report.algorithms.map((a) => n1(byAlgorithm[a.algorithmId] ?? 0)),
  ]);
  return table(headers, rows);
}

/**
 * Quotes every cell, and prefixes a leading =, +, - or @ with an apostrophe so
 * a spreadsheet treats it as text rather than a formula.
 */
function csvCell(value: string | number): string {
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

function toCsv(report: BenchmarkReport): string {
  const headers = [
    "scenarioId",
    "algorithmId",
    "trials",
    "meanFinal",
    "meanPoints",
    ...LAW_IDS.map((l) => `${l}FailRate`),
    ...COMPONENT_IDS,
    "byeSpread",
    "sgSpread",
    "matchGap",
    "blowoutShare",
    "maxPartnerRepeat",
    "maxConsecutiveOpponentStreak",
  ];
  const lines = [headers.map(csvCell).join(",")];
  for (const run of report.runs) {
    lines.push(
      [
        run.scenarioId,
        run.algorithmId,
        run.trials,
        run.meanFinal,
        run.meanPoints,
        ...LAW_IDS.map((l) => run.lawFailRates[l]),
        ...COMPONENT_IDS.map((c) => run.componentMeans[c] ?? ""),
        run.meanByeSpread,
        run.meanSgSpread,
        run.meanMatchGap,
        run.meanBlowoutShare,
        run.maxPartnerRepeat,
        run.maxConsecutiveOpponentStreak,
      ]
        .map(csvCell)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

async function writeOut(path: string, contents: string): Promise<void> {
  const full = resolve(path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, contents, "utf8");
  stdout.write(`\nwrote ${full}\n`);
}

async function main(): Promise<void> {
  const options = parseOptions(argv.slice(2));
  const report = runBenchmark({
    baseSeed: options.seed,
    trials: options.trials,
    ...(options.rounds === undefined ? {} : { rounds: options.rounds }),
    ...(options.algorithmIds === undefined ? {} : { algorithmIds: options.algorithmIds }),
  });

  stdout.write(
    `\n${report.scenarioCount} scenarios · ${report.rounds} rounds · base seed ${report.baseSeed} · ${report.trials} trials for stochastic algorithms (*)\n\n`,
  );
  stdout.write(`${summaryTable(report)}\n\n`);
  stdout.write(`Component means (SPEC-2 §4)\n${componentTable(report)}\n\n`);
  stdout.write(`Diagnostics (SPEC-2 §6)\n${diagnosticsTable(report)}\n\n`);
  for (const dimension of ["size", "ratio", "shape", "courtSetting"] as const) {
    stdout.write(`Mean final by ${dimension}\n${dimensionTable(report, dimension)}\n\n`);
  }

  if (options.jsonPath) await writeOut(options.jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  if (options.csvPath) await writeOut(options.csvPath, toCsv(report));
}

main().catch((error: unknown) => {
  stdout.write(`\nbench failed: ${error instanceof Error ? error.message : String(error)}\n`);
  exit(1);
});
