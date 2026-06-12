import type {
  AttachedArtifactRef,
  CanvasGifCategory,
  PendingFileAttachment,
  UploadedAttachment,
} from "@/lib/store";

export const SIDEBAR_DRAG_MIME = "application/x-flowstate-item";

export type SidebarArtifactCategory =
  | "table"
  | "custom"
  | "3d"
  | "image"
  | "map"
  | "streetview"
  | "todo"
  | "calendar"
  | "website"
  | "repo"
  | "embed"
  | "timeline"
  | "chart"
  | "audio";

export type SidebarDragPayload =
  | {
      kind: "artifact";
      artifactId: string;
      versionId: string;
      category: SidebarArtifactCategory;
    }
  | { kind: "upload"; attachmentId: string }
  | { kind: "asset"; assetId: string }
  | { kind: "skill"; skillId: string }
  | {
      kind: "gif";
      url: string;
      previewUrl: string;
      title: string;
      category: CanvasGifCategory;
      aspectRatio: number;
      sourceId: string;
    };

export function setSidebarDragData(
  dataTransfer: DataTransfer,
  payload: SidebarDragPayload,
): void {
  const json = JSON.stringify(payload);
  dataTransfer.setData(SIDEBAR_DRAG_MIME, json);
  dataTransfer.setData("text/plain", json);
  dataTransfer.effectAllowed = "copy";
}

export function parseSidebarDragPayload(
  dataTransfer: DataTransfer,
): SidebarDragPayload | null {
  const raw =
    dataTransfer.getData(SIDEBAR_DRAG_MIME) ||
    dataTransfer.getData("text/plain");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SidebarDragPayload;
    if (parsed.kind === "artifact" && parsed.artifactId && parsed.versionId) {
      return parsed;
    }
    if (parsed.kind === "upload" && parsed.attachmentId) {
      return parsed;
    }
    if (parsed.kind === "asset" && parsed.assetId) {
      return parsed;
    }
    if (parsed.kind === "skill" && parsed.skillId) {
      return parsed;
    }
    if (
      parsed.kind === "gif" &&
      parsed.url &&
      parsed.sourceId &&
      (parsed.category === "gif" || parsed.category === "sticker")
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function isSidebarDrag(dataTransfer: DataTransfer): boolean {
  return (
    dataTransfer.types.includes(SIDEBAR_DRAG_MIME) ||
    (dataTransfer.types.includes("text/plain") &&
      dataTransfer.getData("text/plain").includes('"kind"'))
  );
}

export function allowSidebarDrop(e: React.DragEvent): void {
  if (!isSidebarDrag(e.dataTransfer)) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
}

export function uploadedToPending(
  att: UploadedAttachment,
): PendingFileAttachment {
  return {
    name: att.name,
    mimeType: att.type,
    base64: att.data,
  };
}

export function artifactRefFromPayload(
  payload: Extract<SidebarDragPayload, { kind: "artifact" }>,
): AttachedArtifactRef {
  return {
    artifactId: payload.artifactId,
    versionId: payload.versionId,
  };
}
