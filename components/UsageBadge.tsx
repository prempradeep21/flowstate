"use client";

import { useCanvasStore } from "@/lib/store";

export function UsageBadge() {
  const { inputTokens, outputTokens } = useCanvasStore((s) => s.sessionUsage);
  const total = inputTokens + outputTokens;

  if (total === 0) return null;

  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-canvas-border bg-canvas-card px-3 py-1.5 shadow-card">
      <span className="text-canvas-caption text-canvas-muted">
        ↑ {fmt(inputTokens)} &nbsp;↓ {fmt(outputTokens)} tokens
      </span>
    </div>
  );
}
