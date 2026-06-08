"use client";

import { formatPendingStatusLabel } from "@/lib/qaStreamDisplay";

export function PendingAnswerPlaceholder({
  thinkingLabel,
  className = "",
}: {
  thinkingLabel?: string;
  className?: string;
}) {
  const label = formatPendingStatusLabel(thinkingLabel);

  return (
    <div
      className={`flex items-center gap-2.5 text-canvas-body leading-relaxed text-canvas-muted ${className}`}
      aria-live="polite"
      aria-busy="true"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-canvas-accent/60 opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-canvas-accent" />
      </span>
      <span className="animate-pulse">{label}</span>
    </div>
  );
}
