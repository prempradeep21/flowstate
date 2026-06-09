import { repairLoadedArtifactState } from "@/lib/materializeCardArtifact";
import { resolveBackgroundForTheme } from "@/lib/canvasBackgroundTheme";
import type { SessionArtifact } from "@/lib/sessionArtifacts";
import type {
  AnswerExplain,
  AppViewMode,
  BranchGroup,
  CanvasArtifactNode,
  CanvasAsset,
  CanvasAssetNode,
  CanvasBackgroundStyle,
  CanvasTheme,
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
  canvasBackgroundStyle: CanvasBackgroundStyle;
  canvasTheme: CanvasTheme;
  selectedModel: ClaudeModel;
  viewMode: AppViewMode;
  sessionArtifacts: Record<string, SessionArtifact>;
  canvasAssets?: Record<string, CanvasAsset>;
  canvasArtifactNodes?: Record<string, CanvasArtifactNode>;
  canvasArtifactOrder?: string[];
  canvasAssetNodes?: Record<string, CanvasAssetNode>;
  canvasAssetOrder?: string[];
  canvasTextLabels?: Record<string, CanvasTextLabel>;
  canvasTextLabelOrder?: string[];
  uploadedAttachments?: UploadedAttachment[];
  collaborationHasEdits?: boolean;
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
  canvasBackgroundStyle: CanvasBackgroundStyle;
  canvasTheme: CanvasTheme;
  selectedModel: ClaudeModel;
  viewMode: AppViewMode;
  sessionArtifacts: Record<string, SessionArtifact>;
  canvasAssets?: Record<string, CanvasAsset>;
  canvasArtifactNodes: Record<string, CanvasArtifactNode>;
  canvasArtifactOrder: string[];
  canvasAssetNodes?: Record<string, CanvasAssetNode>;
  canvasAssetOrder?: string[];
  canvasTextLabels: Record<string, CanvasTextLabel>;
  canvasTextLabelOrder: string[];
  uploadedAttachments: UploadedAttachment[];
  collaborationHasEdits: boolean;
}

function normalizeCardStatus(status: CardStatus): CardStatus {
  if (status === "streaming" || status === "thinking") return "done";
  return status;
}

function normalizeAnswerExplains(
  explains?: AnswerExplain[],
): AnswerExplain[] | undefined {
  if (!explains?.length) return undefined;
  return explains.map((e) => ({
    ...e,
    status:
      e.status === "loading"
        ? e.explanation.trim()
          ? "done"
          : "error"
        : e.status,
  }));
}

function normalizeCardForPersist(card: Card): Card {
  const normalized: Card = {
    ...card,
    status: normalizeCardStatus(card.status),
    thinkingLabel: undefined,
    pendingFiles: undefined,
    quotedSelection: undefined,
    answerExplains: normalizeAnswerExplains(card.answerExplains),
  };
  // Artifact body lives in sessionArtifacts once materialized — drop duplicate blob.
  if (normalized.outputArtifactId && normalized.artifactPayload) {
    return { ...normalized, artifactPayload: undefined };
  }
  return normalized;
}

