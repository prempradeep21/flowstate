import type { ArtifactPayload } from "@/lib/artifactTypes";
import { createCatalogAudioPayload } from "@/lib/audioArtifact";
import { getCanvasAssetBounds } from "@/lib/canvasAssetBounds";
import {
  buildCanvasSnapshot,
  type CanvasSnapshot,
} from "@/lib/canvasSnapshot";
import {
  getArtifactBounds,
  getDefaultArtifactSize,
} from "@/lib/canvasNodeBounds";
import { EMBED_LOADING_HEIGHT } from "@/lib/embedArtifact";
import { parseGoogleDriveUrl } from "@/lib/google/parseDriveUrl";
import { createRepoPayload } from "@/lib/repoArtifact";
import { createWebsitePayload } from "@/lib/websiteArtifact";
import {
  SDLC_INPUTS,
  type SdlcInputDefinition,
} from "@/lib/mobileSdlc/sdlcInputs";
import {
  SDLC_GUIDANCE_Y,
  SDLC_INPUT_GAP_Y,
  SDLC_INPUT_START_Y,
  SDLC_LABEL_Y,
  SDLC_PHASES,
  SDLC_SKILL_NODE_HEIGHT,
  SDLC_SANDBOX_CANVAS_ID,
  SDLC_SANDBOX_SOURCE_CARD_ID,
  sdlcThreadAccent,
  sdlcThreadId,
} from "@/lib/mobileSdlc/sdlcPhases";
import {
  createSessionArtifactFromPayload,
  getLatestVersion,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import {
  MANUAL_STICKY_NOTE_SOURCE_CARD_ID,
  STICKY_NOTE_ARTIFACT_HEIGHT,
  STICKY_NOTE_ARTIFACT_WIDTH,
} from "@/lib/stickyNoteArtifact";
import type {
  CanvasArtifactNode,
  CanvasAsset,
  CanvasAssetNode,
  CanvasBackgroundStyle,
  CanvasSkill,
  CanvasSkillNode,
  CanvasTextLabel,
  CanvasTheme,
  Card,
  Thread,
} from "@/lib/store";
import { domainDisplayLabel } from "@/lib/urlDetection";
import {
  REPO_ARTIFACT_HEIGHT,
  REPO_ARTIFACT_WIDTH,
} from "@/lib/repoArtifactLayout";

const REPO_W = REPO_ARTIFACT_WIDTH;
const REPO_H = REPO_ARTIFACT_HEIGHT;
const EMBED_W = 520;
const EMBED_H = EMBED_LOADING_HEIGHT;

function sandboxRootCard(): Card {
  return {
    id: SDLC_SANDBOX_SOURCE_CARD_ID,
    threadId: sdlcThreadId("charter"),
    question: "Mobile SDLC Sandbox",
    answer: "Inputs-only workspace — PRD through ship. Artifacts come in Phase 2.",
    status: "done",
    position: { x: 160, y: -240 },
    parentCardId: null,
    parentConversationId: null,
  };
}

function createSandboxAsset(input: SdlcInputDefinition): CanvasAsset {
  const publicUrl = input.samplePath ?? "";
  return {
    id: `sdlc-asset-${input.id}`,
    canvasId: SDLC_SANDBOX_CANVAS_ID,
    ownerId: "sandbox",
    name: input.fileName ?? input.title,
    mimeType: input.mimeType ?? "application/octet-stream",
    sizeBytes: 0,
    storagePath: publicUrl,
    publicUrl,
    kind: input.assetKind ?? "document",
    ...(input.assetKind === "image"
      ? { aspectRatio: 4 / 3, width: 360, height: 270 }
      : {}),
    createdAt: Date.now(),
  };
}

function createSandboxSkill(input: SdlcInputDefinition): CanvasSkill {
  const publicUrl = input.samplePath ?? "";
  return {
    id: "sdlc-skill-mobile-sdlc",
    canvasId: SDLC_SANDBOX_CANVAS_ID,
    ownerId: "sandbox",
    title: input.title,
    fileName: input.fileName ?? "mobile-sdlc.md",
    mimeType: "text/markdown",
    sizeBytes: 0,
    storagePath: publicUrl,
    publicUrl,
    createdAt: Date.now(),
  };
}

function createFigmaEmbedPayload(
  url: string,
  title: string,
): Extract<ArtifactPayload, { type: "embed" }> {
  const iframeSrc = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;
  return {
    type: "embed",
    title,
    data: {
      url,
      provider: "figma",
      title,
      domainLabel: "Figma",
      embedWidth: EMBED_W,
      embedHeight: EMBED_H,
      iframeSrc,
      status: "ready",
    },
  };
}

function createSandboxGoogleDocPayload(
  input: SdlcInputDefinition,
): Extract<ArtifactPayload, { type: "google-doc" }> | null {
  if (!input.url) return null;
  const parsed = parseGoogleDriveUrl(input.url);
  if (!parsed) return null;
  return {
    type: "google-doc",
    title: input.title,
    data: {
      url: parsed.url,
      fileId: parsed.fileId,
      fileKind: parsed.fileKind,
      title: input.title,
      status: "ready",
      extractedText: input.extractedText,
      extractedTextLength: input.extractedText?.length,
    },
  };
}

function createStickyNotePayload(
  input: SdlcInputDefinition,
): Extract<ArtifactPayload, { type: "stickynote" }> {
  return {
    type: "stickynote",
    title: input.title,
    data: {
      text: input.stickyText ?? "",
      colorId: input.stickyColor ?? "chalk",
    },
  };
}

function payloadForInput(input: SdlcInputDefinition): ArtifactPayload | null {
  switch (input.kind) {
    case "google-doc":
      return createSandboxGoogleDocPayload(input);
    case "embed-figma":
      return input.url
        ? createFigmaEmbedPayload(input.url, input.title)
        : null;
    case "repo":
      return input.url ? createRepoPayload(input.url) : null;
    case "website": {
      if (!input.url) return null;
      const label = domainDisplayLabel(input.url);
      return createWebsitePayload(input.url, label);
    }
    case "audio":
      return createCatalogAudioPayload(
        input.title,
        input.audioDurationMs ?? 60_000,
        input.audioSeed ?? 0,
      );
    case "stickynote":
      return createStickyNotePayload(input);
    default:
      return null;
  }
}

function sourceCardIdForInput(input: SdlcInputDefinition): string {
  if (input.kind === "stickynote") return MANUAL_STICKY_NOTE_SOURCE_CARD_ID;
  return SDLC_SANDBOX_SOURCE_CARD_ID;
}

function estimateInputSize(
  input: SdlcInputDefinition,
  artifact?: SessionArtifact,
  asset?: CanvasAsset,
): { w: number; h: number } {
  if (input.kind === "asset" && asset) {
    return getCanvasAssetBounds({}, asset);
  }
  if (input.kind === "skill") {
    return { w: 280, h: 120 };
  }
  if (artifact) {
    const ver = getLatestVersion(artifact);
    return getDefaultArtifactSize(artifact.kind, ver?.payload);
  }
  if (input.kind === "embed-figma") return { w: EMBED_W, h: EMBED_H };
  if (input.kind === "repo") return { w: REPO_W, h: REPO_H };
  if (input.kind === "stickynote") {
    return { w: STICKY_NOTE_ARTIFACT_WIDTH, h: STICKY_NOTE_ARTIFACT_HEIGHT };
  }
  return { w: 520, h: 400 };
}

export function buildMobileSdlcSnapshot(options?: {
  canvasTheme?: CanvasTheme;
  canvasBackgroundStyle?: CanvasBackgroundStyle;
}): CanvasSnapshot {
  const cards: Record<string, Card> = {
    [SDLC_SANDBOX_SOURCE_CARD_ID]: sandboxRootCard(),
  };
  const cardOrder = [SDLC_SANDBOX_SOURCE_CARD_ID];
  const threads: Record<string, Thread> = {};
  const threadOrder: string[] = [];
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];
  const canvasAssets: Record<string, CanvasAsset> = {};
  const canvasAssetNodes: Record<string, CanvasAssetNode> = {};
  const canvasAssetOrder: string[] = [];
  const canvasSkills: Record<string, CanvasSkill> = {};
  const canvasSkillNodes: Record<string, CanvasSkillNode> = {};
  const canvasSkillOrder: string[] = [];
  const canvasTextLabels: Record<string, CanvasTextLabel> = {};
  const canvasTextLabelOrder: string[] = [];

  for (const phase of SDLC_PHASES) {
    const threadId = sdlcThreadId(phase.id);
    threads[threadId] = {
      id: threadId,
      accentColour: sdlcThreadAccent(phase.threadColorIndex),
    };
    threadOrder.push(threadId);

    const labelId = `sdlc-label-${phase.id}`;
    canvasTextLabels[labelId] = {
      id: labelId,
      text: `${phase.label}\n${phase.subtitle}`,
      position: { x: phase.originX, y: SDLC_LABEL_Y },
      fontSize: 28,
      width: 440,
    };
    canvasTextLabelOrder.push(labelId);

    const guidanceId = `sdlc-guidance-${phase.id}`;
    const guidanceArtifact = createSessionArtifactFromPayload(
      {
        type: "stickynote",
        title: "Tip",
        data: { text: phase.guidanceNote, colorId: "haiti" },
      },
      MANUAL_STICKY_NOTE_SOURCE_CARD_ID,
    );
    const guidanceStableId = `sdlc-art-guidance-${phase.id}`;
    sessionArtifacts[guidanceStableId] = {
      ...guidanceArtifact,
      id: guidanceStableId,
    };
    const guidanceNodeId = `sdlc-node-guidance-${phase.id}`;
    canvasArtifactNodes[guidanceNodeId] = {
      id: guidanceNodeId,
      artifactId: guidanceStableId,
      versionId: guidanceArtifact.latestVersionId,
      sourceCardId: MANUAL_STICKY_NOTE_SOURCE_CARD_ID,
      position: { x: phase.originX, y: SDLC_GUIDANCE_Y },
      size: {
        w: STICKY_NOTE_ARTIFACT_WIDTH,
        h: STICKY_NOTE_ARTIFACT_HEIGHT,
      },
    };
    canvasArtifactOrder.push(guidanceNodeId);

    let cursorY = SDLC_INPUT_START_Y;
    const phaseInputs = SDLC_INPUTS.filter((i) => i.phaseId === phase.id);

    for (const input of phaseInputs) {
      if (input.kind === "asset") {
        const asset = createSandboxAsset(input);
        canvasAssets[asset.id] = asset;
        const size = estimateInputSize(input, undefined, asset);
        const nodeId = `sdlc-node-${input.id}`;
        canvasAssetNodes[nodeId] = {
          id: nodeId,
          assetId: asset.id,
          position: { x: phase.originX, y: cursorY },
          size: { w: size.w, h: size.h },
        };
        canvasAssetOrder.push(nodeId);
        cursorY += size.h + SDLC_INPUT_GAP_Y;
        continue;
      }

      if (input.kind === "skill") {
        const skill = createSandboxSkill(input);
        canvasSkills[skill.id] = skill;
        const nodeId = `sdlc-node-${input.id}`;
        canvasSkillNodes[nodeId] = {
          id: nodeId,
          skillId: skill.id,
          position: { x: phase.originX, y: cursorY },
        };
        canvasSkillOrder.push(nodeId);
        cursorY += SDLC_SKILL_NODE_HEIGHT + SDLC_INPUT_GAP_Y;
        continue;
      }

      const payload = payloadForInput(input);
      if (!payload) continue;

      const artifact = createSessionArtifactFromPayload(
        payload,
        sourceCardIdForInput(input),
      );
      const stableId = `sdlc-art-${input.id}`;
      const stableArtifact: SessionArtifact = { ...artifact, id: stableId };
      sessionArtifacts[stableId] = stableArtifact;

      const size = estimateInputSize(input, stableArtifact);
      const nodeId = `sdlc-node-${input.id}`;
      canvasArtifactNodes[nodeId] = {
        id: nodeId,
        artifactId: stableId,
        versionId: stableArtifact.latestVersionId,
        sourceCardId: sourceCardIdForInput(input),
        position: { x: phase.originX, y: cursorY },
        size: { w: size.w, h: size.h },
      };
      canvasArtifactOrder.push(nodeId);
      cursorY += size.h + SDLC_INPUT_GAP_Y;
    }
  }

  return buildCanvasSnapshot({
    viewport: { x: 0, y: 0, scale: 1 },
    cards,
    cardOrder,
    connections: [],
    threads,
    threadOrder,
    groups: {},
    connectorStyle: "orthogonal",
    canvasBackgroundStyle: options?.canvasBackgroundStyle ?? "grid",
    canvasTheme: options?.canvasTheme ?? "light",
    selectedModel: "claude-sonnet-4-6",
    viewMode: "canvas",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
    canvasAssets,
    canvasAssetNodes,
    canvasAssetOrder,
    canvasSkills,
    canvasSkillNodes,
    canvasSkillOrder,
    canvasTextLabels,
    canvasTextLabelOrder,
    uploadedAttachments: [],
    collaborationHasEdits: false,
  });
}

