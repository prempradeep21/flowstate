import { cssEase, durationSeconds, durations, easings } from "./tokens";
import type { DurationToken, VisualWeight } from "./types";

const weightEase: Record<VisualWeight, number[]> = {
  light: [...easings.easeLight],
  medium: [...easings.easeMedium],
  heavy: [...easings.easeHeavy],
};

export function transitionForWeight(
  weight: VisualWeight,
  durationKey: DurationToken,
) {
  return {
    duration: durationSeconds(durationKey),
    ease: weightEase[weight],
  };
}

export function framerTransition(
  durationKey: DurationToken,
  easeKey: keyof typeof easings = "easeMedium",
) {
  const ease = easings[easeKey];
  if (typeof ease === "string") {
    return { duration: durationSeconds(durationKey), ease };
  }
  return {
    duration: durationSeconds(durationKey),
    ease: [...ease] as [number, number, number, number],
  };
}

export { cssEase, durations, durationSeconds };
