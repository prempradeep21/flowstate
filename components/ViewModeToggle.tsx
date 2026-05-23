"use client";

import { AppViewMode, useCanvasStore } from "@/lib/store";

export function ViewModeToggle() {
  const viewMode = useCanvasStore((s) => s.viewMode);
  const setViewMode = useCanvasStore((s) => s.setViewMode);

  const modes: { id: AppViewMode; label: string }[] = [
    { id: "canvas", label: "Canvas" },
    { id: "chat", label: "Chat view" },
  ];

  return (
    <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-canvas-border bg-canvas-card px-1 py-1 shadow-card">
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => setViewMode(m.id)}
          className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
            viewMode === m.id
              ? "bg-canvas-ink text-canvas-card"
              : "text-canvas-muted hover:text-canvas-ink"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
