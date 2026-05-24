"use client";

import { useCallback } from "react";
import type { AttachedArtifactRef, PendingFileAttachment } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";
import {
  allowSidebarDrop,
  artifactRefFromPayload,
  parseSidebarDragPayload,
  uploadedToPending,
} from "@/lib/sidebarDnD";

export function useSidebarDropTarget(handlers: {
  onArtifact?: (ref: AttachedArtifactRef) => void;
  onUpload?: (file: PendingFileAttachment) => void;
}) {
  const uploadedAttachments = useCanvasStore((s) => s.uploadedAttachments);

  const onDragOver = useCallback((e: React.DragEvent) => {
    allowSidebarDrop(e);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const payload = parseSidebarDragPayload(e.dataTransfer);
      if (!payload) return;

      if (payload.kind === "artifact") {
        handlers.onArtifact?.(artifactRefFromPayload(payload));
        return;
      }

      const att = uploadedAttachments.find(
        (a) => a.id === payload.attachmentId,
      );
      if (att) {
        handlers.onUpload?.(uploadedToPending(att));
      }
    },
    [handlers, uploadedAttachments],
  );

  return { onDragOver, onDrop };
}
