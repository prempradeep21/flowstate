"use client";

import { useEffect, useState } from "react";
import { formatPendingStatusLabel } from "@/lib/qaStreamDisplay";
import {
  formatElapsedMs,
  formatTurnUsageLine,
} from "@/lib/qaTurnMetrics";
import { useCanvasStore } from "@/lib/store";

function useElapsedMs(startedAt: number | undefined): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.max(0, Date.now() - startedAt));
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [startedAt]);

  return elapsed;
}

export function PendingAnswerPlaceholder({
  cardId,
  thinkingLabel,
  className = "",
}: {
  cardId: string;
  thinkingLabel?: string;
  className?: string;
}) {
  const askStartedAt = useCanvasStore((s) => s.cards[cardId]?.askStartedAt);
  const turnUsage = useCanvasStore((s) => s.cards[cardId]?.turnUsage);
  const elapsedMs = useElapsedMs(askStartedAt);
  const label = formatPendingStatusLabel(thinkingLabel);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className}`}
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="switch-dot h-2 w-2 rounded-full bg-canvas-muted"
            style={{ animationDelay: `${i * 0.15}s` }}
            aria-hidden
          />
        ))}
      </div>
      <p className="max-w-xs text-center text-canvas-body-sm text-canvas-muted">
        {label}
      </p>
      <div className="flex flex-col items-center gap-0.5 text-canvas-caption text-canvas-muted/80 tabular-nums">
        <span>{formatElapsedMs(elapsedMs)}</span>
        <span>{formatTurnUsageLine(turnUsage)}</span>
      </div>
    </div>
  );
}
