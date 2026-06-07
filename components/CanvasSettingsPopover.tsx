"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  BACKGROUND_COMPONENTS,
  BACKGROUND_OPTIONS,
} from "@/components/canvasBackgrounds/registry";
import { useCanvasStore } from "@/lib/store";

interface Props {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export function CanvasSettingsPopover({ open, onClose, anchorRef }: Props) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const canvasBackgroundStyle = useCanvasStore((s) => s.canvasBackgroundStyle);
  const setCanvasBackgroundStyle = useCanvasStore(
    (s) => s.setCanvasBackgroundStyle,
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
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Canvas settings"
      className="absolute bottom-full left-1/2 z-[60] mb-3 w-[min(calc(100vw-2rem),280px)] -translate-x-1/2 rounded-xl border border-canvas-border bg-canvas-card p-3 shadow-card"
    >
      <h3 className="mb-2 text-[13px] font-semibold text-canvas-ink">
        Background
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {BACKGROUND_OPTIONS.map((option) => {
          const Preview = BACKGROUND_COMPONENTS[option.id];
          const selected = canvasBackgroundStyle === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setCanvasBackgroundStyle(option.id)}
              className={`group relative overflow-hidden rounded-lg border text-left transition-colors ${
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
                <span className="text-[12px] font-medium text-canvas-ink">
                  {option.label}
                </span>
              </div>
              {selected && (
                <span
                  className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-canvas-ink text-[10px] text-canvas-card"
                  aria-hidden
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
