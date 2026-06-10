import { payloadToArtifactKind, type ArtifactPayload } from "@/lib/artifactTypes";
import {
  CANVAS_ARTIFACT_WIDTH,
  DEFAULT_ARTIFACT_HEIGHT,
  getArtifactBounds,
  getCardBounds,
  getDefaultArtifactSize,
} from "@/lib/canvasNodeBounds";
import {
  DEFAULT_CANVAS_TUNING,
  resolveTuning,
  type ResolvedCanvasTuning,
} from "@/lib/canvasTuning";
import { getLatestVersion, getVersionById, type SessionArtifact } from "@/lib/sessionArtifacts";
import {
  useCanvasStore,
  type CanvasArtifactNode,
  type Card,
} from "@/lib/store";
import { animateViewportTo } from "@/lib/motion/animateViewport";
import { viewportCenteredOnWorldPoint } from "@/lib/viewport";

const DEFAULT_TUNING = resolveTuning(DEFAULT_CANVAS_TUNING);

export interface WorldRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function findCanvasNodeByArtifactId(
  nodes: Record<string, CanvasArtifactNode>,
  artifactId: string,
): CanvasArtifactNode | undefined {
  return Object.values(nodes).find((n) => n.artifactId === artifactId);
}

export function getNodesForCard(
  nodes: Record<string, CanvasArtifactNode>,
  cardId: string,
): CanvasArtifactNode[] {
  return Object.values(nodes).filter((n) => n.sourceCardId === cardId);
}

export function findGeneratingPreviewNode(
  nodes: Record<string, CanvasArtifactNode>,
  cardId: string,
  kind?: import("@/lib/artifactTypes").ArtifactKind,
): CanvasArtifactNode | undefined {
  return Object.values(nodes).find(
    (n) =>
      n.sourceCardId === cardId &&
      n.generatingPreview &&
      !n.artifactId &&
      (!kind || n.generatingPreview.kind === kind),
  );
}

function payloadSpawnSize(payload?: ArtifactPayload): { w: number; h: number } {
  if (!payload) {
    return { w: CANVAS_ARTIFACT_WIDTH, h: DEFAULT_ARTIFACT_HEIGHT };
  }
  return getDefaultArtifactSize(payloadToArtifactKind(payload), payload);
}

function nodeWorldRect(
  node: CanvasArtifactNode,
  sessionArtifacts: Record<string, SessionArtifact>,
  tuning: ResolvedCanvasTuning,
): WorldRect {
  const art = node.artifactId ? sessionArtifacts[node.artifactId] : undefined;
  const { w, h } = getArtifactBounds(node, art);
  return { x: node.position.x, y: node.position.y, w, h };
}

function rectsOverlap(a: WorldRect, b: WorldRect, gap: number): boolean {
  return !(
    a.x + a.w + gap <= b.x ||
    b.x + b.w + gap <= a.x ||
    a.y + a.h + gap <= b.y ||
    b.y + b.h + gap <= a.y
  );
}

function isRightOfCard(
  node: CanvasArtifactNode,
  cardX: number,
  cardW: number,
  tuning: ResolvedCanvasTuning,
): boolean {
  return node.position.x >= cardX + cardW - tuning.followUpGap / 2;
}

function isLeftOfCard(
  node: CanvasArtifactNode,
  cardX: number,
  tuning: ResolvedCanvasTuning,
): boolean {
  const nodeW = node.size?.w ?? CANVAS_ARTIFACT_WIDTH;
  return node.position.x + nodeW <= cardX + tuning.followUpGap / 2;
}

function resolveNonOverlappingY(
  x: number,
  y: number,
  w: number,
  h: number,
  occupied: WorldRect[],
  gap: number,
): number {
  let candidateY = y;
  for (let attempt = 0; attempt < 32; attempt++) {
    const candidate: WorldRect = { x, y: candidateY, w, h };
    const hit = occupied.some((rect) => rectsOverlap(candidate, rect, gap));
    if (!hit) return candidateY;
    candidateY += h + gap;
  }
  return candidateY;
}

export type ArtifactSpawnSide = "left" | "right";

