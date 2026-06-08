import { normalizeSoundMapping } from "./config";
import type { SoundMapping } from "./types";

export function isValidSoundMapping(value: unknown): value is SoundMapping {
  return normalizeSoundMapping(value) !== null;
}

export function formatSoundMapAsTypeScript(map: SoundMapping): string {
  const entries = Object.entries(map)
    .map(([eventId, config]) => {
      const preset =
        config.preset === null ? "null" : `"${config.preset}"`;
      return `  "${eventId}": { preset: ${preset}, volume: ${config.volume} },`;
    })
    .join("\n");

  return `import type { SoundMapping } from "./types";

/** Production sound mapping — edit via /dev/sound or update manually. */
export const DEFAULT_SOUND_MAP: SoundMapping = {
${entries}
};

export let SOUND_MAP: SoundMapping = { ...DEFAULT_SOUND_MAP };

export function applySoundMap(map: SoundMapping): void {
  SOUND_MAP = { ...map };
}

export function resetSoundMap(): void {
  SOUND_MAP = { ...DEFAULT_SOUND_MAP };
}
`;
}
