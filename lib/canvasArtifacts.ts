import { getLatestVersion, getVersionById } from "@/lib/sessionArtifacts";
import { CANVAS_ARTIFACT_WIDTH, getArtifactBounds } from "@/lib/canvasNodeBounds";
import {
  DEFAULT_CANVAS_TUNING,
  resolveTuning,
  type ResolvedCanvasTuning,
} from "@/lib/canvasTuning";
import {
  useCanvasStore,
  type CanvasArtifactNode,
  type Card,
} from "@/lib/store";
import { animateViewportTo } from "@/lib/motion/animateViewport";
import { viewportCenteredOnWorldPoint } from "@/lib/viewport";

const DEFAULT_TUNING = resolveTuning(DEFAULT_CANVAS_TUNING);

export function findCanvasNodeByArtifactId(
  nodes: Record<string, CanvasArtifactNode>,
  artifactId: string,
): CanvasArtifactNode | undefined {
  return Object.values(nodes).find((n) => n.artifactId === artifactId);
}

export function computeDefaultSpawnPosition(
  sourceCardId: string,
  nodes: Record<string, CanvasArtifactNode>,
  cards: Record<string, Card>,
  tuning: ResolvedCanvasTuning = DEFAULT_TUNING,
): { x: number; y: number } {
  const card = cards[sourceCardId];
  if (!card) {
    return {
      x: CANVAS_ARTIFACT_WIDTH + tuning.artifactSpawnGapX,
      y: 0,
    };
  }

  const cardW = card.size?.w ?? tuning.cardWidth;
  let x = card.position.x + cardW + tuning.artifactSpawnGapX;
  let y = card.position.y;

  const overlap = Object.values(nodes).filter(
    (n) =>
      Math.abs(n.position.y - y) < tuning.followUpGap &&
      Math.abs(n.position.x - x) < tuning.followUpGap,
  );
  if (overlap.length > 0) {
    y += overlap.length * tuning.followUpGap;
  }

  return { x, y };
}

/** Pan viewport to a canvas artifact node and select it. */
export function focusCanvasArtifact(artifactId: string): boolean {
  const state = useCanvasStore.getState();
  let node = findCanvasNodeByArtifactId(
    state.canvasArtifactNodes,
    artifactId,
  );

  if (!node) {
    const art = state.sessionArtifacts[artifactId];
    if (!art) return false;
    const ver = getVersionById(art, art.latestVersionId) ?? getLatestVersion(art);
    if (!ver) return false;
    const nodeId = state.spawnCanvasArtifact(artifactId, ver.id);
    if (!nodeId) return false;
    node = useCanvasStore.getState().canvasArtifactNodes[nodeId];
    if (!node) return false;
  }

  state.selectCanvasArtifact(node.id);

  const container = document.querySelector("[data-canvas-container]");
  const rect = container?.getBoundingClientRect();
  if (!rect) return true;

  const art = state.sessionArtifacts[node.artifactId];
  const { w, h } = getArtifactBounds(node, art);
  const cx = node.position.x + w / 2;
  const cy = node.position.y + h / 2;
  const vp = viewportCenteredOnWorldPoint(
    cx,
    cy,
    rect.width,
    rect.height,
    state.viewport.scale,
  );
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  animateViewportTo(vp, { reducedMotion: reduced });

  if (typeof window !== "undefined") {
    void import("@/lib/sounds/engine").then(({ playSound }) => {
      void playSound("artifact-focus");
    });
  }

  return true;
}
