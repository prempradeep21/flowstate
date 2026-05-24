"use client";

import { AppViewMode, useCanvasStore } from "@/lib/store";

export function ViewModeToggle() {
  const viewMode = useCanvasStore((s) => s.viewMode);
  const setViewMode = useCanvasStore((s) => s.setViewMode);

  const modes: { id: AppViewMode; label: string }[] = [
    { id: "canvas", label: "Branch view" },
    { id: "chat", label: "Chat view" },
  ];

  return (
    <div className="flex w-full flex-col gap-1">
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => setViewMode(m.id)}
          className={`w-full rounded-lg px-3 py-2 text-left text-[12px] font-medium transition-colors ${
            viewMode === m.id
              ? "bg-canvas-ink text-canvas-card"
              : "text-canvas-muted hover:bg-canvas-bg hover:text-canvas-ink"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
