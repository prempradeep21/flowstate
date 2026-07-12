"use client";

import { MODELS } from "@/lib/models";
import { useCanvasStore } from "@/lib/store";

/**
 * Compact model selector shown inline in the chat composer — so model choice is
 * available on every chat surface (new + follow-up), not just the sidebar.
 *
 * Backed by the global `selectedModel`, so the choice applies to all cards and
 * decides the provider: Claude ids run the native Anthropic path, everything
 * else routes through OpenRouter (see getModelProvider / app/api/chat/route.ts).
 */
export function ComposerModelPicker({ disabled = false }: { disabled?: boolean }) {
  const selectedModel = useCanvasStore((s) => s.selectedModel);
  const setModel = useCanvasStore((s) => s.setModel);

  const anthropic = MODELS.filter((m) => m.provider === "anthropic");
  const openrouter = MODELS.filter((m) => m.provider === "openrouter");

  return (
    <select
      value={selectedModel}
      onChange={(e) => setModel(e.target.value)}
      disabled={disabled}
      aria-label="Model"
      title="Model for this and future questions (Claude → Anthropic, others → OpenRouter)"
      className="max-w-[8.5rem] shrink-0 truncate rounded-full border border-canvas-border bg-canvas-bg px-2 py-1 text-canvas-micro text-canvas-muted outline-none transition-colors hover:border-canvas-muted hover:text-canvas-ink focus:border-canvas-muted disabled:opacity-40"
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
  );
}
