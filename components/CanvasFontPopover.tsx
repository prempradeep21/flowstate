"use client";

import { CANVAS_BODY_FONT_OPTIONS } from "@/lib/canvasFonts/registry";
import { useCanvasStore } from "@/lib/store";

const navBtn =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-canvas text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink";

export function CanvasFontSettingsSections() {
  const bodyFontId = useCanvasStore((s) => s.canvasPreviewBodyFontId);
  const setBodyFontId = useCanvasStore((s) => s.setCanvasPreviewBodyFontId);

  const currentIndex = Math.max(
    0,
    CANVAS_BODY_FONT_OPTIONS.findIndex((option) => option.id === bodyFontId),
  );
  const current =
    CANVAS_BODY_FONT_OPTIONS[currentIndex] ?? CANVAS_BODY_FONT_OPTIONS[0]!;

  const shift = (delta: number) => {
    const nextIndex =
      (currentIndex + delta + CANVAS_BODY_FONT_OPTIONS.length) %
      CANVAS_BODY_FONT_OPTIONS.length;
    setBodyFontId(CANVAS_BODY_FONT_OPTIONS[nextIndex]!.id);
  };

  return (
    <div
      className="flex items-center justify-between gap-2"
      role="group"
      aria-label="Font"
    >
      <button
        type="button"
        className={navBtn}
        aria-label="Previous font"
        onClick={() => shift(-1)}
      >
        ‹
      </button>
      <span
        className="min-w-0 flex-1 truncate text-center text-canvas-body-sm font-medium text-canvas-ink"
        style={{ fontFamily: current.family }}
      >
        {current.label}
      </span>
      <button
        type="button"
        className={navBtn}
        aria-label="Next font"
        onClick={() => shift(1)}
      >
        ›
      </button>
    </div>
  );
}
