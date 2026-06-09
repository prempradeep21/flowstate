"use client";

import type {
  ArtifactPayload,
  EmittedArtifact,
  ResponseType,
} from "@/lib/artifactTypes";
import { payloadToArtifactKind } from "@/lib/artifactTypes";
import { getPermissionCopy } from "@/lib/artifactSpawnPriority";
import { SPAWN_ANIMATION_MS } from "@/lib/motion/variants";
import { STREET_VIEW_ARTIFACT_HEIGHT } from "@/lib/streetViewArtifact";
import type {
  CanvasSnapshot,
  CanvasSnapshotSource,
} from "@/lib/canvasSnapshot";
import { normalizeCanvasSnapshot } from "@/lib/canvasSnapshot";
import { resolveBackgroundForTheme } from "@/lib/canvasBackgroundTheme";
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
  clampArtifactSize,
  DEFAULT_ARTIFACT_HEIGHT,
  REPO_ARTIFACT_HEIGHT,
  REPO_ARTIFACT_WIDTH,
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
  computeArtifactSpawnPosition,
  findCanvasNodeByArtifactId,
  pickAlternateSpawnSide,
  type ArtifactSpawnSide,
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
import {
  CALENDAR_ARTIFACT_HEIGHT,
  MANUAL_CALENDAR_SOURCE_CARD_ID,
} from "@/lib/calendarArtifact";
import { MANUAL_MAP_SOURCE_CARD_ID } from "@/lib/mapArtifact";
import {
  MANUAL_TIMELINE_SOURCE_CARD_ID,
  TIMELINE_ARTIFACT_HEIGHT,
  TIMELINE_ARTIFACT_WIDTH,
} from "@/lib/timelineArtifact";
import {
  createEmptyTodoPayload,
  MANUAL_TODO_SOURCE_CARD_ID,
} from "@/lib/todoArtifact";
import {
  createRepoPayload,
  MANUAL_REPO_SOURCE_CARD_ID,
  mergeRepoExplorer,
} from "@/lib/repoArtifact";
import {
  createWebsitePayload,
  MANUAL_WEBSITE_SOURCE_CARD_ID,
} from "@/lib/websiteArtifact";
import {
  createEmbedPayload,
  EMBED_LOADING_HEIGHT,
  EMBED_LOADING_WIDTH,
  MANUAL_EMBED_SOURCE_CARD_ID,
} from "@/lib/embedArtifact";
import { matchEmbedProviderId } from "@/lib/embed/registry";
import type { EmbedResolveResult } from "@/lib/embed/types";
import type { RepoExplorerData } from "@/lib/github/types";
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

export interface CanvasSkill {
  id: string;
  canvasId: string;
  ownerId: string;
  title: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  publicUrl: string;
  createdAt: number;
}

export interface CanvasSkillNode {
  id: string;
  skillId: string;
  position: { x: number; y: number };
  size?: CardSize;
}

export interface AttachedSkillRef {
  skillId: string;
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
  attachedSkills?: AttachedSkillRef[];
  inheritedArtifactId?: string;
  pendingFiles?: PendingFileAttachment[];
  contributorIds?: string[];
  answerExplains?: AnswerExplain[];
  quotedSelection?: string;
  /** Artifacts emitted during the current chat turn (processed on done). */
  pendingEmittedArtifacts?: EmittedArtifact[];
}

