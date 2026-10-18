"use client";

import { Alkatra } from "next/font/google";
import { FlowstateLogo } from "@/components/FlowstateLogo";
import { getDisplayFontPreviewStyles } from "@/lib/canvasFonts/previewStyles";
import { useCanvasStore } from "@/lib/store";

/** The demo-video end-card wordmark face (Figma spec: Alkatra Regular). */
const alkatra = Alkatra({ subsets: ["latin"], weight: "400" });

/** Brand cobalt — matches BRAND_BLUE in the demo-video logo timeline. */
const BRAND_BLUE = "#2066EB";

export function FlowstateBrand({
  compact = false,
  onLogoClick,
  variant = "default",
}: {
  compact?: boolean;
  /** "lockup" sets the lowercase Alkatra wordmark from the demo videos. */
  variant?: "default" | "lockup";
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
      {!compact && variant === "lockup" && (
        <div
          className={`${alkatra.className} whitespace-nowrap`}
          style={{
            fontSize: 30,
            lineHeight: 1,
            letterSpacing: "-0.05em",
            color: BRAND_BLUE,
          }}
        >
          flowstate
        </div>
      )}
      {!compact && variant === "default" && (
        <div className="min-w-0" data-font-preview-brand style={displayPreviewStyle}>
          <div className="font-display text-canvas-brand font-semibold leading-tight text-canvas-ink">
            Flowstate
          </div>
        </div>
      )}
    </div>
  );
}
