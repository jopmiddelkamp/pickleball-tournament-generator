/**
 * Seeded roster generator for the bench.
 *
 * The families come from BUILD-PROMPT "apps/bench": sizes x gender ratios x
 * level shapes, crossed with a court setting so that half the scenarios have
 * players on the bench and bye fairness actually gets exercised.
 */
import { deriveSeed, mulberry32, randomInt } from "./rng.js";
import type { Level, Player, TournamentConfig } from "./types.js";

export const SCENARIO_SIZES = [8, 12, 16, 20, 24] as const;
export type ScenarioSize = (typeof SCENARIO_SIZES)[number];

export const GENDER_RATIOS = ["equal", "plus1", "plus2", "twoToOne"] as const;
export type GenderRatio = (typeof GENDER_RATIOS)[number];

export const LEVEL_SHAPES = ["uniform", "clusteredMid", "bimodal"] as const;
export type LevelShape = (typeof LEVEL_SHAPES)[number];

/** "full" fills every court; "tight" drops one court so people rest. */
export const COURT_SETTINGS = ["full", "tight"] as const;
export type CourtSetting = (typeof COURT_SETTINGS)[number];

export const GENDER_RATIO_LABELS: Readonly<Record<GenderRatio, string>> = {
  equal: "equal",
  plus1: "+1 men",
  plus2: "+2 men",
  twoToOne: "2:1 men",
};

export const LEVEL_SHAPE_LABELS: Readonly<Record<LevelShape, string>> = {
  uniform: "uniform",
  clusteredMid: "clustered mid",
  bimodal: "bimodal low/high",
};

export const DEFAULT_SCENARIO_ROUNDS = 7;
const MAX_COURTS = 6;

export interface ScenarioFamily {
  size: ScenarioSize;
  ratio: GenderRatio;
  shape: LevelShape;
  courtSetting: CourtSetting;
}

export interface Scenario extends ScenarioFamily {
  id: string;
  label: string;
  index: number;
  players: Player[];
  config: TournamentConfig;
}

export function familyKey(family: ScenarioFamily): string {
  return `${family.size}-${family.ratio}-${family.shape}-${family.courtSetting}`;
}

export function familyLabel(family: ScenarioFamily): string {
  return `${family.size}p · ${GENDER_RATIO_LABELS[family.ratio]} · ${LEVEL_SHAPE_LABELS[family.shape]} · ${family.courtSetting}`;
}

function menCount(size: number, ratio: GenderRatio): number {
  switch (ratio) {
    case "equal":
      return size / 2;
    case "plus1":
      return size / 2 + 1;
    case "plus2":
      return size / 2 + 2;
    case "twoToOne":
      return Math.round((size * 2) / 3);
  }
}

/** Level shapes as weight tables over levels 1..6. */
const LEVEL_WEIGHTS: Readonly<Record<LevelShape, readonly number[]>> = {
  uniform: [1, 1, 1, 1, 1, 1],
  clusteredMid: [1, 3, 8, 8, 3, 1],
  bimodal: [6, 5, 1, 1, 5, 6],
};

function drawLevel(shape: LevelShape, rng: () => number): Level {
  const weights = LEVEL_WEIGHTS[shape];
  let total = 0;
  for (const w of weights) total += w;
  let pick = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    pick -= weights[i] as number;
    if (pick < 0) return (i + 1) as Level;
  }
  return 6;
}

function courtsFor(size: number, setting: CourtSetting): number {
  const full = Math.min(MAX_COURTS, Math.floor(size / 4));
  return setting === "full" ? full : Math.max(1, full - 1);
}

export function scenarioFamilies(): ScenarioFamily[] {
  const families: ScenarioFamily[] = [];
  for (const size of SCENARIO_SIZES) {
    for (const ratio of GENDER_RATIOS) {
      for (const shape of LEVEL_SHAPES) {
        for (const courtSetting of COURT_SETTINGS) {
          families.push({ size, ratio, shape, courtSetting });
        }
      }
    }
  }
  return families;
}

export function buildScenario(
  family: ScenarioFamily,
  index: number,
  baseSeed: number,
  rounds = DEFAULT_SCENARIO_ROUNDS,
): Scenario {
  const seed = deriveSeed(baseSeed, index);
  const rng = mulberry32(seed);

  const men = menCount(family.size, family.ratio);
  const women = family.size - men;
  const players: Player[] = [];
  for (let i = 0; i < men; i++) {
    players.push({ id: `m${i}`, name: `Man ${i + 1}`, gender: "M", level: drawLevel(family.shape, rng) });
  }
  for (let i = 0; i < women; i++) {
    players.push({ id: `w${i}`, name: `Woman ${i + 1}`, gender: "F", level: drawLevel(family.shape, rng) });
  }
  // One shuffle so roster order is not gender-sorted; rotation algorithms would
  // otherwise get a free head start from the input order alone.
  for (let i = players.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1);
    const a = players[i] as Player;
    players[i] = players[j] as Player;
    players[j] = a;
  }

  const courts = courtsFor(family.size, family.courtSetting);
  const restSlots = Math.max(0, family.size - 4 * courts);

  return {
    ...family,
    id: `${familyKey(family)}#${index}`,
    label: familyLabel(family),
    index,
    players,
    config: { courts, rounds, restSlots, seed },
  };
}

/**
 * The full benchmark set. Deterministic from `baseSeed`: same base seed, same
 * rosters, every time.
 */
export function generateScenarios(baseSeed = 20240101, rounds = DEFAULT_SCENARIO_ROUNDS): Scenario[] {
  return scenarioFamilies().map((family, index) => buildScenario(family, index, baseSeed, rounds));
}