export interface FollowUpOptions {
  attachedArtifacts?: AttachedArtifactRef[];
  attachedAssets?: AttachedAssetRef[];
  attachedSkills?: AttachedSkillRef[];
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
    }
  | {
      kind: "skill";
      skillNodeId: string;
      skillId: string;
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

/** Dashed plug link from a canvas skill node to a question card composer. */
export interface SkillPlugConnection {
  id: string;
  skillNodeId: string;
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

export type CanvasBackgroundStyle =
  | "grid"
  | "ambient-gradient"
  | "sky"
  | "network"
  | "rising-sun"
  | "gradient-grid"
  | "neat-gradient";

export const CANVAS_BACKGROUND_STYLES: readonly CanvasBackgroundStyle[] = [
  "grid",
  "ambient-gradient",
  "sky",
  "network",
  "rising-sun",
  "gradient-grid",
  "neat-gradient",
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

export interface ArtifactPermissionPreview {
  payload: ArtifactPayload;
  copy: string;
  status: "pending" | "declining";
  kind: import("@/lib/artifactTypes").ArtifactKind;
  title: string;
}

export interface CanvasArtifactNode {
  id: string;
  artifactId: string;
  versionId: string;
  sourceCardId: string;
  position: { x: number; y: number };
  size?: CardSize;
  /** Permission gate — artifact not materialized until user approves. */
  permissionPreview?: ArtifactPermissionPreview;
  /** Play exit animation before removing the node. */
  isExiting?: boolean;
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

export type CanvasGifCategory = "gif" | "sticker";

export interface CanvasGifNode {
  id: string;
  url: string;
  previewUrl: string;
  title: string;
  category: CanvasGifCategory;
  aspectRatio: number;
  sourceId: string;
  position: { x: number; y: number };
  size?: CardSize;
}

export type SpawnCanvasGifInput = Pick<
  CanvasGifNode,
  "url" | "previewUrl" | "title" | "category" | "aspectRatio" | "sourceId"
>;

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
  canvasGifNodes: Record<string, CanvasGifNode>;
  canvasGifOrder: string[];
  selectedCanvasGifId: string | null;
  gifPickerOpen: boolean;
  setGifPickerOpen: (open: boolean) => void;
  imagePlacementAssetId: string | null;
  requestImagePlacement: (assetId: string) => void;
  gifPlacementRequest: SpawnCanvasGifInput | null;
  requestGifPlacement: (input: SpawnCanvasGifInput) => void;
  spawnCanvasGif: (
    input: SpawnCanvasGifInput,
    opts?: { position?: { x: number; y: number }; focus?: boolean },
  ) => string | null;
  moveCanvasGif: (nodeId: string, dx: number, dy: number) => void;
  setCanvasGifSize: (nodeId: string, size: CardSize) => void;
  selectCanvasGif: (nodeId: string | null) => void;
  removeCanvasGifNode: (nodeId: string) => void;
  addCanvasSkill: (skill: CanvasSkill) => void;
  removeCanvasSkill: (skillId: string) => void;
  spawnCanvasSkill: (
    skillId: string,
    opts?: { position?: { x: number; y: number }; focus?: boolean },
  ) => string | null;
  moveCanvasSkill: (nodeId: string, dx: number, dy: number) => void;
  selectCanvasSkill: (nodeId: string | null) => void;
  removeCanvasSkillNode: (nodeId: string) => void;

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
  canvasSkills: Record<string, CanvasSkill>;
  canvasSkillNodes: Record<string, CanvasSkillNode>;
  canvasSkillOrder: string[];
  selectedCanvasSkillId: string | null;
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
  /** Artifact plug connection id to play draw-in animation. */
  recentArtifactPlugId: string | null;
  clearRecentArtifactPlug: () => void;

  /** Staggered slide-in after canvas hydrate (login / reload / switch). */
  canvasLoadReveal: CanvasLoadReveal | null;
  startCanvasLoadReveal: () => void;
  clearCanvasLoadReveal: () => void;

  plugDrag: PlugDragState | null;
  plugComposerAttachments: Record<string, AttachedArtifactRef>;
  plugComposerAssetAttachments: Record<string, AttachedAssetRef>;
  plugComposerSkillAttachments: Record<string, AttachedSkillRef>;
  artifactPlugConnections: ArtifactPlugConnection[];
  skillPlugConnections: SkillPlugConnection[];

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
  createRootCardWithSkillAttachment: (
    position: { x: number; y: number },
    ref: AttachedSkillRef,
  ) => string;
  setCardComposerAttachment: (
    cardId: string,
    ref: AttachedArtifactRef,
  ) => void;
  setCardComposerAssetAttachment: (
    cardId: string,
    ref: AttachedAssetRef,
  ) => void;
  setCardComposerSkillAttachment: (
    cardId: string,
    ref: AttachedSkillRef,
  ) => void;
  addArtifactPlugConnection: (conn: {
    artifactNodeId: string;
    cardId: string;
    fromSide: PlugSide;
    toSide: PlugSide;
  }) => void;
  addSkillPlugConnection: (conn: {
    skillNodeId: string;
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
  createRepoArtifactFromUrl: (
    url: string,
    opts?: {
      position?: { x: number; y: number };
      recordUndo?: boolean;
    },
  ) => { artifactId: string; versionId: string };
  createEmbedArtifactFromUrl: (
    url: string,
    opts?: {
      position?: { x: number; y: number };
      size?: { w: number; h: number };
      recordUndo?: boolean;
    },
  ) => { artifactId: string; versionId: string };
  patchRepoArtifactExplorer: (
    artifactId: string,
    patch: Partial<RepoExplorerData>,
  ) => void;
  patchWebsiteArtifactTitle: (
    artifactId: string,
    patch: { title: string; faviconUrl?: string; previewImageUrl?: string },
  ) => void;
  patchYoutubeArtifactTitle: (
    artifactId: string,
    versionId: string,
    patch: { title: string; thumb?: string },
  ) => void;
  patchEmbedArtifact: (
    artifactId: string,
    versionId: string,
    patch: EmbedResolveResult | { status: "loading" },
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
  saveCalendarArtifactVersion: (
    artifactId: string,
    payload: Extract<ArtifactPayload, { type: "calendar" }>,
  ) => { versionId: string };
  saveTimelineArtifactVersion: (
    artifactId: string,
    payload: Extract<ArtifactPayload, { type: "timeline" }>,
  ) => { versionId: string };
  openSessionArtifact: (artifactId: string, versionId?: string) => void;
  setArtifactPanelVersion: (versionId: string) => void;
  listSessionArtifacts: () => SessionArtifact[];

  spawnCanvasArtifact: (
    artifactId: string,
    versionId: string,
    opts?: {
      position?: { x: number; y: number };
      size?: { w: number; h: number };
      focus?: boolean;
      payload?: ArtifactPayload;
      side?: ArtifactSpawnSide;
    },
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
  wireArtifactToSourceCard: (
    artifactNodeId: string,
    cardId: string,
  ) => void;
  spawnPermissionPreview: (
    cardId: string,
    payload: ArtifactPayload,
    opts?: { copy?: string; position?: { x: number; y: number } },
  ) => string | null;
  approvePermissionPreview: (nodeId: string) => void;
  declinePermissionPreview: (nodeId: string) => void;

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

function newCanvasSkillNodeId() {
  return newId("skillnode");
}

function newCanvasTextLabelId() {
  return newId("ctxt");
}

function newCanvasGifNodeId() {
  return newId("gifnode");
}

export const newCardId = () => newId("card");
export const newExplainId = () => newId("explain");
const newThreadId = () => newId("thread");
const newGroupId = () => newId("group");

/** Empty home card at the global origin — shared by hydrate + first canvas seed. */
function createLandingSeedCard(tuning: ResolvedCanvasTuning, threadIndex: number) {
  const cardId = newCardId();
  const threadId = newThreadId();
  const accent = PALETTE[threadIndex % PALETTE.length];
  const thread: Thread = { id: threadId, accentColour: accent };
  const card: Card = {
    id: cardId,
    threadId,
    question: "",
    answer: "",
    status: "empty",
    position: { x: CANVAS_ORIGIN.x, y: CANVAS_ORIGIN.y },
    size: emptyCardSize(tuning),
    parentCardId: null,
    parentConversationId: null,
  };
  return { cardId, card, thread, threadId };
}

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
        selectedCanvasSkillId: opts?.focus ? null : state.selectedCanvasSkillId,
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
      selectedCanvasSkillId: null,
      selectedCanvasTextLabelId: null,
      selectedCanvasGifId: null,
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

  canvasGifNodes: {},
  canvasGifOrder: [],
  selectedCanvasGifId: null,
  gifPickerOpen: false,
  setGifPickerOpen: (open) => set({ gifPickerOpen: open }),
  imagePlacementAssetId: null,
  requestImagePlacement: (assetId) =>
    set({ imagePlacementAssetId: assetId, viewMode: "canvas" }),
  gifPlacementRequest: null,
  requestGifPlacement: (input) =>
    set({
      gifPlacementRequest: input,
      gifPickerOpen: false,
      viewMode: "canvas",
    }),
  spawnCanvasGif: (input, opts) => {
    let nodeId: string | null = null;
    set((state) => {
      const id = newCanvasGifNodeId();
      nodeId = id;
      const aspect =
        input.aspectRatio && input.aspectRatio > 0 ? input.aspectRatio : 1;
      const w = Math.min(360, Math.max(120, 240));
      const node: CanvasGifNode = {
        id,
        url: input.url,
        previewUrl: input.previewUrl,
        title: input.title,
        category: input.category,
        aspectRatio: aspect,
        sourceId: input.sourceId,
        position: opts?.position ?? { x: 0, y: 0 },
        size: { w, h: w / aspect },
      };
      return {
        canvasGifNodes: { ...state.canvasGifNodes, [id]: node },
        canvasGifOrder: [...state.canvasGifOrder, id],
        selectedCanvasGifId: opts?.focus ? id : state.selectedCanvasGifId,
        selectedCanvasArtifactId: opts?.focus ? null : state.selectedCanvasArtifactId,
        selectedCanvasAssetId: opts?.focus ? null : state.selectedCanvasAssetId,
        selectedCanvasSkillId: opts?.focus ? null : state.selectedCanvasSkillId,
        selectedCanvasTextLabelId: opts?.focus ? null : state.selectedCanvasTextLabelId,
        selectedFamilyRootIds: opts?.focus ? [] : state.selectedFamilyRootIds,
        collaborationHasEdits: true,
      };
    });
    return nodeId;
  },
  moveCanvasGif: (nodeId, dx, dy) =>
    set((state) => {
      if (dx === 0 && dy === 0) return state;
      const node = state.canvasGifNodes[nodeId];
      if (!node) return state;
      return {
        canvasGifNodes: {
          ...state.canvasGifNodes,
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
  setCanvasGifSize: (nodeId, size) =>
    set((state) => {
      const node = state.canvasGifNodes[nodeId];
      if (!node) return state;
      const prev = node.size;
      if (prev && prev.w === size.w && prev.h === size.h) return state;
      return {
        canvasGifNodes: {
          ...state.canvasGifNodes,
          [nodeId]: { ...node, size },
        },
        collaborationHasEdits: true,
      };
    }),
  selectCanvasGif: (nodeId) =>
    set({
      selectedCanvasGifId: nodeId,
      selectedCanvasArtifactId: null,
      selectedCanvasAssetId: null,
      selectedCanvasSkillId: null,
      selectedCanvasTextLabelId: null,
      selectedFamilyRootIds: [],
    }),
  removeCanvasGifNode: (nodeId) =>
    set((state) => {
      if (!state.canvasGifNodes[nodeId]) return state;
      const next = { ...state.canvasGifNodes };
      delete next[nodeId];
      return {
        canvasGifNodes: next,
        canvasGifOrder: state.canvasGifOrder.filter((id) => id !== nodeId),
        selectedCanvasGifId:
          state.selectedCanvasGifId === nodeId
            ? null
            : state.selectedCanvasGifId,
        collaborationHasEdits: true,
      };
    }),

  canvasSkills: {},
  canvasSkillNodes: {},
  canvasSkillOrder: [],
  selectedCanvasSkillId: null,
  addCanvasSkill: (skill) =>
    set((state) => ({
      canvasSkills: { ...state.canvasSkills, [skill.id]: skill },
      collaborationHasEdits: true,
    })),
  removeCanvasSkill: (skillId) =>
    set((state) => {
      if (!state.canvasSkills[skillId]) return state;
      const nextSkills = { ...state.canvasSkills };
      delete nextSkills[skillId];
      const nextNodes = { ...state.canvasSkillNodes };
      const removedNodeIds = new Set<string>();
      for (const [nodeId, node] of Object.entries(nextNodes)) {
        if (node.skillId === skillId) {
          delete nextNodes[nodeId];
          removedNodeIds.add(nodeId);
        }
      }
      return {
        canvasSkills: nextSkills,
        canvasSkillNodes: nextNodes,
        canvasSkillOrder: state.canvasSkillOrder.filter(
          (id) => !removedNodeIds.has(id),
        ),
        selectedCanvasSkillId:
          state.selectedCanvasSkillId && removedNodeIds.has(state.selectedCanvasSkillId)
            ? null
            : state.selectedCanvasSkillId,
        skillPlugConnections: state.skillPlugConnections.filter(
          (c) => !removedNodeIds.has(c.skillNodeId),
        ),
        collaborationHasEdits: true,
      };
    }),
  spawnCanvasSkill: (skillId, opts) => {
    let nodeId: string | null = null;
    set((state) => {
      const skill = state.canvasSkills[skillId];
      if (!skill) return state;
      const id = newCanvasSkillNodeId();
      nodeId = id;
      const node: CanvasSkillNode = {
        id,
        skillId,
        position: opts?.position ?? { x: 0, y: 0 },
      };
      return {
        canvasSkillNodes: { ...state.canvasSkillNodes, [id]: node },
        canvasSkillOrder: [...state.canvasSkillOrder, id],
        selectedCanvasSkillId: opts?.focus ? id : state.selectedCanvasSkillId,
        selectedCanvasArtifactId: opts?.focus ? null : state.selectedCanvasArtifactId,
        selectedCanvasAssetId: opts?.focus ? null : state.selectedCanvasAssetId,
        selectedCanvasTextLabelId: opts?.focus ? null : state.selectedCanvasTextLabelId,
        selectedFamilyRootIds: opts?.focus ? [] : state.selectedFamilyRootIds,
        collaborationHasEdits: true,
      };
    });
    return nodeId;
  },
  moveCanvasSkill: (nodeId, dx, dy) =>
    set((state) => {
      if (dx === 0 && dy === 0) return state;
      const node = state.canvasSkillNodes[nodeId];
      if (!node) return state;
      return {
        canvasSkillNodes: {
          ...state.canvasSkillNodes,
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
  selectCanvasSkill: (nodeId) =>
    set({
      selectedCanvasSkillId: nodeId,
      selectedCanvasArtifactId: null,
      selectedCanvasAssetId: null,
      selectedCanvasTextLabelId: null,
      selectedCanvasGifId: null,
      selectedFamilyRootIds: [],
    }),
  removeCanvasSkillNode: (nodeId) =>
    set((state) => {
      if (!state.canvasSkillNodes[nodeId]) return state;
      const next = { ...state.canvasSkillNodes };
      delete next[nodeId];
      return {
        canvasSkillNodes: next,
        canvasSkillOrder: state.canvasSkillOrder.filter((id) => id !== nodeId),
        selectedCanvasSkillId:
          state.selectedCanvasSkillId === nodeId
            ? null
            : state.selectedCanvasSkillId,
        skillPlugConnections: state.skillPlugConnections.filter(
          (c) => c.skillNodeId !== nodeId,
        ),
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
  canvasTheme: "dark",
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
  clearRecentArtifactPlug: () => set({ recentArtifactPlugId: null }),
  recentArtifactPlugId: null,

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
  plugComposerSkillAttachments: {},
  artifactPlugConnections: [],
  skillPlugConnections: [],

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
      selectedCanvasGifId: null,
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
    set((state) => ({
      canvasTheme: theme,
      canvasBackgroundStyle: resolveBackgroundForTheme(
        state.canvasBackgroundStyle,
        theme,
      ),
      collaborationHasEdits: true,
    })),

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
    const tuning = TUNING;
    let cardId = "";
    set((state) => {
      const undoPast = pushUndoSnapshot(state);
      const isSeed = state.cardOrder.length === 0;
      const seed = createLandingSeedCard(tuning, state.threadOrder.length);
      cardId = seed.cardId;
      const placedCard = isSeed ? seed.card : { ...seed.card, position };
      return {
        undoPast,
        threads: { ...state.threads, [seed.threadId]: seed.thread },
        threadOrder: [...state.threadOrder, seed.threadId],
        cards: { ...state.cards, [seed.cardId]: placedCard },
        cardOrder: [...state.cardOrder, seed.cardId],
        globalOrigin: isSeed
          ? {
              cardId: seed.cardId,
              x: CANVAS_ORIGIN.x,
              y: CANVAS_ORIGIN.y,
            }
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

  createRepoArtifactFromUrl: (url, opts) => {
    const payload = createRepoPayload(url);
    if (!payload) {
      throw new Error("Invalid GitHub repository URL");
    }
    if (opts?.recordUndo !== false) {
      get().recordUndo();
    }
    const { artifactId, versionId } = get().createArtifactVersion(
      null,
      payload,
      MANUAL_REPO_SOURCE_CARD_ID,
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

  createEmbedArtifactFromUrl: (url, opts) => {
    const provider = matchEmbedProviderId(url) ?? "reddit";
    const payload = createEmbedPayload(url, provider);
    if (opts?.recordUndo !== false) {
      get().recordUndo();
    }
    const { artifactId, versionId } = get().createArtifactVersion(
      null,
      payload,
      MANUAL_EMBED_SOURCE_CARD_ID,
    );
    const spawnOpts = {
      position: opts?.position,
      focus: true,
      size: opts?.size ?? {
        w: EMBED_LOADING_WIDTH,
        h: EMBED_LOADING_HEIGHT,
      },
    };
    get().spawnCanvasArtifact(artifactId, versionId, spawnOpts);
    get().openSessionArtifact(artifactId, versionId);
    return { artifactId, versionId };
  },

  patchRepoArtifactExplorer: (artifactId, patch) => {
    set((state) => {
      const art = state.sessionArtifacts[artifactId];
      if (!art || art.kind !== "repo") return state;
      const latest = getLatestVersion(art);
      if (!latest || latest.payload.type !== "repo") return state;

      const explorer = mergeRepoExplorer(latest.payload.data.explorer, patch);
      const displayTitle =
        explorer.overview.data?.name ??
        explorer.overview.data?.fullName ??
        latest.payload.data.displayTitle;
      const updatedPayload: ArtifactPayload = {
        ...latest.payload,
        title: displayTitle,
        data: {
          ...latest.payload.data,
          displayTitle,
          explorer,
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
            title: displayTitle,
            versions,
          },
        },
      };
    });
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

  patchEmbedArtifact: (artifactId, versionId, patch) => {
    set((state) => {
      const art = state.sessionArtifacts[artifactId];
      if (!art || art.kind !== "embed") return state;
      const version = art.versions.find((v) => v.id === versionId);
      if (!version || version.payload.type !== "embed") return state;

      const prev = version.payload.data;
      const isLoading = patch.status === "loading";
      const title =
        !isLoading && "title" in patch && patch.title.trim()
          ? patch.title.trim()
          : prev.title;
      const updatedPayload: ArtifactPayload = {
        ...version.payload,
        title,
        data: isLoading
          ? { ...prev, status: "loading" }
          : {
              url: patch.url,
              provider: patch.provider,
              title,
              domainLabel: patch.fallback?.domainLabel ?? prev.domainLabel,
              embedWidth: patch.embedWidth,
              embedHeight: patch.embedHeight,
              iframeSrc: patch.iframeSrc,
              embedHtml: patch.embedHtml,
              status: patch.status,
              fallback: patch.fallback ?? prev.fallback,
            },
      };
      const versions = art.versions.map((v) =>
        v.id === versionId ? { ...v, payload: updatedPayload } : v,
      );

      let canvasArtifactNodes = state.canvasArtifactNodes;
      if (!isLoading && patch.status === "ready") {
        const node = findCanvasNodeByArtifactId(
          state.canvasArtifactNodes,
          artifactId,
        );
        if (node) {
          const nextSize = clampArtifactSize(patch.embedWidth, patch.embedHeight);
          canvasArtifactNodes = {
            ...state.canvasArtifactNodes,
            [node.id]: {
              ...node,
              size: nextSize,
            },
          };
        }
      }

      return {
        sessionArtifacts: {
          ...state.sessionArtifacts,
          [artifactId]: {
            ...art,
            title,
            versions,
          },
        },
        canvasArtifactNodes,
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

  saveCalendarArtifactVersion: (artifactId, payload) => {
    const { versionId } = get().createArtifactVersion(
      artifactId,
      payload,
      MANUAL_CALENDAR_SOURCE_CARD_ID,
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

  saveTimelineArtifactVersion: (artifactId, payload) => {
    const { versionId } = get().createArtifactVersion(
      artifactId,
      payload,
      MANUAL_TIMELINE_SOURCE_CARD_ID,
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
        computeArtifactSpawnPosition(
          ver.sourceCardId,
          state.canvasArtifactNodes,
          state.cards,
          {
            payload: opts?.payload ?? ver.payload,
            side: opts?.side,
            sessionArtifacts: state.sessionArtifacts,
          },
          TUNING,
        );
      const artifactSize =
        opts?.size ??
        (art.kind === "table"
          ? { w: CANVAS_TABLE_ARTIFACT_WIDTH, h: TABLE_ARTIFACT_HEIGHT }
          : art.kind === "repo"
            ? { w: REPO_ARTIFACT_WIDTH, h: REPO_ARTIFACT_HEIGHT }
            : art.kind === "embed" && ver.payload.type === "embed"
              ? clampArtifactSize(
                  ver.payload.data.embedWidth,
                  ver.payload.data.embedHeight,
                )
              : art.kind === "streetview"
                ? {
                    w: CANVAS_ARTIFACT_WIDTH,
                    h: STREET_VIEW_ARTIFACT_HEIGHT,
                  }
                : art.kind === "calendar"
                  ? {
                      w: CANVAS_ARTIFACT_WIDTH,
                      h: CALENDAR_ARTIFACT_HEIGHT,
                    }
                  : art.kind === "timeline"
                    ? {
                        w: TIMELINE_ARTIFACT_WIDTH,
                        h: TIMELINE_ARTIFACT_HEIGHT,
                      }
                    : { w: CANVAS_ARTIFACT_WIDTH, h: DEFAULT_ARTIFACT_HEIGHT });
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
      selectedCanvasSkillId: null,
      selectedCanvasGifId: null,
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
      selectedCanvasGifId: null,
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
      selectedCanvasSkillId: null,
      selectedCanvasGifId: null,
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
        attachedSkills: options?.attachedSkills,
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

  setCardComposerSkillAttachment: (cardId, ref) =>
    set((state) => ({
      plugComposerSkillAttachments: {
        ...state.plugComposerSkillAttachments,
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
        recentArtifactPlugId: id,
      };
    }),

  addSkillPlugConnection: (conn) =>
    set((state) => {
      const id = `skillplug_${conn.skillNodeId}_${conn.cardId}`;
      const withoutDup = state.skillPlugConnections.filter(
        (c) =>
          !(
            c.skillNodeId === conn.skillNodeId &&
            c.cardId === conn.cardId
          ),
      );
      return {
        skillPlugConnections: [
          ...withoutDup,
          { ...conn, id },
        ],
      };
    }),

  wireArtifactToSourceCard: (artifactNodeId, cardId) => {
    get().addArtifactPlugConnection({
      artifactNodeId,
      cardId,
      fromSide: "left",
      toSide: "right",
    });
  },

  spawnPermissionPreview: (cardId, payload, opts) => {
    const card = get().cards[cardId];
    if (!card) return null;

    const kind = payloadToArtifactKind(payload);
    const placeName =
      payload.type === "map" || payload.type === "streetview"
        ? payload.data.place.label ?? payload.data.place.name
        : undefined;
    const copy = opts?.copy ?? getPermissionCopy(kind, placeName);

    const position =
      opts?.position ??
      computeArtifactSpawnPosition(
        cardId,
        get().canvasArtifactNodes,
        get().cards,
        {
          payload,
          side: pickAlternateSpawnSide(
            cardId,
            get().canvasArtifactNodes,
            get().cards,
            TUNING,
          ),
          sessionArtifacts: get().sessionArtifacts,
        },
        TUNING,
      );

    const nodeId = newCanvasArtifactNodeId();
    const node: CanvasArtifactNode = {
      id: nodeId,
      artifactId: "",
      versionId: "",
      sourceCardId: cardId,
      position,
      size:
        kind === "table"
          ? { w: CANVAS_TABLE_ARTIFACT_WIDTH, h: TABLE_ARTIFACT_HEIGHT }
          : { w: CANVAS_ARTIFACT_WIDTH, h: DEFAULT_ARTIFACT_HEIGHT },
      permissionPreview: {
        payload,
        copy,
        status: "pending",
        kind,
        title: payload.title,
      },
    };

    set((state) => ({
      canvasArtifactNodes: { ...state.canvasArtifactNodes, [nodeId]: node },
      canvasArtifactOrder: [...state.canvasArtifactOrder, nodeId],
      selectedCanvasArtifactId: nodeId,
    }));

    get().setSpawnMeta({
      targetId: nodeId,
      targetKind: "artifact",
      kind: "popUp",
      createdAt: Date.now(),
    });
    return nodeId;
  },

  approvePermissionPreview: (nodeId) => {
    const node = get().canvasArtifactNodes[nodeId];
    if (!node?.permissionPreview) return;

    const { payload } = node.permissionPreview;
    const cardId = node.sourceCardId;
    const { artifactId, versionId } = get().createArtifactVersion(
      null,
      payload,
      cardId,
    );

    set((state) => ({
      canvasArtifactNodes: {
        ...state.canvasArtifactNodes,
        [nodeId]: {
          ...node,
          artifactId,
          versionId,
          permissionPreview: undefined,
        },
      },
    }));
  },

  declinePermissionPreview: (nodeId) => {
    const node = get().canvasArtifactNodes[nodeId];
    if (!node?.permissionPreview || node.isExiting) return;

    set((state) => ({
      canvasArtifactNodes: {
        ...state.canvasArtifactNodes,
        [nodeId]: {
          ...node,
          permissionPreview: {
            ...node.permissionPreview!,
            status: "declining",
          },
          isExiting: true,
        },
      },
    }));

    window.setTimeout(() => {
      get().removeCanvasArtifact(nodeId);
    }, SPAWN_ANIMATION_MS);
  },

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

  createRootCardWithSkillAttachment: (position, ref) => {
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
        attachedSkills: [ref],
      };
      return {
        undoPast,
        threads: { ...state.threads, [threadId]: thread },
        threadOrder: [...state.threadOrder, threadId],
        cards: { ...state.cards, [id]: card },
        cardOrder: [...state.cardOrder, id],
        plugComposerSkillAttachments: {
          ...state.plugComposerSkillAttachments,
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
        skillPlugConnections: state.skillPlugConnections.filter(
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
      canvasSkills: state.canvasSkills,
      canvasSkillNodes: state.canvasSkillNodes,
      canvasSkillOrder: state.canvasSkillOrder,
      canvasTextLabels: state.canvasTextLabels,
      canvasTextLabelOrder: state.canvasTextLabelOrder,
      canvasGifNodes: state.canvasGifNodes,
      canvasGifOrder: state.canvasGifOrder,
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
      canvasSkills: {},
      canvasSkillNodes: {},
      canvasSkillOrder: [],
      canvasTextLabels: {},
      canvasTextLabelOrder: [],
      canvasGifNodes: {},
      canvasGifOrder: [],
      uploadedAttachments: [],
      globalOrigin: null,
      activeThreadId: null,
      openArtifactCardId: null,
      openGroupArtifactId: null,
      openSessionArtifactId: null,
      openSessionArtifactVersionId: null,
      selectedCanvasArtifactId: null,
      selectedCanvasAssetId: null,
      selectedCanvasSkillId: null,
      selectedCanvasTextLabelId: null,
      selectedCanvasGifId: null,
      selectedFamilyRootIds: [],
      activeGroupId: null,
      undoPast: [],
      plugDrag: null,
      plugComposerAttachments: {},
      plugComposerAssetAttachments: {},
      plugComposerSkillAttachments: {},
      artifactPlugConnections: [],
      skillPlugConnections: [],
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
      let cards = repairVerticalChainsOnly(
        repaired.cards,
        connections,
        cardOrder,
        defaultTuning,
      );
      let threads = { ...snapshotNorm.threads };
      let threadOrder = [...snapshotNorm.threadOrder];
      let nextCardOrder = cardOrder;

      if (nextCardOrder.length === 0) {
        const seed = createLandingSeedCard(defaultTuning, threadOrder.length);
        cards = { ...cards, [seed.cardId]: seed.card };
        nextCardOrder = [seed.cardId];
        threads = { ...threads, [seed.threadId]: seed.thread };
        threadOrder = [...threadOrder, seed.threadId];
      }

      const canvasArtifactNodes = normalizeLoadedArtifactNodes(
        { ...snapshotNorm.canvasArtifactNodes },
        repaired.sessionArtifacts,
      );
      const firstCardId = nextCardOrder[0];
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
          cardOrder: nextCardOrder,
          connections,
          threads,
          threadOrder,
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
        cardOrder: nextCardOrder,
        connections,
        threads,
        threadOrder,
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
        canvasSkills: { ...snapshotNorm.canvasSkills },
        canvasSkillNodes: { ...snapshotNorm.canvasSkillNodes },
        canvasSkillOrder: [...(snapshotNorm.canvasSkillOrder ?? [])],
        canvasLoadReveal,
        activeThreadId: threadOrder[0] ?? null,
        openArtifactCardId: null,
        openGroupArtifactId: null,
        openSessionArtifactId: null,
        openSessionArtifactVersionId: null,
        selectedCanvasArtifactId: null,
        selectedCanvasAssetId: null,
        canvasTextLabels: { ...snapshotNorm.canvasTextLabels },
        canvasTextLabelOrder: [...(snapshotNorm.canvasTextLabelOrder ?? [])],
        canvasGifNodes: { ...snapshotNorm.canvasGifNodes },
        canvasGifOrder: [...(snapshotNorm.canvasGifOrder ?? [])],
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
        plugComposerSkillAttachments: {},
        artifactPlugConnections: [],
        skillPlugConnections: [],
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
