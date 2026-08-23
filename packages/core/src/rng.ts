/**
 * Seeded RNG. Every source of randomness in core comes from here, so the same
 * players + config + seed always produce an identical schedule.
 *
 * mulberry32: 32-bit state, uses only integer ops that port unchanged to Dart
 * and C# (`>>>` becomes an unsigned shift, `Math.imul` a 32-bit multiply).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [0, maxExclusive). */
export function randomInt(rng: () => number, maxExclusive: number): number {
  return Math.floor(rng() * maxExclusive);
}

/** Fisher-Yates on a copy; never mutates the input. */
export function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1);
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

/**
 * Derives a sub-seed from a base seed and an index, so a bench run can give
 * every scenario an independent but reproducible stream.
 */
export function deriveSeed(baseSeed: number, index: number): number {
  let h = (baseSeed ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (index + 0x85ebca6b), 0xc2b2ae35) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h;
}
