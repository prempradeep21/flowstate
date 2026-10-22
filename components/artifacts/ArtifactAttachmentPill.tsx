"use client";

import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import { artifactCategoryStyle } from "@/lib/design/theme/artifactCategories";
import type { ArtifactKind } from "@/lib/artifactTypes";

export function ArtifactAttachmentPill({
  kind,
  title,
  versionNumber,
  onRemove,
  nested = false,
}: {
  kind: ArtifactKind;
  title: string;
  versionNumber: number;
  onRemove?: () => void;
  /** In the composer's padded attachment row: corners yield to the
   *  composer's (concentric — R = composer − 9px). */
  nested?: boolean;
}) {
  return (
    <div
      data-artifact-attachment-pill=""
      data-nested={nested ? "" : undefined}
      className={`inline-flex max-w-full items-center gap-3 border border-canvas-border bg-canvas-card py-1.5 pl-2 pr-2.5 ${
        nested ? "rounded-canvas-nest-9" : "rounded-canvas"
      }`}
    >
      {/* Icon sits py-1.5 + border = 7px into the pill's corners. */}
      <span
        data-attachment-icon=""
        className={`flex h-8 w-8 shrink-0 items-center justify-center text-canvas-ink ${
          nested ? "rounded-canvas-nest-16" : "rounded-canvas-nest-7"
        }`}
        style={artifactCategoryStyle(kind)}
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
          className="btn h-5 w-5 shrink-0 rounded-full text-canvas-muted hover:text-canvas-ink"
        >
          ×
        </button>
      )}
    </div>
  );
}
