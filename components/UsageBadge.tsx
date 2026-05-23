"use client";

import { useCanvasStore } from "@/lib/store";
import { useApiKey } from "@/lib/useApiKey";

export function UsageBadge() {
  const { inputTokens, outputTokens } = useCanvasStore((s) => s.sessionUsage);
  const { clearApiKey } = useApiKey();
  const total = inputTokens + outputTokens;

  if (total === 0) return null;

  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-canvas-border bg-canvas-card px-3 py-1.5 shadow-card">
      <span className="text-[11px] text-canvas-muted">
        ↑ {fmt(inputTokens)} &nbsp;↓ {fmt(outputTokens)} tokens
      </span>
      <button
        type="button"
        onClick={clearApiKey}
        title="Clear API key and sign out"
        className="text-[11px] text-canvas-muted/60 hover:text-canvas-ink transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
