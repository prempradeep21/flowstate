"use client";

import type { CSSProperties } from "react";
import { AssetKindIcon } from "@/components/canvas/AssetKindIcon";
import type { ArtifactCategoryId } from "@/lib/design/theme/types";
import type { AssetPreviewRenderer } from "@/lib/documentPreview";
import type { CanvasAsset } from "@/lib/store";

type AssetIconKind = "document" | "code" | "spreadsheet" | "word" | "presentation";

/**
 * Resolves the header icon, the short kind tag, and the category for a document
 * input artifact. Images never reach here — they render as a bare preview so
 * they read as images.
 *
 * `kindTag` and `category` feed the artifact style packs exactly like a real
 * artifact header: `category` picks the icon-circle fill, and the packs render
 * `kindTag` as the corner chip (see app/styles/artifact-styles.css) so this
 * header adapts to the active style (Neo / Brut / Liquid Glass).
 */
function documentHeaderMeta(
  asset: CanvasAsset,
  previewKind: AssetPreviewRenderer,
): { iconKind: AssetIconKind; kindTag: string; category: ArtifactCategoryId } {
  if (previewKind === "pdf") {
    return { iconKind: "document", kindTag: "pdf", category: "docs" };
  }
  if (asset.kind === "spreadsheet") {
    return { iconKind: "spreadsheet", kindTag: "sheet", category: "data" };
  }
  if (previewKind === "csv") {
    return { iconKind: "spreadsheet", kindTag: "csv", category: "data" };
  }
  if (asset.kind === "presentation") {
    return { iconKind: "presentation", kindTag: "slides", category: "docs" };
  }
  if (asset.kind === "word") {
    return { iconKind: "word", kindTag: "doc", category: "docs" };
  }
  if (previewKind === "code") {
    return { iconKind: "code", kindTag: "code", category: "dev" };
  }
  if (previewKind === "json") {
    return { iconKind: "code", kindTag: "json", category: "dev" };
  }
  if (previewKind === "html") {
    return { iconKind: "code", kindTag: "html", category: "dev" };
  }
  return {
    iconKind: "document",
    kindTag: previewKind === "markdown" ? "md" : "text",
    category: "docs",
  };
}

/**
 * Header bar for document input-artifact cards (never images), so it is clear
 * the card is a document rather than a picture. Structure, sizing, and spacing
 * are inherited verbatim from ArtifactPanelHeader (44px category icon circle,
 * heading-size title, gap-[11px] / py-3.5 pl-4 pr-2), and it carries the same
 * `artifact-panel-header` + kind/category hooks so the style packs restyle it
 * identically to a YouTube/embed artifact header.
 */
export function CanvasAssetHeader({
  asset,
  previewKind,
}: {
  asset: CanvasAsset;
  previewKind: AssetPreviewRenderer;
}) {
  const { iconKind, kindTag, category } = documentHeaderMeta(asset, previewKind);
  const iconCircleStyle: CSSProperties = {
    backgroundColor: `rgb(var(--artifact-cat-${category}-bg))`,
    color: `rgb(var(--artifact-cat-${category}-fg))`,
  };

  return (
    <div
      className="artifact-panel-header flex shrink-0 items-center gap-[11px] border-b border-canvas-border/60 bg-canvas-card py-3.5 pl-4 pr-2"
      data-artifact-kind={kindTag}
      data-artifact-category={category}
    >
      <span
        className="artifact-header-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-canvas-ink"
        style={iconCircleStyle}
      >
        <span className="flex h-full w-full items-center justify-center rounded-full">
          <AssetKindIcon kind={iconKind} className="h-[22px] w-[22px]" />
        </span>
      </span>
      <h2
        className="min-w-0 flex-1 truncate text-canvas-heading font-semibold leading-tight text-canvas-ink"
        title={asset.name}
      >
        {asset.name}
      </h2>
    </div>
  );
}
