"use client";

import { useEffect, useRef } from "react";
import {
  ContextMenuItem,
  LayoutGridIcon,
  UndoIcon,
} from "@/components/MenuIcons";
import { useCanvasStore } from "@/lib/store";

export interface ContextMenuState {
  screenX: number;
  screenY: number;
}

interface CanvasContextMenuProps {
  menu: ContextMenuState;
  onClose: () => void;
}

export function CanvasContextMenu({ menu, onClose }: CanvasContextMenuProps) {
  const autoLayoutCanvas = useCanvasStore((s) => s.autoLayoutCanvas);
  const undo = useCanvasStore((s) => s.undo);
  const canUndo = useCanvasStore((s) => s.undoPast.length > 0);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
      className="fixed z-50 min-w-[200px] overflow-hidden rounded-lg border border-canvas-border bg-canvas-card py-1 shadow-card"
      style={{ left: menu.screenX, top: menu.screenY }}
    >
      <ContextMenuItem
        icon={<LayoutGridIcon />}
        label="Auto layout"
        onClick={() => {
          autoLayoutCanvas();
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
