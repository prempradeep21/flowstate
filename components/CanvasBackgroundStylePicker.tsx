"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AmbientGradientBackground } from "@/components/canvasBackgrounds/AmbientGradientBackground";
import { GridBackground } from "@/components/canvasBackgrounds/GridBackground";
import { StaticImageBackground } from "@/components/canvasBackgrounds/StaticImageBackground";
import { isBackgroundAllowedForTheme } from "@/lib/canvasBackgroundTheme";
import {
  CANVAS_PICKER_BACKGROUND_IMAGE_IDS,
  getCanvasBackgroundImageById,
} from "@/lib/canvasBackgroundImages";
import { useCanvasStore, type CanvasBackgroundStyle } from "@/lib/store";

interface BackgroundSlide {
  key: string;
  label: string;
  style: CanvasBackgroundStyle;
  imageId?: string;
}

/** Picker order: dot grid, ambient, then the curated photos. */
const SLIDES: BackgroundSlide[] = [
  { key: "grid", label: "Dot grid", style: "grid" },
  { key: "ambient-gradient", label: "Ambient", style: "ambient-gradient" },
  ...CANVAS_PICKER_BACKGROUND_IMAGE_IDS.map((imageId, i) => ({
    key: imageId,
    label: `Photo ${i + 1}`,
    style: "static-image" as const,
    imageId,
  })),
];

const navBtn =
  "absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-canvas-border bg-canvas-card/90 text-canvas-ink shadow-card backdrop-blur-sm transition-colors hover:bg-canvas-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-accent";

function SlidePreview({ slide }: { slide: BackgroundSlide }) {
  if (slide.style === "grid") return <GridBackground className="!absolute inset-0" />;
  if (slide.style === "ambient-gradient") {
    return <AmbientGradientBackground animate={false} className="!absolute inset-0" />;
  }
  return <StaticImageBackground imageId={slide.imageId} className="!absolute inset-0" />;
}

/** One large preview with prev/next arrows — each step applies the background. */
export function CanvasBackgroundStylePicker() {
  const canvasTheme = useCanvasStore((s) => s.canvasTheme);
  const style = useCanvasStore((s) => s.canvasBackgroundStyle);
  const imageId = useCanvasStore((s) => s.canvasBackgroundImageId);
  const setCanvasBackgroundStyle = useCanvasStore(
    (s) => s.setCanvasBackgroundStyle,
  );
  const setCanvasBackgroundImageId = useCanvasStore(
    (s) => s.setCanvasBackgroundImageId,
  );

  const slides = SLIDES.filter((slide) =>
    isBackgroundAllowedForTheme(slide.style, canvasTheme),
  );
  const index = slides.findIndex((slide) =>
    slide.style === "static-image"
      ? style === "static-image" && slide.imageId === imageId
      : slide.style === style,
  );
  // A canvas saved with a photo outside the curated set still shows it; the
  // arrows step from the first curated photo.
  const legacyPhoto =
    index < 0 && style === "static-image"
      ? getCanvasBackgroundImageById(imageId)
      : undefined;
  const anchor =
    index >= 0
      ? index
      : Math.max(0, slides.findIndex((s) => s.style === "static-image"));
  const current: BackgroundSlide = legacyPhoto
    ? {
        key: legacyPhoto.id,
        label: legacyPhoto.label,
        style: "static-image",
        imageId: legacyPhoto.id,
      }
    : slides[anchor]!;

  const step = (delta: -1 | 1) => {
    const from = index >= 0 ? index : delta === 1 ? anchor - 1 : anchor;
    const next = slides[(from + delta + slides.length) % slides.length]!;
    if (next.imageId) setCanvasBackgroundImageId(next.imageId);
    setCanvasBackgroundStyle(next.style);
  };

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Background style"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          step(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          step(1);
        }
      }}
    >
      <div className="relative h-32 w-full overflow-hidden rounded-canvas border border-canvas-border bg-canvas-bg">
        <SlidePreview key={current.key} slide={current} />
        <button
          type="button"
          className={`${navBtn} left-2`}
          aria-label="Previous background"
          onClick={() => step(-1)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          className={`${navBtn} right-2`}
          aria-label="Next background"
          onClick={() => step(1)}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span
          className="min-w-0 truncate text-canvas-compact font-medium text-canvas-ink"
          aria-live="polite"
        >
          {current.label}
        </span>
        <span className="flex shrink-0 items-center gap-1" aria-hidden>
          {slides.map((slide, i) => (
            <span
              key={slide.key}
              className={`h-1.5 rounded-full transition-all ${
                i === index
                  ? "w-3 bg-canvas-ink"
                  : "w-1.5 bg-canvas-muted/40"
              }`}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
