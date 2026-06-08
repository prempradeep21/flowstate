import type { PresetName } from "seslen/presets";

export type SeslenPresetId = PresetName;

export type SoundEventId =
  | "card-drag-start"
  | "card-drag-drop"
  | "artifact-drag-drop"
  | "canvas-pan"
  | "branch-collapse"
  | "chat-collapse"
  | "branch-create"
  | "plug-connect"
  | "artifact-panel-open"
  | "artifact-panel-close"
  | "artifact-focus"
  | "agent-thinking-start"
  | "agent-streaming-start"
  | "agent-complete"
  | "agent-error"
  | "undo"
  | "redo";

/** `null` = no sound for this interaction. */
export type SoundPresetSelection = SeslenPresetId | null;

/** Per-interaction sound: preset + gain multiplier (0..1). */
export interface SoundEventConfig {
  preset: SoundPresetSelection;
  volume: number;
}

export type SoundMapping = Record<SoundEventId, SoundEventConfig>;

export type SoundEventCategory =
  | "canvas"
  | "branch"
  | "artifact"
  | "agent"
  | "history";

export interface SoundEventDefinition {
  id: SoundEventId;
  label: string;
  description: string;
  category: SoundEventCategory;
  defaultPreset: SeslenPresetId;
  /** Default per-event gain (0..1). */
  defaultVolume: number;
}
