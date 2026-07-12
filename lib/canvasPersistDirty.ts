import type { Card, SessionArtifact } from "@/lib/store";
import type { CanvasSnapshot } from "@/lib/canvasSnapshot";
import { DEFAULT_CANVAS_BACKGROUND_IMAGE_ID } from "@/lib/canvasBackgroundImages";

/** Store slices compared when deciding whether to persist canvas state. */
export interface CanvasPersistSlice {
  viewport: { x: number; y: number; scale: number };
  cards: Record<string, Card>;
  cardOrder: string[];
  connections: unknown[];
  threads: Record<string, unknown>;
  threadOrder: string[];
  groups: Record<string, unknown>;
  connectorStyle: string;
  canvasBackgroundStyle: string;
  canvasBackgroundImageId: string;
  canvasTheme: string;
  selectedModel: string;
  viewMode: string;
  sessionArtifacts: Record<string, SessionArtifact>;
  canvasAssets?: Record<string, unknown>;
  canvasArtifactNodes: Record<string, unknown>;
  canvasArtifactOrder: string[];
  canvasAssetNodes?: Record<string, unknown>;
  canvasAssetOrder?: string[];
  canvasTextLabels: Record<string, unknown>;
  canvasTextLabelOrder: string[];
  canvasGifNodes?: Record<string, unknown>;
  canvasGifOrder?: string[];
  canvas3DNodes?: Record<string, unknown>;
  canvas3DOrder?: string[];
  canvasStrokes?: Record<string, unknown>;
  canvasStrokeOrder?: string[];
  uploadedAttachments: unknown[];
  collaborationHasEdits: boolean;
}

/**
 * Shared sentinels for absent optional fields so two picks of the same state
 * stay reference-equal — the fast dirty checks below rely on this.
 */
const EMPTY_OBJECT: Record<string, never> = Object.freeze({});
const EMPTY_ARRAY = Object.freeze([]) as unknown as string[];

export function pickCanvasPersistSlice(
  state: CanvasPersistSlice,
): CanvasPersistSlice {
  return {
    viewport: state.viewport,
    cards: state.cards,
    cardOrder: state.cardOrder,
    connections: state.connections,
    threads: state.threads,
    threadOrder: state.threadOrder,
    groups: state.groups,
    connectorStyle: state.connectorStyle,
    canvasBackgroundStyle: state.canvasBackgroundStyle,
    canvasBackgroundImageId: state.canvasBackgroundImageId,
    canvasTheme: state.canvasTheme,
    selectedModel: state.selectedModel,
    viewMode: state.viewMode,
    sessionArtifacts: state.sessionArtifacts,
    canvasAssets: state.canvasAssets ?? EMPTY_OBJECT,
    canvasArtifactNodes: state.canvasArtifactNodes,
    canvasArtifactOrder: state.canvasArtifactOrder,
    canvasAssetNodes: state.canvasAssetNodes ?? EMPTY_OBJECT,
    canvasAssetOrder: state.canvasAssetOrder ?? EMPTY_ARRAY,
    canvasTextLabels: state.canvasTextLabels,
    canvasTextLabelOrder: state.canvasTextLabelOrder,
    canvasGifNodes: state.canvasGifNodes ?? EMPTY_OBJECT,
    canvasGifOrder: state.canvasGifOrder ?? EMPTY_ARRAY,
    canvas3DNodes: state.canvas3DNodes ?? EMPTY_OBJECT,
    canvas3DOrder: state.canvas3DOrder ?? EMPTY_ARRAY,
    canvasStrokes: state.canvasStrokes ?? EMPTY_OBJECT,
    canvasStrokeOrder: state.canvasStrokeOrder ?? EMPTY_ARRAY,
    uploadedAttachments: state.uploadedAttachments,
    collaborationHasEdits: state.collaborationHasEdits,
  };
}

