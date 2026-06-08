"use client";

import type { ArtifactPayload, ResponseType } from "@/lib/artifactTypes";
import { payloadToArtifactKind } from "@/lib/artifactTypes";
import type {
  CanvasSnapshot,
  CanvasSnapshotSource,
} from "@/lib/canvasSnapshot";
import { normalizeCanvasSnapshot } from "@/lib/canvasSnapshot";
import { repairLoadedArtifactState } from "@/lib/materializeCardArtifact";
import { collectSubtreeIds } from "@/lib/canvasSubtree";
import {
  resolveBranchDropPosition,
  getFollowUpChild,
  relayoutVerticalChainOf,
  repairCanvasLayout,
  repairVerticalChainsOnly,
  shiftBottomAttachedSubtrees,
  childBandY,
  defaultBranchSlotX,
  computeFollowUpPositionFromDom,
} from "@/lib/canvasLayout";
import { DEFAULT_BODY_FONT_ID } from "@/lib/canvasFonts/registry";
import { THREAD_ACCENT_PALETTE } from "@/lib/design/tokens";
import { buildCanvasLoadRevealPlan } from "@/lib/motion/canvasLoadReveal";
import type { CanvasLoadReveal, SpawnMeta } from "@/lib/motion/types";
import { isCardPending } from "@/lib/cardLayoutPolicy";
import {
  CANVAS_ARTIFACT_WIDTH,
  CANVAS_TABLE_ARTIFACT_WIDTH,
  DEFAULT_ARTIFACT_HEIGHT,
  TABLE_ARTIFACT_HEIGHT,
  emptyCardSize,
  getArtifactBounds,
} from "@/lib/canvasNodeBounds";
import {
  clampTextLabelFontSize,
  clampTextLabelWidth,
} from "@/lib/canvasTextLabelBounds";
import {
  DEFAULT_CANVAS_TUNING,
  RESOLVED_CANVAS_TUNING,
  type ResolvedCanvasTuning,
} from "@/lib/canvasTuning";

