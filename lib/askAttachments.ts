import { collectAncestorCardIds } from "@/lib/buildAncestorHistory";
import { buildGroupContextBlocks } from "@/lib/groupAskContext";
import { getQuestionAttachedImages } from "@/lib/questionAttachments";
import type {
  BranchGroup,
  Canvas3DNode,
  CanvasArtifactNode,
  CanvasAsset,
  CanvasAssetNode,
  CanvasGifNode,
  CanvasSkill,
  CanvasTextLabel,
  Card,
  Connection,
  Thread,
  PendingFileAttachment,
} from "@/lib/store";
import type { SessionArtifact } from "@/lib/sessionArtifacts";

export const MAX_ASSET_TEXT_CONTEXT_CHARS = 60_000;

export interface AskAttachmentFile {
  name: string;
  mimeType: string;
  base64: string;
  /** Which conversation turn this came from (1 = current). */
  turnLabel?: string;
}

export interface CollectedAskAttachments {
  questionWithContext: string;
  files: AskAttachmentFile[];
}

interface AskAttachmentGraph {
  cards: Record<string, Card>;
  connections: Connection[];
  canvasAssets: Record<string, CanvasAsset>;
  canvasSkills: Record<string, CanvasSkill>;
  sessionArtifacts?: Record<string, SessionArtifact>;
  /** Group joint-context fields — optional so narrow callers still work. */
  groups?: Record<string, BranchGroup>;
  cardOrder?: string[];
  threads?: Record<string, Thread>;
  threadOrder?: string[];
  canvasArtifactNodes?: Record<string, CanvasArtifactNode>;
  canvasAssetNodes?: Record<string, CanvasAssetNode>;
  canvasGifNodes?: Record<string, CanvasGifNode>;
  canvas3DNodes?: Record<string, Canvas3DNode>;
  canvasTextLabels?: Record<string, CanvasTextLabel>;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function isTextAsset(asset: CanvasAsset): boolean {
  return (
    asset.kind === "code" ||
    asset.mimeType.startsWith("text/") ||
    asset.mimeType === "application/json"
  );
}

function isBinaryAttachmentMime(mimeType: string): boolean {
  return mimeType.startsWith("image/") || mimeType === "application/pdf";
}

function cardImageToFile(
  img: { url: string; alt?: string },
  name: string,
  turnLabel?: string,
): AskAttachmentFile | null {
  if (!img.url.startsWith("data:")) return null;
  const match = img.url.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    name,
    mimeType: match[1]!,
    base64: match[2]!,
    turnLabel,
  };
}

function appendTextContext(
  blocks: string[],
  label: string,
  raw: string,
): void {
  const truncated = raw.length > MAX_ASSET_TEXT_CONTEXT_CHARS;
  const text = truncated ? raw.slice(0, MAX_ASSET_TEXT_CONTEXT_CHARS) : raw;
  blocks.push(
    `${label}\n${text}${truncated ? "\n[File truncated due to size limit]" : ""}`,
  );
}

/** Fetch one asset into the binary-file or inline-text channel. */
async function collectAssetContext(
  asset: CanvasAsset,
  files: AskAttachmentFile[],
  textContexts: string[],
  contextLabel: string,
  turnLabel?: string,
): Promise<void> {
  if (!asset.publicUrl) return;
  try {
    const response = await fetch(asset.publicUrl);
    if (!response.ok) return;
    const blob = await response.blob();
    if (isBinaryAttachmentMime(asset.mimeType)) {
      files.push({
        name: asset.name,
        mimeType: asset.mimeType,
        base64: await blobToBase64(blob),
        turnLabel,
      });
    } else if (isTextAsset(asset)) {
      const raw = await blob.text();
      appendTextContext(
        textContexts,
        `${contextLabel}: ${asset.name} (${asset.mimeType})`,
        raw,
      );
    }
  } catch {
    textContexts.push(
      `${contextLabel}: ${asset.name} (${asset.mimeType}) could not be loaded.`,
    );
  }
}

