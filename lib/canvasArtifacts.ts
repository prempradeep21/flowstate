import { getLatestVersion, getVersionById } from "@/lib/sessionArtifacts";
import { CARD_WIDTH, getArtifactBounds } from "@/lib/canvasNodeBounds";
import {
  ARTIFACT_SPAWN_GAP_X,
  CANVAS_ARTIFACT_WIDTH,
  useCanvasStore,
  type CanvasArtifactNode,
  type Card,
} from "@/lib/store";
import { viewportCenteredOnWorldPoint } from "@/lib/viewport";

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
): { x: number; y: number } {
  const card = cards[sourceCardId];
  if (!card) {
    return { x: CANVAS_ARTIFACT_WIDTH + ARTIFACT_SPAWN_GAP_X, y: 0 };
  }

  const cardW = card.size?.w ?? CARD_WIDTH;
  let x = card.position.x + cardW + ARTIFACT_SPAWN_GAP_X;
  let y = card.position.y;

  const overlap = Object.values(nodes).filter(
    (n) => Math.abs(n.position.y - y) < 40 && Math.abs(n.position.x - x) < 40,
  );
  if (overlap.length > 0) {
    y += overlap.length * 40;
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
  state.setViewport(vp);
  return true;
}
