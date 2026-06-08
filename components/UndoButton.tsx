"use client";

import { UndoIcon } from "@/components/MenuIcons";
import { useClientMounted } from "@/hooks/useClientMounted";
import { useCanvasStore } from "@/lib/store";

export function UndoButton({ variant = "floating" }: { variant?: "floating" | "toolbar" }) {
  const mounted = useClientMounted();
  const canUndo = useCanvasStore((s) => s.undoPast.length > 0);
  const undo = useCanvasStore((s) => s.undo);

  if (!mounted) {
    return (
      <div
        className="pointer-events-none h-9 w-9 shrink-0 rounded-full"
        aria-hidden
      />
    );
  }

  const className =
    variant === "toolbar"
      ? "flex h-9 w-9 items-center justify-center rounded-canvas text-canvas-muted transition-colors hover:bg-canvas-bg hover:text-canvas-ink disabled:cursor-not-allowed disabled:opacity-40"
      : "pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-canvas-border bg-canvas-card text-canvas-muted shadow-card transition-colors hover:bg-canvas-bg hover:text-canvas-ink disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <button
      type="button"
      onClick={() => undo()}
      disabled={!canUndo}
      title="Undo (Ctrl+Z)"
      aria-label="Undo"
      className={className}
    >
      <UndoIcon />
    </button>
  );
}
