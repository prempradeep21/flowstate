"use client";

import { FlowstateLogo } from "@/components/FlowstateLogo";
import { getDisplayFontPreviewStyles } from "@/lib/canvasFonts/previewStyles";
import { useCanvasStore } from "@/lib/store";

export function FlowstateBrand({
  compact = false,
  onLogoClick,
}: {
  compact?: boolean;
  onLogoClick?: () => void;
}) {
  const displayFontId = useCanvasStore((s) => s.canvasPreviewDisplayFontId);
  const displayPreviewStyle = getDisplayFontPreviewStyles(displayFontId);

  const logo = <FlowstateLogo className="h-8 w-8 shrink-0" />;

  return (
    <div
      className={`flex items-center gap-2.5 ${compact ? "justify-center" : ""}`}
    >
      {onLogoClick ? (
        <button
          type="button"
          onClick={onLogoClick}
          aria-label="Back to home"
          title="Back to home"
          className="flex shrink-0 items-center justify-center rounded-canvas transition-opacity hover:opacity-80"
        >
          {logo}
        </button>
      ) : (
        logo
      )}
      {!compact && (
        <div className="min-w-0" data-font-preview-brand style={displayPreviewStyle}>
          <div className="font-display text-canvas-brand font-semibold leading-tight text-canvas-ink">
            Flowstate
          </div>
        </div>
      )}
    </div>
  );
}
