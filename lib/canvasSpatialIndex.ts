import RBush from "rbush";
import { getArtifactBounds, getCardBounds } from "@/lib/canvasNodeBounds";
import { getCanvasGifBounds } from "@/lib/canvasGifBounds";
import { getCanvas3DBounds } from "@/lib/canvas3dBounds";
import { getCanvasAssetBounds } from "@/lib/canvasAssetBounds";
import { getCanvasSkillBounds } from "@/lib/canvasSkillBounds";
import { estimateTextLabelBounds } from "@/lib/canvasTextLabelBounds";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import type {
  CanvasArtifactNode,
  CanvasAsset,
  CanvasAssetNode,
  CanvasGifNode,
  Canvas3DNode,
  CanvasSkill,
  CanvasSkillNode,
  CanvasTextLabel,
  Card,
  SessionArtifact,
  Viewport,
} from "@/lib/store";

/** Enable viewport culling once the board exceeds this node count. */
export const CULLING_MIN_NODES = 30;

/** Minimum world-space padding so nodes near the edge don't pop in/out. */
export const CULLING_VIEWPORT_PADDING = 240;

/**
 * Screen-space mount band beyond each viewport edge. A fixed world padding
 * shrinks on screen as you zoom out (240 world = 120px at 0.5×, 43px at
 * 0.18×): a brisk pan crossed it in a frame or two, so nodes mounted AT the
 * screen edge and slid in as empty stand-ins. Sized in screen pixels the band
 * gives revealed nodes ~half a screen of travel to mount and hydrate before
 * they are seen, at every zoom.
 */
export const CULLING_SCREEN_PADDING_PX = 480;

/**
 * The query rect snaps outward to this world-space grid. Without it, every
 * pan frame produces a slightly different rect, some node edge is almost
 * always straddling it, and the visible set flaps — re-rendering the whole
 * canvas subtree per frame. Quantized, the set only changes when the
 * viewport crosses a band edge (~once per 240 world units of travel).
 */
export const CULLING_QUANTIZE = 240;

/** World padding for a scale: the screen band, never below the world floor. */
export function cullingPaddingForScale(scale: number): number {
  return Math.max(CULLING_VIEWPORT_PADDING, CULLING_SCREEN_PADDING_PX / scale);
}

/**
 * Quantize grid for a scale. Below 1× the grid coarsens in powers of two so
 * band crossings stay ~a few hundred SCREEN pixels apart; a fixed 240-world
 * grid is only 24px on screen at 0.1× and flapped the visible set every few
 * frames. Always a multiple of CULLING_QUANTIZE.
 */
export function cullingQuantizeForScale(scale: number): number {
  if (scale >= 1) return CULLING_QUANTIZE;
  return CULLING_QUANTIZE * 2 ** Math.ceil(Math.log2(1 / scale));
}

/**
 * Idle warm-up: once the view rests, offscreen nodes are mounted fully
 * rendered (but content-visibility:hidden) nearest-first, so later pans and
 * zooms reveal finished content instead of building it on arrival. Capped so
 * very large canvases keep a bounded resident set around the viewport.
 */
export const WARM_NODE_BUDGET = 200;

export interface VisibleNodes {
  cards: Set<string>;
  artifacts: Set<string>;
  assets: Set<string>;
  gifs: Set<string>;
  threeD: Set<string>;
  skills: Set<string>;
  labels: Set<string>;
}

export type SpatialNodeKind =
  | "card"
  | "artifact"
  | "asset"
  | "gif"
  | "3d"
  | "skill"
  | "label";

interface SpatialEntry {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  kind: SpatialNodeKind;
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
  canvasGifNodes: Record<string, CanvasGifNode>;
  canvasGifOrder: string[];
  canvas3DNodes: Record<string, Canvas3DNode>;
  canvas3DOrder: string[];
  canvasSkills: Record<string, CanvasSkill>;
  canvasSkillNodes: Record<string, CanvasSkillNode>;
  canvasSkillOrder: string[];
  canvasTextLabels: Record<string, CanvasTextLabel>;
  canvasTextLabelOrder: string[];
  sessionArtifacts: Record<string, SessionArtifact>;
}

