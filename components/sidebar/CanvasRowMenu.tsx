"use client";

import { useEffect, useRef, useState } from "react";
import { ContextMenuItem } from "@/components/MenuIcons";

interface CanvasRowMenuProps {
  onRename: () => void;
  onOpenChange?: (open: boolean) => void;
}

function DotsIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="currentColor"
    >
      <circle cx="8" cy="3.25" r="1.25" />
      <circle cx="8" cy="8" r="1.25" />
      <circle cx="8" cy="12.75" r="1.25" />
    </svg>
  );
}

function RenameIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path
        d="M10.5 2.5 13.5 5.5 5.5 13.5H2.5V10.5L10.5 2.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CanvasRowMenu({ onRename, onOpenChange }: CanvasRowMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onOpenChange?.(open);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (el && el.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Canvas actions"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className={`flex h-7 w-7 items-center justify-center rounded-canvas text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink ${
          open ? "bg-canvas-bg text-canvas-ink" : ""
        }`}
      >
        <DotsIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card py-1 shadow-card"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ContextMenuItem
            icon={<RenameIcon />}
            label="Rename"
            onClick={() => {
              onRename();
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
