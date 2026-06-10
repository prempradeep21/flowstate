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
      className={`flex items-center justify-center gap-1.5 ${className}`}
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="switch-dot h-2 w-2 rounded-full bg-canvas-muted"
          style={{ animationDelay: `${i * 0.15}s` }}
          aria-hidden
        />
      ))}
    </div>
  );
}
