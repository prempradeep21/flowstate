import type { SessionArtifact } from "@/lib/sessionArtifacts";
import type {
  AppViewMode,
  BranchGroup,
  CanvasArtifactNode,
  CanvasTextLabel,
  Card,
  CardStatus,
  ClaudeModel,
  Connection,
  ConnectorStyle,
  Thread,
  UploadedAttachment,
  Viewport,
} from "@/lib/store";

export const CANVAS_SNAPSHOT_VERSION = 1 as const;

export interface CanvasSnapshot {
  version: typeof CANVAS_SNAPSHOT_VERSION;
  viewport: Viewport;
  cards: Record<string, Card>;
  cardOrder: string[];
  connections: Connection[];
  threads: Record<string, Thread>;
  threadOrder: string[];
  groups: Record<string, BranchGroup>;
  connectorStyle: ConnectorStyle;
  selectedModel: ClaudeModel;
  viewMode: AppViewMode;
  sessionArtifacts: Record<string, SessionArtifact>;
  canvasArtifactNodes?: Record<string, CanvasArtifactNode>;
  canvasArtifactOrder?: string[];
  canvasTextLabels?: Record<string, CanvasTextLabel>;
  canvasTextLabelOrder?: string[];
  uploadedAttachments?: UploadedAttachment[];
}

export interface CanvasSnapshotSource {
  viewport: Viewport;
  cards: Record<string, Card>;
  cardOrder: string[];
  connections: Connection[];
  threads: Record<string, Thread>;
  threadOrder: string[];
  groups: Record<string, BranchGroup>;
  connectorStyle: ConnectorStyle;
  selectedModel: ClaudeModel;
  viewMode: AppViewMode;
  sessionArtifacts: Record<string, SessionArtifact>;
  canvasArtifactNodes: Record<string, CanvasArtifactNode>;
  canvasArtifactOrder: string[];
  canvasTextLabels: Record<string, CanvasTextLabel>;
  canvasTextLabelOrder: string[];
  uploadedAttachments: UploadedAttachment[];
}

function normalizeCardStatus(status: CardStatus): CardStatus {
  if (status === "streaming" || status === "thinking") return "done";
  return status;
}

function normalizeCardForPersist(card: Card): Card {
  return {
    ...card,
    status: normalizeCardStatus(card.status),
    thinkingLabel: undefined,
    pendingFiles: undefined,
  };
}

export function buildCanvasSnapshot(source: CanvasSnapshotSource): CanvasSnapshot {
  const cards: Record<string, Card> = {};
  for (const [id, card] of Object.entries(source.cards)) {
    cards[id] = normalizeCardForPersist(card);
  }

  return {
    version: CANVAS_SNAPSHOT_VERSION,
    viewport: { ...source.viewport },
    cards,
    cardOrder: [...source.cardOrder],
    connections: source.connections.map((c) => ({ ...c })),
    threads: { ...source.threads },
    threadOrder: [...source.threadOrder],
    groups: { ...source.groups },
    connectorStyle: source.connectorStyle,
    selectedModel: source.selectedModel,
    viewMode: source.viewMode,
    sessionArtifacts: JSON.parse(
      JSON.stringify(source.sessionArtifacts),
    ) as Record<string, SessionArtifact>,
    canvasArtifactNodes: JSON.parse(
      JSON.stringify(source.canvasArtifactNodes),
    ) as Record<string, CanvasArtifactNode>,
    canvasArtifactOrder: [...source.canvasArtifactOrder],
    canvasTextLabels: JSON.parse(
      JSON.stringify(source.canvasTextLabels),
    ) as Record<string, CanvasTextLabel>,
    canvasTextLabelOrder: [...source.canvasTextLabelOrder],
    uploadedAttachments: JSON.parse(
      JSON.stringify(source.uploadedAttachments),
    ) as UploadedAttachment[],
  };
}

export function buildEmptyCanvasSnapshot(
  selectedModel: ClaudeModel = "claude-sonnet-4-6",
): CanvasSnapshot {
  return {
    version: CANVAS_SNAPSHOT_VERSION,
    viewport: { x: 0, y: 0, scale: 1 },
    cards: {},
    cardOrder: [],
    connections: [],
    threads: {},
    threadOrder: [],
    groups: {},
    connectorStyle: "orthogonal",
    selectedModel,
    viewMode: "canvas",
    sessionArtifacts: {},
    canvasArtifactNodes: {},
    canvasArtifactOrder: [],
    canvasTextLabels: {},
    canvasTextLabelOrder: [],
    uploadedAttachments: [],
  };
}

export function isCanvasSnapshot(value: unknown): value is CanvasSnapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<CanvasSnapshot>;
  return (
    v.version === CANVAS_SNAPSHOT_VERSION &&
    typeof v.viewport === "object" &&
    v.viewport !== null &&
    typeof v.cards === "object" &&
    v.cards !== null &&
    Array.isArray(v.cardOrder)
  );
}

export function parseCanvasSnapshot(raw: unknown): CanvasSnapshot | null {
  if (isCanvasSnapshot(raw)) return raw;
  return null;
}

export function snapshotHasContent(snapshot: CanvasSnapshot): boolean {
  return snapshot.cardOrder.length > 0;
}
