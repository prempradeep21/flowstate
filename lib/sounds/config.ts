import { SOUND_EVENTS } from "./events";
import type { SoundEventConfig, SoundEventId, SoundMapping } from "./types";

export const DEFAULT_EVENT_VOLUME = 1;

export function createEventConfig(
  preset: SoundEventConfig["preset"],
  volume = DEFAULT_EVENT_VOLUME,
): SoundEventConfig {
  return {
    preset,
    volume: clampEventVolume(volume),
  };
}

export function clampEventVolume(volume: number): number {
  return Math.max(0, Math.min(1, volume));
}

export function buildDefaultSoundMap(): SoundMapping {
  const map = {} as SoundMapping;
  for (const event of SOUND_EVENTS) {
    map[event.id] = createEventConfig(event.defaultPreset, event.defaultVolume);
  }
  return map;
}

/** Accept legacy draft entries that stored only a preset id string. */
export function normalizeSoundMapping(value: unknown): SoundMapping | null {
  if (!value || typeof value !== "object") return null;

  const base = buildDefaultSoundMap();
  const raw = value as Record<string, unknown>;

  for (const event of SOUND_EVENTS) {
    const entry = raw[event.id];
    if (typeof entry === "string") {
      base[event.id] = createEventConfig(
        entry === "none" ? null : (entry as SoundEventConfig["preset"]),
      );
      continue;
    }
    if (!entry || typeof entry !== "object") continue;

    const config = entry as Record<string, unknown>;
    const preset = config.preset;
    const volume = config.volume;

    if (preset === null) {
      base[event.id] = createEventConfig(
        null,
        typeof volume === "number" ? volume : DEFAULT_EVENT_VOLUME,
      );
      continue;
    }

    if (typeof preset !== "string") continue;

    base[event.id] = createEventConfig(
      preset === "none" ? null : (preset as SoundEventConfig["preset"]),
      typeof volume === "number" ? volume : DEFAULT_EVENT_VOLUME,
    );
  }

  return base;
}
