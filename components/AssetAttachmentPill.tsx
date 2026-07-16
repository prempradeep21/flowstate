"use client";

import { AssetKindIcon } from "@/components/canvas/AssetKindIcon";
import type { CanvasAsset } from "@/lib/store";

function assetKindLabel(
  kind: CanvasAsset["kind"],
): "document" | "code" | "spreadsheet" | "word" | "presentation" {
  if (
    kind === "code" ||
    kind === "spreadsheet" ||
    kind === "word" ||
    kind === "presentation"
  ) {
    return kind;
  }
  return "document";
}

export function AssetAttachmentPill({
  name,
  kind,
  onRemove,
}: {
  name: string;
  kind: CanvasAsset["kind"];
  onRemove?: () => void;
}) {
  const iconKind = assetKindLabel(kind);
  const kindLabel =
    kind === "image"
      ? "Image"
      : kind === "code"
        ? "Code"
        : kind === "spreadsheet"
          ? "Spreadsheet"
          : kind === "presentation"
            ? "Presentation"
            : kind === "word"
              ? "Document"
              : "Document";

  return (
    <div
      className="inline-flex max-w-full items-center gap-3 rounded-canvas border border-canvas-border bg-canvas-card py-1.5 pl-2 pr-2.5"
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-canvas bg-canvas-artifactIconBg text-canvas-muted"
      >
        <AssetKindIcon kind={iconKind} className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span
          className="block max-w-[220px] truncate text-canvas-compact font-medium text-canvas-ink"
          title={name}
        >
          {name}
        </span>
        <span className="text-canvas-micro uppercase tracking-wide text-canvas-muted">
          {kindLabel}
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
