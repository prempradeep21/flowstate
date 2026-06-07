import type { AttachedArtifactRef, PendingFileAttachment } from "@/lib/store";
import type { UploadedAttachment } from "@/lib/store";

export const SIDEBAR_DRAG_MIME = "application/x-flowstate-item";

export type SidebarArtifactCategory =
  | "table"
  | "custom"
  | "3d"
  | "image"
  | "map"
  | "todo";

export type SidebarDragPayload =
  | {
      kind: "artifact";
      artifactId: string;
      versionId: string;
      category: SidebarArtifactCategory;
    }
  | { kind: "upload"; attachmentId: string };

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