export { CANVAS_ARTIFACT_WIDTH, CANVAS_TABLE_ARTIFACT_WIDTH } from "@/lib/canvasNodeBounds";
import {
  CANVAS_ORIGIN,
  isOriginCardPinned,
  type GlobalOrigin,
} from "@/lib/canvasOrigin";
import { resetViewportBootstrap } from "@/lib/canvasViewportBootstrap";
import { pickDefaultThreadId } from "@/lib/chatThreads";
import { syncAllCardDomSizes } from "@/lib/canvasMeasure";
import { buildSummaryContentFingerprint } from "@/lib/groupSummaryStaleness";
import {
  computeDefaultSpawnPosition,
  findCanvasNodeByArtifactId,
} from "@/lib/canvasArtifacts";
import {
  appendArtifactVersion,
  createSessionArtifactFromPayload,
  getLatestVersion,
  getVersionById,
  normalizePayloadForRegistry,
  resolveThreadArtifactId,
  type AttachedArtifactRef,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import { MANUAL_MAP_SOURCE_CARD_ID } from "@/lib/mapArtifact";
import {
  createEmptyTodoPayload,
  MANUAL_TODO_SOURCE_CARD_ID,
} from "@/lib/todoArtifact";
import {
  createWebsitePayload,
  MANUAL_WEBSITE_SOURCE_CARD_ID,
} from "@/lib/websiteArtifact";
import { domainDisplayLabel } from "@/lib/urlDetection";
import {
  graphSnapshotFromState,
  GraphSnapshot,
  MAX_UNDO_STACK,
} from "@/lib/undo";
import { create } from "zustand";

export type ClaudeModel =
  | "claude-opus-4-7"
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5";

const MANUAL_VIDEO_SOURCE_CARD_ID = "manual-video";

export type CardStatus = "empty" | "thinking" | "streaming" | "done";

export interface CardImage {
  url: string;
  thumb: string;
  alt: string;
}

export interface CardSize {
  w: number;
  h: number;
}

export type { ArtifactPayload, ResponseType };
export type { AttachedArtifactRef, SessionArtifact } from "@/lib/sessionArtifacts";

export interface PendingFileAttachment {
  name: string;
  mimeType: string;
  base64: string;
}

export interface UploadedAttachment {
  id: string;
  name: string;
  type: string;
  data: string;
  addedAt: number;
}

export type CanvasAssetKind = "image" | "document" | "code";

export interface CanvasAsset {
  id: string;
  canvasId: string;
  ownerId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  publicUrl: string;
  kind: CanvasAssetKind;
  width?: number;
  height?: number;
  aspectRatio?: number;
  createdAt: number;
}

export interface AttachedAssetRef {
  assetId: string;
}

export interface AnswerExplain {
  id: string;
  selectedText: string;
  /** 0-based occurrence among identical substrings in rendered plain text */
  occurrenceIndex: number;
  explanation: string;
  status: "loading" | "done" | "error";
}

export interface BranchOptions {
  quotedSelection?: string;
}

export interface Card {
  id: string;
  threadId: string;
  question: string;
  answer: string;
  status: CardStatus;
  thinkingLabel?: string;
  position: { x: number; y: number };
  parentCardId: string | null;
  parentConversationId: string | null;
  size?: CardSize;
  artifactId?: string;
  images?: CardImage[];
  responseType?: ResponseType;
  artifactPayload?: ArtifactPayload;
  outputArtifactId?: string;
  outputArtifactVersionId?: string;
  attachedArtifacts?: AttachedArtifactRef[];
  attachedAssets?: AttachedAssetRef[];
  inheritedArtifactId?: string;
  pendingFiles?: PendingFileAttachment[];
  contributorIds?: string[];
  answerExplains?: AnswerExplain[];
  quotedSelection?: string;
}

export interface FollowUpOptions {
  attachedArtifacts?: AttachedArtifactRef[];
  attachedAssets?: AttachedAssetRef[];
  pendingImages?: CardImage[];
  pendingFiles?: PendingFileAttachment[];
}

export type CardSide = "top" | "bottom" | "left" | "right";
export type PlugSide = "left" | "right";

export type PlugDragState =
  | {
      kind: "branch";
      sourceCardId: string;
      fromSide: PlugSide;
      pointerWorld: { x: number; y: number };
      didDrag: boolean;
    }
  | {
      kind: "artifact";
      artifactNodeId: string;
      artifactId: string;
      versionId: string;
      fromSide: PlugSide;
      pointerWorld: { x: number; y: number };
      didDrag: boolean;
      receiveTargetCardId: string | null;
      hoveredReceiveSide: PlugSide | null;
    }
  | {
      kind: "asset";
      assetNodeId: string;
      assetId: string;
      fromSide: PlugSide;
      pointerWorld: { x: number; y: number };
      didDrag: boolean;
      receiveTargetCardId: string | null;
      hoveredReceiveSide: PlugSide | null;
    };

export interface Connection {
  id: string;
  from: string;
  to: string;
  fromSide: CardSide;
  toSide: CardSide;
}

/** Dashed plug link from a canvas artefact node to a question card composer. */
export interface ArtifactPlugConnection {
  id: string;
  artifactNodeId: string;
  cardId: string;
  fromSide: PlugSide;
  toSide: PlugSide;
}

export interface Thread {
  id: string;
  accentColour: string;
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export type ConnectorStyle = "curvy" | "orthogonal";
export type AppViewMode = "canvas" | "chat";

export type CanvasBackgroundStyle = "grid" | "ambient-gradient";

export const CANVAS_BACKGROUND_STYLES: readonly CanvasBackgroundStyle[] = [
  "grid",
  "ambient-gradient",
] as const;

export type CanvasTheme = "light" | "dark";

export const CANVAS_THEMES: readonly CanvasTheme[] = ["light", "dark"] as const;

export interface BranchGroup {
  id: string;
  label: string;
  familyRootThreadIds: string[];
  summaryMarkdown: string | null;
  summaryGeneratedAt?: number;
  summaryContentFingerprint?: string;
}

export interface CanvasArtifactNode {
  id: string;
  artifactId: string;
  versionId: string;
  sourceCardId: string;
  position: { x: number; y: number };
  size?: CardSize;
}

export interface CanvasAssetNode {
  id: string;
  assetId: string;
  position: { x: number; y: number };
  size?: CardSize;
}

export const CANVAS_TEXT_LABEL_FONT_SIZE = 40;

export type CanvasPlacementTool = "question" | "text";

export interface CanvasTextLabel {
  id: string;
  text: string;
  position: { x: number; y: number };
  fontSize: number;
  /** When set, text wraps inside this width (canvas px). */
  width?: number;
}

/** Horizontal gap between a source card's right edge and a spawned artifact. */
export const ARTIFACT_SPAWN_GAP_X = 24;

interface CanvasState {
  selectedModel: ClaudeModel;
  setModel: (model: ClaudeModel) => void;

  leftPanelCollapsed: boolean;
  setLeftPanelCollapsed: (collapsed: boolean) => void;
  toggleLeftPanel: () => void;

  rightPanelCollapsed: boolean;
  setRightPanelCollapsed: (collapsed: boolean) => void;
  toggleRightPanel: () => void;

  uploadedAttachments: UploadedAttachment[];
  addUploadedAttachment: (attachment: UploadedAttachment) => void;
  removeUploadedAttachment: (id: string) => void;
  addCanvasAsset: (asset: CanvasAsset) => void;
  removeCanvasAsset: (assetId: string) => void;
  spawnCanvasAsset: (
    assetId: string,
    opts?: { position?: { x: number; y: number }; focus?: boolean },
  ) => string | null;
  moveCanvasAsset: (nodeId: string, dx: number, dy: number) => void;
  setCanvasAssetSize: (nodeId: string, size: CardSize) => void;
  selectCanvasAsset: (nodeId: string | null) => void;
  removeCanvasAssetNode: (nodeId: string) => void;

  viewMode: AppViewMode;
  activeThreadId: string | null;
  setViewMode: (mode: AppViewMode) => void;
  setActiveThreadId: (threadId: string) => void;

  canvasPlacementRequest: CanvasPlacementTool | null;
  activeCanvasPlacement: CanvasPlacementTool | null;
  requestCanvasPlacement: (tool: CanvasPlacementTool) => void;

  sessionUsage: { inputTokens: number; outputTokens: number };
  addUsage: (input: number, output: number) => void;

  viewport: Viewport;
  /** Scale used for stroke/chrome compensation; lags during active zoom gestures. */
  viewportSettledScale: number;
  cards: Record<string, Card>;
  cardOrder: string[];
  connections: Connection[];
  threads: Record<string, Thread>;
  threadOrder: string[];
  openArtifactCardId: string | null;
  openGroupArtifactId: string | null;
  sessionArtifacts: Record<string, SessionArtifact>;
  canvasAssets: Record<string, CanvasAsset>;
  openSessionArtifactId: string | null;
  openSessionArtifactVersionId: string | null;
  canvasArtifactNodes: Record<string, CanvasArtifactNode>;
  canvasArtifactOrder: string[];
  selectedCanvasArtifactId: string | null;
  canvasAssetNodes: Record<string, CanvasAssetNode>;
  canvasAssetOrder: string[];
  selectedCanvasAssetId: string | null;
  canvasTextLabels: Record<string, CanvasTextLabel>;
  canvasTextLabelOrder: string[];
  selectedCanvasTextLabelId: string | null;
  connectorStyle: ConnectorStyle;
  canvasBackgroundStyle: CanvasBackgroundStyle;
  canvasTheme: CanvasTheme;
  /** UI sound effects enabled for this session. */
  soundEnabled: boolean;
  /** Master UI sound volume (0..1). */
  soundVolume: number;
  /** Session-only font preview — body layer (not persisted). */
  canvasPreviewBodyFontId: string;
  /** Session-only font preview — display layer (not persisted). */
  canvasPreviewDisplayFontId: string;
  /** First seeded card — world origin anchor (top-left at 0,0). Set once per canvas session. */
  globalOrigin: GlobalOrigin | null;
  undoPast: GraphSnapshot[];

  /** Active spawn animation target (single concurrent spawn). */
  spawnMeta: SpawnMeta | null;
  setSpawnMeta: (meta: SpawnMeta) => void;
  clearSpawnMeta: () => void;
  clearRecentConnection: () => void;
  /** Connection id to play draw-in animation (cleared after draw). */
  recentConnectionId: string | null;

  /** Staggered slide-in after canvas hydrate (login / reload / switch). */
  canvasLoadReveal: CanvasLoadReveal | null;
  startCanvasLoadReveal: () => void;
  clearCanvasLoadReveal: () => void;

  plugDrag: PlugDragState | null;
  plugComposerAttachments: Record<string, AttachedArtifactRef>;
  plugComposerAssetAttachments: Record<string, AttachedAssetRef>;
  artifactPlugConnections: ArtifactPlugConnection[];

  selectedFamilyRootIds: string[];
  /** Branch thread ids collapsed on the canvas (session UI only, not persisted). */
  collapsedBranchThreadIds: string[];
  /** Card ids with answer + descendant subtree collapsed on canvas (session UI only). */
  collapsedCardIds: string[];
  groups: Record<string, BranchGroup>;
  activeGroupId: string | null;

  setSelectedFamilyRootIds: (rootThreadIds: string[]) => void;
  toggleBranchThreadCollapsed: (branchThreadId: string) => void;
  toggleCardCollapsed: (cardId: string) => void;
  clearSelection: () => void;
  createGroupFromSelection: (label?: string) => string | null;
  setGroupSummary: (groupId: string, markdown: string) => void;
  openGroupArtifact: (groupId: string) => void;
  closeGroupArtifact: () => void;
  removeGroup: (groupId: string) => void;
  setActiveGroupId: (groupId: string | null) => void;

  recordUndo: () => void;
  undo: () => void;

  setViewport: (next: Partial<Viewport>) => void;
  panBy: (dx: number, dy: number) => void;
  zoomAt: (
    factor: number,
    pivotScreenX: number,
    pivotScreenY: number,
  ) => void;

  updateCard: (id: string, patch: Partial<Card>) => void;
  setCardSize: (id: string, size: CardSize) => void;
  setCanvasArtifactSize: (nodeId: string, size: CardSize) => void;
  moveSubtree: (rootId: string, dx: number, dy: number) => void;

  createRootCard: (position: { x: number; y: number }) => string;
  createFollowUp: (
    parentId: string,
    question: string,
    options?: FollowUpOptions,
  ) => string | null;
  createBranch: (
    sourceId: string,
    side: "left" | "right",
    options?: BranchOptions,
  ) => string | null;
  createBranchAt: (
    sourceId: string,
    side: "left" | "right",
    position: { x: number; y: number },
    options?: BranchOptions,
  ) => string | null;
  createBranchFromSelection: (
    sourceId: string,
    selectedText: string,
    side?: "left" | "right",
  ) => string | null;
  addAnswerExplain: (cardId: string, explain: AnswerExplain) => void;
  updateAnswerExplain: (
    cardId: string,
    explainId: string,
    patch: Partial<AnswerExplain>,
  ) => void;
  createRootCardWithAttachment: (
    position: { x: number; y: number },
    ref: AttachedArtifactRef,
  ) => string;
  createRootCardWithAssetAttachment: (
    position: { x: number; y: number },
    ref: AttachedAssetRef,
  ) => string;
  setCardComposerAttachment: (
    cardId: string,
    ref: AttachedArtifactRef,
  ) => void;
  setCardComposerAssetAttachment: (
    cardId: string,
    ref: AttachedAssetRef,
  ) => void;
  addArtifactPlugConnection: (conn: {
    artifactNodeId: string;
    cardId: string;
    fromSide: PlugSide;
    toSide: PlugSide;
  }) => void;
  startPlugDrag: (drag: PlugDragState) => void;
  updatePlugDrag: (patch: Partial<Pick<PlugDragState, "pointerWorld">> & {
    receiveTargetCardId?: string | null;
    hoveredReceiveSide?: PlugSide | null;
    didDrag?: boolean;
  }) => void;
  endPlugDrag: () => void;
  cancelPlugDrag: () => void;
  deleteFromCard: (cardId: string) => void;

  createArtifactVersion: (
    artifactId: string | null,
    payload: ArtifactPayload,
    cardId: string,
  ) => { artifactId: string; versionId: string };
  createBlankTodoArtifact: (
    title?: string,
  ) => { artifactId: string; versionId: string };
  createVideoArtifactFromUrl: (
    url: string,
    opts?: {
      title?: string;
      thumb?: string;
      position?: { x: number; y: number };
      recordUndo?: boolean;
    },
  ) => { artifactId: string; versionId: string };
  createWebsiteArtifactFromUrl: (
    url: string,
    position?: { x: number; y: number },
    opts?: { recordUndo?: boolean },
  ) => { artifactId: string; versionId: string };
  patchWebsiteArtifactTitle: (
    artifactId: string,
    patch: { title: string; faviconUrl?: string; previewImageUrl?: string },
  ) => void;
  patchYoutubeArtifactTitle: (
    artifactId: string,
    versionId: string,
    patch: { title: string; thumb?: string },
  ) => void;
  ensurePendingTableArtifact: (
    cardId: string,
  ) => { artifactId: string; versionId: string } | null;
  ensurePendingCustomArtifact: (
    cardId: string,
  ) => { artifactId: string; versionId: string } | null;
  saveTodoArtifactVersion: (
    artifactId: string,
    payload: Extract<ArtifactPayload, { type: "todo" }>,
  ) => { versionId: string };
  saveMapArtifactVersion: (
    artifactId: string,
    payload: Extract<ArtifactPayload, { type: "map" }>,
  ) => { versionId: string };
  openSessionArtifact: (artifactId: string, versionId?: string) => void;
  setArtifactPanelVersion: (versionId: string) => void;
  listSessionArtifacts: () => SessionArtifact[];

  spawnCanvasArtifact: (
    artifactId: string,
    versionId: string,
    opts?: { position?: { x: number; y: number }; focus?: boolean },
  ) => string | null;
  ensureCanvasArtifactAt: (
    artifactId: string,
    versionId: string,
    position: { x: number; y: number },
  ) => string | null;
  moveCanvasArtifact: (nodeId: string, dx: number, dy: number) => void;
  selectCanvasArtifact: (nodeId: string | null) => void;
  setCanvasArtifactVersion: (nodeId: string, versionId: string) => void;
  removeCanvasArtifact: (nodeId: string) => void;

  spawnCanvasTextLabel: (
    position: { x: number; y: number },
    text?: string,
  ) => string;
  moveCanvasTextLabel: (nodeId: string, dx: number, dy: number) => void;
  updateCanvasTextLabel: (nodeId: string, text: string) => void;
  setCanvasTextLabelFontSize: (nodeId: string, fontSize: number) => void;
  setCanvasTextLabelWidth: (nodeId: string, width: number) => void;
  removeCanvasTextLabel: (nodeId: string) => void;
  selectCanvasTextLabel: (nodeId: string | null) => void;

  openArtifact: (cardId: string) => void;
  closeArtifact: () => void;
  setConnectorStyle: (style: ConnectorStyle) => void;
  setCanvasBackgroundStyle: (style: CanvasBackgroundStyle) => void;
  setCanvasTheme: (theme: CanvasTheme) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setCanvasPreviewBodyFontId: (id: string) => void;
  setCanvasPreviewDisplayFontId: (id: string) => void;
  /** Re-measure cards from DOM at current zoom, then repair vertical chains. */
  relayoutCanvasFromDom: () => void;
  /** Re-snap the vertical chain under a parent after DOM height changes. */
  relayoutFollowUpChainFromParent: (parentId: string) => void;
  /** Snap the bottom follow-up to the parent after its composer footer unmounts. */
  snapFollowUpChildToParent: (parentId: string) => void;

  getCanvasSnapshotSource: () => CanvasSnapshotSource;
  hydrateFromSnapshot: (
    snapshot: CanvasSnapshot,
    options?: { applyViewport?: boolean; canvasReveal?: boolean },
  ) => void;
  canvasReadOnly: boolean;
  setCanvasReadOnly: (readOnly: boolean) => void;
  collaborationHasEdits: boolean;
  setCollaborationHasEdits: (value: boolean) => void;
  appendContributorToCard: (cardId: string, userId: string) => void;
  appendContributorToArtifact: (artifactId: string, userId: string) => void;
  stampContributorOnActiveEdits: (userId: string) => void;
  resetCanvasState: () => void;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
const VIEWPORT_SETTLE_MS = 150;

let viewportSettleTimer: ReturnType<typeof setTimeout> | null = null;

function flushViewportSettledScale(scale: number): void {
  if (viewportSettleTimer) {
    clearTimeout(viewportSettleTimer);
    viewportSettleTimer = null;
  }
  useCanvasStore.setState({ viewportSettledScale: scale });
}

function scheduleViewportSettledScale(scale: number): void {
  if (viewportSettleTimer) clearTimeout(viewportSettleTimer);
  viewportSettleTimer = setTimeout(() => {
    useCanvasStore.setState({ viewportSettledScale: scale });
    viewportSettleTimer = null;
  }, VIEWPORT_SETTLE_MS);
}

// Placeholder palette for thread accents until OQ-01 is resolved.
// Cycles after 8 threads.
const PALETTE = [...THREAD_ACCENT_PALETTE];

const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;

function newCanvasArtifactNodeId() {
  return newId("cano");
}

function newCanvasAssetNodeId() {
  return newId("assetnode");
}

function newCanvasTextLabelId() {
  return newId("ctxt");
}

export const newCardId = () => newId("card");
export const newExplainId = () => newId("explain");
const newThreadId = () => newId("thread");
const newGroupId = () => newId("group");

function layoutStateFrom(state: CanvasState): {
  cards: Record<string, Card>;
  connections: Connection[];
  cardOrder: string[];
} {
  return {
    cards: state.cards,
    connections: state.connections,
    cardOrder: state.cardOrder,
  };
}

const TUNING: ResolvedCanvasTuning = RESOLVED_CANVAS_TUNING;

function syncCardWidthsToTuning(
  cards: Record<string, Card>,
  cardWidth: number,
  emptyHeight: number,
): Record<string, Card> {
  const next = { ...cards };
  for (const id of Object.keys(next)) {
    const c = next[id];
    if (!c) continue;
    if (c.size?.w === cardWidth) continue;
    const h = c.size?.h ?? emptyHeight;
    next[id] = { ...c, size: { w: cardWidth, h } };
  }
  return next;
}

function applyTuningLayoutRepair(
  cards: Record<string, Card>,
  connections: Connection[],
  cardOrder: string[],
  tuning: ResolvedCanvasTuning,
  repairLateralBands: boolean,
): Record<string, Card> {
  if (repairLateralBands) {
    return repairCanvasLayout(cards, connections, cardOrder, tuning);
  }
  return repairVerticalChainsOnly(cards, connections, cardOrder, tuning);
}

function relayoutCardsAfterSizeChange(
  state: CanvasState,
  cardsWithSize: Record<string, Card>,
  cardId: string,
  prev: CardSize | undefined,
  normalized: CardSize,
): Record<string, Card> {
  const tuning = TUNING;

  if (prev?.h != null) {
    const dy = normalized.h - prev.h;
    if (dy === 0) return cardsWithSize;
    if (DEFAULT_CANVAS_TUNING.useDeltaShiftOnResize) {
      return shiftBottomAttachedSubtrees(
        cardsWithSize,
        state.connections,
        cardId,
        dy,
        (childId) => {
          const child = cardsWithSize[childId];
          return child != null && !isCardPending(child.status);
        },
      );
    }
    return relayoutVerticalChainOf(
      { ...layoutStateFrom(state), cards: cardsWithSize },
      cardId,
      tuning,
    );
  }

  return relayoutVerticalChainOf(
    { ...layoutStateFrom(state), cards: cardsWithSize },
    cardId,
    tuning,
  );
}

/** Sync DOM sizes and re-snap the vertical chain under `parentId`. */
function relayoutFollowUpChainFromDom(
  state: Pick<CanvasState, "cards" | "connections" | "cardOrder">,
  parentId: string,
): Record<string, Card> {
  const tuning = TUNING;
  let cards = syncAllCardDomSizes(state.cards, tuning.cardWidth);
  return relayoutVerticalChainOf(
    { ...layoutStateFrom(state as CanvasState), cards },
    parentId,
    tuning,
  );
}

function normalizeLoadedCards(
  cards: Record<string, Card>,
  tuning: ResolvedCanvasTuning = TUNING,
): Record<string, Card> {
  const next = { ...cards };
  for (const [id, card] of Object.entries(next)) {
    let normalized = card;
    if (card.status === "streaming" || card.status === "thinking") {
      normalized = {
        ...normalized,
        status: "done",
        thinkingLabel: undefined,
        pendingFiles: undefined,
      };
    }
    if (normalized.status === "empty" && !normalized.size) {
      normalized = { ...normalized, size: emptyCardSize(tuning) };
    }
    next[id] = normalized;
  }
  return next;
}

function normalizeLoadedArtifactNodes(
  nodes: Record<string, CanvasArtifactNode>,
  sessionArtifacts: Record<string, SessionArtifact>,
): Record<string, CanvasArtifactNode> {
  const next = { ...nodes };
  for (const [id, node] of Object.entries(next)) {
    const art = sessionArtifacts[node.artifactId];
    const bounds = getArtifactBounds(node, art);
    next[id] = { ...node, size: { w: bounds.w, h: bounds.h } };
  }
  return next;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  selectedModel: "claude-sonnet-4-6",
  sessionUsage: { inputTokens: 0, outputTokens: 0 },
  addUsage: (input, output) =>
    set((s) => ({
      sessionUsage: {
        inputTokens: s.sessionUsage.inputTokens + input,
        outputTokens: s.sessionUsage.outputTokens + output,
      },
    })),
  setModel: (model) => set({ selectedModel: model }),

  leftPanelCollapsed: true,
  setLeftPanelCollapsed: (collapsed) => set({ leftPanelCollapsed: collapsed }),
  toggleLeftPanel: () =>
    set((s) => ({ leftPanelCollapsed: !s.leftPanelCollapsed })),

  rightPanelCollapsed: true,
  setRightPanelCollapsed: (collapsed) => set({ rightPanelCollapsed: collapsed }),
  toggleRightPanel: () =>
    set((s) => ({ rightPanelCollapsed: !s.rightPanelCollapsed })),

  uploadedAttachments: [],
  addUploadedAttachment: (attachment) =>
    set((s) => ({
      uploadedAttachments: [...s.uploadedAttachments, attachment],
    })),
  removeUploadedAttachment: (id) =>
    set((s) => ({
      uploadedAttachments: s.uploadedAttachments.filter((a) => a.id !== id),
    })),
  canvasAssets: {},
  canvasAssetNodes: {},
  canvasAssetOrder: [],
  selectedCanvasAssetId: null,
  addCanvasAsset: (asset) =>
    set((state) => ({
      canvasAssets: { ...state.canvasAssets, [asset.id]: asset },
      collaborationHasEdits: true,
    })),
  removeCanvasAsset: (assetId) =>
    set((state) => {
      if (!state.canvasAssets[assetId]) return state;
      const nextAssets = { ...state.canvasAssets };
      delete nextAssets[assetId];
      const nextNodes = { ...state.canvasAssetNodes };
      const removedNodeIds = new Set<string>();
      for (const [nodeId, node] of Object.entries(nextNodes)) {
        if (node.assetId === assetId) {
          delete nextNodes[nodeId];
          removedNodeIds.add(nodeId);
        }
      }
      return {
        canvasAssets: nextAssets,
        canvasAssetNodes: nextNodes,
        canvasAssetOrder: state.canvasAssetOrder.filter(
          (id) => !removedNodeIds.has(id),
        ),
        selectedCanvasAssetId:
          state.selectedCanvasAssetId && removedNodeIds.has(state.selectedCanvasAssetId)
            ? null
            : state.selectedCanvasAssetId,
        collaborationHasEdits: true,
      };
    }),
  spawnCanvasAsset: (assetId, opts) => {
    let nodeId: string | null = null;
    set((state) => {
      const asset = state.canvasAssets[assetId];
      if (!asset) return state;
      const id = newCanvasAssetNodeId();
      nodeId = id;
      const size =
        asset.kind === "image" && asset.aspectRatio
          ? { w: Math.min(480, Math.max(180, asset.width ?? 360)), h: Math.min(480, Math.max(180, asset.width ?? 360)) / asset.aspectRatio }
          : undefined;
      const node: CanvasAssetNode = {
        id,
        assetId,
        position: opts?.position ?? { x: 0, y: 0 },
        ...(size ? { size } : {}),
      };
      return {
        canvasAssetNodes: { ...state.canvasAssetNodes, [id]: node },
        canvasAssetOrder: [...state.canvasAssetOrder, id],
        selectedCanvasAssetId: opts?.focus ? id : state.selectedCanvasAssetId,
        selectedCanvasArtifactId: opts?.focus ? null : state.selectedCanvasArtifactId,
        selectedCanvasTextLabelId: opts?.focus ? null : state.selectedCanvasTextLabelId,
        selectedFamilyRootIds: opts?.focus ? [] : state.selectedFamilyRootIds,
        collaborationHasEdits: true,
      };
    });
    return nodeId;
  },
  moveCanvasAsset: (nodeId, dx, dy) =>
    set((state) => {
      if (dx === 0 && dy === 0) return state;
      const node = state.canvasAssetNodes[nodeId];
      if (!node) return state;
      return {
        canvasAssetNodes: {
          ...state.canvasAssetNodes,
          [nodeId]: {
            ...node,
            position: {
              x: node.position.x + dx,
              y: node.position.y + dy,
            },
          },
        },
        collaborationHasEdits: true,
      };
    }),
  setCanvasAssetSize: (nodeId, size) =>
    set((state) => {
      const node = state.canvasAssetNodes[nodeId];
      if (!node) return state;
      const prev = node.size;
      if (prev && prev.w === size.w && prev.h === size.h) return state;
      return {
        canvasAssetNodes: {
          ...state.canvasAssetNodes,
          [nodeId]: { ...node, size },
        },
        collaborationHasEdits: true,
      };
    }),
  selectCanvasAsset: (nodeId) =>
    set({
      selectedCanvasAssetId: nodeId,
      selectedCanvasArtifactId: null,
      selectedCanvasTextLabelId: null,
      selectedFamilyRootIds: [],
    }),
  removeCanvasAssetNode: (nodeId) =>
    set((state) => {
      if (!state.canvasAssetNodes[nodeId]) return state;
      const next = { ...state.canvasAssetNodes };
      delete next[nodeId];
      return {
        canvasAssetNodes: next,
        canvasAssetOrder: state.canvasAssetOrder.filter((id) => id !== nodeId),
        selectedCanvasAssetId:
          state.selectedCanvasAssetId === nodeId
            ? null
            : state.selectedCanvasAssetId,
        collaborationHasEdits: true,
      };
    }),

  viewMode: "canvas",
  activeThreadId: null,
  canvasPlacementRequest: null,
  activeCanvasPlacement: null,
  requestCanvasPlacement: (tool) =>
    set({ canvasPlacementRequest: tool, viewMode: "canvas" }),
  setViewMode: (mode) =>
    set((state) => {
      if (mode === "chat" && !state.activeThreadId && state.threadOrder[0]) {
        return { viewMode: mode, activeThreadId: state.threadOrder[0] };
      }
      return { viewMode: mode };
    }),
  setActiveThreadId: (threadId) => set({ activeThreadId: threadId }),

  viewport: { x: 0, y: 0, scale: 1 },
  viewportSettledScale: 1,
  cards: {},
  cardOrder: [],
  connections: [],
  threads: {},
  threadOrder: [],
  openArtifactCardId: null,
  openGroupArtifactId: null,
  sessionArtifacts: {},
  openSessionArtifactId: null,
  openSessionArtifactVersionId: null,
  canvasArtifactNodes: {},
  canvasArtifactOrder: [],
  selectedCanvasArtifactId: null,
  canvasTextLabels: {},
  canvasTextLabelOrder: [],
  selectedCanvasTextLabelId: null,
  connectorStyle: "orthogonal",
  canvasBackgroundStyle: "grid",
  canvasTheme: "light",
  soundEnabled: true,
  soundVolume: 0.7,
  canvasPreviewBodyFontId: DEFAULT_BODY_FONT_ID,
  canvasPreviewDisplayFontId: "denton",
  globalOrigin: null,
  undoPast: [],

  spawnMeta: null,
  setSpawnMeta: (meta) => set({ spawnMeta: meta }),
  clearSpawnMeta: () => set({ spawnMeta: null }),
  clearRecentConnection: () => set({ recentConnectionId: null }),
  recentConnectionId: null,

  canvasLoadReveal: null,
  startCanvasLoadReveal: () =>
    set((state) => {
      if (!state.canvasLoadReveal || state.canvasLoadReveal.phase !== "pending") {
        return state;
      }
      return {
        canvasLoadReveal: {
          ...state.canvasLoadReveal,
          phase: "running",
          startedAt: Date.now(),
        },
      };
    }),
  clearCanvasLoadReveal: () => set({ canvasLoadReveal: null }),

  plugDrag: null,
  plugComposerAttachments: {},
  plugComposerAssetAttachments: {},
  artifactPlugConnections: [],

  selectedFamilyRootIds: [],
  collapsedBranchThreadIds: [],
  collapsedCardIds: [],
  groups: {},
  activeGroupId: null,

  setSelectedFamilyRootIds: (rootThreadIds) =>
    set({ selectedFamilyRootIds: rootThreadIds }),

  toggleBranchThreadCollapsed: (branchThreadId) =>
    set((state) => {
      const collapsed = state.collapsedBranchThreadIds.includes(branchThreadId);
      return {
        collapsedBranchThreadIds: collapsed
          ? state.collapsedBranchThreadIds.filter((id) => id !== branchThreadId)
          : [...state.collapsedBranchThreadIds, branchThreadId],
      };
    }),

  toggleCardCollapsed: (cardId) =>
    set((state) => {
      const collapsed = state.collapsedCardIds.includes(cardId);
      return {
        collapsedCardIds: collapsed
          ? state.collapsedCardIds.filter((id) => id !== cardId)
          : [...state.collapsedCardIds, cardId],
      };
    }),

  clearSelection: () =>
    set({
      selectedFamilyRootIds: [],
      selectedCanvasArtifactId: null,
      selectedCanvasAssetId: null,
      selectedCanvasTextLabelId: null,
    }),

  createGroupFromSelection: (label) => {
    const safeLabel =
      typeof label === "string" && label.trim().length > 0
        ? label.trim()
        : undefined;
    let groupId: string | null = null;
    set((state) => {
      if (state.selectedFamilyRootIds.length === 0) return state;
      const id = newGroupId();
      groupId = id;
      const groupCount = Object.keys(state.groups).length;
      const group: BranchGroup = {
        id,
        label: safeLabel ?? `Group ${groupCount + 1}`,
        familyRootThreadIds: [...state.selectedFamilyRootIds],
        summaryMarkdown: null,
      };
      return {
        groups: { ...state.groups, [id]: group },
        activeGroupId: id,
        selectedFamilyRootIds: [],
      };
    });
    return groupId;
  },

  setGroupSummary: (groupId, markdown) =>
    set((state) => {
      const group = state.groups[groupId];
      if (!group) return state;
      const nextGroup: BranchGroup = {
        ...group,
        summaryMarkdown: markdown,
        summaryGeneratedAt: Date.now(),
        summaryContentFingerprint: buildSummaryContentFingerprint(
          state,
          group,
        ),
      };
      return {
        groups: {
          ...state.groups,
          [groupId]: nextGroup,
        },
      };
    }),

  openGroupArtifact: (groupId) =>
    set((state) => {
      const group = state.groups[groupId];
      if (!group?.summaryMarkdown) return state;
      const fingerprint =
        group.summaryContentFingerprint ??
        buildSummaryContentFingerprint(state, group);
      return {
        openGroupArtifactId: groupId,
        openArtifactCardId: null,
        openSessionArtifactId: null,
        openSessionArtifactVersionId: null,
        groups: {
          ...state.groups,
          [groupId]: { ...group, summaryContentFingerprint: fingerprint },
        },
      };
    }),

  closeGroupArtifact: () => set({ openGroupArtifactId: null }),

  removeGroup: (groupId) =>
    set((state) => {
      if (!state.groups[groupId]) return state;
      const next = { ...state.groups };
      delete next[groupId];
      return {
        groups: next,
        activeGroupId:
          state.activeGroupId === groupId ? null : state.activeGroupId,
        openGroupArtifactId:
          state.openGroupArtifactId === groupId
            ? null
            : state.openGroupArtifactId,
      };
    }),

  setActiveGroupId: (groupId) => set({ activeGroupId: groupId }),

  recordUndo: () =>
    set((state) => {
      const snap = graphSnapshotFromState(state);
      const next = [...state.undoPast, snap];
      if (next.length > MAX_UNDO_STACK) next.shift();
      return { undoPast: next };
    }),

  undo: () =>
    set((state) => {
      if (state.undoPast.length === 0) return state;
      const snap = state.undoPast[state.undoPast.length - 1];
      return {
        ...snap,
        undoPast: state.undoPast.slice(0, -1),
      };
    }),

  setConnectorStyle: (style) => set({ connectorStyle: style }),

  setCanvasBackgroundStyle: (style) =>
    set({ canvasBackgroundStyle: style, collaborationHasEdits: true }),

  setCanvasTheme: (theme) =>
    set({ canvasTheme: theme, collaborationHasEdits: true }),

  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

  setSoundVolume: (volume) =>
    set({ soundVolume: Math.max(0, Math.min(1, volume)) }),

  setCanvasPreviewBodyFontId: (id) => set({ canvasPreviewBodyFontId: id }),
  setCanvasPreviewDisplayFontId: (id) => set({ canvasPreviewDisplayFontId: id }),

  relayoutCanvasFromDom: () =>
    set((state) => {
      if (state.cardOrder.length === 0) return state;
      const tuning = TUNING;
      let cards = syncCardWidthsToTuning(
        state.cards,
        tuning.cardWidth,
        tuning.emptyCardHeight,
      );
      cards = syncAllCardDomSizes(cards, tuning.cardWidth);
      cards = applyTuningLayoutRepair(
        cards,
        state.connections,
        state.cardOrder,
        tuning,
        DEFAULT_CANVAS_TUNING.repairLateralBandsOnTune,
      );
      return { cards };
    }),

  relayoutFollowUpChainFromParent: (parentId) =>
    set((state) => {
      if (!state.cards[parentId]) return state;
      return { cards: relayoutFollowUpChainFromDom(state, parentId) };
    }),

  snapFollowUpChildToParent: (parentId) =>
    set((state) => {
      const parent = state.cards[parentId];
      if (!parent) return state;
      const childId = getFollowUpChild(parentId, layoutStateFrom(state));
      if (!childId) return state;
      const child = state.cards[childId];
      if (!child) return state;
      const pos = computeFollowUpPositionFromDom(parentId, parent, TUNING);
      if (
        child.position.x === pos.x &&
        child.position.y === pos.y
      ) {
        return state;
      }
      return {
        cards: {
          ...state.cards,
          [childId]: { ...child, position: pos },
        },
      };
    }),

  setViewport: (next) =>
    set((state) => {
      const viewport = { ...state.viewport, ...next };
      if (next.scale != null && next.scale !== state.viewport.scale) {
        scheduleViewportSettledScale(viewport.scale);
      }
      return { viewport };
    }),

  panBy: (dx, dy) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        x: state.viewport.x + dx,
        y: state.viewport.y + dy,
      },
    })),

  zoomAt: (factor, pivotScreenX, pivotScreenY) =>
    set((state) => {
      const { x, y, scale } = state.viewport;
      const nextScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, scale * factor),
      );
      const k = nextScale / scale;
      // Keep the world point under the cursor fixed while scaling.
      const nx = pivotScreenX - k * (pivotScreenX - x);
      const ny = pivotScreenY - k * (pivotScreenY - y);
      scheduleViewportSettledScale(nextScale);
      return { viewport: { x: nx, y: ny, scale: nextScale } };
    }),

  updateCard: (id, patch) =>
    set((state) => {
      const existing = state.cards[id];
      if (!existing) return state;
      let nextPatch = patch;
      if (
        patch.position &&
        isOriginCardPinned(
          state.cards,
          state.cardOrder,
          id,
          state.globalOrigin,
        )
      ) {
        nextPatch = {
          ...patch,
          position: {
            x: state.globalOrigin!.x,
            y: state.globalOrigin!.y,
          },
        };
      }
      return {
        cards: { ...state.cards, [id]: { ...existing, ...nextPatch } },
      };
    }),

  /**
   * Updates measured size. On height change, shifts only bottom-attached
   * follow-ups by dy (default). Lateral branches and unrelated cards stay fixed.
   * Full chain relayout runs on first measure only, or when the dev toggle
   * "Full chain relayout on resize" is enabled (useDeltaShiftOnResize false).
   */
  setCardSize: (id, size) =>
    set((state) => {
      const existing = state.cards[id];
      if (!existing) return state;
      const tuning = TUNING;
      const normalized = { w: tuning.cardWidth, h: size.h };
      const prev = existing.size;

      // Never shrink cards while a response is loading — height is grow-only until done.
      if (
        isCardPending(existing.status) &&
        prev?.h != null &&
        normalized.h < prev.h
      ) {
        return state;
      }

      if (prev && prev.w === normalized.w && prev.h === normalized.h) {
        return state;
      }

      const cardsWithSize = {
        ...state.cards,
        [id]: { ...existing, size: normalized },
      };

      return {
        cards: relayoutCardsAfterSizeChange(
          state,
          cardsWithSize,
          id,
          prev,
          normalized,
        ),
      };
    }),

  setCanvasArtifactSize: (nodeId, size) =>
    set((state) => {
      const node = state.canvasArtifactNodes[nodeId];
      if (!node) return state;
      const prev = node.size;
      if (prev && prev.w === size.w && prev.h === size.h) return state;
      return {
        canvasArtifactNodes: {
          ...state.canvasArtifactNodes,
          [nodeId]: { ...node, size },
        },
      };
    }),

  moveSubtree: (rootId, dx, dy) =>
    set((state) => {
      if (dx === 0 && dy === 0) return state;
      if (!state.cards[rootId]) return state;
      if (
        isOriginCardPinned(
          state.cards,
          state.cardOrder,
          rootId,
          state.globalOrigin,
        )
      ) {
        return state;
      }

      // BFS over connections to collect the root and all its descendants.
      const subtree = new Set<string>();
      const queue: string[] = [rootId];
      while (queue.length > 0) {
        const id = queue.shift()!;
        if (subtree.has(id)) continue;
        subtree.add(id);
        for (const conn of state.connections) {
          if (conn.from === id && !subtree.has(conn.to)) queue.push(conn.to);
        }
      }

      const nextCards = { ...state.cards };
      subtree.forEach((id) => {
        const c = nextCards[id];
        if (!c) return;
        nextCards[id] = {
          ...c,
          position: { x: c.position.x + dx, y: c.position.y + dy },
        };
      });
      return { cards: nextCards };
    }),

  createRootCard: (position) => {
    const cardId = newCardId();
    set((state) => {
      const undoPast = pushUndoSnapshot(state);
      const tuning = TUNING;
      const isSeed = state.cardOrder.length === 0;
      const threadId = newThreadId();
      const accent = PALETTE[state.threadOrder.length % PALETTE.length];
      const thread: Thread = { id: threadId, accentColour: accent };
      const card: Card = {
        id: cardId,
        threadId,
        question: "",
        answer: "",
        status: "empty",
        position: isSeed
          ? { x: CANVAS_ORIGIN.x, y: CANVAS_ORIGIN.y }
          : position,
        size: emptyCardSize(tuning),
        parentCardId: null,
        parentConversationId: null,
      };
      return {
        undoPast,
        threads: { ...state.threads, [threadId]: thread },
        threadOrder: [...state.threadOrder, threadId],
        cards: { ...state.cards, [cardId]: card },
        cardOrder: [...state.cardOrder, cardId],
        globalOrigin: isSeed
          ? { cardId, x: CANVAS_ORIGIN.x, y: CANVAS_ORIGIN.y }
          : state.globalOrigin,
      };
    });
    get().setSpawnMeta({
      targetId: cardId,
      targetKind: "card",
      kind: "drop",
      createdAt: Date.now(),
    });
    return cardId;
  },

  createArtifactVersion: (artifactId, payload, cardId) => {
    let result = { artifactId: "", versionId: "" };
    set((state) => {
      const normalized = normalizePayloadForRegistry(payload);
      const newKind = payloadToArtifactKind(normalized);
      if (artifactId && state.sessionArtifacts[artifactId]) {
        const existing = state.sessionArtifacts[artifactId];
        if (existing.kind === newKind) {
          const { artifact, versionId } = appendArtifactVersion(
            existing,
            payload,
            cardId,
          );
          result = { artifactId: artifact.id, versionId };
          return {
            sessionArtifacts: {
              ...state.sessionArtifacts,
              [artifact.id]: artifact,
            },
          };
        }
      }
      const created = createSessionArtifactFromPayload(payload, cardId);
      result = {
        artifactId: created.id,
        versionId: created.latestVersionId,
      };
      return {
        sessionArtifacts: {
          ...state.sessionArtifacts,
          [created.id]: created,
        },
      };
    });
    return result;
  },

  createBlankTodoArtifact: (title) => {
    const payload = createEmptyTodoPayload(title);
    const { artifactId, versionId } = get().createArtifactVersion(
      null,
      payload,
      MANUAL_TODO_SOURCE_CARD_ID,
    );
    get().openSessionArtifact(artifactId, versionId);
    get().spawnCanvasArtifact(artifactId, versionId, { focus: true });
    return { artifactId, versionId };
  },

  createVideoArtifactFromUrl: (url, opts) => {
    const title = opts?.title?.trim() || "YouTube video";
    const payload: ArtifactPayload = {
      type: "images",
      title,
      data: {
        items: [
          {
            kind: "youtube",
            url,
            thumb: opts?.thumb,
            title,
          },
        ],
      },
    };
    if (opts?.recordUndo !== false) {
      get().recordUndo();
    }
    const { artifactId, versionId } = get().createArtifactVersion(
      null,
      payload,
      MANUAL_VIDEO_SOURCE_CARD_ID,
    );
    if (opts?.position) {
      get().spawnCanvasArtifact(artifactId, versionId, {
        position: opts.position,
        focus: true,
      });
    } else {
      get().spawnCanvasArtifact(artifactId, versionId, { focus: true });
    }
    return { artifactId, versionId };
  },

  createWebsiteArtifactFromUrl: (url, position, opts) => {
    const domainLabel = domainDisplayLabel(url);
    const payload = createWebsitePayload(url, domainLabel);
    if (opts?.recordUndo !== false) {
      get().recordUndo();
    }
    const { artifactId, versionId } = get().createArtifactVersion(
      null,
      payload,
      MANUAL_WEBSITE_SOURCE_CARD_ID,
    );
    if (position) {
      get().spawnCanvasArtifact(artifactId, versionId, {
        position,
        focus: true,
      });
    } else {
      get().spawnCanvasArtifact(artifactId, versionId, { focus: true });
    }
    get().openSessionArtifact(artifactId, versionId);
    return { artifactId, versionId };
  },

  patchWebsiteArtifactTitle: (artifactId, patch) => {
    set((state) => {
      const art = state.sessionArtifacts[artifactId];
      if (!art || art.kind !== "website") return state;
      const latest = getLatestVersion(art);
      if (!latest || latest.payload.type !== "website") return state;
      const title = patch.title.trim();
      if (!title) return state;
      const updatedPayload: ArtifactPayload = {
        ...latest.payload,
        title,
        data: {
          ...latest.payload.data,
          title,
          faviconUrl: patch.faviconUrl ?? latest.payload.data.faviconUrl,
          previewImageUrl:
            patch.previewImageUrl ?? latest.payload.data.previewImageUrl,
        },
      };
      const versions = art.versions.map((v) =>
        v.id === latest.id ? { ...v, payload: updatedPayload } : v,
      );
      return {
        sessionArtifacts: {
          ...state.sessionArtifacts,
          [artifactId]: {
            ...art,
            title,
            versions,
          },
        },
      };
    });
  },

  patchYoutubeArtifactTitle: (artifactId, versionId, patch) => {
    set((state) => {
      const art = state.sessionArtifacts[artifactId];
      if (!art || art.kind !== "images") return state;
      const version = art.versions.find((v) => v.id === versionId);
      if (!version || version.payload.type !== "images") return state;
      const title = patch.title.trim();
      if (!title) return state;
      const items = version.payload.data.items.map((item, i) =>
        i === 0 && item.kind === "youtube"
          ? {
              ...item,
              title,
              thumb: patch.thumb ?? item.thumb,
            }
          : item,
      );
      const updatedPayload: ArtifactPayload = {
        ...version.payload,
        title,
        data: { ...version.payload.data, items },
      };
      const versions = art.versions.map((v) =>
        v.id === versionId ? { ...v, payload: updatedPayload } : v,
      );
      return {
        sessionArtifacts: {
          ...state.sessionArtifacts,
          [artifactId]: {
            ...art,
            title,
            versions,
          },
        },
      };
    });
  },

  ensurePendingTableArtifact: (cardId) => {
    const card = get().cards[cardId];
    if (!card) return null;

    if (card.outputArtifactId) {
      const art = get().sessionArtifacts[card.outputArtifactId];
      if (art?.kind === "table") {
        const latest = getLatestVersion(art);
        if (latest) {
          get().spawnCanvasArtifact(card.outputArtifactId, latest.id, {
            focus: true,
          });
          return {
            artifactId: card.outputArtifactId,
            versionId: latest.id,
          };
        }
      }
    }

    const title = card.question.slice(0, 48) || "Table";
    const payload: ArtifactPayload = {
      type: "table",
      title,
      data: { columns: [], rows: [] },
    };
    const { artifactId, versionId } = get().createArtifactVersion(
      null,
      payload,
      cardId,
    );
    get().updateCard(cardId, {
      outputArtifactId: artifactId,
      outputArtifactVersionId: versionId,
      responseType: "table",
    });
    get().spawnCanvasArtifact(artifactId, versionId, { focus: true });
    return { artifactId, versionId };
  },

  ensurePendingCustomArtifact: (cardId) => {
    const card = get().cards[cardId];
    if (!card) return null;

    if (card.outputArtifactId) {
      const art = get().sessionArtifacts[card.outputArtifactId];
      if (art?.kind === "custom") {
        const latest = getLatestVersion(art);
        if (latest) {
          get().spawnCanvasArtifact(card.outputArtifactId, latest.id, {
            focus: true,
          });
          return {
            artifactId: card.outputArtifactId,
            versionId: latest.id,
          };
        }
      }
    }

    const title = card.question.slice(0, 48) || "Custom component";
    const payload: ArtifactPayload = {
      type: "custom",
      title,
      data: {
        html: '<div class="pending">Preparing component…</div>',
        css: ".pending { padding: 1rem; color: #6b7280; font: 14px/1.5 system-ui,sans-serif; }",
      },
    };
    const { artifactId, versionId } = get().createArtifactVersion(
      null,
      payload,
      cardId,
    );
    get().updateCard(cardId, {
      outputArtifactId: artifactId,
      outputArtifactVersionId: versionId,
      responseType: "custom",
    });
    get().spawnCanvasArtifact(artifactId, versionId, { focus: true });
    return { artifactId, versionId };
  },

  saveTodoArtifactVersion: (artifactId, payload) => {
    const { versionId } = get().createArtifactVersion(
      artifactId,
      payload,
      MANUAL_TODO_SOURCE_CARD_ID,
    );
    get().setArtifactPanelVersion(versionId);
    const node = findCanvasNodeByArtifactId(
      get().canvasArtifactNodes,
      artifactId,
    );
    if (node) {
      get().setCanvasArtifactVersion(node.id, versionId);
    }
    return { versionId };
  },

  saveMapArtifactVersion: (artifactId, payload) => {
    const { versionId } = get().createArtifactVersion(
      artifactId,
      payload,
      MANUAL_MAP_SOURCE_CARD_ID,
    );
    get().setArtifactPanelVersion(versionId);
    const node = findCanvasNodeByArtifactId(
      get().canvasArtifactNodes,
      artifactId,
    );
    if (node) {
      get().setCanvasArtifactVersion(node.id, versionId);
    }
    return { versionId };
  },

  openSessionArtifact: (artifactId, versionId) =>
    set((state) => {
      const art = state.sessionArtifacts[artifactId];
      if (!art) return state;
      const vid = versionId ?? art.latestVersionId;
      return {
        openSessionArtifactId: artifactId,
        openSessionArtifactVersionId: vid,
        openArtifactCardId: null,
        openGroupArtifactId: null,
      };
    }),

  setArtifactPanelVersion: (versionId) =>
    set({ openSessionArtifactVersionId: versionId }),

  spawnCanvasArtifact: (artifactId, versionId, opts) => {
    let nodeId: string | null = null;
    let isNewNode = false;
    set((state) => {
      const art = state.sessionArtifacts[artifactId];
      if (!art) return state;
      const ver = getVersionById(art, versionId) ?? getLatestVersion(art);
      if (!ver) return state;

      const existing = findCanvasNodeByArtifactId(
        state.canvasArtifactNodes,
        artifactId,
      );
      if (existing) {
        nodeId = existing.id;
        isNewNode = false;
        const nextNode: CanvasArtifactNode = {
          ...existing,
          versionId: ver.id,
          sourceCardId: ver.sourceCardId,
          ...(opts?.position ? { position: opts.position } : {}),
        };
        return {
          canvasArtifactNodes: {
            ...state.canvasArtifactNodes,
            [existing.id]: nextNode,
          },
          selectedCanvasArtifactId: opts?.focus
            ? existing.id
            : state.selectedCanvasArtifactId,
        };
      }

      const id = newCanvasArtifactNodeId();
      nodeId = id;
      isNewNode = true;
      const position =
        opts?.position ??
        computeDefaultSpawnPosition(
          ver.sourceCardId,
          state.canvasArtifactNodes,
          state.cards,
          TUNING,
        );
      const artifactSize =
        art.kind === "table"
          ? { w: CANVAS_TABLE_ARTIFACT_WIDTH, h: TABLE_ARTIFACT_HEIGHT }
          : { w: CANVAS_ARTIFACT_WIDTH, h: DEFAULT_ARTIFACT_HEIGHT };
      const node: CanvasArtifactNode = {
        id,
        artifactId,
        versionId: ver.id,
        sourceCardId: ver.sourceCardId,
        position,
        size: artifactSize,
      };
      return {
        canvasArtifactNodes: { ...state.canvasArtifactNodes, [id]: node },
        canvasArtifactOrder: [...state.canvasArtifactOrder, id],
        selectedCanvasArtifactId: opts?.focus ? id : state.selectedCanvasArtifactId,
      };
    });
    if (nodeId && isNewNode) {
      get().setSpawnMeta({
        targetId: nodeId,
        targetKind: "artifact",
        kind: "popUp",
        createdAt: Date.now(),
      });
    }
    return nodeId;
  },

  ensureCanvasArtifactAt: (artifactId, versionId, position) => {
    return get().spawnCanvasArtifact(artifactId, versionId, { position });
  },

  moveCanvasArtifact: (nodeId, dx, dy) =>
    set((state) => {
      if (dx === 0 && dy === 0) return state;
      const node = state.canvasArtifactNodes[nodeId];
      if (!node) return state;
      return {
        canvasArtifactNodes: {
          ...state.canvasArtifactNodes,
          [nodeId]: {
            ...node,
            position: {
              x: node.position.x + dx,
              y: node.position.y + dy,
            },
          },
        },
      };
    }),

  selectCanvasArtifact: (nodeId) =>
    set({
      selectedCanvasArtifactId: nodeId,
      selectedCanvasTextLabelId: null,
      selectedCanvasAssetId: null,
      selectedFamilyRootIds: [],
    }),

  setCanvasArtifactVersion: (nodeId, versionId) =>
    set((state) => {
      const node = state.canvasArtifactNodes[nodeId];
      if (!node) return state;
      return {
        canvasArtifactNodes: {
          ...state.canvasArtifactNodes,
          [nodeId]: { ...node, versionId },
        },
      };
    }),

  removeCanvasArtifact: (nodeId) =>
    set((state) => {
      if (!state.canvasArtifactNodes[nodeId]) return state;
      const next = { ...state.canvasArtifactNodes };
      delete next[nodeId];
      return {
        canvasArtifactNodes: next,
        canvasArtifactOrder: state.canvasArtifactOrder.filter(
          (id) => id !== nodeId,
        ),
        selectedCanvasArtifactId:
          state.selectedCanvasArtifactId === nodeId
            ? null
            : state.selectedCanvasArtifactId,
        artifactPlugConnections: state.artifactPlugConnections.filter(
          (c) => c.artifactNodeId !== nodeId,
        ),
      };
    }),

  spawnCanvasTextLabel: (position, text = "Text") => {
    const id = newCanvasTextLabelId();
    const label: CanvasTextLabel = {
      id,
      text,
      position: { ...position },
      fontSize: CANVAS_TEXT_LABEL_FONT_SIZE,
    };
    set((state) => ({
      canvasTextLabels: { ...state.canvasTextLabels, [id]: label },
      canvasTextLabelOrder: [...state.canvasTextLabelOrder, id],
      selectedCanvasTextLabelId: id,
      selectedCanvasArtifactId: null,
      selectedCanvasAssetId: null,
      selectedFamilyRootIds: [],
    }));
    return id;
  },

  moveCanvasTextLabel: (nodeId, dx, dy) =>
    set((state) => {
      if (dx === 0 && dy === 0) return state;
      const label = state.canvasTextLabels[nodeId];
      if (!label) return state;
      return {
        canvasTextLabels: {
          ...state.canvasTextLabels,
          [nodeId]: {
            ...label,
            position: {
              x: label.position.x + dx,
              y: label.position.y + dy,
            },
          },
        },
      };
    }),

  updateCanvasTextLabel: (nodeId, text) =>
    set((state) => {
      const label = state.canvasTextLabels[nodeId];
      if (!label) return state;
      return {
        canvasTextLabels: {
          ...state.canvasTextLabels,
          [nodeId]: { ...label, text },
        },
      };
    }),

  setCanvasTextLabelFontSize: (nodeId, fontSize) =>
    set((state) => {
      const label = state.canvasTextLabels[nodeId];
      if (!label) return state;
      const next = clampTextLabelFontSize(fontSize);
      if (label.fontSize === next) return state;
      return {
        canvasTextLabels: {
          ...state.canvasTextLabels,
          [nodeId]: { ...label, fontSize: next },
        },
      };
    }),

  setCanvasTextLabelWidth: (nodeId, width) =>
    set((state) => {
      const label = state.canvasTextLabels[nodeId];
      if (!label) return state;
      const next = clampTextLabelWidth(width);
      if (label.width === next) return state;
      return {
        canvasTextLabels: {
          ...state.canvasTextLabels,
          [nodeId]: { ...label, width: next },
        },
      };
    }),

  removeCanvasTextLabel: (nodeId) =>
    set((state) => {
      if (!state.canvasTextLabels[nodeId]) return state;
      const next = { ...state.canvasTextLabels };
      delete next[nodeId];
      return {
        canvasTextLabels: next,
        canvasTextLabelOrder: state.canvasTextLabelOrder.filter(
          (id) => id !== nodeId,
        ),
        selectedCanvasTextLabelId:
          state.selectedCanvasTextLabelId === nodeId
            ? null
            : state.selectedCanvasTextLabelId,
      };
    }),

  selectCanvasTextLabel: (nodeId) =>
    set({
      selectedCanvasTextLabelId: nodeId,
      selectedCanvasArtifactId: null,
      selectedCanvasAssetId: null,
      selectedFamilyRootIds: [],
    }),

  listSessionArtifacts: (): SessionArtifact[] => {
    const state = get();
    return Object.values(state.sessionArtifacts).sort((a, b) => {
      const av =
        a.versions.find((v) => v.id === a.latestVersionId)?.createdAt ?? 0;
      const bv =
        b.versions.find((v) => v.id === b.latestVersionId)?.createdAt ?? 0;
      return bv - av;
    });
  },

  createFollowUp: (parentId, question, options) => {
    let childId: string | null = null;
    set((state) => {
      const parent = state.cards[parentId];
      if (!parent) return state;
      const undoPast = pushUndoSnapshot(state);
      const id = newCardId();
      childId = id;
      const tuning = TUNING;
      const pos = computeFollowUpPositionFromDom(parentId, parent, tuning);
      const inheritedArtifactId =
        options?.attachedArtifacts?.[0]?.artifactId ??
        parent.outputArtifactId ??
        resolveThreadArtifactId(
          state.cards,
          state.connections,
          state.cardOrder,
          parent.threadId,
        ) ??
        undefined;
      const child: Card = {
        id,
        threadId: parent.threadId,
        question,
        answer: "",
        status: "thinking",
        position: pos,
        size: { w: tuning.cardWidth, h: tuning.fallbackCardHeight },
        parentCardId: parentId,
        parentConversationId: parentId,
        attachedArtifacts: options?.attachedArtifacts,
        attachedAssets: options?.attachedAssets,
        inheritedArtifactId,
        images: options?.pendingImages,
        pendingFiles: options?.pendingFiles,
      };
      const connId = `conn_${parentId}_${id}`;
      const conn: Connection = {
        id: connId,
        from: parentId,
        to: id,
        fromSide: "bottom",
        toSide: "top",
      };
      return {
        undoPast,
        cards: { ...state.cards, [id]: child },
        cardOrder: [...state.cardOrder, id],
        connections: [...state.connections, conn],
        recentConnectionId: connId,
      };
    });
    if (childId) {
      get().setSpawnMeta({
        targetId: childId,
        targetKind: "card",
        kind: "popUp",
        createdAt: Date.now(),
      });
    }
    return childId;
  },

  startPlugDrag: (drag) => set({ plugDrag: drag }),

  updatePlugDrag: (patch) =>
    set((state) => {
      if (!state.plugDrag) return state;
      const next = { ...state.plugDrag, ...patch } as PlugDragState;
      return { plugDrag: next };
    }),

  endPlugDrag: () => set({ plugDrag: null }),

  cancelPlugDrag: () => set({ plugDrag: null }),

  setCardComposerAttachment: (cardId, ref) =>
    set((state) => ({
      plugComposerAttachments: {
        ...state.plugComposerAttachments,
        [cardId]: ref,
      },
    })),

  setCardComposerAssetAttachment: (cardId, ref) =>
    set((state) => ({
      plugComposerAssetAttachments: {
        ...state.plugComposerAssetAttachments,
        [cardId]: ref,
      },
    })),

  addArtifactPlugConnection: (conn) =>
    set((state) => {
      const id = `artplug_${conn.artifactNodeId}_${conn.cardId}`;
      const withoutDup = state.artifactPlugConnections.filter(
        (c) =>
          !(
            c.artifactNodeId === conn.artifactNodeId &&
            c.cardId === conn.cardId
          ),
      );
      return {
        artifactPlugConnections: [
          ...withoutDup,
          { ...conn, id },
        ],
      };
    }),

  createRootCardWithAttachment: (position, ref) => {
    let cardId = "";
    set((state) => {
      const undoPast = pushUndoSnapshot(state);
      const tuning = TUNING;
      const id = newCardId();
      cardId = id;
      const threadId = newThreadId();
      const accent = PALETTE[state.threadOrder.length % PALETTE.length];
      const thread: Thread = { id: threadId, accentColour: accent };
      const card: Card = {
        id,
        threadId,
        question: "",
        answer: "",
        status: "empty",
        position,
        size: emptyCardSize(tuning),
        parentCardId: null,
        parentConversationId: null,
        attachedArtifacts: [ref],
      };
      return {
        undoPast,
        threads: { ...state.threads, [threadId]: thread },
        threadOrder: [...state.threadOrder, threadId],
        cards: { ...state.cards, [id]: card },
        cardOrder: [...state.cardOrder, id],
        plugComposerAttachments: {
          ...state.plugComposerAttachments,
          [id]: ref,
        },
      };
    });
    get().setSpawnMeta({
      targetId: cardId,
      targetKind: "card",
      kind: "drop",
      createdAt: Date.now(),
    });
    return cardId;
  },

  createRootCardWithAssetAttachment: (position, ref) => {
    let cardId = "";
    set((state) => {
      const undoPast = pushUndoSnapshot(state);
      const tuning = TUNING;
      const id = newCardId();
      cardId = id;
      const threadId = newThreadId();
      const accent = PALETTE[state.threadOrder.length % PALETTE.length];
      const thread: Thread = { id: threadId, accentColour: accent };
      const card: Card = {
        id,
        threadId,
        question: "",
        answer: "",
        status: "empty",
        position,
        size: emptyCardSize(tuning),
        parentCardId: null,
        parentConversationId: null,
        attachedAssets: [ref],
      };
      return {
        undoPast,
        threads: { ...state.threads, [threadId]: thread },
        threadOrder: [...state.threadOrder, threadId],
        cards: { ...state.cards, [id]: card },
        cardOrder: [...state.cardOrder, id],
        plugComposerAssetAttachments: {
          ...state.plugComposerAssetAttachments,
          [id]: ref,
        },
      };
    });
    get().setSpawnMeta({
      targetId: cardId,
      targetKind: "card",
      kind: "drop",
      createdAt: Date.now(),
    });
    return cardId;
  },

  createBranchAt: (sourceId, side, position, options) => {
    let branchId: string | null = null;
    set((state) => {
      const source = state.cards[sourceId];
      if (!source) return state;
      const undoPast = pushUndoSnapshot(state);

      const newThreadIdStr = newThreadId();
      const accent =
        PALETTE[state.threadOrder.length % PALETTE.length];
      const thread: Thread = {
        id: newThreadIdStr,
        accentColour: accent,
      };

      const id = newCardId();
      branchId = id;
      const tuning = TUNING;
      const layout = layoutStateFrom(state);
      const drop = resolveBranchDropPosition(
        position.x,
        position.y,
        side,
        source,
        tuning,
      );
      const card: Card = {
        id,
        threadId: newThreadIdStr,
        question: "",
        answer: "",
        status: "empty",
        position: drop,
        size: emptyCardSize(tuning),
        parentCardId: null,
        parentConversationId: sourceId,
        quotedSelection: options?.quotedSelection,
      };

      const connId = `conn_${sourceId}_${id}`;
      const conn: Connection = {
        id: connId,
        from: sourceId,
        to: id,
        fromSide: side,
        toSide: side === "right" ? "left" : "right",
      };

      return {
        undoPast,
        threads: { ...state.threads, [newThreadIdStr]: thread },
        threadOrder: [...state.threadOrder, newThreadIdStr],
        cards: { ...state.cards, [id]: card },
        cardOrder: [...state.cardOrder, id],
        connections: [...state.connections, conn],
        recentConnectionId: connId,
      };
    });
    if (branchId) {
      get().setSpawnMeta({
        targetId: branchId,
        targetKind: "card",
        kind: "popUp",
        createdAt: Date.now(),
      });
    }
    return branchId;
  },

  createBranch: (sourceId, side, options) => {
    let branchId: string | null = null;
    set((state) => {
      const source = state.cards[sourceId];
      if (!source) return state;
      const undoPast = pushUndoSnapshot(state);

      const existingOnSide = state.connections.filter(
        (c) => c.from === sourceId && c.fromSide === side,
      ).length;

      const slot = existingOnSide; // 0 for the first branch on this side
      const tuning = TUNING;
      const layout = layoutStateFrom(state);
      const x = defaultBranchSlotX(side, source, slot, tuning);
      const y = childBandY(layout, sourceId, source, tuning);

      const newThreadIdStr = newThreadId();
      const accent =
        PALETTE[state.threadOrder.length % PALETTE.length];
      const thread: Thread = {
        id: newThreadIdStr,
        accentColour: accent,
      };

      const id = newCardId();
      branchId = id;
      const card: Card = {
        id,
        threadId: newThreadIdStr,
        question: "",
        answer: "",
        status: "empty",
        position: { x, y },
        size: emptyCardSize(tuning),
        parentCardId: null,
        parentConversationId: sourceId,
        quotedSelection: options?.quotedSelection,
      };

      const connId = `conn_${sourceId}_${id}`;
      const conn: Connection = {
        id: connId,
        from: sourceId,
        to: id,
        fromSide: side,
        toSide: side === "right" ? "left" : "right",
      };

      return {
        undoPast,
        threads: { ...state.threads, [newThreadIdStr]: thread },
        threadOrder: [...state.threadOrder, newThreadIdStr],
        cards: { ...state.cards, [id]: card },
        cardOrder: [...state.cardOrder, id],
        connections: [...state.connections, conn],
        recentConnectionId: connId,
      };
    });
    if (branchId) {
      get().setSpawnMeta({
        targetId: branchId,
        targetKind: "card",
        kind: "popUp",
        createdAt: Date.now(),
      });
    }
    return branchId;
  },

  createBranchFromSelection: (sourceId, selectedText, side = "right") => {
    return get().createBranch(sourceId, side, {
      quotedSelection: selectedText,
    });
  },

  addAnswerExplain: (cardId, explain) =>
    set((state) => {
      const card = state.cards[cardId];
      if (!card) return state;
      const existing = card.answerExplains ?? [];
      return {
        cards: {
          ...state.cards,
          [cardId]: {
            ...card,
            answerExplains: [...existing, explain],
          },
        },
      };
    }),

  updateAnswerExplain: (cardId, explainId, patch) =>
    set((state) => {
      const card = state.cards[cardId];
      if (!card?.answerExplains?.length) return state;
      const next = card.answerExplains.map((e) =>
        e.id === explainId ? { ...e, ...patch } : e,
      );
      return {
        cards: {
          ...state.cards,
          [cardId]: { ...card, answerExplains: next },
        },
      };
    }),

  deleteFromCard: (cardId) =>
    set((state) => {
      if (!state.cards[cardId]) return state;
      const undoPast = pushUndoSnapshot(state);

      const toDelete = collectSubtreeIds(state.connections, cardId);
      const nextCards = { ...state.cards };
      for (const id of toDelete) {
        delete nextCards[id];
      }

      const nextConnections = state.connections.filter(
        (c) => !toDelete.has(c.from) && !toDelete.has(c.to),
      );
      const nextCardOrder = state.cardOrder.filter((id) => !toDelete.has(id));

      const remainingThreadIds = new Set(
        Object.values(nextCards).map((c) => c.threadId),
      );
      const nextThreads = { ...state.threads };
      for (const tid of Object.keys(nextThreads)) {
        if (!remainingThreadIds.has(tid)) delete nextThreads[tid];
      }
      const nextThreadOrder = state.threadOrder.filter((tid) =>
        remainingThreadIds.has(tid),
      );

      let activeThreadId = state.activeThreadId;
      if (activeThreadId && !remainingThreadIds.has(activeThreadId)) {
        activeThreadId = pickDefaultThreadId({
          cards: nextCards,
          connections: nextConnections,
          cardOrder: nextCardOrder,
          threads: nextThreads,
          threadOrder: nextThreadOrder,
        });
      }

      let openArtifactCardId = state.openArtifactCardId;
      if (openArtifactCardId && toDelete.has(openArtifactCardId)) {
        openArtifactCardId = null;
      }

      return {
        undoPast,
        cards: nextCards,
        cardOrder: nextCardOrder,
        connections: nextConnections,
        threads: nextThreads,
        threadOrder: nextThreadOrder,
        activeThreadId,
        openArtifactCardId,
        artifactPlugConnections: state.artifactPlugConnections.filter(
          (c) => !toDelete.has(c.cardId),
        ),
      };
    }),

  openArtifact: (cardId) =>
    set((state) => {
      if (!state.cards[cardId]) return state;
      return { openArtifactCardId: cardId, openGroupArtifactId: null };
    }),

  closeArtifact: () =>
    set({
      openArtifactCardId: null,
      openGroupArtifactId: null,
      openSessionArtifactId: null,
      openSessionArtifactVersionId: null,
    }),

  collaborationHasEdits: false,
  canvasReadOnly: false,

  setCanvasReadOnly: (readOnly) => set({ canvasReadOnly: readOnly }),

  setCollaborationHasEdits: (value) => set({ collaborationHasEdits: value }),

  appendContributorToCard: (cardId, userId) =>
    set((state) => {
      const card = state.cards[cardId];
      if (!card) return state;
      const existing = card.contributorIds ?? [];
      if (existing.includes(userId)) return state;
      return {
        collaborationHasEdits: true,
        cards: {
          ...state.cards,
          [cardId]: {
            ...card,
            contributorIds: [...existing, userId],
          },
        },
      };
    }),

  appendContributorToArtifact: (artifactId, userId) =>
    set((state) => {
      const artifact = state.sessionArtifacts[artifactId];
      if (!artifact) return state;
      const versions = artifact.versions.map((v) => {
        if (v.createdByUserId) return v;
        return { ...v, createdByUserId: userId };
      });
      const latest = versions.find((v) => v.id === artifact.latestVersionId);
      if (latest && !latest.createdByUserId) {
        const idx = versions.findIndex((v) => v.id === latest.id);
        versions[idx] = { ...latest, createdByUserId: userId };
      }
      return {
        collaborationHasEdits: true,
        sessionArtifacts: {
          ...state.sessionArtifacts,
          [artifactId]: { ...artifact, versions },
        },
      };
    }),

  stampContributorOnActiveEdits: (userId) => {
    const state = get();
    state.setCollaborationHasEdits(true);
  },

  getCanvasSnapshotSource: (): CanvasSnapshotSource => {
    const state = get();
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
      canvasTheme: state.canvasTheme,
      selectedModel: state.selectedModel,
      viewMode: state.viewMode,
      sessionArtifacts: state.sessionArtifacts,
      canvasAssets: state.canvasAssets,
      canvasArtifactNodes: state.canvasArtifactNodes,
      canvasArtifactOrder: state.canvasArtifactOrder,
      canvasAssetNodes: state.canvasAssetNodes,
      canvasAssetOrder: state.canvasAssetOrder,
      canvasTextLabels: state.canvasTextLabels,
      canvasTextLabelOrder: state.canvasTextLabelOrder,
      uploadedAttachments: state.uploadedAttachments,
      collaborationHasEdits: state.collaborationHasEdits,
    };
  },

  resetCanvasState: () => {
    flushViewportSettledScale(1);
    set({
      viewport: { x: 0, y: 0, scale: 1 },
      viewportSettledScale: 1,
      cards: {},
      cardOrder: [],
      connections: [],
      threads: {},
      threadOrder: [],
      groups: {},
      sessionArtifacts: {},
      canvasAssets: {},
      canvasArtifactNodes: {},
      canvasArtifactOrder: [],
      canvasAssetNodes: {},
      canvasAssetOrder: [],
      canvasTextLabels: {},
      canvasTextLabelOrder: [],
      uploadedAttachments: [],
      globalOrigin: null,
      activeThreadId: null,
      openArtifactCardId: null,
      openGroupArtifactId: null,
      openSessionArtifactId: null,
      openSessionArtifactVersionId: null,
      selectedCanvasArtifactId: null,
      selectedCanvasAssetId: null,
      selectedCanvasTextLabelId: null,
      selectedFamilyRootIds: [],
      activeGroupId: null,
      undoPast: [],
      plugDrag: null,
      plugComposerAttachments: {},
      plugComposerAssetAttachments: {},
      artifactPlugConnections: [],
      canvasPlacementRequest: null,
      activeCanvasPlacement: null,
      viewMode: "canvas",
      collaborationHasEdits: false,
      canvasReadOnly: false,
      canvasLoadReveal: null,
    });
  },

  hydrateFromSnapshot: (snapshot, options) =>
    set((state) => {
      const snapshotNorm = normalizeCanvasSnapshot(snapshot);
      const applyViewport = options?.applyViewport !== false;
      const viewport = applyViewport
        ? { ...snapshotNorm.viewport }
        : { ...state.viewport };
      flushViewportSettledScale(viewport.scale);
      const sessionArtifacts = JSON.parse(
        JSON.stringify(snapshotNorm.sessionArtifacts),
      ) as Record<string, SessionArtifact>;
      const normalized = normalizeLoadedCards({ ...snapshotNorm.cards });
      const connections = snapshotNorm.connections.map((c) => ({ ...c }));
      const cardOrder = [...snapshotNorm.cardOrder];
      const defaultTuning = TUNING;
      const repaired = repairLoadedArtifactState(
        normalized,
        sessionArtifacts,
        connections,
        cardOrder,
      );
      // Re-snap vertical chains so any stale gap from older snapshots
      // collapses back to the canonical FOLLOW_UP_GAP. Lateral branches are
      // not touched (absolute-positions policy).
      const cards = repairVerticalChainsOnly(
        repaired.cards,
        connections,
        cardOrder,
        defaultTuning,
      );
      const canvasArtifactNodes = normalizeLoadedArtifactNodes(
        { ...snapshotNorm.canvasArtifactNodes },
        repaired.sessionArtifacts,
      );
      const firstCardId = cardOrder[0];
      const firstCard = firstCardId ? cards[firstCardId] : undefined;
      const globalOrigin =
        firstCardId && firstCard
          ? {
              cardId: firstCardId,
              x: firstCard.position.x,
              y: firstCard.position.y,
            }
          : null;

      const canvasArtifactOrder = [...(snapshotNorm.canvasArtifactOrder ?? [])];
      let canvasLoadReveal: CanvasLoadReveal | null = null;
      if (options?.canvasReveal) {
        const plan = buildCanvasLoadRevealPlan({
          cards,
          cardOrder,
          connections,
          threads: snapshotNorm.threads,
          threadOrder: snapshotNorm.threadOrder,
          canvasArtifactNodes,
          canvasArtifactOrder,
        });
        if (plan.unitCount > 0) {
          canvasLoadReveal = {
            phase: "pending",
            delays: plan.delays,
            maxDelayMs: plan.maxDelayMs,
            startedAt: 0,
          };
        }
      }

      return {
        viewport,
        viewportSettledScale: viewport.scale,
        cards,
        cardOrder,
        connections,
        threads: { ...snapshotNorm.threads },
        threadOrder: [...snapshotNorm.threadOrder],
        groups: { ...snapshotNorm.groups },
        connectorStyle: snapshotNorm.connectorStyle,
        canvasBackgroundStyle: snapshotNorm.canvasBackgroundStyle,
        canvasTheme: snapshotNorm.canvasTheme,
        selectedModel: snapshotNorm.selectedModel,
        viewMode: snapshotNorm.viewMode,
        sessionArtifacts: repaired.sessionArtifacts,
        canvasAssets: { ...snapshotNorm.canvasAssets },
        canvasArtifactNodes,
        canvasArtifactOrder,
        canvasAssetNodes: { ...snapshotNorm.canvasAssetNodes },
        canvasAssetOrder: [...(snapshotNorm.canvasAssetOrder ?? [])],
        canvasLoadReveal,
        activeThreadId: snapshotNorm.threadOrder[0] ?? null,
        openArtifactCardId: null,
        openGroupArtifactId: null,
        openSessionArtifactId: null,
        openSessionArtifactVersionId: null,
        selectedCanvasArtifactId: null,
        selectedCanvasAssetId: null,
        canvasTextLabels: { ...snapshotNorm.canvasTextLabels },
        canvasTextLabelOrder: [...(snapshotNorm.canvasTextLabelOrder ?? [])],
        selectedCanvasTextLabelId: null,
        selectedFamilyRootIds: [],
        activeGroupId: null,
        undoPast: [],
        globalOrigin,
        uploadedAttachments: JSON.parse(
          JSON.stringify(snapshotNorm.uploadedAttachments),
        ) as UploadedAttachment[],
        plugDrag: null,
        plugComposerAttachments: {},
        plugComposerAssetAttachments: {},
        artifactPlugConnections: [],
        canvasPlacementRequest: null,
        activeCanvasPlacement: null,
        collaborationHasEdits: snapshotNorm.collaborationHasEdits ?? false,
      };
    }),
}));

function pushUndoSnapshot(state: CanvasState): GraphSnapshot[] {
  const snap = graphSnapshotFromState(state);
  const next = [...state.undoPast, snap];
  if (next.length > MAX_UNDO_STACK) next.shift();
  return next;
}

// Selector helpers.
export const selectAccentForCard = (cardId: string) =>
  (state: CanvasState): string | undefined => {
    const card = state.cards[cardId];
    if (!card) return undefined;
    return state.threads[card.threadId]?.accentColour;
  };
