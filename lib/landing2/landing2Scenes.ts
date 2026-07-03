import type { Landing2SceneId } from "@/components/landing2/landing2Copy";

export interface Landing2SceneConfig {
  id: Landing2SceneId;
  pinHeightVh: number;
  pinHeightVhMobile: number;
}

export const LANDING2_SCENE_CONFIG: Landing2SceneConfig[] = [
  { id: "prologue", pinHeightVh: 220, pinHeightVhMobile: 140 },
  { id: "chat-trap", pinHeightVh: 320, pinHeightVhMobile: 200 },
  { id: "three-pains", pinHeightVh: 300, pinHeightVhMobile: 220 },
  { id: "canvas-break", pinHeightVh: 450, pinHeightVhMobile: 280 },
  { id: "artifact-orbit", pinHeightVh: 380, pinHeightVhMobile: 240 },
  { id: "inputs", pinHeightVh: 160, pinHeightVhMobile: 130 },
  { id: "share", pinHeightVh: 280, pinHeightVhMobile: 200 },
  { id: "finale", pinHeightVh: 110, pinHeightVhMobile: 100 },
];

export function sceneConfig(id: Landing2SceneId): Landing2SceneConfig {
  const found = LANDING2_SCENE_CONFIG.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown landing2 scene: ${id}`);
  return found;
}
