import { getCanvas3DBounds } from "@/lib/canvas3dBounds";
import { getCanvasAssetBounds } from "@/lib/canvasAssetBounds";
import { getCanvasGifBounds } from "@/lib/canvasGifBounds";
import { getArtifactBounds, getCardBounds } from "@/lib/canvasNodeBounds";
import type { CanvasSpatialInput } from "@/lib/canvasSpatialIndex";
import { getCanvasSkillBounds } from "@/lib/canvasSkillBounds";
import { estimateTextLabelBounds } from "@/lib/canvasTextLabelBounds";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import type { ArtifactKind } from "@/lib/artifactTypes";
import type { Viewport } from "@/lib/store";

/**
 * A tiny, local-only sketch of a canvas — where each node sits, how big it is
 * and what it is called — so a canvas that is still loading can show its real
 * layout as skeletons instead of a blank screen or a generic loader.
 */

export type OutlineNodeKind =
  | "card"
  | "artifact"
  | "asset"
  | "gif"
  | "3d"
  | "skill"
  | "label";

export interface OutlineNode {
  k: OutlineNodeKind;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Title / question / label text, truncated. */
  t?: string;
  /** Artifact kind, so the skeleton can hint at the content's shape. */
  a?: ArtifactKind;
  /** Text label font size. */
  f?: number;
}

export interface CanvasLayoutOutline {
  v: 1;
  viewport: Viewport;
  nodes: OutlineNode[];
}

const KEY_PREFIX = "flowstate:canvas-outline:";
const INDEX_KEY = "flowstate:canvas-outline-index";
/** Outlines kept on this device; least recently written are dropped. */
const MAX_OUTLINES = 40;
/** Plenty for a recognisable layout while keeping each entry a few dozen KB. */
const MAX_NODES = 400;
const MAX_TEXT = 80;

function clip(text: string | undefined): string | undefined {
  const t = text?.replace(/\s+/g, " ").trim();
  if (!t) return undefined;
  return t.length > MAX_TEXT ? `${t.slice(0, MAX_TEXT - 1)}…` : t;
}

function push(
  nodes: OutlineNode[],
  node: Omit<OutlineNode, "x" | "y" | "w" | "h"> & {
    x: number;
    y: number;
    w: number;
    h: number;
  },
) {
  if (nodes.length >= MAX_NODES) return;
  nodes.push({
    ...node,
    x: Math.round(node.x),
    y: Math.round(node.y),
    w: Math.round(node.w),
    h: Math.round(node.h),
  });
}

export function buildCanvasLayoutOutline(
  input: CanvasSpatialInput,
): CanvasLayoutOutline {
  const nodes: OutlineNode[] = [];

  // Labels first: they are the section headings that make a layout legible.
  for (const id of input.canvasTextLabelOrder) {
    const label = input.canvasTextLabels[id];
    if (!label) continue;
    const { w, h } = estimateTextLabelBounds(label);
    push(nodes, {
      k: "label",
      ...label.position,
      w,
      h,
      t: clip(label.text),
      f: label.fontSize,
    });
  }

  for (const id of input.canvasArtifactOrder) {
    const node = input.canvasArtifactNodes[id];
    if (!node) continue;
    const art = node.artifactId
      ? input.sessionArtifacts[node.artifactId]
      : undefined;
    const { w, h } = getArtifactBounds(node, art);
    push(nodes, {
      k: "artifact",
      ...node.position,
      w,
      h,
      t: clip(art?.title),
      a: art?.kind,
    });
  }

  for (const id of input.cardOrder) {
    const card = input.cards[id];
    if (!card) continue;
    const { w, h } = getCardBounds(card, RESOLVED_CANVAS_TUNING);
    push(nodes, { k: "card", ...card.position, w, h, t: clip(card.question) });
  }

  for (const id of input.canvasAssetOrder) {
    const node = input.canvasAssetNodes[id];
    if (!node) continue;
    const asset = input.canvasAssets[node.assetId];
    const { w, h } = getCanvasAssetBounds(node, asset);
    push(nodes, { k: "asset", ...node.position, w, h, t: clip(asset?.name) });
  }

  for (const id of input.canvasGifOrder) {
    const node = input.canvasGifNodes[id];
    if (!node) continue;
    const { w, h } = getCanvasGifBounds(node);
    push(nodes, { k: "gif", ...node.position, w, h });
  }

  for (const id of input.canvas3DOrder) {
    const node = input.canvas3DNodes[id];
    if (!node) continue;
    const { w, h } = getCanvas3DBounds(node);
    push(nodes, { k: "3d", ...node.position, w, h });
  }

  for (const id of input.canvasSkillOrder) {
    const node = input.canvasSkillNodes[id];
    if (!node) continue;
    const skill = input.canvasSkills[node.skillId];
    const { w, h } = getCanvasSkillBounds(node, skill);
    push(nodes, { k: "skill", ...node.position, w, h, t: clip(skill?.title) });
  }

  return { v: 1, viewport: { ...input.viewport }, nodes };
}

function readIndex(): string[] {
  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeCanvasLayoutOutline(
  canvasId: string,
  outline: CanvasLayoutOutline,
): void {
  if (typeof window === "undefined") return;
  try {
    // An empty canvas has nothing to sketch; drop any stale outline instead.
    if (outline.nodes.length === 0) {
      clearCanvasLayoutOutline(canvasId);
      return;
    }
    window.localStorage.setItem(
      `${KEY_PREFIX}${canvasId}`,
      JSON.stringify(outline),
    );
    const index = [canvasId, ...readIndex().filter((id) => id !== canvasId)];
    for (const evicted of index.splice(MAX_OUTLINES)) {
      window.localStorage.removeItem(`${KEY_PREFIX}${evicted}`);
    }
    window.localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    // Quota or private mode — the outline is only a loading nicety.
  }
}

export function readCanvasLayoutOutline(
  canvasId: string,
): CanvasLayoutOutline | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${KEY_PREFIX}${canvasId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CanvasLayoutOutline>;
    const vp = parsed.viewport;
    if (
      parsed.v !== 1 ||
      !Array.isArray(parsed.nodes) ||
      parsed.nodes.length === 0 ||
      !vp ||
      !Number.isFinite(vp.x) ||
      !Number.isFinite(vp.y) ||
      !(vp.scale > 0)
    ) {
      return null;
    }
    return parsed as CanvasLayoutOutline;
  } catch {
    return null;
  }
}

export function clearCanvasLayoutOutline(canvasId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${KEY_PREFIX}${canvasId}`);
    const index = readIndex().filter((id) => id !== canvasId);
    window.localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    // ignore
  }
}
