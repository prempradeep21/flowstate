"use client";

import {
  ARTIFACT_FONT_SCALE_MAX,
  ARTIFACT_FONT_SCALE_MIN,
  stepArtifactFontScale,
} from "@/lib/artifactFontScale";

export function ArtifactFontScaleControls({
  scale,
  onScaleChange,
}: {
  scale: number;
  onScaleChange: (scale: number) => void;
}) {
  const atMin = scale <= ARTIFACT_FONT_SCALE_MIN;
  const atMax = scale >= ARTIFACT_FONT_SCALE_MAX;

  return (
    <div
      className="ml-auto flex shrink-0 items-center gap-1.5"
      data-no-drag
      role="group"
      aria-label="Artifact text size"
    >
      <span
        className="flex h-9 w-12 items-center justify-center text-xs font-semibold leading-none text-canvas-muted"
        aria-hidden
        title="Text size"
      >
        Aa
      </span>
      <button
        type="button"
        disabled={atMin}
        onClick={() => onScaleChange(stepArtifactFontScale(scale, -1))}
        aria-label="Decrease text size"
        className="flex h-9 w-9 items-center justify-center rounded-sm text-sm leading-none text-canvas-ink transition-colors hover:bg-canvas-border/50 disabled:cursor-default disabled:opacity-35"
        data-no-drag
      >
        −
      </button>
      <button
        type="button"
        disabled={atMax}
        onClick={() => onScaleChange(stepArtifactFontScale(scale, 1))}
        aria-label="Increase text size"
        className="flex h-9 w-9 items-center justify-center rounded-sm text-sm leading-none text-canvas-ink transition-colors hover:bg-canvas-border/50 disabled:cursor-default disabled:opacity-35"
        data-no-drag
      >
        +
      </button>
    </div>
  );
}
