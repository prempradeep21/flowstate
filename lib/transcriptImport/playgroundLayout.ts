import type { ArtifactPayload } from "@/lib/artifactTypes";
import {
  CANVAS_ARTIFACT_WIDTH,
  CARD_WIDTH,
} from "@/lib/canvasNodeBounds";
import { THREAD_ACCENT_PALETTE } from "@/lib/design/tokens";
import {
  createSessionArtifactFromPayload,
  getLatestVersion,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import { createWebsitePayload } from "@/lib/websiteArtifact";
import type {
  BranchGroup,
  CanvasArtifactNode,
  Card,
  Connection,
  Thread,
} from "@/lib/store";
import { domainDisplayLabel } from "@/lib/urlDetection";

export const CARD_GAP_X = 160;
export const CARD_STEP_X = CARD_WIDTH + CARD_GAP_X;
/** Horizontal gap from conversation card to its linked artifact. */
export const ARTIFACT_OFFSET_X = 640;
/** Vertical gap between stacked artifacts beside one card. */
export const ARTIFACT_STACK_Y = 280;
/** Extra lane for generated output artifacts (timeline, table). */
export const OUTPUT_ARTIFACT_LANE_X = 960;
/** Minimum gap between input website / link artifacts. */
export const INPUT_ARTIFACT_GAP = 300;
export const INPUT_ARTIFACT_STEP = CANVAS_ARTIFACT_WIDTH + INPUT_ARTIFACT_GAP;

export const ORIGIN_X = 100;
/** Fixed layout height so horizontal connectors stay level across a row. */
export const CONVERSATION_CARD_LAYOUT_H = 200;

/** Vertical offset between stacked playground conversation imports. */
export const PLAYGROUND_SECTION_GAP_Y = 640;

export interface TranscriptImportCanvasSection {
  cards: Record<string, Card>;
  cardOrder: string[];
  connections: Connection[];
  threads: Record<string, Thread>;
  threadOrder: string[];
  groups: Record<string, BranchGroup>;
  sessionArtifacts: Record<string, SessionArtifact>;
  canvasArtifactNodes: Record<string, CanvasArtifactNode>;
  canvasArtifactOrder: string[];
  contentCenter: { x: number; y: number };
}

export function thread(id: string, accentIndex: number): Thread {
  return {
    id,
    accentColour: THREAD_ACCENT_PALETTE[accentIndex % THREAD_ACCENT_PALETTE.length],
  };
}

export function convCard(
  id: string,
  threadId: string,
  title: string,
  summary: string,
  position: { x: number; y: number },
  parentConversationId: string | null = null,
): Card {
  return {
    id,
    threadId,
    cardKind: "conversation",
    question: title,
    answer: summary,
    status: "done",
    position,
    size: { w: CARD_WIDTH, h: CONVERSATION_CARD_LAYOUT_H },
    parentCardId: null,
    parentConversationId,
  };
}

export function conn(
  from: string,
  to: string,
  fromSide: "left" | "right" | "top" | "bottom",
  toSide: "left" | "right" | "top" | "bottom",
): Connection {
  return { id: `conn-${from}-${to}`, from, to, fromSide, toSide };
}

export function spawnWebsite(
  id: string,
  url: string,
  title: string,
  cardId: string,
  position: { x: number; y: number },
  sessionArtifacts: Record<string, SessionArtifact>,
  canvasArtifactNodes: Record<string, CanvasArtifactNode>,
  canvasArtifactOrder: string[],
): void {
  let faviconUrl: string | undefined;
  try {
    faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;
  } catch {
    faviconUrl = undefined;
  }
  const payload = createWebsitePayload(url, title || domainDisplayLabel(url), {
    faviconUrl,
    previewImageUrl: `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&embed=screenshot.url`,
  });
  const art = createSessionArtifactFromPayload(payload, cardId);
  sessionArtifacts[art.id] = art;
  const ver = getLatestVersion(art)!;
  const nodeId = `tip-art-node-${id}`;
  canvasArtifactNodes[nodeId] = {
    id: nodeId,
    artifactId: art.id,
    versionId: ver.id,
    sourceCardId: cardId,
    position,
  };
  canvasArtifactOrder.push(nodeId);
}

/** Place input websites in a strip below the conversation threads. */
export function spawnInputWebsiteStrip(
  items: { id: string; url: string; title: string; cardId: string }[],
  startX: number,
  y: number,
  sessionArtifacts: Record<string, SessionArtifact>,
  canvasArtifactNodes: Record<string, CanvasArtifactNode>,
  canvasArtifactOrder: string[],
): void {
  items.forEach((item, index) => {
    spawnWebsite(
      item.id,
      item.url,
      item.title,
      item.cardId,
      { x: startX + index * INPUT_ARTIFACT_STEP, y },
      sessionArtifacts,
      canvasArtifactNodes,
      canvasArtifactOrder,
    );
  });
}

export function spawnPayload(
  nodeId: string,
  payload: ArtifactPayload,
  cardId: string,
  position: { x: number; y: number },
  sessionArtifacts: Record<string, SessionArtifact>,
  canvasArtifactNodes: Record<string, CanvasArtifactNode>,
  canvasArtifactOrder: string[],
): void {
  const art = createSessionArtifactFromPayload(payload, cardId);
  sessionArtifacts[art.id] = art;
  const ver = getLatestVersion(art)!;
  canvasArtifactNodes[nodeId] = {
    id: nodeId,
    artifactId: art.id,
    versionId: ver.id,
    sourceCardId: cardId,
    position,
  };
  canvasArtifactOrder.push(nodeId);
}

export function mergeTranscriptImportSections(
  sections: TranscriptImportCanvasSection[],
): Omit<TranscriptImportCanvasSection, "contentCenter"> & {
  contentCenter: { x: number; y: number };
} {
  const cards: Record<string, Card> = {};
  const cardOrder: string[] = [];
  const connections: Connection[] = [];
  const threads: Record<string, Thread> = {};
  const threadOrder: string[] = [];
  const groups: Record<string, BranchGroup> = {};
  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];

  for (const section of sections) {
    Object.assign(cards, section.cards);
    cardOrder.push(...section.cardOrder);
    connections.push(...section.connections);
    Object.assign(threads, section.threads);
    threadOrder.push(...section.threadOrder);
    Object.assign(groups, section.groups);
    Object.assign(sessionArtifacts, section.sessionArtifacts);
    Object.assign(canvasArtifactNodes, section.canvasArtifactNodes);
    canvasArtifactOrder.push(...section.canvasArtifactOrder);
  }

  const centers = sections.map((s) => s.contentCenter);
  const contentCenter = {
    x: centers.reduce((sum, c) => sum + c.x, 0) / centers.length,
    y: centers.reduce((sum, c) => sum + c.y, 0) / centers.length,
  };

  return {
    cards,
    cardOrder,
    connections,
    threads,
    threadOrder,
    groups,
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
    contentCenter,
  };
}
