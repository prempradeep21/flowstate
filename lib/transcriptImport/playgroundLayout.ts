import type { ArtifactPayload } from "@/lib/artifactTypes";
import { CARD_WIDTH } from "@/lib/canvasNodeBounds";
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

/**
 * Content helpers for the transcript-import playground. Every node is spawned
 * at the origin and then positioned by layoutChapters (see chapterLayout.ts) —
 * builders author what is on the canvas, never where it sits.
 */

import { transcriptWebsitePreview } from "@/lib/transcriptImport/websitePreviews";

export const ORIGIN_X = 0;
/**
 * Fixed layout height so horizontal connectors stay level across a row.
 *
 * Sized for a two-line title plus a six-line summary at 420px wide: the body is
 * 13px text on relaxed leading (~21px a line) across ~384px of usable width, so
 * six lines need ~127px on top of the header, divider and padding. At 200px the
 * card could not fit the four lines its own clamp asked for, and summaries were
 * cut mid-sentence.
 */
export const CONVERSATION_CARD_LAYOUT_H = 300;

/** Placeholder until the chapter engine assigns a real position. */
const UNPLACED = { x: 0, y: 0 };

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
  parentConversationId: string | null = null,
): Card {
  return {
    id,
    threadId,
    cardKind: "conversation",
    question: title,
    answer: summary,
    status: "done",
    position: { ...UNPLACED },
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

/**
 * Website artifacts point at images this app serves, never at a third party.
 *
 * These previously carried a live api.microlink.io screenshot call as the
 * <img src> and a Google favicon-service call beside it, so every card hotlinked
 * two rate-limited third parties on every render — the blank artifacts. The
 * preview now comes from the build-time manifest
 * (scripts/prefetch-transcript-previews.mjs), and a URL with no entry simply has
 * no preview, which the card renders as a proper empty state.
 */
export function spawnWebsite(
  id: string,
  url: string,
  title: string,
  cardId: string,
  sessionArtifacts: Record<string, SessionArtifact>,
  canvasArtifactNodes: Record<string, CanvasArtifactNode>,
  canvasArtifactOrder: string[],
): void {
  const preview = transcriptWebsitePreview(url);
  const payload = createWebsitePayload(url, title || domainDisplayLabel(url), {
    previewImageUrl: preview?.path,
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
    position: { ...UNPLACED },
  };
  canvasArtifactOrder.push(nodeId);
}

/** Spawn every mentioned link; each lands in the chapter of its source card. */
export function spawnWebsites(
  items: { id: string; url: string; title: string; cardId: string }[],
  sessionArtifacts: Record<string, SessionArtifact>,
  canvasArtifactNodes: Record<string, CanvasArtifactNode>,
  canvasArtifactOrder: string[],
): void {
  for (const item of items) {
    spawnWebsite(
      item.id,
      item.url,
      item.title,
      item.cardId,
      sessionArtifacts,
      canvasArtifactNodes,
      canvasArtifactOrder,
    );
  }
}

export function spawnPayload(
  nodeId: string,
  payload: ArtifactPayload,
  cardId: string,
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
    position: { ...UNPLACED },
  };
  canvasArtifactOrder.push(nodeId);
}
