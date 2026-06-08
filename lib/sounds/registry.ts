import type { SoundMapping } from "./types";

/** Production sound mapping — edit via /dev/sound or update manually. */
export const DEFAULT_SOUND_MAP: SoundMapping = {
  "card-drag-start": { preset: "swoosh", volume: 0.8 },
  "card-drag-drop": { preset: "drop", volume: 0.1 },
  "artifact-drag-drop": { preset: "drop", volume: 0.2 },
  "canvas-pan": { preset: "scroll-tick", volume: 0.7 },
  "branch-collapse": { preset: "collapse", volume: 1 },
  "chat-collapse": { preset: "collapse", volume: 1 },
  "branch-create": { preset: "swoosh", volume: 1 },
  "plug-connect": { preset: "toggle-on", volume: 1 },
  "artifact-panel-open": { preset: null, volume: 1 },
  "artifact-panel-close": { preset: null, volume: 1 },
  "artifact-focus": { preset: "scroll-tick", volume: 1 },
  "agent-thinking-start": { preset: "toggle-on", volume: 1 },
  "agent-streaming-start": { preset: null, volume: 1 },
  "agent-complete": { preset: "message", volume: 0.6 },
  "agent-error": { preset: null, volume: 1 },
  "undo": { preset: null, volume: 1 },
  "redo": { preset: null, volume: 1 },
};

export let SOUND_MAP: SoundMapping = { ...DEFAULT_SOUND_MAP };

export function applySoundMap(map: SoundMapping): void {
  SOUND_MAP = { ...map };
}

export function resetSoundMap(): void {
  SOUND_MAP = { ...DEFAULT_SOUND_MAP };
}
