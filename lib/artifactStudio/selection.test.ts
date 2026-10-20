import { describe, expect, it } from "vitest";
import { getStudioPool, VARIANT_ORDER } from "@/lib/artifactStudio/pool";
import {
  BENTO_MIN_TILES,
  selectMix1,
  selectMix2,
  selectOneOfEach,
  selectRandomMix,
} from "@/lib/artifactStudio/selection";

describe("artifact studio selection", () => {
  const pool = getStudioPool();

  it("only admits artifacts with real data", () => {
    expect(pool.length).toBeGreaterThan(200);
    for (const item of pool) expect(item.richness).toBeGreaterThan(0);
  });

  it("shows one of every variant", () => {
    const one = selectOneOfEach(pool);
    expect(one.map((i) => i.variant)).toEqual(
      VARIANT_ORDER.filter((v) => pool.some((p) => p.variant === v)),
    );
  });

  it("fills every bento with at least the minimum, no duplicates", () => {
    for (const mix of [selectMix1(pool), selectMix2(pool), selectRandomMix(pool, "abc123")]) {
      expect(mix.length).toBeGreaterThanOrEqual(BENTO_MIN_TILES);
      expect(new Set(mix.map((i) => i.uid)).size).toBe(mix.length);
    }
  });

  it("keeps Mix 2 disjoint from Mix 1", () => {
    const mix1 = new Set(selectMix1(pool).map((i) => i.uid));
    expect(selectMix2(pool).some((i) => mix1.has(i.uid))).toBe(false);
  });

  it("is reproducible from a seed", () => {
    const a = selectRandomMix(pool, "seed-1").map((i) => i.uid);
    expect(selectRandomMix(pool, "seed-1").map((i) => i.uid)).toEqual(a);
    expect(selectRandomMix(pool, "seed-2").map((i) => i.uid)).not.toEqual(a);
  });
});
