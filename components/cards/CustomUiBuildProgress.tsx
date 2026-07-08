"use client";

import { useEffect, useState } from "react";
import { formatElapsedMs, formatTurnUsageLine } from "@/lib/qaTurnMetrics";
import type { SdkBuildStage } from "@/lib/cursorSdk/buildProgressTypes";
import { useCanvasStore } from "@/lib/store";

function stageIcon(status: SdkBuildStage["status"]): string {
  switch (status) {
    case "done":
      return "✓";
    case "active":
      return "●";
    case "error":
      return "!";
    default:
      return "○";
  }
}

function stageClass(status: SdkBuildStage["status"]): string {
  switch (status) {
    case "done":
      return "text-canvas-accent";
    case "active":
      return "text-canvas-body text-canvas-fg";
    case "error":
      return "text-red-500";
    default:
      return "text-canvas-muted/70";
  }
}

export function CustomUiBuildProgress({
  cardId,
  stages,
  thinkingLabel,
  className = "",
}: {
  cardId: string;
  stages: SdkBuildStage[];
  thinkingLabel?: string;
  className?: string;
}) {
  const askStartedAt = useCanvasStore((s) => s.cards[cardId]?.askStartedAt);
  const turnUsage = useCanvasStore((s) => s.cards[cardId]?.turnUsage);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!askStartedAt) {
      setElapsedMs(0);
      return;
    }
    const tick = () => setElapsedMs(Math.max(0, Date.now() - askStartedAt));
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [askStartedAt]);

  return (
    <div
      className={`flex w-full max-w-sm flex-col gap-3 ${className}`}
      aria-live="polite"
      aria-busy="true"
      aria-label={thinkingLabel ?? "Building custom UI"}
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
      {thinkingLabel ? (
        <p className="text-center text-canvas-body-sm font-medium text-canvas-fg">
          {thinkingLabel}
        </p>
      ) : null}
      <ol className="flex flex-col gap-1.5 rounded-canvas border border-canvas-border bg-canvas-card/60 px-3 py-2.5 text-left">
        {stages.map((stage) => (
          <li
            key={stage.id}
            className={`flex flex-col gap-0.5 text-canvas-caption ${stageClass(stage.status)}`}
          >
            <span className="flex items-start gap-2">
              <span className="mt-px w-3 shrink-0 tabular-nums" aria-hidden>
                {stageIcon(stage.status)}
              </span>
              <span className={stage.status === "active" ? "font-medium" : ""}>
                {stage.label}
              </span>
            </span>
            {stage.detail ? (
              <span className="ml-5 text-canvas-muted/90">{stage.detail}</span>
            ) : null}
          </li>
        ))}
      </ol>
      <div className="flex flex-col items-center gap-0.5 text-canvas-caption text-canvas-muted/80 tabular-nums">
        <span>{formatElapsedMs(elapsedMs)}</span>
        <span>{formatTurnUsageLine(turnUsage)}</span>
      </div>
    </div>
  );
}
