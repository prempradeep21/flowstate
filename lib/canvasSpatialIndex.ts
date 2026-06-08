import RBush from "rbush";
import { getArtifactBounds, getCardBounds } from "@/lib/canvasNodeBounds";
import { getCanvasAssetBounds } from "@/lib/canvasAssetBounds";
import { estimateTextLabelBounds } from "@/lib/canvasTextLabelBounds";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import type {
  CanvasArtifactNode,
  CanvasAsset,
  CanvasAssetNode,
  CanvasTextLabel,
  Card,
  SessionArtifact,
  Viewport,
} from "@/lib/store";

/** Enable viewport culling once the board exceeds this node count. */
export const CULLING_MIN_NODES = 30;

/** Extra world-space padding so nodes near the edge don't pop in/out. */
export const CULLING_VIEWPORT_PADDING = 240;

export interface VisibleNodes {
  cards: Set<string>;
  artifacts: Set<string>;
  assets: Set<string>;
  labels: Set<string>;
}

interface SpatialEntry {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  kind: "card" | "artifact" | "asset" | "label";
  id: string;
}

type SpatialIndex = RBush<SpatialEntry>;

export interface CanvasSpatialInput {
  viewport: Viewport;
  cards: Record<string, Card>;
  cardOrder: string[];
  canvasArtifactNodes: Record<string, CanvasArtifactNode>;
  canvasArtifactOrder: string[];
  canvasAssets: Record<string, CanvasAsset>;
  canvasAssetNodes: Record<string, CanvasAssetNode>;
  canvasAssetOrder: string[];
  canvasTextLabels: Record<string, CanvasTextLabel>;
  canvasTextLabelOrder: string[];
  sessionArtifacts: Record<string, SessionArtifact>;
}

export function getVisibleWorldRect(
  viewport: Viewport,
  containerWidth: number,
  containerHeight: number,
  padding = CULLING_VIEWPORT_PADDING,
): { minX: number; minY: number; maxX: number; maxY: number } {
  const minX = (-viewport.x) / viewport.scale - padding;
  const minY = (-viewport.y) / viewport.scale - padding;
  const maxX = (containerWidth - viewport.x) / viewport.scale + padding;
  const maxY = (containerHeight - viewport.y) / viewport.scale + padding;
  return { minX, minY, maxX, maxY };
}

export function buildCanvasSpatialIndex(
  input: CanvasSpatialInput,
): SpatialIndex {
  const tree = new RBush<SpatialEntry>();
  const entries: SpatialEntry[] = [];

  for (const id of input.cardOrder) {
    const card = input.cards[id];
    if (!card) continue;
    const { w, h } = getCardBounds(card, RESOLVED_CANVAS_TUNING);
    entries.push({
      minX: card.position.x,
      minY: card.position.y,
      maxX: card.position.x + w,
      maxY: card.position.y + h,
      kind: "card",
      id,
    });
  }

  for (const id of input.canvasArtifactOrder) {
    const node = input.canvasArtifactNodes[id];
    if (!node) continue;
    const artifact = node.artifactId
      ? input.sessionArtifacts[node.artifactId]
      : undefined;
    const { w, h } = getArtifactBounds(node, artifact);
    entries.push({
      minX: node.position.x,
      minY: node.position.y,
      maxX: node.position.x + w,
      maxY: node.position.y + h,
      kind: "artifact",
      id,
    });
  }

  for (const id of input.canvasAssetOrder) {
    const node = input.canvasAssetNodes[id];
    if (!node) continue;
    const asset = input.canvasAssets[node.assetId];
    const { w, h } = getCanvasAssetBounds(node, asset);
    entries.push({
      minX: node.position.x,
      minY: node.position.y,
      maxX: node.position.x + w,
      maxY: node.position.y + h,
      kind: "asset",
      id,
    });
  }

  for (const id of input.canvasTextLabelOrder) {
    const label = input.canvasTextLabels[id];
    if (!label) continue;
    const { w, h } = estimateTextLabelBounds(label);
    entries.push({
      minX: label.position.x,
      minY: label.position.y,
      maxX: label.position.x + w,
      maxY: label.position.y + h,
      kind: "label",
      id,
    });
  }

  tree.load(entries);
  return tree;
}

export function queryVisibleNodes(
  input: CanvasSpatialInput,
  containerSize: { width: number; height: number },
  alwaysVisible: {
    cards?: Iterable<string>;
    artifacts?: Iterable<string>;
    assets?: Iterable<string>;
    labels?: Iterable<string>;
  } = {},
): VisibleNodes {
  const rect = getVisibleWorldRect(
    input.viewport,
    containerSize.width,
    containerSize.height,
  );
  const tree = buildCanvasSpatialIndex(input);
  const hits = tree.search(rect);

  const cards = new Set<string>(alwaysVisible.cards ?? []);
  const artifacts = new Set<string>(alwaysVisible.artifacts ?? []);
  const assets = new Set<string>(alwaysVisible.assets ?? []);
  const labels = new Set<string>(alwaysVisible.labels ?? []);

  for (const hit of hits) {
    if (hit.kind === "card") cards.add(hit.id);
    else if (hit.kind === "artifact") artifacts.add(hit.id);
    else if (hit.kind === "asset") assets.add(hit.id);
    else labels.add(hit.id);
  }

  return { cards, artifacts, assets, labels };
}

export function shouldEnableViewportCulling(nodeCount: number): boolean {
  return nodeCount >= CULLING_MIN_NODES;
}