export function pickCanvasPersistSliceFromSnapshot(
  snapshot: CanvasSnapshot,
): CanvasPersistSlice {
  return pickCanvasPersistSlice({
    viewport: snapshot.viewport,
    cards: snapshot.cards,
    cardOrder: snapshot.cardOrder,
    connections: snapshot.connections,
    threads: snapshot.threads,
    threadOrder: snapshot.threadOrder,
    groups: snapshot.groups,
    connectorStyle: snapshot.connectorStyle,
    canvasBackgroundStyle: snapshot.canvasBackgroundStyle,
    canvasBackgroundImageId:
      snapshot.canvasBackgroundImageId ?? DEFAULT_CANVAS_BACKGROUND_IMAGE_ID,
    canvasTheme: snapshot.canvasTheme,
    selectedModel: snapshot.selectedModel,
    viewMode: snapshot.viewMode,
    sessionArtifacts: snapshot.sessionArtifacts,
    canvasAssets: snapshot.canvasAssets ?? {},
    canvasArtifactNodes: snapshot.canvasArtifactNodes ?? {},
    canvasArtifactOrder: snapshot.canvasArtifactOrder ?? [],
    canvasAssetNodes: snapshot.canvasAssetNodes ?? {},
    canvasAssetOrder: snapshot.canvasAssetOrder ?? [],
    canvasTextLabels: snapshot.canvasTextLabels ?? {},
    canvasTextLabelOrder: snapshot.canvasTextLabelOrder ?? [],
    canvasGifNodes: snapshot.canvasGifNodes ?? {},
    canvasGifOrder: snapshot.canvasGifOrder ?? [],
    canvas3DNodes: snapshot.canvas3DNodes ?? {},
    canvas3DOrder: snapshot.canvas3DOrder ?? [],
    canvasStrokes: snapshot.canvasStrokes ?? {},
    canvasStrokeOrder: snapshot.canvasStrokeOrder ?? [],
    uploadedAttachments: snapshot.uploadedAttachments ?? [],
    collaborationHasEdits: snapshot.collaborationHasEdits ?? false,
  });
}

function cardsQuestionEdit(
  prev: Record<string, Card>,
  next: Record<string, Card>,
): boolean {
  const prevIds = new Set(Object.keys(prev));
  for (const id of Object.keys(next)) {
    if (!prevIds.has(id)) return true;
    if (prev[id]?.question !== next[id]?.question) return true;
  }
  return false;
}

function sessionArtifactsEdit(
  prev: Record<string, SessionArtifact>,
  next: Record<string, SessionArtifact>,
): boolean {
  const prevIds = new Set(Object.keys(prev));
  const nextIds = new Set(Object.keys(next));
  if (prevIds.size !== nextIds.size) return true;
  for (const id of nextIds) {
    if (!prevIds.has(id)) return true;
    if (JSON.stringify(prev[id]) !== JSON.stringify(next[id])) return true;
  }
  return false;
}

/** True when the user added/changed a question or edited artifact content. */
export function isContentEditChange(
  prev: CanvasPersistSlice,
  next: CanvasPersistSlice,
): boolean {
  if (cardsQuestionEdit(prev.cards, next.cards)) return true;
  if (sessionArtifactsEdit(prev.sessionArtifacts, next.sessionArtifacts)) {
    return true;
  }
  return false;
}

function viewportChanged(
  prev: CanvasPersistSlice["viewport"],
  next: CanvasPersistSlice["viewport"],
): boolean {
  return (
    prev.x !== next.x || prev.y !== next.y || prev.scale !== next.scale
  );
}

/**
 * Reference equality across every persisted field except viewport.
 *
 * The zustand store replaces slices immutably, so for store-sourced slices
 * this is both necessary AND sufficient for "nothing but viewport changed".
 * Costs ~28 pointer compares vs the ~1MB-each JSON.stringify it replaces —
 * this runs on EVERY store write (drag pointermoves, pan frames).
 */