async function collectFilesForCard(
  card: Card,
  graph: AskAttachmentGraph,
  turnLabel?: string,
  seenGroupIds?: Set<string>,
): Promise<{ files: AskAttachmentFile[]; textContexts: string[] }> {
  const files: AskAttachmentFile[] = [];
  const textContexts: string[] = [];

  for (const file of card.pendingFiles ?? []) {
    if (
      file.mimeType.startsWith("text/") ||
      file.mimeType === "application/json"
    ) {
      try {
        const bytes = Uint8Array.from(atob(file.base64), (c) => c.charCodeAt(0));
        appendTextContext(
          textContexts,
          `Attached file${turnLabel ? ` (${turnLabel})` : ""}: ${file.name}`,
          new TextDecoder().decode(bytes),
        );
      } catch {
        textContexts.push(
          `Attached file${turnLabel ? ` (${turnLabel})` : ""}: ${file.name} could not be read.`,
        );
      }
      continue;
    }
    files.push({
      name: file.name,
      mimeType: file.mimeType,
      base64: file.base64,
      turnLabel,
    });
  }

  for (const [index, img] of getQuestionAttachedImages(card).entries()) {
    const converted = cardImageToFile(
      img,
      img.alt?.trim() || `image-${index + 1}.png`,
      turnLabel,
    );
    if (converted) files.push(converted);
  }

  for (const ref of card.attachedAssets ?? []) {
    const asset = graph.canvasAssets[ref.assetId];
    if (!asset) continue;
    await collectAssetContext(
      asset,
      files,
      textContexts,
      `Asset${turnLabel ? ` (${turnLabel})` : ""}`,
      turnLabel,
    );
  }

  for (const ref of card.attachedSkills ?? []) {
    const skill = graph.canvasSkills[ref.skillId];
    if (!skill?.publicUrl) continue;
    try {
      const response = await fetch(skill.publicUrl);
      if (!response.ok) continue;
      const raw = await response.text();
      appendTextContext(
        textContexts,
        `Skill${turnLabel ? ` (${turnLabel})` : ""}: ${skill.title}`,
        raw,
      );
    } catch {
      textContexts.push(
        `Skill${turnLabel ? ` (${turnLabel})` : ""}: ${skill.title} could not be loaded.`,
      );
    }
  }

  // Attached groups — joint context. Serialized once per ask even when the
  // same group rides the current card AND its ancestors (follow-up turns).
  for (const ref of card.attachedGroups ?? []) {
    if (seenGroupIds?.has(ref.groupId)) continue;
    seenGroupIds?.add(ref.groupId);
    const group = graph.groups?.[ref.groupId];
    if (!group) continue;

    const threadState = {
      cards: graph.cards,
      connections: graph.connections,
      cardOrder: graph.cardOrder ?? [],
      threads: graph.threads ?? {},
      threadOrder: graph.threadOrder ?? [],
    };
    for (const block of buildGroupContextBlocks(group, {
      ...threadState,
      sessionArtifacts: graph.sessionArtifacts,
      canvasArtifactNodes: graph.canvasArtifactNodes,
      canvasGifNodes: graph.canvasGifNodes,
      canvas3DNodes: graph.canvas3DNodes,
      canvasTextLabels: graph.canvasTextLabels,
    })) {
      textContexts.push(block);
    }

    // Member assets go through the normal channels: images/PDFs as native
    // model files, text files inline.
    for (const item of group.items ?? []) {
      if (item.kind !== "asset") continue;
      const node = graph.canvasAssetNodes?.[item.id];
      const asset = node ? graph.canvasAssets[node.assetId] : undefined;
      if (!asset) continue;
      await collectAssetContext(
        asset,
        files,
        textContexts,
        `Asset in group "${group.label}"`,
        turnLabel,
      );
    }
  }

  return { files, textContexts };
}

function ancestorCardIds(
  graph: AskAttachmentGraph & { sessionArtifacts?: Record<string, SessionArtifact> },
  cardId: string,
): string[] {
  return collectAncestorCardIds(
    {
      cards: graph.cards,
      connections: graph.connections,
    },
    cardId,
  );
}

/** Collect attachments for the current card and ancestor cards on this branch. */
export async function collectAskAttachments(
  cardId: string,
  question: string,
  graph: AskAttachmentGraph,
): Promise<CollectedAskAttachments> {
  const card = graph.cards[cardId];
  if (!card) {
    return { questionWithContext: question, files: [] };
  }

  const contextBlocks: string[] = [];
  const files: AskAttachmentFile[] = [];
  const seen = new Set<string>();

  const pushFile = (file: AskAttachmentFile) => {
    const key = `${file.turnLabel ?? "current"}:${file.name}:${file.mimeType}:${file.base64.slice(0, 48)}`;
    if (seen.has(key)) return;
    seen.add(key);
    files.push(file);
  };

  const seenGroupIds = new Set<string>();
  const ancestorIds = ancestorCardIds(graph, cardId);
  for (const [index, ancestorId] of ancestorIds.entries()) {
    const ancestor = graph.cards[ancestorId];
    if (!ancestor) continue;
    const turnLabel = `earlier turn ${index + 1}`;
    const collected = await collectFilesForCard(
      ancestor,
      graph,
      turnLabel,
      seenGroupIds,
    );
    for (const block of collected.textContexts) {
      contextBlocks.push(block);
    }
    for (const file of collected.files) {
      pushFile(file);
    }
  }

  const current = await collectFilesForCard(card, graph, undefined, seenGroupIds);
  for (const block of current.textContexts) {
    contextBlocks.push(block);
  }
  for (const file of current.files) {
    pushFile({ ...file, turnLabel: file.turnLabel ?? "current turn" });
  }

  const questionWithContext =
    contextBlocks.length > 0
      ? `${question}\n\n${contextBlocks.join("\n\n---\n\n")}`
      : question;

  return { questionWithContext, files };
}

export function askAttachmentFilesToPending(
  files: AskAttachmentFile[],
): PendingFileAttachment[] {
  return files.map((file) => ({
    name: file.name,
    mimeType: file.mimeType,
    base64: file.base64,
  }));
}
