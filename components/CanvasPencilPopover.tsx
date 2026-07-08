"use client";

import { useCallback, useEffect, useRef } from "react";
import { MotionOverlayPopover } from "@/components/motion/MotionOverlay";
import { PencilIcon } from "@/components/MenuIcons";
import { useToolbarPopoverAnchor } from "@/hooks/useToolbarPopoverAnchor";
import { PENCIL_COLORS } from "@/lib/canvasStroke";

interface Props {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  containerRef: React.RefObject<HTMLElement | null>;
  active: boolean;
  color: string;
  onToggle: () => void;
  onColorChange: (color: string) => void;
  disabled?: boolean;
}

const colorBtn =
  "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110";

export function CanvasPencilPopover({
  open,
  onClose,
  anchorRef,
  containerRef,
  active,
  color,
  onToggle,
  onColorChange,
  disabled,
}: Props) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const anchorStyle = useToolbarPopoverAnchor(
    anchorRef,
    containerRef,
    open,
    popoverRef,
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
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [open, handlePointerDown]);

  return (
    <MotionOverlayPopover
      isOpen={open}
      className="pointer-events-auto absolute bottom-full z-[60] mb-2 min-w-[160px] -translate-x-1/2 rounded-canvas border border-canvas-border bg-canvas-card p-2 shadow-card"
      style={{ transformOrigin: "bottom center", ...anchorStyle }}
    >
      <div ref={popoverRef} className="flex flex-col gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onToggle}
          className={`flex w-full items-center gap-2 rounded-canvas px-2.5 py-2 text-left text-canvas-body-sm font-medium transition-colors hover:bg-canvas-bg disabled:cursor-not-allowed disabled:opacity-40 ${
            active ? "bg-canvas-bg text-canvas-ink" : "text-canvas-ink"
          }`}
        >
          <PencilIcon />
          {active ? "Stop drawing" : "Start drawing"}
        </button>
        <div className="flex flex-wrap gap-2 px-1">
          {PENCIL_COLORS.map((swatch) => (
            <button
              key={swatch}
              type="button"
              disabled={disabled}
              aria-label={`Color ${swatch}`}
              aria-pressed={color === swatch}
              className={colorBtn}
              style={{
                backgroundColor: swatch,
                borderColor: color === swatch ? "#fff" : "transparent",
                boxShadow:
                  color === swatch
                    ? "0 0 0 1px var(--canvas-border, #888)"
                    : undefined,
              }}
              onClick={() => onColorChange(swatch)}
            />
          ))}
        </div>
      </div>
    </MotionOverlayPopover>
  );
}
