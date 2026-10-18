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
    </div>
  );
}
