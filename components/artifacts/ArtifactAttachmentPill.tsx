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
    <div
      className="inline-flex max-w-full items-center gap-3 rounded-canvas border border-canvas-border bg-canvas-card py-1.5 pl-2 pr-2.5"
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-canvas bg-canvas-artifactIconBg text-canvas-ink"
      >
        <ArtifactTypeIcon kind={kind} className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span
          className="block max-w-[220px] truncate text-canvas-compact font-medium text-canvas-ink"
          title={title}
        >
          {title}
        </span>
        <span className="text-canvas-micro italic text-canvas-muted">
          Version {versionNumber}
        </span>
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
