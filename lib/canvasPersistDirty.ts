import type { Card, SessionArtifact } from "@/lib/store";

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
  selectedModel: string;
  viewMode: string;
  sessionArtifacts: Record<string, SessionArtifact>;
  canvasArtifactNodes: Record<string, unknown>;
  canvasArtifactOrder: string[];
  canvasTextLabels: Record<string, unknown>;
  canvasTextLabelOrder: string[];
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
    selectedModel: state.selectedModel,
    viewMode: state.viewMode,
    sessionArtifacts: state.sessionArtifacts,
    canvasArtifactNodes: state.canvasArtifactNodes,
    canvasArtifactOrder: state.canvasArtifactOrder,
    canvasTextLabels: state.canvasTextLabels,
    canvasTextLabelOrder: state.canvasTextLabelOrder,
    uploadedAttachments: state.uploadedAttachments,
    collaborationHasEdits: state.collaborationHasEdits,
  };
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

export function isPersistableChange(
  prev: CanvasPersistSlice,
  next: CanvasPersistSlice,
): boolean {
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
  return {
    persist,
    contentEdit: persist && isContentEditChange(prev, next),
  };
}