export function buildCanvasSnapshot(source: CanvasSnapshotSource): CanvasSnapshot {
  let sessionArtifacts = JSON.parse(
    JSON.stringify(source.sessionArtifacts),
  ) as Record<string, SessionArtifact>;
  const connections = source.connections.map((c) => ({ ...c }));
  const cardOrder = [...source.cardOrder];
  const repaired = repairLoadedArtifactState(
    source.cards,
    sessionArtifacts,
    connections,
    cardOrder,
  );
  sessionArtifacts = repaired.sessionArtifacts;

  const cards: Record<string, Card> = {};
  for (const [id, card] of Object.entries(repaired.cards)) {
    cards[id] = normalizeCardForPersist(card);
  }

  return {
    version: CANVAS_SNAPSHOT_VERSION,
    viewport: { ...source.viewport },
    cards,
    cardOrder,
    connections,
    threads: { ...source.threads },
    threadOrder: [...source.threadOrder],
    groups: { ...source.groups },
    connectorStyle: source.connectorStyle,
    canvasBackgroundStyle: source.canvasBackgroundStyle,
    canvasTheme: source.canvasTheme,
    selectedModel: source.selectedModel,
    viewMode: source.viewMode,
    sessionArtifacts,
    canvasAssets: JSON.parse(
      JSON.stringify(source.canvasAssets ?? {}),
    ) as Record<string, CanvasAsset>,
    canvasArtifactNodes: JSON.parse(
      JSON.stringify(source.canvasArtifactNodes),
    ) as Record<string, CanvasArtifactNode>,
    canvasArtifactOrder: [...source.canvasArtifactOrder],
    canvasAssetNodes: JSON.parse(
      JSON.stringify(source.canvasAssetNodes ?? {}),
    ) as Record<string, CanvasAssetNode>,
    canvasAssetOrder: [...(source.canvasAssetOrder ?? [])],
    canvasTextLabels: JSON.parse(
      JSON.stringify(source.canvasTextLabels),
    ) as Record<string, CanvasTextLabel>,
    canvasTextLabelOrder: [...source.canvasTextLabelOrder],
    uploadedAttachments: JSON.parse(
      JSON.stringify(source.uploadedAttachments),
    ) as UploadedAttachment[],
    collaborationHasEdits: source.collaborationHasEdits,
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
    canvasBackgroundStyle: "grid",
    canvasTheme: "dark",
    selectedModel,
    viewMode: "canvas",
    sessionArtifacts: {},
    canvasAssets: {},
    canvasArtifactNodes: {},
    canvasArtifactOrder: [],
    canvasAssetNodes: {},
    canvasAssetOrder: [],
    canvasTextLabels: {},
    canvasTextLabelOrder: [],
    uploadedAttachments: [],
    collaborationHasEdits: false,
  };
}

const VALID_BACKGROUND_STYLES = new Set<CanvasBackgroundStyle>([
  "grid",
  "ambient-gradient",
  "sky",
  "network",
  "rising-sun",
]);

function normalizeCanvasBackgroundStyle(
  raw: unknown,
  fallback: CanvasBackgroundStyle,
): CanvasBackgroundStyle {
  return typeof raw === "string" &&
    VALID_BACKGROUND_STYLES.has(raw as CanvasBackgroundStyle)
    ? (raw as CanvasBackgroundStyle)
    : fallback;
}

const VALID_THEMES = new Set<CanvasTheme>(["light", "dark"]);

function normalizeCanvasTheme(
  raw: unknown,
  fallback: CanvasTheme,
): CanvasTheme {
  return typeof raw === "string" && VALID_THEMES.has(raw as CanvasTheme)
    ? (raw as CanvasTheme)
    : fallback;
}

const VALID_MODELS = new Set<ClaudeModel>([
  "claude-opus-4-7",
  "claude-sonnet-4-6",
  "claude-haiku-4-5",
]);

function normalizeViewport(raw: unknown, fallback: Viewport): Viewport {
  if (!raw || typeof raw !== "object") return { ...fallback };
  const v = raw as Partial<Viewport>;
  return {
    x: typeof v.x === "number" && Number.isFinite(v.x) ? v.x : fallback.x,
    y: typeof v.y === "number" && Number.isFinite(v.y) ? v.y : fallback.y,
    scale:
      typeof v.scale === "number" && Number.isFinite(v.scale) && v.scale > 0
        ? v.scale
        : fallback.scale,
  };
}

function normalizeRecord<T>(raw: unknown): Record<string, T> {
  if (!raw || typeof raw !== "object") return {};
  return { ...(raw as Record<string, T>) };
}

function normalizeStringArray(raw: unknown): string[] {
  return Array.isArray(raw)
    ? raw.filter((id): id is string => typeof id === "string")
    : [];
}

function normalizeSessionArtifacts(
  raw: unknown,
): Record<string, SessionArtifact> {
  const input = normalizeRecord<SessionArtifact>(raw);
  const out: Record<string, SessionArtifact> = {};

  for (const [id, artifact] of Object.entries(input)) {
    if (!artifact || typeof artifact !== "object") continue;
    const versions = Array.isArray(artifact.versions)
      ? artifact.versions.filter(
          (version): version is SessionArtifact["versions"][number] =>
            Boolean(version && typeof version === "object" && version.id),
        )
      : [];
    if (versions.length === 0) continue;

    const latestVersionId =
      typeof artifact.latestVersionId === "string" &&
      versions.some((version) => version.id === artifact.latestVersionId)
        ? artifact.latestVersionId
        : versions[versions.length - 1]!.id;

    out[id] = {
      id: typeof artifact.id === "string" ? artifact.id : id,
      title:
        typeof artifact.title === "string" && artifact.title.trim().length > 0
          ? artifact.title
          : "Artifact",
      kind: artifact.kind ?? "custom",
      versions,
      latestVersionId,
    };
  }

  return out;
}

