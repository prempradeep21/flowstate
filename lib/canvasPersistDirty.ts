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
    canvasAssets: state.canvasAssets ?? {},
    canvasArtifactNodes: state.canvasArtifactNodes,
    canvasArtifactOrder: state.canvasArtifactOrder,
    canvasAssetNodes: state.canvasAssetNodes ?? {},
    canvasAssetOrder: state.canvasAssetOrder ?? [],
    canvasTextLabels: state.canvasTextLabels,
    canvasTextLabelOrder: state.canvasTextLabelOrder,
    canvasGifNodes: state.canvasGifNodes ?? {},
    canvasGifOrder: state.canvasGifOrder ?? [],
    canvas3DNodes: state.canvas3DNodes ?? {},
    canvas3DOrder: state.canvas3DOrder ?? [],
    canvasStrokes: state.canvasStrokes ?? {},
    canvasStrokeOrder: state.canvasStrokeOrder ?? [],
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

/** Fast path: only viewport fields differ (common during pan/zoom). */
function slicesEqualExceptViewport(
  prev: CanvasPersistSlice,
  next: CanvasPersistSlice,
): boolean {
  const prevSlice = pickCanvasPersistSlice(prev);
  const nextSlice = pickCanvasPersistSlice(next);
  return (
    JSON.stringify({ ...prevSlice, viewport: null }) ===
    JSON.stringify({ ...nextSlice, viewport: null })
  );
}

export function isViewportOnlyChange(
  prev: CanvasPersistSlice,
  next: CanvasPersistSlice,
): boolean {
  if (!viewportChanged(prev.viewport, next.viewport)) return false;
  if (slicesEqualExceptViewport(prev, next)) return true;
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
  const persist = isPersistableChange(prev, next);
  const viewportOnly =
    persist &&
    (isViewportOnlyChange(prev, next) ||
      slicesEqualExceptViewport(prev, next));
  return {
    persist,
    // Any non-viewport canvas change (cards, assets, artifacts, answers, …)
    // must use the priority save path — never the slow viewport debounce.
    contentEdit: persist && !viewportOnly,
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