export function pickAlternateSpawnSide(
  sourceCardId: string,
  nodes: Record<string, CanvasArtifactNode>,
  cards: Record<string, Card>,
  tuning: ResolvedCanvasTuning = DEFAULT_TUNING,
): ArtifactSpawnSide {
  const card = cards[sourceCardId];
  if (!card) return "right";

  const cardW = card.size?.w ?? tuning.cardWidth;
  const siblings = getNodesForCard(nodes, sourceCardId);
  if (siblings.length === 0) return "right";

  const hasRight = siblings.some((n) =>
    isRightOfCard(n, card.position.x, cardW, tuning),
  );
  const hasLeft = siblings.some((n) =>
    isLeftOfCard(n, card.position.x, tuning),
  );

  if (hasRight && !hasLeft) return "left";
  if (hasLeft && !hasRight) return "right";
  return siblings.length % 2 === 0 ? "right" : "left";
}

/** Non-overlapping spawn position — alternates left/right of the source card. */
export function computeArtifactSpawnPosition(
  sourceCardId: string,
  nodes: Record<string, CanvasArtifactNode>,
  cards: Record<string, Card>,
  opts?: {
    payload?: ArtifactPayload;
    side?: ArtifactSpawnSide;
    sessionArtifacts?: Record<string, SessionArtifact>;
  },
  tuning: ResolvedCanvasTuning = DEFAULT_TUNING,
): { x: number; y: number } {
  const card = cards[sourceCardId];
  if (!card) {
    return {
      x: CANVAS_ARTIFACT_WIDTH + tuning.artifactSpawnGapX,
      y: 0,
    };
  }

  const cardBounds = getCardBounds(card, tuning);
  const cardW = cardBounds.w;
  const { w: artifactW, h: artifactH } = payloadSpawnSize(opts?.payload);
  const side =
    opts?.side ?? pickAlternateSpawnSide(sourceCardId, nodes, cards, tuning);

  const x =
    side === "left"
      ? card.position.x - tuning.artifactSpawnGapX - artifactW
      : card.position.x + cardW + tuning.artifactSpawnGapX;
  let y = card.position.y;

  const sessionArtifacts = opts?.sessionArtifacts ?? {};
  const occupied = Object.values(nodes).map((node) =>
    nodeWorldRect(node, sessionArtifacts, tuning),
  );

  y = resolveNonOverlappingY(x, y, artifactW, artifactH, occupied, tuning.followUpGap);

  return { x, y };
}

/** @deprecated Use computeArtifactSpawnPosition — kept for callers that only need a default slot. */
export function computeDefaultSpawnPosition(
  sourceCardId: string,
  nodes: Record<string, CanvasArtifactNode>,
  cards: Record<string, Card>,
  tuning: ResolvedCanvasTuning = DEFAULT_TUNING,
): { x: number; y: number } {
  return computeArtifactSpawnPosition(sourceCardId, nodes, cards, undefined, tuning);
}

function panToWorldRect(
  rect: WorldRect,
  selectNodeId?: string,
): boolean {
  const state = useCanvasStore.getState();
  if (selectNodeId) {
    state.selectCanvasArtifact(selectNodeId);
  }

  const container = document.querySelector("[data-canvas-container]");
  const domRect = container?.getBoundingClientRect();
  if (!domRect) return true;

  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const vp = viewportCenteredOnWorldPoint(
    cx,
    cy,
    domRect.width,
    domRect.height,
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

/** Pan viewport to a canvas artifact node (materialized or permission preview). */
export function focusCanvasArtifactNode(nodeId: string): boolean {
  const state = useCanvasStore.getState();
  const node = state.canvasArtifactNodes[nodeId];
  if (!node) return false;

  if (node.artifactId) {
    return focusCanvasArtifact(node.artifactId);
  }

  const { w, h } = getArtifactBounds(node, null);
  return panToWorldRect(
    { x: node.position.x, y: node.position.y, w, h },
    nodeId,
  );
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
    const payloadKind = payloadToArtifactKind(ver.payload);
    const nodeId = state.spawnCanvasArtifact(artifactId, ver.id, {
      payload: ver.payload,
      side: pickAlternateSpawnSide(
        ver.sourceCardId,
        state.canvasArtifactNodes,
        state.cards,
      ),
    });
    if (!nodeId) return false;
    node = useCanvasStore.getState().canvasArtifactNodes[nodeId];
    if (!node) return false;
  }

  state.selectCanvasArtifact(node.id);

  const art = state.sessionArtifacts[node.artifactId];
  const { w, h } = getArtifactBounds(node, art);
  return panToWorldRect(
    { x: node.position.x, y: node.position.y, w, h },
    node.id,
  );
}
