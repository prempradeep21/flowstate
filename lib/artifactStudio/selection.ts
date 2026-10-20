import {
  VARIANT_ORDER,
  type ArtifactVariant,
  type StudioArtifact,
} from "@/lib/artifactStudio/pool";

/**
 * Which artifacts each Artifact Studio view shows, and how big each bento
 * tile is. Everything is a pure function of the pool and a seed, so a view is
 * reproducible from its URL.
 */

export const BENTO_MIN_TILES = 36;

/** Small, fast, deterministic PRNG (mulberry32) seeded from a string. */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function byVariant(pool: StudioArtifact[]): Map<ArtifactVariant, StudioArtifact[]> {
  const map = new Map<ArtifactVariant, StudioArtifact[]>();
  for (const item of pool) {
    const list = map.get(item.variant) ?? [];
    list.push(item);
    map.set(item.variant, list);
  }
  for (const list of map.values()) list.sort((a, b) => b.richness - a.richness);
  return map;
}

/** The richest artifact of every variant, in family order. */
export function selectOneOfEach(pool: StudioArtifact[]): StudioArtifact[] {
  const groups = byVariant(pool);
  return VARIANT_ORDER.flatMap((variant) => {
    const best = groups.get(variant)?.[0];
    return best ? [best] : [];
  });
}

/**
 * A bento mix: how many of each variant to include. Variants not listed get
 * one tile each so every mix still spans every family.
 */
type MixRecipe = Partial<Record<ArtifactVariant, number>>;

/** Mix 1 — the balanced board: every variant, the visual-heavy ones doubled. */
const MIX_1_RECIPE: MixRecipe = {
  table: 2,
  "chart:bar": 2,
  "chart:pie": 2,
  map: 2,
  video: 2,
  website: 2,
  stat: 2,
  quote: 2,
  stickynote: 2,
  mechanism: 2,
};

/** Mix 2 — the reading board: transcript extracts and data, light on media. */
const MIX_2_RECIPE: MixRecipe = {
  table: 3,
  "chart:bar": 2,
  "chart:line": 2,
  stat: 4,
  quote: 4,
  claim: 3,
  definition: 3,
  mechanism: 3,
  timeline: 2,
  todo: 2,
  stickynote: 2,
  website: 2,
  video: 1,
  images: 0,
  "3d": 0,
  audio: 0,
};

/** Pick from the richer half first so a mix never leans on borderline data. */
function takeFrom(
  candidates: StudioArtifact[],
  count: number,
  rand: () => number,
  used: Set<string>,
): StudioArtifact[] {
  const fresh = candidates.filter((c) => !used.has(c.uid));
  const richHalf = fresh.slice(0, Math.max(count, Math.ceil(fresh.length / 2)));
  const picked = shuffle(richHalf, rand).slice(0, count);
  for (const p of picked) used.add(p.uid);
  return picked;
}

function buildMix(
  pool: StudioArtifact[],
  recipe: MixRecipe,
  seed: string,
  exclude: Set<string> = new Set(),
): StudioArtifact[] {
  const rand = seededRandom(seed);
  const groups = byVariant(pool);
  const used = new Set(exclude);
  const picked: StudioArtifact[] = [];
  for (const variant of VARIANT_ORDER) {
    const count = recipe[variant] ?? 1;
    picked.push(...takeFrom(groups.get(variant) ?? [], count, rand, used));
  }
  // Top up from anything rich if a recipe came in under the floor.
  if (picked.length < BENTO_MIN_TILES) {
    const rest = shuffle(
      pool.filter((p) => !used.has(p.uid)),
      rand,
    ).slice(0, BENTO_MIN_TILES - picked.length);
    picked.push(...rest);
  }
  return shuffle(picked, rand);
}

export function selectMix1(pool: StudioArtifact[]): StudioArtifact[] {
  return buildMix(pool, MIX_1_RECIPE, "mix-1");
}

/** Mix 2 never repeats an artifact from Mix 1. */
export function selectMix2(pool: StudioArtifact[]): StudioArtifact[] {
  const mix1 = new Set(selectMix1(pool).map((a) => a.uid));
  return buildMix(pool, MIX_2_RECIPE, "mix-2", mix1);
}

/** A fresh random board: random recipe, every variant still represented. */
export function selectRandomMix(pool: StudioArtifact[], seed: string): StudioArtifact[] {
  const rand = seededRandom(`recipe:${seed}`);
  const recipe: MixRecipe = {};
  for (const variant of VARIANT_ORDER) recipe[variant] = 1 + Math.floor(rand() * 2.2);
  return buildMix(pool, recipe, seed);
}

export function newRandomSeed(): string {
  return Math.random().toString(36).slice(2, 8);
}
