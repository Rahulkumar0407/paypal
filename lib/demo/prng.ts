/** A tiny seeded random generator (mulberry32), so the simulated history is identical on every reset. */
export function createRandom(seed: number) {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    /** Whole number in [min, max]. */
    int(min: number, max: number): number {
      return min + Math.floor(next() * (max - min + 1));
    },
    /** Pick by relative weight. */
    weighted<T extends { weight: number }>(items: readonly T[]): T {
      const total = items.reduce((sum, i) => sum + i.weight, 0);
      let roll = next() * total;
      for (const item of items) {
        roll -= item.weight;
        if (roll < 0) return item;
      }
      return items[items.length - 1]!;
    },
  };
}
