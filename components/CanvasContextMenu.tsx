"use client";

import { useEffect, useRef } from "react";
import {
  ContextMenuItem,
  CopyIcon,
  ImageIcon,
  TrashIcon,
  TypeIcon,
  UndoIcon,
} from "@/components/MenuIcons";
import { useCanvasStore } from "@/lib/store";

export interface ContextMenuState {
  screenX: number;
  screenY: number;
  showDelete?: boolean;
  showCopy?: boolean;
  /** Public URL of a right-clicked image asset, offered as a project thumbnail. */
  thumbnailImageUrl?: string;
  /** Whether that image is already the canvas thumbnail (offer "Remove" instead). */
  isCurrentThumbnail?: boolean;
}

interface CanvasContextMenuProps {
  menu: ContextMenuState;
  onClose: () => void;
  onAddText: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onSetThumbnail?: (url: string) => void;
  onRemoveThumbnail?: () => void;
}

export function CanvasContextMenu({
  menu,
  onClose,
  onAddText,
  onDelete,
  onCopy,
  onSetThumbnail,
  onRemoveThumbnail,
}: CanvasContextMenuProps) {
  const undo = useCanvasStore((s) => s.undo);
  const canUndo = useCanvasStore((s) => s.undoPast.length > 0);
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const showDelete = Boolean(menu.showDelete && onDelete && !canvasReadOnly);
  const showCopy = Boolean(menu.showCopy && onCopy);
  const showThumbnail = Boolean(
    menu.thumbnailImageUrl && !canvasReadOnly && onSetThumbnail,
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const el = menuRef.current;
      if (el && el.contains(e.target as Node)) return;
      onClose();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-50 min-w-[200px] overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card py-1 shadow-card"
      style={{ left: menu.screenX, top: menu.screenY }}
    >
      {showDelete && (
        <>
          <ContextMenuItem
            icon={<TrashIcon />}
            label="Delete"
            onClick={() => {
              onDelete?.();
              onClose();
            }}
          />
          <div className="my-1 h-px bg-canvas-border" />
        </>
      )}
      {showCopy && (
        <ContextMenuItem
          icon={<CopyIcon />}
          label="Copy"
          onClick={() => {
            onCopy?.();
            onClose();
          }}
        />
      )}
      {showThumbnail &&
        (menu.isCurrentThumbnail ? (
          <ContextMenuItem
            icon={<ImageIcon />}
            label="Remove as thumbnail"
            onClick={() => {
              onRemoveThumbnail?.();
              onClose();
            }}
          />
        ) : (
          <ContextMenuItem
            icon={<ImageIcon />}
            label="Set as thumbnail"
            onClick={() => {
              if (menu.thumbnailImageUrl) onSetThumbnail?.(menu.thumbnailImageUrl);
              onClose();
            }}
          />
        ))}
      <ContextMenuItem
        icon={<TypeIcon />}
        label="Add text"
        onClick={() => {
          onAddText();
          onClose();
        }}
      />
      <ContextMenuItem
        icon={<UndoIcon />}
        label="Undo"
        disabled={!canUndo}
        onClick={() => {
          undo();
          onClose();
        }}
      />
    </div>
  );
}
