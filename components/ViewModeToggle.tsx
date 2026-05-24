"use client";

import { AppViewMode, useCanvasStore } from "@/lib/store";

export function ViewModeToggle() {
  const viewMode = useCanvasStore((s) => s.viewMode);
  const setViewMode = useCanvasStore((s) => s.setViewMode);

  return (
    <div className="flex w-full rounded-lg bg-canvas-bg p-1">
      <button
        type="button"
        onClick={() => setViewMode("canvas")}
        className={`flex-1 rounded-md px-3 py-2 text-center text-[18px] font-medium transition-colors ${
          viewMode === "canvas"
            ? "bg-canvas-ink text-canvas-card shadow-card"
            : "text-canvas-muted hover:text-canvas-ink"
        }`}
      >
        Canvas view
      </button>
      <button
        type="button"
        onClick={() => setViewMode("chat")}
        className={`flex-1 rounded-md px-3 py-2 text-center text-[18px] font-medium transition-colors ${
          viewMode === "chat"
            ? "bg-canvas-ink text-canvas-card shadow-card"
            : "text-canvas-muted hover:text-canvas-ink"
        }`}
      >
        Chat view
      </button>
    </div>
  );
}