/** Merge partial or legacy persisted state with empty snapshot defaults. */
export function normalizeCanvasSnapshot(raw: unknown): CanvasSnapshot {
  const base = buildEmptyCanvasSnapshot();
  if (!raw || typeof raw !== "object") return base;

  const snapshot = raw as Partial<CanvasSnapshot>;
  if (snapshot.version !== CANVAS_SNAPSHOT_VERSION) return base;

  const cards = normalizeRecord<Card>(snapshot.cards);
  const cardOrder = normalizeStringArray(snapshot.cardOrder);
  const normalizedCardOrder =
    cardOrder.length > 0 ? cardOrder : Object.keys(cards);

  return {
    version: CANVAS_SNAPSHOT_VERSION,
    viewport: normalizeViewport(snapshot.viewport, base.viewport),
    cards,
    cardOrder: normalizedCardOrder,
    connections: Array.isArray(snapshot.connections)
      ? snapshot.connections.map((connection) => ({ ...connection }))
      : [],
    threads: normalizeRecord<Thread>(snapshot.threads),
    threadOrder: normalizeStringArray(snapshot.threadOrder),
    groups: normalizeRecord<BranchGroup>(snapshot.groups),
    connectorStyle:
      snapshot.connectorStyle === "curvy" ||
      snapshot.connectorStyle === "orthogonal"
        ? snapshot.connectorStyle
        : base.connectorStyle,
    canvasBackgroundStyle: resolveBackgroundForTheme(
      normalizeCanvasBackgroundStyle(
        snapshot.canvasBackgroundStyle,
        base.canvasBackgroundStyle,
      ),
      normalizeCanvasTheme(snapshot.canvasTheme, base.canvasTheme),
    ),
    canvasTheme: normalizeCanvasTheme(snapshot.canvasTheme, base.canvasTheme),
    selectedModel:
      snapshot.selectedModel && VALID_MODELS.has(snapshot.selectedModel)
        ? snapshot.selectedModel
        : base.selectedModel,
    viewMode: snapshot.viewMode === "chat" ? "chat" : "canvas",
    sessionArtifacts: normalizeSessionArtifacts(snapshot.sessionArtifacts),
    canvasAssets: normalizeRecord<CanvasAsset>(snapshot.canvasAssets),
    canvasArtifactNodes: normalizeRecord<CanvasArtifactNode>(
      snapshot.canvasArtifactNodes,
    ),
    canvasArtifactOrder: normalizeStringArray(snapshot.canvasArtifactOrder),
    canvasAssetNodes: normalizeRecord<CanvasAssetNode>(
      snapshot.canvasAssetNodes,
    ),
    canvasAssetOrder: normalizeStringArray(snapshot.canvasAssetOrder),
    canvasTextLabels: normalizeRecord<CanvasTextLabel>(
      snapshot.canvasTextLabels,
    ),
    canvasTextLabelOrder: normalizeStringArray(snapshot.canvasTextLabelOrder),
    uploadedAttachments: Array.isArray(snapshot.uploadedAttachments)
      ? (JSON.parse(
          JSON.stringify(snapshot.uploadedAttachments),
        ) as UploadedAttachment[])
      : [],
    collaborationHasEdits: Boolean(snapshot.collaborationHasEdits),
  };
}

export function isCanvasSnapshot(value: unknown): value is CanvasSnapshot {
  if (!value || typeof value !== "object") return false;
  return (value as Partial<CanvasSnapshot>).version === CANVAS_SNAPSHOT_VERSION;
}

export function parseCanvasSnapshot(raw: unknown): CanvasSnapshot | null {
  if (!isCanvasSnapshot(raw)) return null;
  return normalizeCanvasSnapshot(raw);
}

export function snapshotHasContent(snapshot: CanvasSnapshot): boolean {
  return snapshot.cardOrder.length > 0;
}
