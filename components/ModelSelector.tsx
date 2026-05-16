"use client";

import { ClaudeModel, useCanvasStore } from "@/lib/store";

const MODELS: { value: ClaudeModel; label: string }[] = [
  { value: "claude-opus-4-7", label: "Opus" },
  { value: "claude-sonnet-4-6", label: "Sonnet" },
  { value: "claude-haiku-4-5-20251001", label: "Haiku" },
];

export function ModelSelector() {
  const selectedModel = useCanvasStore((s) => s.selectedModel);
  const setModel = useCanvasStore((s) => s.setModel);

  return (
    <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-canvas-border bg-canvas-card px-1 py-1 shadow-card">
      {MODELS.map((m) => (
        <button
          key={m.value}
          type="button"
          onClick={() => setModel(m.value)}
          className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
            m.value === selectedModel
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
