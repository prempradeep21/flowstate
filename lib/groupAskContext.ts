import {
  buildGroupTranscript,
  transcriptHasContent,
  type GroupTranscript,
} from "@/lib/buildGroupTranscript";
import {
  buildFlowstateGroupTranscript,
  groupHasNewSummaryContent,
} from "@/lib/groupSummaryStaleness";
import type { ChatThreadState } from "@/lib/chatThreads";
import {
  artifactDisplayTitle,
  getLatestVersion,
  getVersionById,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import type {
  BranchGroup,
  Canvas3DNode,
  CanvasArtifactNode,
  CanvasGifNode,
  CanvasTextLabel,
} from "@/lib/store";

/**
 * Serializing a whole group can dwarf the question itself, so each layer is
 * capped and the cheapest faithful representation wins:
 * - chats ride the CACHED summary when one exists (plus a delta transcript of
 *   only the exchanges added since), full transcript only as fallback;
 * - structured artifacts inline compact JSON, but bulky custom/code payloads
 *   collapse to a one-line note;
 * - gifs / 3d / labels are described, never fetched.
 * Binary assets are handled by the caller (they go as native model files).
 */
const GROUP_TRANSCRIPT_MAX_CHARS = 40_000;
const GROUP_ARTIFACT_JSON_MAX_CHARS = 20_000;

/** Artifact kinds whose payloads are too bulky to inline as group context. */
const BULKY_ARTIFACT_KINDS = new Set(["custom", "code"]);

export interface GroupContextGraph extends ChatThreadState {
  sessionArtifacts?: Record<string, SessionArtifact>;
  canvasArtifactNodes?: Record<string, CanvasArtifactNode>;
  canvasGifNodes?: Record<string, CanvasGifNode>;
  canvas3DNodes?: Record<string, Canvas3DNode>;
  canvasTextLabels?: Record<string, CanvasTextLabel>;
}

function formatTranscript(transcript: GroupTranscript): string {
  const parts: string[] = [];
  for (const family of transcript.families) {
    parts.push(`## Thread: ${family.rootTitle}`);
    for (const thread of family.threads) {
      if (thread.title !== family.rootTitle) {
        parts.push(`### Branch: ${thread.title}`);
      }
      if (thread.branchedFrom) {
        parts.push(`(Branched from: ${thread.branchedFrom})`);
      }
      for (const ex of thread.exchanges) {
        parts.push(`Q: ${ex.question}`);
        parts.push(`A: ${ex.answer}`);
        parts.push("");
      }
    }
  }
  return parts.join("\n");
}

function capped(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n[Truncated due to size limit]`;
}

/**
 * Text blocks describing a group's chats and non-asset members, appended to
 * the question when the group is attached as joint context.
 */
export function buildGroupContextBlocks(
  group: BranchGroup,
  graph: GroupContextGraph,
): string[] {
  const blocks: string[] = [];
  const items = group.items ?? [];

  blocks.push(
    `Canvas group "${group.label}" is attached as joint context ` +
      `(${group.familyRootThreadIds.length} chat thread(s), ${items.length} canvas item(s)). ` +
      `Treat everything in this group as shared background for the question.`,
  );

  // Chat threads — cached summary first, transcripts only where needed.
  if (group.summaryMarkdown) {
    blocks.push(
      `Summary of the group's chat threads:\n${group.summaryMarkdown}`,
    );
    if (groupHasNewSummaryContent(graph, group)) {
      const delta = buildFlowstateGroupTranscript(graph, group);
      if (transcriptHasContent(delta)) {
        blocks.push(
          `New exchanges since that summary:\n${capped(
            formatTranscript(delta),
            GROUP_TRANSCRIPT_MAX_CHARS,
          )}`,
        );
      }
    }
  } else if (group.familyRootThreadIds.length > 0) {
    const transcript = buildGroupTranscript(graph, group);
    if (transcriptHasContent(transcript)) {
      blocks.push(
        `Transcript of the group's chat threads:\n${capped(
          formatTranscript(transcript),
          GROUP_TRANSCRIPT_MAX_CHARS,
        )}`,
      );
    }
  }

  for (const item of items) {
    switch (item.kind) {
      case "artifact": {
        const node = graph.canvasArtifactNodes?.[item.id];
        const art = node ? graph.sessionArtifacts?.[node.artifactId] : undefined;
        if (!node || !art) break;
        const version =
          getVersionById(art, node.versionId) ?? getLatestVersion(art);
        const title = version
          ? artifactDisplayTitle(art, version)
          : art.title;
        if (!version || BULKY_ARTIFACT_KINDS.has(art.kind)) {
          blocks.push(
            `The group contains a ${art.kind} artifact titled "${title}" (content omitted for size).`,
          );
          break;
        }
        blocks.push(
          `Artifact in group — "${title}" (${art.kind}):\n${capped(
            JSON.stringify(version.payload),
            GROUP_ARTIFACT_JSON_MAX_CHARS,
          )}`,
        );
        break;
      }
      case "gif": {
        const node = graph.canvasGifNodes?.[item.id];
        if (node) {
          blocks.push(`The group contains an animated GIF: "${node.title}".`);
        }
        break;
      }
      case "3d": {
        const node = graph.canvas3DNodes?.[item.id];
        if (node) {
          blocks.push(
            `The group contains a 3D model: "${node.title}" (${node.format}).`,
          );
        }
        break;
      }
      case "label": {
        const label = graph.canvasTextLabels?.[item.id];
        if (label?.text.trim()) {
          blocks.push(`Canvas note in group: "${label.text.trim()}"`);
        }
        break;
      }
      default:
        break;
    }
  }

  return blocks;
}
