import type { SeslenPresetId } from "./types";

export interface PresetGroup {
  label: string;
  presets: SeslenPresetId[];
}

export const PRESET_GROUPS: PresetGroup[] = [
  {
    label: "Original",
    presets: [
      "tick",
      "success",
      "error",
      "warning",
      "message",
      "add",
      "delete",
      "victory",
    ],
  },
  {
    label: "UI feedback",
    presets: [
      "hover",
      "pop",
      "swoosh",
      "toggle-on",
      "toggle-off",
      "notify",
      "keypress",
      "scroll-tick",
      "drag",
      "drop",
      "expand",
      "collapse",
      "undo",
      "redo",
      "send",
      "receive",
      "copy",
      "paste",
    ],
  },
  {
    label: "Game",
    presets: ["level-up", "coin", "jump", "shoot", "explosion"],
  },
  {
    label: "Ambient",
    presets: ["heartbeat", "alarm", "typewriter", "lock", "unlock"],
  },
];
