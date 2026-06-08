import { getArtifactBounds, getCardBounds } from "@/lib/canvasNodeBounds";
import type {
  CanvasArtifactNode,
  CanvasTextLabel,
  Card,
  SessionArtifact,
} from "@/lib/store";

export interface ContentBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

const CONTENT_BOUNDS_PADDING = 48;
const EMPTY_BOUNDS_W = 1200;
const EMPTY_BOUNDS_H = 800;

export interface CanvasContentBoundsInput {
  cards: Record<string, Card>;
  cardOrder: string[];
  canvasArtifactNodes: Record<string, CanvasArtifactNode>;
  canvasArtifactOrder: string[];
  canvasTextLabels: Record<string, CanvasTextLabel>;
  canvasTextLabelOrder: string[];
  sessionArtifacts: Record<string, SessionArtifact>;
}

export function computeCanvasContentBounds(
  state: CanvasContentBoundsInput,
  padding: number = CONTENT_BOUNDS_PADDING,
): ContentBounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const include = (x: number, y: number, w: number, h: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  };

  for (const id of state.cardOrder) {
    const card = state.cards[id];
    if (!card) continue;
    const { w, h } = getCardBounds(card);
    include(card.position.x, card.position.y, w, h);
  }

  for (const id of state.canvasArtifactOrder) {
    const node = state.canvasArtifactNodes[id];
    if (!node) continue;
    const artifact = state.sessionArtifacts[node.artifactId];
    const { w, h } = getArtifactBounds(node, artifact);
    include(node.position.x, node.position.y, w, h);
  }

  for (const id of state.canvasTextLabelOrder) {
    const label = state.canvasTextLabels[id];
    if (!label) continue;
    const w = Math.max(80, label.text.length * label.fontSize * 0.35);
    const h = label.fontSize;
    include(label.position.x, label.position.y - h / 2, w, h);
  }

  if (!Number.isFinite(minX)) {
    return {
      x: -EMPTY_BOUNDS_W / 2,
      y: -EMPTY_BOUNDS_H / 2,
      w: EMPTY_BOUNDS_W,
      h: EMPTY_BOUNDS_H,
    };
  }

  return {
    x: minX - padding,
    y: minY - padding,
    w: maxX - minX + padding * 2,
    h: maxY - minY + padding * 2,
  };
}
