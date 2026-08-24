/** Public surface of @ptg/core. Apps import from here and nowhere deeper. */

export * from "./types.js";
export * from "./rng.js";
export * from "./tracker.js";
export * from "./feasibility.js";
export * from "./maxPlayers.js";
export * from "./suggestConfig.js";
export * from "./roundBuilder.js";
export * from "./constants.js";
export * from "./scenarios.js";

export * from "./algorithms/registry.js";
export { randomAlgorithm } from "./algorithms/random.js";
export { circleAlgorithm } from "./algorithms/circle.js";
export { latinAlgorithm } from "./algorithms/latin.js";
export { greedyAlgorithm } from "./algorithms/greedy.js";

export * from "./scoring/algorithmScore.js";
export * from "./scoring/nightPoints.js";
export * from "./fingerprint.js";
export * from "./benchmark.js";
