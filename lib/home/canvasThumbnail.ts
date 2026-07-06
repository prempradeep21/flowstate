import { THREAD_ACCENT_PALETTE } from "@/lib/design/tokens";

/** Deterministic hash of an id/slug so a canvas always gets the same visuals. */
export function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Thread accent colour for a canvas — cycles the same palette threads use. */
export function threadAccentForSeed(seed: string): string {
  return THREAD_ACCENT_PALETTE[hashSeed(seed) % THREAD_ACCENT_PALETTE.length];
}

/**
 * Mini-canvas scene layout variant (node arrangement) for a seed, so the grid
 * doesn't repeat the exact same thumbnail on every card.
 */
export function sceneVariantForSeed(seed: string): 0 | 1 | 2 {
  return (hashSeed(seed) % 3) as 0 | 1 | 2;
}
