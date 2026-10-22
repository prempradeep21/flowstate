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
    <div data-landing-tip className="flex h-full min-w-0 flex-1 flex-col gap-2 rounded-canvas border border-canvas-border bg-canvas-card p-3 shadow-artifact">
      <div data-landing-tip-icon className="flex h-8 w-8 shrink-0 items-center justify-center rounded-canvas-sm bg-canvas-bg text-canvas-ink">
        {icon}
      </div>
      <p className="text-canvas-caption leading-snug text-canvas-muted">{children}</p>
    </div>
  );
}