function nonViewportRefsEqual(
  prev: CanvasPersistSlice,
  next: CanvasPersistSlice,
): boolean {
  return (
    prev.cards === next.cards &&
    prev.cardOrder === next.cardOrder &&
    prev.connections === next.connections &&
    prev.threads === next.threads &&
    prev.threadOrder === next.threadOrder &&
    prev.groups === next.groups &&
    prev.connectorStyle === next.connectorStyle &&
    prev.canvasBackgroundStyle === next.canvasBackgroundStyle &&
    prev.canvasBackgroundImageId === next.canvasBackgroundImageId &&
    prev.canvasTheme === next.canvasTheme &&
    prev.selectedModel === next.selectedModel &&
    prev.viewMode === next.viewMode &&
    prev.sessionArtifacts === next.sessionArtifacts &&
    prev.canvasAssets === next.canvasAssets &&
    prev.canvasArtifactNodes === next.canvasArtifactNodes &&
    prev.canvasArtifactOrder === next.canvasArtifactOrder &&
    prev.canvasAssetNodes === next.canvasAssetNodes &&
    prev.canvasAssetOrder === next.canvasAssetOrder &&
    prev.canvasTextLabels === next.canvasTextLabels &&
    prev.canvasTextLabelOrder === next.canvasTextLabelOrder &&
    prev.canvasGifNodes === next.canvasGifNodes &&
    prev.canvasGifOrder === next.canvasGifOrder &&
    prev.canvas3DNodes === next.canvas3DNodes &&
    prev.canvas3DOrder === next.canvas3DOrder &&
    prev.canvasStrokes === next.canvasStrokes &&
    prev.canvasStrokeOrder === next.canvasStrokeOrder &&
    prev.uploadedAttachments === next.uploadedAttachments &&
    prev.collaborationHasEdits === next.collaborationHasEdits
  );
}

/** Deep fallback: only viewport fields differ (for snapshot-sourced slices). */
function slicesEqualExceptViewport(
  prev: CanvasPersistSlice,
  next: CanvasPersistSlice,
): boolean {
  // Inputs are already picked slices — no re-pick, one stringify per side.
  return (
    JSON.stringify({ ...prev, viewport: null }) ===
    JSON.stringify({ ...next, viewport: null })
  );
}

export function isViewportOnlyChange(
  prev: CanvasPersistSlice,
  next: CanvasPersistSlice,
): boolean {
  if (!viewportChanged(prev.viewport, next.viewport)) return false;
  // Cheap reference walk first — hits for all store-sourced slices. Only
  // snapshot-sourced slices (fresh objects, equal content) need the deep
  // stringify fallback.
  if (nonViewportRefsEqual(prev, next)) return true;
  return slicesEqualExceptViewport(prev, next);
}

export function isPersistableChange(
  prev: CanvasPersistSlice,
  next: CanvasPersistSlice,
): boolean {
  if (isViewportOnlyChange(prev, next)) return true;
  return (
    JSON.stringify(pickCanvasPersistSlice(prev)) !==
    JSON.stringify(pickCanvasPersistSlice(next))
  );
}

export function classifyCanvasPersistChange(
  prev: CanvasPersistSlice,
  next: CanvasPersistSlice,
): { persist: boolean; contentEdit: boolean } {
  // Evaluate each predicate at most once (the old shape re-ran the stringify
  // comparisons up to three times per store write).
  if (isViewportOnlyChange(prev, next)) {
    return { persist: true, contentEdit: false };
  }
  const persist =
    JSON.stringify(pickCanvasPersistSlice(prev)) !==
    JSON.stringify(pickCanvasPersistSlice(next));
  return {
    persist,
    // Any non-viewport canvas change (cards, assets, artifacts, answers, …)
    // must use the priority save path — never the slow viewport debounce.
    contentEdit: persist,
  };
}

/**
 * Reference-only classifier for the per-store-write hot path.
 *
 * Store writes are immutable, so a changed reference is the ONLY way content
 * can change — `persist: false` here is always safe. A replaced-but-identical
 * object yields a false-positive `persist: true`, which merely schedules a
 * debounced save of identical content (harmless). No serialization, ever.
 */
export function classifyCanvasPersistChangeFast(
  prev: CanvasPersistSlice,
  next: CanvasPersistSlice,
): { persist: boolean; contentEdit: boolean } {
  const contentChanged = !nonViewportRefsEqual(prev, next);
  if (contentChanged) return { persist: true, contentEdit: true };
  return {
    persist: viewportChanged(prev.viewport, next.viewport),
    contentEdit: false,
  };
}

/** True when persisted canvas content is unchanged (ignores object identity). */
export function areCanvasPersistSlicesEqual(
  prev: CanvasPersistSlice,
  next: CanvasPersistSlice,
): boolean {
  return (
    JSON.stringify(pickCanvasPersistSlice(prev)) ===
    JSON.stringify(pickCanvasPersistSlice(next))
  );
}
