import type { CSSProperties } from "react";
import { THREAD_ACCENT_PALETTE } from "@/lib/design/tokens";
import type { Landing2SceneId } from "@/components/landing2/landing2Copy";

export const LANDING2_ACCENTS = THREAD_ACCENT_PALETTE;

/** Per-scene color wash — edge-to-edge gradients */
export const LANDING2_SCENE_WASH: Record<
  Landing2SceneId,
  { from: string; via?: string; to: string; accent: string; orb?: string }
> = {
  prologue: {
    from: "rgb(107 78 255 / 0.32)",
    via: "rgb(187 107 217 / 0.18)",
    to: "rgb(var(--canvas-bg) / 0)",
    accent: LANDING2_ACCENTS[0]!,
    orb: LANDING2_ACCENTS[0]!,
  },
  "chat-trap": {
    from: "rgb(242 201 76 / 0.26)",
    via: "rgb(242 153 74 / 0.14)",
    to: "rgb(var(--canvas-bg) / 0)",
    accent: LANDING2_ACCENTS[3]!,
    orb: LANDING2_ACCENTS[3]!,
  },
  "three-pains": {
    from: "rgb(255 143 163 / 0.28)",
    via: "rgb(155 81 224 / 0.16)",
    to: "rgb(var(--canvas-bg) / 0)",
    accent: LANDING2_ACCENTS[1]!,
    orb: LANDING2_ACCENTS[1]!,
  },
  "canvas-break": {
    from: "rgb(111 207 151 / 0.22)",
    via: "rgb(86 204 242 / 0.16)",
    to: "rgb(107 78 255 / 0.1)",
    accent: LANDING2_ACCENTS[2]!,
    orb: LANDING2_ACCENTS[2]!,
  },
  "artifact-orbit": {
    from: "rgb(107 78 255 / 0.2)",
    via: "rgb(86 204 242 / 0.14)",
    to: "rgb(242 153 74 / 0.1)",
    accent: LANDING2_ACCENTS[5]!,
    orb: LANDING2_ACCENTS[5]!,
  },
  inputs: {
    from: "rgb(187 107 217 / 0.24)",
    to: "rgb(111 207 151 / 0.14)",
    accent: LANDING2_ACCENTS[4]!,
    orb: LANDING2_ACCENTS[4]!,
  },
  share: {
    from: "rgb(86 204 242 / 0.26)",
    via: "rgb(107 78 255 / 0.16)",
    to: "rgb(var(--canvas-bg) / 0)",
    accent: LANDING2_ACCENTS[6]!,
    orb: LANDING2_ACCENTS[6]!,
  },
  finale: {
    from: "rgb(107 78 255 / 0.36)",
    via: "rgb(255 143 163 / 0.2)",
    to: "rgb(111 207 151 / 0.16)",
    accent: LANDING2_ACCENTS[0]!,
    orb: LANDING2_ACCENTS[0]!,
  },
};

export function sceneWashStyle(sceneId: Landing2SceneId): CSSProperties {
  const wash = LANDING2_SCENE_WASH[sceneId];
  const stops = wash.via
    ? `${wash.from} 0%, ${wash.via} 45%, ${wash.to} 100%`
    : `${wash.from} 0%, ${wash.to} 100%`;
  return {
    background: `linear-gradient(165deg, ${stops})`,
  };
}
