"use client";

import { useCallback, useEffect, useRef } from "react";
import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import { QuestionIcon } from "@/components/MenuIcons";
import { MotionOverlayPopover } from "@/components/motion/MotionOverlay";
import { useToolbarPopoverAnchor } from "@/hooks/useToolbarPopoverAnchor";
import {
  MANUAL_ARTIFACT_MENU_ITEMS,
  type ManualArtifactMenuPick,
} from "@/lib/manualArtifactMenu";

interface Props {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  containerRef: React.RefObject<HTMLElement | null>;
  onPick: (pick: ManualArtifactMenuPick) => void;
  disabled?: boolean;
}

const menuBtn =
  "flex w-full items-center gap-2.5 rounded-canvas px-2.5 py-2 text-left text-canvas-body-sm font-medium text-canvas-ink transition-colors hover:bg-canvas-bg disabled:cursor-not-allowed disabled:opacity-40";

export function CanvasArtifactMenu({
  open,
  onClose,
  anchorRef,
  containerRef,
  onPick,
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
      className="pointer-events-auto absolute bottom-full z-[60] mb-2 max-h-[min(70vh,420px)] min-w-[180px] -translate-x-1/2 overflow-y-auto rounded-canvas border border-canvas-border bg-canvas-card p-1 shadow-card"
      style={{ transformOrigin: "bottom center", ...anchorStyle }}
    >
      <div ref={popoverRef} role="menu" aria-label="Add artefact">
        {MANUAL_ARTIFACT_MENU_ITEMS.map((entry) => (
          <button
            key={entry.label}
            type="button"
            role="menuitem"
            disabled={disabled}
            className={menuBtn}
            onClick={() => {
              onPick(entry.pick);
              onClose();
            }}
          >
            <span className="text-canvas-muted">
              {entry.iconKind === "question" ? (
                <QuestionIcon />
              ) : (
                <ArtifactTypeIcon kind={entry.iconKind} />
              )}
            </span>
            {entry.label}
          </button>
        ))}
      </div>
    </MotionOverlayPopover>
  );
}
