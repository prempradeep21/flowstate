"use client";

import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import type { ArtifactKind } from "@/lib/artifactTypes";

export function ArtifactAttachmentPill({
  kind,
  title,
  versionNumber,
  onRemove,
}: {
  kind: ArtifactKind;
  title: string;
  versionNumber: number;
  onRemove?: () => void;
}) {
  return (
    <div className="flex w-full min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card px-2.5 py-1.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-canvas-artifactIconBg text-canvas-ink">
        <ArtifactTypeIcon kind={kind} className="h-3 w-3" />
      </span>
      <span className="min-w-0 flex-1 overflow-hidden">
        <span
          className="block overflow-hidden text-ellipsis whitespace-nowrap text-canvas-compact font-medium text-canvas-ink"
          title={title}
        >
          {title}
        </span>
        <span className="text-canvas-micro italic text-canvas-muted">Version {versionNumber}</span>
      </span>
      {onRemove && (
        <button
          type="button"
          aria-label="Remove attachment"
          onClick={onRemove}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink"
        >
          ×
        </button>
      )}
    </div>
  );
}
