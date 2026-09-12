import type { ComponentType } from "react";
import { AskScene } from "@/components/canvas-loading/scenes/AskScene";
import { BranchScene } from "@/components/canvas-loading/scenes/BranchScene";
import { SourcesScene } from "@/components/canvas-loading/scenes/SourcesScene";
import { ArtifactScene } from "@/components/canvas-loading/scenes/ArtifactScene";
import { ShareScene } from "@/components/canvas-loading/scenes/ShareScene";
import type { SceneProps } from "@/components/canvas-loading/types";

export interface SceneEntry {
  name: string;
  Scene: ComponentType<SceneProps>;
}

export const SCENES: SceneEntry[] = [
  { name: "Ask + follow up", Scene: AskScene },
  { name: "Branch", Scene: BranchScene },
  { name: "Sources + citations", Scene: SourcesScene },
  { name: "Artifact morph", Scene: ArtifactScene },
  { name: "Share + live cursors", Scene: ShareScene },
];

let lastScene = -1;

/**
 * Random scene index that never repeats the previous pick. Module-level state
 * survives canvas switches within a session and resets on page reload.
 */
export function pickScene(): number {
  let index = Math.floor(Math.random() * SCENES.length);
  if (index === lastScene) index = (index + 1) % SCENES.length;
  lastScene = index;
  return index;
}
