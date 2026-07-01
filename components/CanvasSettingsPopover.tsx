"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  BACKGROUND_COMPONENTS,
  getBackgroundOptionsForTheme,
  THEME_OPTIONS,
} from "@/components/canvasBackgrounds/registry";
import { CanvasFontSettingsSections } from "@/components/CanvasFontPopover";
import { MotionFlowSize } from "@/components/motion/MotionFlowSize";
import { preloadAllCanvasGoogleFonts } from "@/hooks/useCanvasFontLoader";
import { useToolbarPopoverAnchor } from "@/hooks/useToolbarPopoverAnchor";
import { canvasColors, darkCanvasColors } from "@/lib/design/tokens";
import { useCanvasStore, type CanvasTheme } from "@/lib/store";

interface Props {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  containerRef: React.RefObject<HTMLElement | null>;
}

const THEME_PREVIEW: Record<
  CanvasTheme,
  Record<keyof typeof canvasColors, string>
> = {
  light: canvasColors,
  dark: darkCanvasColors,
};

export function CanvasSettingsPopover({
  open,
  onClose,
  anchorRef,
  containerRef,
}: Props) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const anchorStyle = useToolbarPopoverAnchor(
    anchorRef,
    containerRef,
    open,
    popoverRef,
  );
  const canvasTheme = useCanvasStore((s) => s.canvasTheme);
  const setCanvasTheme = useCanvasStore((s) => s.setCanvasTheme);
  const canvasBackgroundStyle = useCanvasStore((s) => s.canvasBackgroundStyle);
  const setCanvasBackgroundStyle = useCanvasStore(
    (s) => s.setCanvasBackgroundStyle,
  );
  const soundEnabled = useCanvasStore((s) => s.soundEnabled);
  const soundVolume = useCanvasStore((s) => s.soundVolume);
  const setSoundEnabled = useCanvasStore((s) => s.setSoundEnabled);
  const setSoundVolume = useCanvasStore((s) => s.setSoundVolume);

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    },
    [anchorRef, onClose],
  );

  useEffect(() => {
    if (!open) return;
    preloadAllCanvasGoogleFonts();
    document.addEventListener("pointerdown", handlePointerDown);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, handlePointerDown, onClose]);

  if (!open) return null;

  const backgroundOptions = getBackgroundOptionsForTheme(canvasTheme);

  return (
    <MotionFlowSize
      ref={popoverRef}
      role="dialog"
      aria-label="Canvas controls"
      className="absolute bottom-full z-[60] mb-3 max-h-[min(70vh,480px)] w-[min(calc(100vw-2rem),300px)] -translate-x-1/2 overflow-y-auto rounded-canvas border border-canvas-border bg-canvas-card p-3 shadow-card"
      style={anchorStyle}
    >
      <h3 className="mb-2 text-canvas-body-sm font-semibold text-canvas-ink">
        Theme
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {THEME_OPTIONS.map((option) => {
          const palette = THEME_PREVIEW[option.id];
          const selected = canvasTheme === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setCanvasTheme(option.id)}
              className={`group relative overflow-hidden rounded-canvas border text-left transition-colors ${
                selected
                  ? "border-canvas-ink ring-1 ring-canvas-ink"
                  : "border-canvas-border hover:border-canvas-muted"
              }`}
            >
              <div
                className="relative flex h-12 w-full items-center gap-1.5 px-2.5"
                style={{ backgroundColor: palette.bg }}
              >
                <span
                  className="h-6 w-8 rounded-canvas-sm border"
                  style={{
                    backgroundColor: palette.card,
                    borderColor: palette.border,
                  }}
                  aria-hidden
                />
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: palette.accent }}
                  aria-hidden
                />
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: palette.dot }}
                  aria-hidden
                />
              </div>
              <div className="px-2 py-1.5">
                <span className="text-canvas-compact font-medium text-canvas-ink">
                  {option.label}
                </span>
              </div>
              {selected && (
                <span
                  className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-canvas-ink text-canvas-micro text-canvas-card"
                  aria-hidden
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <h3 className="mb-2 mt-3 text-canvas-body-sm font-semibold text-canvas-ink">
        Background
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {backgroundOptions.map((option) => {
          const Preview = BACKGROUND_COMPONENTS[option.id];
          const selected = canvasBackgroundStyle === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setCanvasBackgroundStyle(option.id)}
              className={`group relative overflow-hidden rounded-canvas border text-left transition-colors ${
                selected
                  ? "border-canvas-ink ring-1 ring-canvas-ink"
                  : "border-canvas-border hover:border-canvas-muted"
              }`}
            >
              <div className="relative h-12 w-full overflow-hidden bg-canvas-bg">
                <div className="absolute inset-0 scale-[1] origin-top-left">
                  <Preview animate={false} className="!absolute inset-0" />
                </div>
              </div>
              <div className="px-2 py-1.5">
                <span className="text-canvas-compact font-medium text-canvas-ink">
                  {option.label}
                </span>
              </div>
              {selected && (
                <span
                  className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-canvas-ink text-canvas-micro text-canvas-card"
                  aria-hidden
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <h3 className="mb-2 mt-3 text-canvas-body-sm font-semibold text-canvas-ink">
        Sounds
      </h3>
      <label className="mb-3 flex items-center gap-2 text-canvas-compact text-canvas-ink">
        <input
          type="checkbox"
          checked={soundEnabled}
          onChange={(e) => setSoundEnabled(e.target.checked)}
        />
        UI sounds
      </label>
      <label className="flex items-center gap-3">
        <span className="shrink-0 text-canvas-compact text-canvas-muted">
          Volume
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={soundVolume}
          disabled={!soundEnabled}
          onChange={(e) => setSoundVolume(Number(e.target.value))}
          className="flex-1 disabled:opacity-40"
        />
        <span className="w-8 text-canvas-compact tabular-nums text-canvas-ink">
          {Math.round(soundVolume * 100)}
        </span>
      </label>

      <h3 className="mb-2 mt-3 text-canvas-body-sm font-semibold text-canvas-ink">
        Font
      </h3>
      <CanvasFontSettingsSections />
    </MotionFlowSize>
  );
}
