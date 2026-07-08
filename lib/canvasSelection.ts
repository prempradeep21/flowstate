import { getCanvasAssetBounds } from "@/lib/canvasAssetBounds";
import { getCanvasGifBounds } from "@/lib/canvasGifBounds";
import { getCanvas3DBounds } from "@/lib/canvas3dBounds";
import { getArtifactBounds } from "@/lib/canvasNodeBounds";
import { getCanvasSkillBounds } from "@/lib/canvasSkillBounds";
import { estimateTextLabelBounds } from "@/lib/canvasTextLabelBounds";
import { getFamilyCardIds, getFamilyRootThreadId } from "@/lib/chatThreads";
import { cardIntersectsWorldRect } from "@/lib/groupBounds";
import { CARD_WIDTH, FALLBACK_CARD_HEIGHT } from "@/lib/canvasNodeBounds";
import type { ChatThreadState } from "@/lib/chatThreads";
import type {
  CanvasArtifactNode,
  CanvasAsset,
  CanvasAssetNode,
  CanvasGifNode,
  Canvas3DNode,
  CanvasSkill,
  CanvasSkillNode,
  CanvasTextLabel,
  SessionArtifact,
} from "@/lib/store";

export interface WorldRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Non-card canvas node kinds that participate in unified selection. */
export type CanvasSelectionKind =
  | "artifact"
  | "asset"
  | "gif"
  | "3d"
  | "skill"
  | "label";

export interface CanvasSelectionItem {
  kind: CanvasSelectionKind;
  id: string;
}

/** Unified selection: thread families (cards) + free-floating canvas nodes. */
export interface CanvasSelection {
  familyRootIds: string[];
  items: CanvasSelectionItem[];
}

export const EMPTY_CANVAS_SELECTION: CanvasSelection = {
  familyRootIds: [],
  items: [],
};

/** Store slice with every selectable canvas node collection. */
export interface CanvasNodesState extends ChatThreadState {
  canvasArtifactNodes: Record<string, CanvasArtifactNode>;
  canvasArtifactOrder: string[];
  sessionArtifacts: Record<string, SessionArtifact>;
  canvasAssets: Record<string, CanvasAsset>;
  canvasAssetNodes: Record<string, CanvasAssetNode>;
  canvasAssetOrder: string[];
  canvasGifNodes: Record<string, CanvasGifNode>;
  canvasGifOrder: string[];
  canvas3DNodes: Record<string, Canvas3DNode>;
  canvas3DOrder: string[];
  canvasSkills: Record<string, CanvasSkill>;
  canvasSkillNodes: Record<string, CanvasSkillNode>;
  canvasSkillOrder: string[];
  canvasTextLabels: Record<string, CanvasTextLabel>;
  canvasTextLabelOrder: string[];
}

function normalizedRect(rect: WorldRect): {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
} {
  return {
    x1: Math.min(rect.x1, rect.x2),
    y1: Math.min(rect.y1, rect.y2),
    x2: Math.max(rect.x1, rect.x2),
    y2: Math.max(rect.y1, rect.y2),
  };
}

function aabbIntersectsRect(
  x: number,
  y: number,
  w: number,
  h: number,
  rect: WorldRect,
): boolean {
  const r = normalizedRect(rect);
  return x < r.x2 && x + w > r.x1 && y < r.y2 && y + h > r.y1;
}

/** Thread family roots for every card whose bounds intersect the world rect. */
export function collectFamiliesInWorldRect(
  state: ChatThreadState,
  worldRect: WorldRect,
): string[] {
  const roots = new Set<string>();
  for (const id of state.cardOrder) {
    const card = state.cards[id];
    if (!card) continue;
    if (!cardIntersectsWorldRect(card, worldRect)) continue;
    roots.add(getFamilyRootThreadId(state, card.threadId));
  }
  return [...roots];
}

/**
 * Unified marquee hit-test: thread families plus every non-card node kind
 * (artifacts, assets, gifs, skills, text labels) intersecting the world rect.
 */
export function collectCanvasItemsInWorldRect(
  state: CanvasNodesState,
  worldRect: WorldRect,
): CanvasSelection {
  const familyRootIds = collectFamiliesInWorldRect(state, worldRect);
  const items: CanvasSelectionItem[] = [];

  for (const id of state.canvasArtifactOrder) {
    const node = state.canvasArtifactNodes[id];
    if (!node) continue;
    const artifact = node.artifactId
      ? state.sessionArtifacts[node.artifactId]
      : undefined;
    const { w, h } = getArtifactBounds(node, artifact);
    if (aabbIntersectsRect(node.position.x, node.position.y, w, h, worldRect)) {
      items.push({ kind: "artifact", id });
    }
  }

  for (const id of state.canvasAssetOrder) {
    const node = state.canvasAssetNodes[id];
    if (!node) continue;
    const asset = state.canvasAssets[node.assetId];
    const { w, h } = getCanvasAssetBounds(node, asset);
    if (aabbIntersectsRect(node.position.x, node.position.y, w, h, worldRect)) {
      items.push({ kind: "asset", id });
    }
  }

  for (const id of state.canvasGifOrder) {
    const node = state.canvasGifNodes[id];
    if (!node) continue;
    const { w, h } = getCanvasGifBounds(node);
    if (aabbIntersectsRect(node.position.x, node.position.y, w, h, worldRect)) {
      items.push({ kind: "gif", id });
    }
  }

  for (const id of state.canvas3DOrder) {
    const node = state.canvas3DNodes[id];
    if (!node) continue;
    const { w, h } = getCanvas3DBounds(node);
    if (aabbIntersectsRect(node.position.x, node.position.y, w, h, worldRect)) {
      items.push({ kind: "3d", id });
    }
  }

  for (const id of state.canvasSkillOrder) {
    const node = state.canvasSkillNodes[id];
    if (!node) continue;
    const skill = state.canvasSkills[node.skillId];
    const { w, h } = getCanvasSkillBounds(node, skill);
    if (aabbIntersectsRect(node.position.x, node.position.y, w, h, worldRect)) {
      items.push({ kind: "skill", id });
    }
  }

  for (const id of state.canvasTextLabelOrder) {
    const label = state.canvasTextLabels[id];
    if (!label) continue;
    const { w, h } = estimateTextLabelBounds(label);
    if (
      aabbIntersectsRect(label.position.x, label.position.y, w, h, worldRect)
    ) {
      items.push({ kind: "label", id });
    }
  }

  return { familyRootIds, items };
}

