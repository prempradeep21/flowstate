"use client";

import type { ReactNode } from "react";

export function LandingTipCard({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-canvas border border-canvas-border bg-canvas-card p-3 shadow-card">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-canvas bg-canvas-bg text-canvas-ink">
        {icon}
      </div>
      <p className="text-canvas-caption leading-snug text-canvas-muted">{children}</p>
    </div>
  );
}
