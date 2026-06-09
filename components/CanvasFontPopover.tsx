"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  CANVAS_BODY_FONT_OPTIONS,
  CANVAS_DISPLAY_FONT_OPTIONS,
  type CanvasFontOption,
} from "@/lib/canvasFonts/registry";
import { preloadAllCanvasGoogleFonts } from "@/hooks/useCanvasFontLoader";
import { useToolbarPopoverAnchor } from "@/hooks/useToolbarPopoverAnchor";
import { MotionFlowSize } from "@/components/motion/MotionFlowSize";
import { useCanvasStore } from "@/lib/store";

interface Props {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  containerRef: React.RefObject<HTMLElement | null>;
}

function FontSection({
  title,
  ariaLabel,
  options,
  selectedId,
  onSelect,
}: {
  title: string;
  ariaLabel: string;
  options: CanvasFontOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-1.5 text-canvas-compact font-semibold uppercase tracking-wide text-canvas-muted">
        {title}
      </h3>
      <ul
        role="listbox"
        aria-label={ariaLabel}
        className="flex flex-col gap-0.5"
      >
        {options.map((option) => {
          const selected = selectedId === option.id;
          return (
            <li key={option.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onSelect(option.id)}
                className={`flex w-full items-center justify-between rounded-canvas px-2.5 py-2 text-left transition-colors ${
                  selected
                    ? "bg-canvas-bg text-canvas-ink"
                    : "text-canvas-ink hover:bg-canvas-bg/70"
                }`}
              >
                <span
                  className="text-canvas-body-sm font-medium"
                  style={{ fontFamily: option.family }}
                >
                  {option.label}
                </span>
                {selected && (
                  <span
                    className="ml-2 shrink-0 text-canvas-caption text-canvas-muted"
                    aria-hidden
                  >
                    ✓
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CanvasFontPopover({
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
  const bodyFontId = useCanvasStore((s) => s.canvasPreviewBodyFontId);
  const displayFontId = useCanvasStore((s) => s.canvasPreviewDisplayFontId);
  const setBodyFontId = useCanvasStore((s) => s.setCanvasPreviewBodyFontId);
  const setDisplayFontId = useCanvasStore(
    (s) => s.setCanvasPreviewDisplayFontId,
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
  }, [open]);

  useEffect(() => {
    if (!open) return;
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
      aria-label="Font preview"
      className="absolute bottom-full z-[60] mb-3 max-h-[min(70vh,420px)] w-[min(calc(100vw-2rem),300px)] -translate-x-1/2 overflow-y-auto rounded-canvas border border-canvas-border bg-canvas-card p-3 shadow-card"
      style={anchorStyle}
    >
      <div className="flex flex-col gap-4">
        <FontSection
          title="Body"
          ariaLabel="Body font"
          options={CANVAS_BODY_FONT_OPTIONS}
          selectedId={bodyFontId}
          onSelect={setBodyFontId}
        />
        <div className="h-px bg-canvas-border" aria-hidden />
        <FontSection
          title="Display"
          ariaLabel="Display font"
          options={CANVAS_DISPLAY_FONT_OPTIONS}
          selectedId={displayFontId}
          onSelect={setDisplayFontId}
        />
      </div>
    </MotionFlowSize>
  );
}
