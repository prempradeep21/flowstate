export type SpawnKind =
  | "drop"
  | "popUp"
  | "landing"
  | "panelExpand"
  | "overlay"
  | "connection";

export type VisualWeight = "light" | "medium" | "heavy";

export type DurationToken =
  | "instant"
  | "fast"
  | "standard"
  | "panel"
  | "slow"
  | "deliberate";

export type SpawnTargetKind = "card" | "artifact" | "connection";

export interface SpawnMeta {
  targetId: string;
  targetKind: SpawnTargetKind;
  kind: SpawnKind;
  createdAt: number;
}

export const SPAWN_META_TTL_MS = 400;
export const LANDING_ANIMATED_KEY = "flowstate-landing-animated";