export function isCanvasItemSelected(
  items: CanvasSelectionItem[],
  kind: CanvasSelectionKind,
  id: string,
): boolean {
  return items.some((item) => item.kind === kind && item.id === id);
}

/** Union of two selections (used for Shift/Ctrl additive marquee). */
export function mergeCanvasSelections(
  a: CanvasSelection,
  b: CanvasSelection,
): CanvasSelection {
  const familyRootIds = [...new Set([...a.familyRootIds, ...b.familyRootIds])];
  const items = [...a.items];
  for (const item of b.items) {
    if (!isCanvasItemSelected(items, item.kind, item.id)) items.push(item);
  }
  return { familyRootIds, items };
}

/** Total movable units: each thread family counts as one unit. */
export function getCanvasSelectionUnitCount(selection: CanvasSelection): number {
  return selection.familyRootIds.length + selection.items.length;
}

export interface SelectionUnitBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A movable selection unit with its current world bounds. */
export type SelectionUnit =
  | { kind: "family"; id: string; bounds: SelectionUnitBounds }
  | { kind: CanvasSelectionKind; id: string; bounds: SelectionUnitBounds };

function familyBounds(
  state: ChatThreadState,
  rootThreadId: string,
): SelectionUnitBounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const id of getFamilyCardIds(state, rootThreadId)) {
    const card = state.cards[id];
    if (!card) continue;
    const w = card.size?.w ?? CARD_WIDTH;
    const h = card.size?.h ?? FALLBACK_CARD_HEIGHT;
    minX = Math.min(minX, card.position.x);
    minY = Math.min(minY, card.position.y);
    maxX = Math.max(maxX, card.position.x + w);
    maxY = Math.max(maxY, card.position.y + h);
  }
  if (!Number.isFinite(minX)) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function itemBounds(
  state: CanvasNodesState,
  item: CanvasSelectionItem,
): SelectionUnitBounds | null {
  switch (item.kind) {
    case "artifact": {
      const node = state.canvasArtifactNodes[item.id];
      if (!node) return null;
      const artifact = node.artifactId
        ? state.sessionArtifacts[node.artifactId]
        : undefined;
      const { w, h } = getArtifactBounds(node, artifact);
      return { x: node.position.x, y: node.position.y, w, h };
    }
    case "asset": {
      const node = state.canvasAssetNodes[item.id];
      if (!node) return null;
      const { w, h } = getCanvasAssetBounds(node, state.canvasAssets[node.assetId]);
      return { x: node.position.x, y: node.position.y, w, h };
    }
    case "gif": {
      const node = state.canvasGifNodes[item.id];
      if (!node) return null;
      const { w, h } = getCanvasGifBounds(node);
      return { x: node.position.x, y: node.position.y, w, h };
    }
    case "3d": {
      const node = state.canvas3DNodes[item.id];
      if (!node) return null;
      const { w, h } = getCanvas3DBounds(node);
      return { x: node.position.x, y: node.position.y, w, h };
    }
    case "skill": {
      const node = state.canvasSkillNodes[item.id];
      if (!node) return null;
      const { w, h } = getCanvasSkillBounds(node, state.canvasSkills[node.skillId]);
      return { x: node.position.x, y: node.position.y, w, h };
    }
    case "label": {
      const label = state.canvasTextLabels[item.id];
      if (!label) return null;
      const { w, h } = estimateTextLabelBounds(label);
      return { x: label.position.x, y: label.position.y, w, h };
    }
  }
}

/** Resolve every selected unit to its current world bounds (missing ids dropped). */
export function getSelectionUnits(
  state: CanvasNodesState,
  selection: CanvasSelection,
): SelectionUnit[] {
  const units: SelectionUnit[] = [];
  for (const rootId of selection.familyRootIds) {
    const bounds = familyBounds(state, rootId);
    if (bounds) units.push({ kind: "family", id: rootId, bounds });
  }
  for (const item of selection.items) {
    const bounds = itemBounds(state, item);
    if (bounds) units.push({ kind: item.kind, id: item.id, bounds });
  }
  return units;
}

/** Combined AABB across all selected units. */
export function getSelectionBounds(
  state: CanvasNodesState,
  selection: CanvasSelection,
): SelectionUnitBounds | null {
  const units = getSelectionUnits(state, selection);
  if (units.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const u of units) {
    minX = Math.min(minX, u.bounds.x);
    minY = Math.min(minY, u.bounds.y);
    maxX = Math.max(maxX, u.bounds.x + u.bounds.w);
    maxY = Math.max(maxY, u.bounds.y + u.bounds.h);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
