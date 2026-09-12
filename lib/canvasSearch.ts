import {
  getHiddenCardIds,
  getThreadRootCard,
  getThreadTitle,
  type CollapseVisibilityState,
} from "@/lib/chatThreads";
import type {
  CanvasArtifactNode,
  CanvasAsset,
  CanvasAssetNode,
  CanvasTextLabel,
  SessionArtifact,
} from "@/lib/store";

export type CanvasSearchKind = "artifact" | "chat" | "asset" | "label";

export type CanvasSearchTarget =
  | { type: "artifact"; artifactId: string }
  | { type: "card"; cardId: string }
  | { type: "assetNode"; nodeId: string }
  | { type: "label"; labelId: string };

export interface CanvasSearchEntry {
  /** Stable + unique — also used as the aria-activedescendant option id. */
  id: string;
  kind: CanvasSearchKind;
  title: string;
  /** Lowercased title, precomputed at build time so matching is a plain indexOf. */
  haystack: string;
  target: CanvasSearchTarget;
}

export interface CanvasSearchIndexInput extends CollapseVisibilityState {
  canvasArtifactNodes: Record<string, CanvasArtifactNode>;
  canvasArtifactOrder: string[];
  sessionArtifacts: Record<string, SessionArtifact>;
  canvasAssets: Record<string, CanvasAsset>;
  canvasAssetNodes: Record<string, CanvasAssetNode>;
  canvasAssetOrder: string[];
  canvasTextLabels: Record<string, CanvasTextLabel>;
  canvasTextLabelOrder: string[];
}

export const MAX_SEARCH_RESULTS = 8;

/** Result ordering tiebreak — the "prioritise the scope" knob. */
const KIND_PRIORITY: Record<CanvasSearchKind, number> = {
  artifact: 0,
  chat: 1,
  asset: 2,
  label: 3,
};

/** Title getThreadTitle falls back to when a thread has no question yet. */
const EMPTY_THREAD_TITLE = "New chat";

function normalizeTitle(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

/**
 * Walks every searchable node kind on the canvas. Mirrors the enumeration in
 * computeCanvasContentBounds — iterate the `*Order` arrays, never Object.values,
 * so results follow canvas z-order.
 */
export function buildCanvasSearchIndex(
  state: CanvasSearchIndexInput,
): CanvasSearchEntry[] {
  const entries: CanvasSearchEntry[] = [];

  const push = (
    kind: CanvasSearchKind,
    targetId: string,
    rawTitle: string,
    target: CanvasSearchTarget,
  ) => {
    const title = normalizeTitle(rawTitle);
    if (!title) return;
    entries.push({
      id: `${kind}:${targetId}`,
      kind,
      title,
      haystack: title.toLowerCase(),
      target,
    });
  };

  for (const id of state.canvasArtifactOrder) {
    const node = state.canvasArtifactNodes[id];
    // No artifactId — an in-flight generating or permission preview.
    if (!node?.artifactId) continue;
    const artifact = state.sessionArtifacts[node.artifactId];
    if (!artifact) continue;
    push("artifact", node.artifactId, artifact.title, {
      type: "artifact",
      artifactId: node.artifactId,
    });
  }

  // Hidden cards would zoom the camera to empty space — computed once per build.
  const hiddenCardIds = getHiddenCardIds(state);
  for (const threadId of state.threadOrder) {
    const root = getThreadRootCard(state, threadId);
    if (!root || hiddenCardIds.has(root.id)) continue;
    const title = getThreadTitle(state, threadId);
    if (title === EMPTY_THREAD_TITLE) continue;
    push("chat", threadId, title, { type: "card", cardId: root.id });
  }

  for (const id of state.canvasAssetOrder) {
    const node = state.canvasAssetNodes[id];
    if (!node) continue;
    const asset = state.canvasAssets[node.assetId];
    if (!asset) continue;
    push("asset", node.id, asset.name, { type: "assetNode", nodeId: node.id });
  }

  for (const id of state.canvasTextLabelOrder) {
    const label = state.canvasTextLabels[id];
    if (!label) continue;
    push("label", label.id, label.text, { type: "label", labelId: label.id });
  }

  return entries;
}

const WORD_CHAR = /[\p{L}\p{N}]/u;

/** 0 = title prefix, 1 = starts a word, 2 = mid-word. */
function matchRank(haystack: string, idx: number): number {
  if (idx === 0) return 0;
  return WORD_CHAR.test(haystack[idx - 1]!) ? 2 : 1;
}

/**
 * Linear indexOf scan. A canvas holds tens to low-hundreds of entries, so this is
 * microseconds — no debounce, no async, no fuzzy-match dependency.
 */
export function searchCanvasIndex(
  index: readonly CanvasSearchEntry[],
  query: string,
  limit: number = MAX_SEARCH_RESULTS,
): CanvasSearchEntry[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const scored: Array<{
    entry: CanvasSearchEntry;
    rank: number;
    idx: number;
    order: number;
  }> = [];

  for (let order = 0; order < index.length; order++) {
    const entry = index[order]!;
    const first = entry.haystack.indexOf(tokens[0]!);
    if (first === -1) continue;

    let matchesAll = true;
    for (let t = 1; t < tokens.length; t++) {
      if (!entry.haystack.includes(tokens[t]!)) {
        matchesAll = false;
        break;
      }
    }
    if (!matchesAll) continue;

    scored.push({
      entry,
      rank: matchRank(entry.haystack, first),
      idx: first,
      order,
    });
  }

  scored.sort(
    (a, b) =>
      a.rank - b.rank ||
      KIND_PRIORITY[a.entry.kind] - KIND_PRIORITY[b.entry.kind] ||
      a.idx - b.idx ||
      a.entry.title.length - b.entry.title.length ||
      a.order - b.order,
  );

  return scored.slice(0, limit).map((s) => s.entry);
}