/** World-space center of sandbox content for viewport fit. */
export function mobileSdlcContentCenter(snapshot: CanvasSnapshot): {
  x: number;
  y: number;
} {
  const rects: { x: number; y: number; w: number; h: number }[] = [];

  for (const id of snapshot.cardOrder) {
    const card = snapshot.cards[id];
    if (!card || card.id === SDLC_SANDBOX_SOURCE_CARD_ID) continue;
    rects.push({ x: card.position.x, y: card.position.y, w: 420, h: 200 });
  }

  for (const id of snapshot.canvasArtifactOrder ?? []) {
    const node = snapshot.canvasArtifactNodes?.[id];
    if (!node) continue;
    const art = snapshot.sessionArtifacts[node.artifactId];
    const { w, h } = getArtifactBounds(node, art);
    rects.push({ x: node.position.x, y: node.position.y, w, h });
  }

  for (const id of snapshot.canvasAssetOrder ?? []) {
    const node = snapshot.canvasAssetNodes?.[id];
    if (!node) continue;
    const asset = snapshot.canvasAssets?.[node.assetId];
    const { w, h } = getCanvasAssetBounds(node, asset);
    rects.push({ x: node.position.x, y: node.position.y, w, h });
  }

  for (const id of snapshot.canvasSkillOrder ?? []) {
    const node = snapshot.canvasSkillNodes?.[id];
    if (!node) continue;
    rects.push({ x: node.position.x, y: node.position.y, w: 280, h: 120 });
  }

  if (rects.length === 0) {
    return { x: 160, y: SDLC_INPUT_START_Y };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.w);
    maxY = Math.max(maxY, rect.y + rect.h);
  }

  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}

export function mobileSdlcContentBounds(snapshot: CanvasSnapshot): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} | null {
  const rects: { x: number; y: number; w: number; h: number }[] = [];

  for (const id of snapshot.canvasArtifactOrder ?? []) {
    const node = snapshot.canvasArtifactNodes?.[id];
    if (!node) continue;
    const art = snapshot.sessionArtifacts[node.artifactId];
    const { w, h } = getArtifactBounds(node, art);
    rects.push({ x: node.position.x, y: node.position.y, w, h });
  }
  for (const id of snapshot.canvasAssetOrder ?? []) {
    const node = snapshot.canvasAssetNodes?.[id];
    if (!node) continue;
    const asset = snapshot.canvasAssets?.[node.assetId];
    const { w, h } = getCanvasAssetBounds(node, asset);
    rects.push({ x: node.position.x, y: node.position.y, w, h });
  }

  if (rects.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.w);
    maxY = Math.max(maxY, rect.y + rect.h);
  }

  return { minX, minY, maxX, maxY };
}
