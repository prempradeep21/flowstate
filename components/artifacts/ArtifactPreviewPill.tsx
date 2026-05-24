"use client";

import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import { focusCanvasArtifact } from "@/lib/canvasArtifacts";
import type { ArtifactKind } from "@/lib/artifactTypes";

export function ArtifactPreviewPill({
  kind,
  title,
  versionNumber,
  artifactId,
  versionId,
  generating = false,
  compact = false,
}: {
  kind: ArtifactKind;
  title: string;
  versionNumber: number;
  artifactId: string;
  versionId?: string;
  generating?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={generating || !artifactId}
      onClick={() => {
        if (!artifactId) return;
        focusCanvasArtifact(artifactId);
      }}
      className={`flex w-full max-w-md items-center gap-2.5 rounded-xl border border-canvas-border bg-canvas-card text-left transition-colors hover:border-canvas-ink/25 ${
        compact ? "px-2.5 py-2" : "px-3 py-2.5"
      } ${generating ? "cursor-wait opacity-80" : ""}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-canvas-artifactIconBg text-canvas-ink ${
          compact ? "h-5 w-5" : "h-8 w-8"
        }`}
      >
        <ArtifactTypeIcon kind={kind} className={compact ? "h-3 w-3" : "h-4 w-4"} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate font-medium text-canvas-ink ${compact ? "text-[12px]" : "text-[13px]"}`}>
          {title}
        </span>
        <span className={`italic text-canvas-muted ${compact ? "text-[10px]" : "text-[11px]"}`}>
          Version {versionNumber}
          {generating ? " · Generating…" : ""}
        </span>
      </span>
      {!generating && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-canvas-ink" aria-hidden>
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M1.5 8s2.5-4 6.5-4 6.5 4 6.5 4-2.5 4-6.5 4-6.5-4-6.5-4Z" />
            <circle cx="8" cy="8" r="2" />
          </svg>
        </span>
      )}
    </button>
  );
}
