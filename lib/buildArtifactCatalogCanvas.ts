import type { ArtifactCatalogCategory, ArtifactCatalogEntry } from "@/lib/artifactCatalogSamples";
import { ARTIFACT_CATALOG_ENTRIES } from "@/lib/artifactCatalogSamples";
import {
  buildCanvasSnapshot,
  type CanvasSnapshot,
} from "@/lib/canvasSnapshot";
import {
  CARD_WIDTH,
  FALLBACK_CARD_HEIGHT,
  getArtifactBounds,
  getCardBounds,
  getDefaultArtifactSize,
} from "@/lib/canvasNodeBounds";
import { THREAD_ACCENT_PALETTE } from "@/lib/design/tokens";
import {
  createSessionArtifactFromPayload,
  getLatestVersion,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import type {
  CanvasArtifactNode,
  CanvasBackgroundStyle,
  CanvasTheme,
  Card,
  Thread,
} from "@/lib/store";

export const CATALOG_THREAD_ID = "catalog-thread";
export const CATALOG_SOURCE_CARD_ID = "catalog-source-card";

const GRID_ORIGIN_X = 120;
const GRID_ORIGIN_Y = 140;
const GRID_GAP_X = 160;
const GRID_GAP_Y = 140;

type LayoutItem =
  | { kind: "artifact"; entry: ArtifactCatalogEntry; w: number; h: number }
  | { kind: "card"; entry: ArtifactCatalogEntry; w: number; h: number };

function columnCount(category: ArtifactCatalogCategory, count: number): number {
  if (category === "custom-example") return Math.min(2, count);
  if (count <= 6) return 3;
  return 4;
}

function catalogArtifactSize(artifact: SessionArtifact): { w: number; h: number } {
  const ver = getLatestVersion(artifact);
  return getDefaultArtifactSize(artifact.kind, ver?.payload);
}

function layoutGrid(
  items: LayoutItem[],
  cols: number,
): { x: number; y: number; w: number; h: number }[] {
  const colWidths = Array.from({ length: cols }, () => 0);
  const rowHeights: number[] = [];

  items.forEach((item, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    colWidths[col] = Math.max(colWidths[col], item.w);
    rowHeights[row] = Math.max(rowHeights[row] ?? 0, item.h);
  });

  return items.map((item, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    let x = GRID_ORIGIN_X;
    for (let c = 0; c < col; c++) x += colWidths[c]! + GRID_GAP_X;
    let y = GRID_ORIGIN_Y;
    for (let r = 0; r < row; r++) y += rowHeights[r]! + GRID_GAP_Y;
    return { x, y, w: item.w, h: item.h };
  });
}

function catalogSourceCard(): Card {
  return {
    id: CATALOG_SOURCE_CARD_ID,
    threadId: CATALOG_THREAD_ID,
    question: "Artifact catalog",
    answer: "Browse live artifact previews on the canvas.",
    status: "done",
    position: { x: GRID_ORIGIN_X, y: GRID_ORIGIN_Y - 220 },
    parentCardId: null,
    parentConversationId: null,
  };
}

function catalogTextCard(entry: ArtifactCatalogEntry, position: { x: number; y: number }): Card {
  return {
    id: `catalog-card-${entry.id}`,
    threadId: CATALOG_THREAD_ID,
    question: entry.textCard?.question ?? entry.title,
    answer: entry.textCard?.answer ?? entry.description,
    status: "done",
    position,
    parentCardId: null,
    parentConversationId: null,
  };
}

export function buildArtifactCatalogSnapshot(
  category: ArtifactCatalogCategory,
  options?: {
    canvasTheme?: CanvasTheme;
    canvasBackgroundStyle?: CanvasBackgroundStyle;
  },
): CanvasSnapshot {
  const entries = ARTIFACT_CATALOG_ENTRIES.filter((entry) => entry.category === category);
  const layoutItems: LayoutItem[] = [];

  for (const entry of entries) {
    if (entry.previewKind === "text-card") {
      layoutItems.push({
        kind: "card",
        entry,
        w: CARD_WIDTH,
        h: FALLBACK_CARD_HEIGHT,
      });
      continue;
    }
    if (!entry.payload) continue;
    const artifact = createSessionArtifactFromPayload(entry.payload, CATALOG_SOURCE_CARD_ID);
    const sized = catalogArtifactSize(artifact);
    layoutItems.push({ kind: "artifact", entry, w: sized.w, h: sized.h });
  }

  const cols = columnCount(category, layoutItems.length);
  const positions = layoutGrid(layoutItems, cols);

  const thread: Thread = {
    id: CATALOG_THREAD_ID,
    accentColour: THREAD_ACCENT_PALETTE[0]!,
  };

  const cards: Record<string, Card> = {
    [CATALOG_SOURCE_CARD_ID]: catalogSourceCard(),
  };
  const cardOrder = [CATALOG_SOURCE_CARD_ID];
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];

  layoutItems.forEach((item, index) => {
    const pos = positions[index]!;

    if (item.kind === "card") {
      const card = catalogTextCard(item.entry, { x: pos.x, y: pos.y });
      cards[card.id] = card;
      cardOrder.push(card.id);
      return;
    }

    const artifact = createSessionArtifactFromPayload(
      item.entry.payload!,
      CATALOG_SOURCE_CARD_ID,
    );
    const stableId = `catalog-art-${item.entry.id}`;
    const stableArtifact: SessionArtifact = { ...artifact, id: stableId };
    sessionArtifacts[stableId] = stableArtifact;

    const nodeId = `catalog-node-${item.entry.id}`;
    canvasArtifactNodes[nodeId] = {
      id: nodeId,
      artifactId: stableId,
      versionId: stableArtifact.latestVersionId,
      sourceCardId: CATALOG_SOURCE_CARD_ID,
      position: { x: pos.x, y: pos.y },
      size: { w: pos.w, h: pos.h },
    };
    canvasArtifactOrder.push(nodeId);
  });

  return buildCanvasSnapshot({
    viewport: { x: 0, y: 0, scale: 1 },
    cards,
    cardOrder,
    connections: [],
    threads: { [CATALOG_THREAD_ID]: thread },
    threadOrder: [CATALOG_THREAD_ID],
    groups: {},
    connectorStyle: "orthogonal",
    canvasBackgroundStyle: options?.canvasBackgroundStyle ?? "grid",
    canvasTheme: options?.canvasTheme ?? "light",
    selectedModel: "claude-sonnet-4-6",
    viewMode: "canvas",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
    canvasAssetNodes: {},
    canvasAssetOrder: [],
    canvasTextLabels: {},
    canvasTextLabelOrder: [],
    uploadedAttachments: [],
    collaborationHasEdits: false,
  });
}

/** World-space center of catalog content — used to frame the viewport after hydrate. */
export function catalogContentCenter(snapshot: CanvasSnapshot): { x: number; y: number } {
  const rects: { x: number; y: number; w: number; h: number }[] = [];

  for (const id of snapshot.cardOrder) {
    const card = snapshot.cards[id];
    if (!card) continue;
    const { w, h } = getCardBounds(card);
    rects.push({ x: card.position.x, y: card.position.y, w, h });
  }

  for (const id of snapshot.canvasArtifactOrder ?? []) {
    const node = snapshot.canvasArtifactNodes?.[id];
    if (!node) continue;
    const art = snapshot.sessionArtifacts[node.artifactId];
    const { w, h } = getArtifactBounds(node, art);
    rects.push({ x: node.position.x, y: node.position.y, w, h });
  }

  if (rects.length === 0) {
    return { x: GRID_ORIGIN_X, y: GRID_ORIGIN_Y };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.w);
    maxY = Math.max(maxY, rect.y + rect.h);
  }

  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}
