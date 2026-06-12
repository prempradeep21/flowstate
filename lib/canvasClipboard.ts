import type { ArtifactKind } from "@/lib/artifactTypes";
import { MANUAL_AUDIO_SOURCE_CARD_ID } from "@/lib/audioArtifact";
import { MANUAL_CALENDAR_SOURCE_CARD_ID } from "@/lib/calendarArtifact";
import { MANUAL_EMBED_SOURCE_CARD_ID } from "@/lib/embedArtifact";
import { MANUAL_GOOGLE_DOC_SOURCE_CARD_ID } from "@/lib/googleWorkspaceArtifact";
import { MANUAL_MAP_SOURCE_CARD_ID } from "@/lib/mapArtifact";
import {
  MANUAL_CHART_SOURCE_CARD_ID,
  MANUAL_IMAGES_SOURCE_CARD_ID,
  MANUAL_TABLE_SOURCE_CARD_ID,
} from "@/lib/manualArtifactDefaults";
import { MANUAL_REPO_SOURCE_CARD_ID } from "@/lib/repoArtifact";
import { MANUAL_STICKY_NOTE_SOURCE_CARD_ID } from "@/lib/stickyNoteArtifact";
import { MANUAL_TIMELINE_SOURCE_CARD_ID } from "@/lib/timelineArtifact";
import { MANUAL_TODO_SOURCE_CARD_ID } from "@/lib/todoArtifact";
import { MANUAL_WEBSITE_SOURCE_CARD_ID } from "@/lib/websiteArtifact";
import type { CanvasNodesState, CanvasSelectionItem } from "@/lib/canvasSelection";
import {
  createSessionArtifactFromPayload,
  newArtifactVersionId,
  newSessionArtifactId,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import type {
  ArtifactGeneratingPreview,
  ArtifactPermissionPreview,
  CanvasArtifactNode,
  CanvasSkill,
  CardSize,
} from "@/lib/store";

export const CANVAS_CLIPBOARD_MIME = "application/x-flowstate-canvas-clipboard";
export const CANVAS_CLIPBOARD_VERSION = 1 as const;
export const CANVAS_PASTE_SOURCE_CARD_ID = "__canvas_paste__";

const PASTE_OFFSET_PX = 24;

export type CanvasClipboardArtifactItem = {
  kind: "artifact";
  sessionArtifact: SessionArtifact;
  displayedVersionId: string;
  container: {
    position: { x: number; y: number };
    size?: CardSize;
    userSetSize?: boolean;
    permissionPreview?: ArtifactPermissionPreview;
    generatingPreview?: ArtifactGeneratingPreview;
  };
};

export type CanvasClipboardSkillItem = {
  kind: "skill";
  skill: CanvasSkill;
  container: {
    position: { x: number; y: number };
    size?: CardSize;
  };
};

export type CanvasClipboardItem =
  | CanvasClipboardArtifactItem
  | CanvasClipboardSkillItem;

export type CanvasClipboardPayload = {
  version: typeof CANVAS_CLIPBOARD_VERSION;
  anchor: { x: number; y: number };
  items: CanvasClipboardItem[];
};

let lastCanvasClipboard: CanvasClipboardPayload | null = null;

export function getLastCanvasClipboard(): CanvasClipboardPayload | null {
  return lastCanvasClipboard;
}

export function getCopyableSelectionItems(
  state: CanvasNodesState & {
    canvasSelection: CanvasSelectionItem[];
    selectedFamilyRootIds: string[];
    selectedCanvasArtifactId?: string | null;
    selectedCanvasSkillId?: string | null;
  },
): CanvasSelectionItem[] {
  const fromUnified = state.canvasSelection.filter(
    (item) => item.kind === "artifact" || item.kind === "skill",
  );
  if (fromUnified.length > 0) return fromUnified;

  // Fall back to legacy single-selection ids — spawn/focus paths set these
  // without always syncing canvasSelection.
  const legacy: CanvasSelectionItem[] = [];
  if (state.selectedCanvasArtifactId) {
    legacy.push({ kind: "artifact", id: state.selectedCanvasArtifactId });
  }
  if (state.selectedCanvasSkillId) {
    legacy.push({ kind: "skill", id: state.selectedCanvasSkillId });
  }
  return legacy;
}

export function canCopyCanvasSelection(
  state: CanvasNodesState & {
    canvasSelection: CanvasSelectionItem[];
    selectedFamilyRootIds: string[];
  },
): boolean {
  return getCopyableSelectionItems(state).length > 0;
}

function pasteSourceCardIdForKind(kind: ArtifactKind): string {
  switch (kind) {
    case "table":
      return MANUAL_TABLE_SOURCE_CARD_ID;
    case "chart":
      return MANUAL_CHART_SOURCE_CARD_ID;
    case "images":
      return MANUAL_IMAGES_SOURCE_CARD_ID;
    case "todo":
      return MANUAL_TODO_SOURCE_CARD_ID;
    case "calendar":
      return MANUAL_CALENDAR_SOURCE_CARD_ID;
    case "timeline":
      return MANUAL_TIMELINE_SOURCE_CARD_ID;
    case "map":
    case "streetview":
      return MANUAL_MAP_SOURCE_CARD_ID;
    case "stickynote":
      return MANUAL_STICKY_NOTE_SOURCE_CARD_ID;
    case "audio":
      return MANUAL_AUDIO_SOURCE_CARD_ID;
    case "website":
      return MANUAL_WEBSITE_SOURCE_CARD_ID;
    case "repo":
      return MANUAL_REPO_SOURCE_CARD_ID;
    case "embed":
      return MANUAL_EMBED_SOURCE_CARD_ID;
    case "google-doc":
      return MANUAL_GOOGLE_DOC_SOURCE_CARD_ID;
    default:
      return CANVAS_PASTE_SOURCE_CARD_ID;
  }
}

export type ClonedSessionArtifact = {
  artifact: SessionArtifact;
  versionIdMap: Map<string, string>;
};

export function cloneSessionArtifactDeep(
  artifact: SessionArtifact,
  options?: { preserveSourceCardIds?: boolean },
): ClonedSessionArtifact {
  const versionIdMap = new Map<string, string>();
  const newArtifactId = newSessionArtifactId();
  const sourceCardId = options?.preserveSourceCardIds
    ? undefined
    : pasteSourceCardIdForKind(artifact.kind);

  const versions = artifact.versions.map((version) => {
    const newVersionId = newArtifactVersionId();
    versionIdMap.set(version.id, newVersionId);
    return {
      ...version,
      id: newVersionId,
      payload: structuredClone(version.payload),
      sourceCardId:
        sourceCardId ??
        (version.sourceCardId.startsWith("__manual") ||
        version.sourceCardId === "manual-video"
          ? version.sourceCardId
          : pasteSourceCardIdForKind(artifact.kind)),
    };
  });

  const latestVersionId =
    versionIdMap.get(artifact.latestVersionId) ??
    versions[versions.length - 1]?.id ??
    "";

  return {
    artifact: {
      id: newArtifactId,
      title: artifact.title,
      kind: artifact.kind,
      versions,
      latestVersionId,
    },
    versionIdMap,
  };
}

function artifactItemFromNode(
  state: CanvasNodesState,
  node: CanvasArtifactNode,
): CanvasClipboardArtifactItem | null {
  const container = {
    position: { ...node.position },
    ...(node.size ? { size: { ...node.size } } : {}),
    ...(node.userSetSize ? { userSetSize: node.userSetSize } : {}),
    ...(node.permissionPreview
      ? { permissionPreview: structuredClone(node.permissionPreview) }
      : {}),
    ...(node.generatingPreview
      ? { generatingPreview: structuredClone(node.generatingPreview) }
      : {}),
  };

  const art = node.artifactId
    ? state.sessionArtifacts[node.artifactId]
    : undefined;

  if (art) {
    return {
      kind: "artifact",
      sessionArtifact: structuredClone(art),
      displayedVersionId: node.versionId || art.latestVersionId,
      container,
    };
  }

  if (node.permissionPreview) {
    const created = createSessionArtifactFromPayload(
      node.permissionPreview.payload,
      CANVAS_PASTE_SOURCE_CARD_ID,
    );
    return {
      kind: "artifact",
      sessionArtifact: created,
      displayedVersionId: created.latestVersionId,
      container,
    };
  }

  if (node.generatingPreview) {
    const placeholder = createSessionArtifactFromPayload(
      {
        type: "custom",
        title: node.generatingPreview.title,
        data: { html: "" },
      },
      CANVAS_PASTE_SOURCE_CARD_ID,
    );
    return {
      kind: "artifact",
      sessionArtifact: {
        ...placeholder,
        kind: node.generatingPreview.kind,
        title: node.generatingPreview.title,
      },
      displayedVersionId: placeholder.latestVersionId,
      container,
    };
  }

  return null;
}

function selectionAnchor(
  state: CanvasNodesState,
  items: CanvasSelectionItem[],
): { x: number; y: number } {
  let minX = Infinity;
  let minY = Infinity;

  for (const item of items) {
    if (item.kind === "artifact") {
      const node = state.canvasArtifactNodes[item.id];
      if (!node) continue;
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      continue;
    }
    if (item.kind === "skill") {
      const node = state.canvasSkillNodes[item.id];
      if (!node) continue;
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
    }
  }

  if (!Number.isFinite(minX)) {
    return { x: 0, y: 0 };
  }
  return { x: minX, y: minY };
}

export function buildCanvasClipboardPayload(
  state: CanvasNodesState & {
    canvasSelection: CanvasSelectionItem[];
    selectedFamilyRootIds: string[];
  },
  items: CanvasSelectionItem[] = getCopyableSelectionItems(state),
): CanvasClipboardPayload | null {
  const clipboardItems: CanvasClipboardItem[] = [];

  for (const item of items) {
    if (item.kind === "artifact") {
      const node = state.canvasArtifactNodes[item.id];
      if (!node) continue;
      const built = artifactItemFromNode(state, node);
      if (built) clipboardItems.push(built);
      continue;
    }

    if (item.kind === "skill") {
      const node = state.canvasSkillNodes[item.id];
      const skill = node ? state.canvasSkills[node.skillId] : undefined;
      if (!node || !skill) continue;
      clipboardItems.push({
        kind: "skill",
        skill: structuredClone(skill),
        container: {
          position: { ...node.position },
          ...(node.size ? { size: { ...node.size } } : {}),
        },
      });
    }
  }

  if (clipboardItems.length === 0) return null;

  return {
    version: CANVAS_CLIPBOARD_VERSION,
    anchor: selectionAnchor(state, items),
    items: clipboardItems,
  };
}

export function computePastePosition(
  anchor: { x: number; y: number },
  itemPosition: { x: number; y: number },
  pasteWorld: { x: number; y: number },
  itemIndex: number,
): { x: number; y: number } {
  const offset =
    itemIndex === 0
      ? { x: 0, y: 0 }
      : {
          x: PASTE_OFFSET_PX * itemIndex,
          y: PASTE_OFFSET_PX * itemIndex,
        };
  return {
    x: pasteWorld.x + (itemPosition.x - anchor.x) + offset.x,
    y: pasteWorld.y + (itemPosition.y - anchor.y) + offset.y,
  };
}

export function parseCanvasClipboardPayload(
  raw: string,
): CanvasClipboardPayload | null {
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as CanvasClipboardPayload;
    if (parsed.version !== CANVAS_CLIPBOARD_VERSION) return null;
    if (!Array.isArray(parsed.items) || parsed.items.length === 0) return null;
    if (
      !parsed.anchor ||
      typeof parsed.anchor.x !== "number" ||
      typeof parsed.anchor.y !== "number"
    ) {
      return null;
    }
    for (const item of parsed.items) {
      if (item.kind === "artifact") {
        if (!item.sessionArtifact?.id || !item.displayedVersionId) return null;
      } else if (item.kind === "skill") {
        if (!item.skill?.id) return null;
      } else {
        return null;
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readCanvasClipboardFromDataTransfer(
  dataTransfer: DataTransfer | null | undefined,
): CanvasClipboardPayload | null {
  if (!dataTransfer) return null;
  const raw =
    dataTransfer.getData(CANVAS_CLIPBOARD_MIME) ||
    dataTransfer.getData("text/plain");
  const parsed = parseCanvasClipboardPayload(raw);
  if (parsed) return parsed;
  return null;
}

export async function readCanvasClipboard(): Promise<CanvasClipboardPayload | null> {
  if (lastCanvasClipboard) return lastCanvasClipboard;

  if (typeof navigator !== "undefined" && navigator.clipboard?.read) {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes(CANVAS_CLIPBOARD_MIME)) {
          const blob = await item.getType(CANVAS_CLIPBOARD_MIME);
          const raw = await blob.text();
          const parsed = parseCanvasClipboardPayload(raw);
          if (parsed) return parsed;
        }
        if (item.types.includes("text/plain")) {
          const blob = await item.getType("text/plain");
          const raw = await blob.text();
          const parsed = parseCanvasClipboardPayload(raw);
          if (parsed) return parsed;
        }
      }
    } catch {
      // Fall through to in-memory cache.
    }
  }

  return lastCanvasClipboard;
}

export async function writeCanvasClipboard(
  payload: CanvasClipboardPayload,
): Promise<boolean> {
  lastCanvasClipboard = payload;
  const json = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && navigator.clipboard?.write) {
    try {
      const blob = new Blob([json], { type: CANVAS_CLIPBOARD_MIME });
      const plain = new Blob([json], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({
          [CANVAS_CLIPBOARD_MIME]: blob,
          "text/plain": plain,
        }),
      ]);
      return true;
    } catch {
      // In-memory cache still holds the payload.
    }
  }

  return lastCanvasClipboard !== null;
}
