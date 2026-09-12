"use client";

import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import type { ArtifactKind } from "@/lib/artifactTypes";

interface ArtifactPermissionPromptProps {
  kind: ArtifactKind;
  title: string;
  copy: string;
  busy?: boolean;
  onApprove: () => void;
  onDecline: () => void;
}

export function ArtifactPermissionPrompt({
  kind,
  title,
  copy,
  busy = false,
  onApprove,
  onDecline,
}: ArtifactPermissionPromptProps) {
  return (
    <div
      role="group"
      aria-label={`Create ${title} artifact?`}
      className="flex h-full flex-col"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 border-b border-canvas-border px-4 py-3">
        <ArtifactTypeIcon kind={kind} className="h-4 w-4 shrink-0 text-canvas-muted" />
        <span className="truncate text-canvas-body-sm font-medium text-canvas-ink">
          {title}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-4 p-4">
        <p className="text-canvas-body leading-relaxed text-canvas-muted">
          {copy}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onDecline}
            className="btn rounded-canvas border border-canvas-border px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-muted hover:text-canvas-ink"
          >
            Not now
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onApprove}
            className="btn rounded-canvas bg-canvas-accent px-3 py-1.5 text-canvas-body-sm font-medium text-canvas-onAccent"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
