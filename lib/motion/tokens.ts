import type { DurationToken } from "./types";

/** All durations in milliseconds. */
export const durations: Record<DurationToken, number> = {
  instant: 100,
  fast: 200,
  standard: 320,
  panel: 380,
  slow: 480,
  deliberate: 600,
};

export const easings = {
  easeLight: [0.22, 1, 0.36, 1] as const,
  easeMedium: [0.16, 1, 0.3, 1] as const,
  easeHeavy: [0.12, 0.84, 0.27, 1] as const,
  easeSettle: [0.34, 1.25, 0.64, 1] as const,
  easeLinear: "linear" as const,
};

export const distances = {
  shiftXs: 6,
  shiftSm: 12,
  shiftMd: 24,
  shiftLg: 40,
  dropLift: 16,
  /** Artifact rises from below the chat card. */
  artifactPopRise: 52,
  artifactPopOvershoot: -18,
  artifactPopBounce: 7,
  artifactPopSettle: -3,
  artifactPopMicro: 1,
} as const;

export const staggers = {
  staggerItem: 50,
  staggerGroup: 80,
  staggerSection: 140,
  staggerCap: 900,
} as const;

export const scales = {
  scaleCompress: 0.96,
  scaleOvershoot: 1.02,
  scalePopStart: 0.92,
  /** Artifact chat spawn — dramatic rise + bounce. */
  artifactPopStart: 0.7,
  artifactPopPeak: 1.14,
  artifactPopCompress: 0.93,
  artifactPopSettle: 1.05,
} as const;

/** Artifact pop-in from chat — full bounce sequence (ms). */
export const ARTIFACT_SPAWN_ANIMATION_MS = 1200;

/** Canvas load reveal — stagger left-to-right; nodes slide up from below. */
export const canvasLoadDelays = {
  totalMs: 3000,
  slideDuration: 620,
  shift: distances.shiftMd,
  buffer: 0,
} as const;

/** Landing stagger delays (ms) — total perceptual complete < 1000ms. */
export const landingDelays = {
  title: 0,
  pillBase: 280,
  pillStagger: 40,
  composer: 500,
  tipBase: 640,
  tipStagger: 35,
  duration: 280,
} as const;

export function durationSeconds(token: DurationToken): number {
  return durations[token] / 1000;
}

export function cssEase(
  key: keyof Pick<
    typeof easings,
    "easeLight" | "easeMedium" | "easeHeavy" | "easeSettle"
  >,
): string {
  const [a, b, c, d] = easings[key];
  return `cubic-bezier(${a}, ${b}, ${c}, ${d})`;
}
