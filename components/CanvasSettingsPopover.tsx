"use client";

import { useCallback, useEffect, useRef } from "react";
import { THEME_OPTIONS } from "@/components/canvasBackgrounds/registry";
import { CanvasFontSettingsSections } from "@/components/CanvasFontPopover";
import { CanvasBackgroundStylePicker } from "@/components/CanvasBackgroundStylePicker";
import { MotionFlowSize } from "@/components/motion/MotionFlowSize";
import { preloadAllCanvasGoogleFonts } from "@/hooks/useCanvasFontLoader";
import { useToolbarPopoverAnchor } from "@/hooks/useToolbarPopoverAnchor";
import { canvasColors, darkCanvasColors } from "@/lib/design/tokens";
import { ARTIFACT_STYLE_PACKS } from "@/lib/design/style/stylePacks";
import { useCanvasStore, type CanvasTheme } from "@/lib/store";

interface Props {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  containerRef: React.RefObject<HTMLElement | null>;
  /** "above" for the bottom toolbar, "below" for the top-right unit. */
  placement?: "above" | "below";
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
  placement = "above",
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
  const canvasArtifactStyle = useCanvasStore((s) => s.canvasArtifactStyle);
  const setCanvasArtifactStyle = useCanvasStore(
    (s) => s.setCanvasArtifactStyle,
  );

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

  return (
    <MotionFlowSize
      ref={popoverRef}
      role="dialog"
      aria-label="Canvas controls"
      className={`absolute z-[60] ${
        placement === "below" ? "top-full mt-3" : "bottom-full mb-3"
      } max-h-[min(70vh,480px)] w-[min(calc(100vw-2rem),300px)] overflow-y-auto rounded-canvas-wrap-13 border border-canvas-border bg-canvas-card p-3 shadow-card`}
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
                  ? "border-canvas-accent ring-1 ring-canvas-accent"
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
                  style={{ backgroundColor: palette.gridDot }}
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
        Styles
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {ARTIFACT_STYLE_PACKS.map((pack) => {
          const selected = canvasArtifactStyle === pack.id;
          const tokens = pack.light;
          const accent = pack.accent ?? "rgb(var(--canvas-accent))";
          // Glass packs preview as translucent frosted chips — solid fill
          // would hide the one thing the pack is about.
          const isGlass = Boolean(pack.backdropFilter);
          // Color-led packs preview as three tone chips — the palette is
          // the one thing those packs are about.
          // Frost previews as itself: a mini frost card with its fall shadow
          // on the field, plus the one lime dot (8.8). Styled in
          // app/styles/frost/frost-cards-menus.css from the Frost tokens.
          const isFrost = pack.bodyFamily === "frost";
          const swatches = isFrost ? undefined : pack.previewSwatches;
          return (
            <button
              key={pack.id}
              type="button"
              aria-pressed={selected}
              title={pack.description}
              onClick={() => setCanvasArtifactStyle(pack.id)}
              className={`group relative overflow-hidden rounded-canvas border text-left transition-colors ${
                selected
                  ? "border-canvas-accent ring-1 ring-canvas-accent"
                  : "border-canvas-border hover:border-canvas-muted"
              }`}
            >
              <div
                className="relative flex h-12 w-full items-center justify-center bg-canvas-bg px-2.5"
                style={
                  swatches && tokens.canvasBg
                    ? { backgroundColor: tokens.canvasBg }
                    : undefined
                }
              >
                {swatches ? (
                  <span
                    className="relative flex h-8 w-full items-stretch gap-1.5"
                    aria-hidden
                  >
                    {swatches.map((hex, i) => (
                      <span
                        key={`${hex}-${i}`}
                        className={i === 0 ? "flex-[1.4]" : "flex-1"}
                        style={{
                          backgroundColor: hex,
                          borderRadius: `calc(${pack.radius} * 0.4)`,
                          border:
                            pack.strokeWidth !== "0px"
                              ? `${pack.strokeWidth} solid ${tokens.stroke}`
                              : undefined,
                          boxShadow:
                            tokens.hardShadow !== "none"
                              ? tokens.hardShadow.replace(/\b3px\b/g, "2px")
                              : undefined,
                        }}
                      />
                    ))}
                  </span>
                ) : null}
                {isFrost && (
                  <span
                    data-artifact-style="frost"
                    data-frost-chip=""
                    className="absolute inset-0 flex items-center justify-center"
                    aria-hidden
                  >
                    <span data-frost-chip-card="">
                      <span data-frost-chip-dot="" />
                      <span data-frost-chip-line="" />
                    </span>
                  </span>
                )}
                {!swatches && !isFrost && isGlass && (
                  <span className="pointer-events-none absolute inset-0" aria-hidden>
                    <span
                      className="absolute left-3 top-1 h-5 w-5 rounded-full opacity-50"
                      style={{ backgroundColor: accent }}
                    />
                    <span
                      className="absolute bottom-1 right-4 h-4 w-4 rounded-full bg-canvas-ink opacity-30"
                    />
                  </span>
                )}
                {!swatches && !isFrost && (
                <span
                  className="relative flex h-8 w-full items-center gap-1.5 px-1.5"
                  style={{
                    backgroundColor: isGlass
                      ? `color-mix(in srgb, ${tokens.cardFill} 55%, transparent)`
                      : tokens.cardFill,
                    border: `${pack.strokeWidth} solid ${
                      isGlass
                        ? `color-mix(in srgb, ${tokens.stroke} 55%, transparent)`
                        : tokens.stroke
                    }`,
                    borderRadius: pack.radius,
                    ...(isGlass
                      ? {
                          backdropFilter: "blur(3px)",
                          WebkitBackdropFilter: "blur(3px)",
                        }
                      : {}),
                    boxShadow: isGlass
                      ? tokens.innerHighlight
                      : tokens.hardShadow !== "none"
                        ? tokens.hardShadow
                        : tokens.chinShadow === "none"
                          ? undefined
                          : tokens.chinShadow,
                  }}
                  aria-hidden
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                  <span
                    className="h-1 flex-1 rounded-full"
                    style={{ backgroundColor: tokens.stroke, opacity: 0.25 }}
                  />
                </span>
                )}
              </div>
              <div className="px-2 py-1.5">
                <span className="text-canvas-compact font-medium text-canvas-ink">
                  {pack.name}
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
        Background style
      </h3>
      <CanvasBackgroundStylePicker />

      <h3 className="mb-2 mt-3 text-canvas-body-sm font-semibold text-canvas-ink">
        Font
      </h3>
      <CanvasFontSettingsSections />
    </MotionFlowSize>
  );
}