export function getVisibleWorldRect(
  viewport: Viewport,
  containerWidth: number,
  containerHeight: number,
  padding = cullingPaddingForScale(viewport.scale),
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

  for (const id of input.canvasGifOrder) {
    const node = input.canvasGifNodes[id];
    if (!node) continue;
    const { w, h } = getCanvasGifBounds(node);
    entries.push({
      minX: node.position.x,
      minY: node.position.y,
      maxX: node.position.x + w,
      maxY: node.position.y + h,
      kind: "gif",
      id,
    });
  }

  for (const id of input.canvas3DOrder) {
    const node = input.canvas3DNodes[id];
    if (!node) continue;
    const { w, h } = getCanvas3DBounds(node);
    entries.push({
      minX: node.position.x,
      minY: node.position.y,
      maxX: node.position.x + w,
      maxY: node.position.y + h,
      kind: "3d",
      id,
    });
  }

  for (const id of input.canvasSkillOrder) {
    const node = input.canvasSkillNodes[id];
    if (!node) continue;
    const skill = input.canvasSkills[node.skillId];
    const { w, h } = getCanvasSkillBounds(node, skill);
    entries.push({
      minX: node.position.x,
      minY: node.position.y,
      maxX: node.position.x + w,
      maxY: node.position.y + h,
      kind: "skill",
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

export interface AlwaysVisibleSets {
  cards?: Iterable<string>;
  artifacts?: Iterable<string>;
  assets?: Iterable<string>;
  gifs?: Iterable<string>;
  threeD?: Iterable<string>;
  skills?: Iterable<string>;
  labels?: Iterable<string>;
}

/**
 * The padded visible world rect snapped outward to the quantize grid — the
 * exact rect searchVisibleNodes queries. Exposed so callers can compare rects
 * across frames and skip the search entirely when the quantized rect (and
 * the tree) are unchanged.
 */
export function quantizedVisibleRect(
  viewport: Viewport,
  containerSize: { width: number; height: number },
): { minX: number; minY: number; maxX: number; maxY: number } {
  const raw = getVisibleWorldRect(
    viewport,
    containerSize.width,
    containerSize.height,
  );
  const q = cullingQuantizeForScale(viewport.scale);
  return {
    minX: Math.floor(raw.minX / q) * q,
    minY: Math.floor(raw.minY / q) * q,
    maxX: Math.ceil(raw.maxX / q) * q,
    maxY: Math.ceil(raw.maxY / q) * q,
  };
}

export function emptyVisibleNodes(): VisibleNodes {
  return {
    cards: new Set(),
    artifacts: new Set(),
    assets: new Set(),
    gifs: new Set(),
    threeD: new Set(),
    skills: new Set(),
    labels: new Set(),
  };
}

/** The VisibleNodes set that holds ids of `kind`. */
export function visibleSetFor(
  nodes: VisibleNodes,
  kind: SpatialNodeKind,
): Set<string> {
  switch (kind) {
    case "card":
      return nodes.cards;
    case "artifact":
      return nodes.artifacts;
    case "asset":
      return nodes.assets;
    case "gif":
      return nodes.gifs;
    case "3d":
      return nodes.threeD;
    case "skill":
      return nodes.skills;
    default:
      return nodes.labels;
  }
}

/** Search a PREBUILT tree — no rebuild. O(log n + hits). */
export function searchVisibleNodes(
  tree: SpatialIndex,
  viewport: Viewport,
  containerSize: { width: number; height: number },
  alwaysVisible: AlwaysVisibleSets = {},
): VisibleNodes {
  const rect = quantizedVisibleRect(viewport, containerSize);
  const hits = tree.search(rect);

  const cards = new Set<string>(alwaysVisible.cards ?? []);
  const artifacts = new Set<string>(alwaysVisible.artifacts ?? []);
  const assets = new Set<string>(alwaysVisible.assets ?? []);
  const gifs = new Set<string>(alwaysVisible.gifs ?? []);
  const threeD = new Set<string>(alwaysVisible.threeD ?? []);
  const skills = new Set<string>(alwaysVisible.skills ?? []);
  const labels = new Set<string>(alwaysVisible.labels ?? []);

  for (const hit of hits) {
    if (hit.kind === "card") cards.add(hit.id);
    else if (hit.kind === "artifact") artifacts.add(hit.id);
    else if (hit.kind === "asset") assets.add(hit.id);
    else if (hit.kind === "gif") gifs.add(hit.id);
    else if (hit.kind === "3d") threeD.add(hit.id);
    else if (hit.kind === "skill") skills.add(hit.id);
    else labels.add(hit.id);
  }

  return { cards, artifacts, assets, gifs, threeD, skills, labels };
}

export function queryVisibleNodes(
  input: CanvasSpatialInput,
  containerSize: { width: number; height: number },
  alwaysVisible: AlwaysVisibleSets = {},
): VisibleNodes {
  return searchVisibleNodes(
    buildCanvasSpatialIndex(input),
    input.viewport,
    containerSize,
    alwaysVisible,
  );
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

/**
 * True when both results contain the same node ids. Lets the culling hook
 * skip its React state update on the (very common) pan/zoom frames where
 * nothing entered or left the padded viewport.
 */
export function visibleNodesEqual(
  a: VisibleNodes | null,
  b: VisibleNodes | null,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    setsEqual(a.cards, b.cards) &&
    setsEqual(a.artifacts, b.artifacts) &&
    setsEqual(a.assets, b.assets) &&
    setsEqual(a.gifs, b.gifs) &&
    setsEqual(a.threeD, b.threeD) &&
    setsEqual(a.skills, b.skills) &&
    setsEqual(a.labels, b.labels)
  );
}

/**
 * Persistent spatial index: geometry changes mark the tree dirty (rebuilt
 * lazily on next query); viewport-only changes reuse the tree — the old
 * queryVisibleNodes path rebuilt the whole RBush O(n log n) EVERY frame
 * during pan/zoom, which was the dominant per-frame cost after render work.
 */
export class CanvasSpatialIndexManager {
  private tree: SpatialIndex | null = null;

  /**
   * Geometry epoch: bumped on every markDirty. Callers pair it with the
   * quantized query rect to know a previous query's result is still valid
   * (same rect + same epoch ⇒ same visible set, no search needed).
   */
  version = 0;

  markDirty(): void {
    this.tree = null;
    this.byKey = null;
    this.version++;
  }

  private byKey: Map<string, SpatialEntry> | null = null;

  private ensure(input: CanvasSpatialInput): SpatialIndex {
    if (!this.tree) this.tree = buildCanvasSpatialIndex(input);
    return this.tree;
  }

  private entries(input: CanvasSpatialInput): Map<string, SpatialEntry> {
    if (!this.byKey) {
      this.byKey = new Map(
        this.ensure(input)
          .all()
          .map((e) => [`${e.kind}:${e.id}`, e]),
      );
    }
    return this.byKey;
  }

  /** World distance from (x, y) to a node's bounds; Infinity if it is gone. */
  distanceTo(
    input: CanvasSpatialInput,
    kind: SpatialNodeKind,
    id: string,
    x: number,
    y: number,
  ): number {
    const e = this.entries(input).get(`${kind}:${id}`);
    if (!e) return Number.POSITIVE_INFINITY;
    return Math.hypot(
      Math.max(e.minX - x, 0, x - e.maxX),
      Math.max(e.minY - y, 0, y - e.maxY),
    );
  }

  /**
   * Up to `k` nodes nearest world point (x, y) that `skip` does not exclude,
   * nearest first, with their distances — the idle warm-up order. O(n).
   */
  nearest(
    input: CanvasSpatialInput,
    x: number,
    y: number,
    skip: (kind: SpatialNodeKind, id: string) => boolean,
    k: number,
  ): Array<{ kind: SpatialNodeKind; id: string; dist: number }> {
    const out: Array<{ kind: SpatialNodeKind; id: string; dist: number }> = [];
    for (const e of this.entries(input).values()) {
      if (skip(e.kind, e.id)) continue;
      out.push({
        kind: e.kind,
        id: e.id,
        dist: Math.hypot(
          Math.max(e.minX - x, 0, x - e.maxX),
          Math.max(e.minY - y, 0, y - e.maxY),
        ),
      });
    }
    out.sort((a, b) => a.dist - b.dist);
    return out.slice(0, k);
  }

  /** Rebuild if dirty, then search. */
  query(
    input: CanvasSpatialInput,
    containerSize: { width: number; height: number },
    alwaysVisible: AlwaysVisibleSets = {},
  ): VisibleNodes {
    return searchVisibleNodes(
      this.ensure(input),
      input.viewport,
      containerSize,
      alwaysVisible,
    );
  }
}

export function shouldEnableViewportCulling(nodeCount: number): boolean {
  return nodeCount >= CULLING_MIN_NODES;
}
