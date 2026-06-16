"use client";

import { MODELS } from "@/lib/models";
import { useCanvasStore } from "@/lib/store";

/** Compact model selector grouped by provider (Anthropic / OpenRouter). */
export function ModelPicker() {
  const selectedModel = useCanvasStore((s) => s.selectedModel);
  const setModel = useCanvasStore((s) => s.setModel);

  const anthropic = MODELS.filter((m) => m.provider === "anthropic");
  const openrouter = MODELS.filter((m) => m.provider === "openrouter");

  return (
    <label className="flex items-center gap-2 text-xs text-canvas-muted">
      <span className="shrink-0">Model</span>
      <select
        value={selectedModel}
        onChange={(e) => setModel(e.target.value)}
        className="min-w-0 flex-1 rounded-canvas border border-canvas-border bg-canvas-bg px-2 py-1.5 text-xs text-canvas-ink outline-none transition-colors hover:border-canvas-muted focus:border-canvas-muted"
      >
        <optgroup label="Anthropic">
          {anthropic.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="OpenRouter">
          {openrouter.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
              {m.supportsTools ? "" : " (text only)"}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}
