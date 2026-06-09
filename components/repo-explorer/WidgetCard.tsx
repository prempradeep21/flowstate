"use client";

import type { ReactNode } from "react";

export function WidgetCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card shadow-card ${className}`}
    >
      <header className="border-b border-canvas-border px-4 py-3">
        <h2 className="text-canvas-body-lg font-medium text-canvas-ink">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-canvas-compact text-canvas-muted">{subtitle}</p>
        ) : null}
      </header>
      <div className="flex min-h-0 flex-1 flex-col p-4">{children}</div>
    </section>
  );
}

export function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-canvas-sm bg-canvas-artifactStage px-3 py-2">
      <div className="text-canvas-caption uppercase tracking-wide text-canvas-muted">
        {label}
      </div>
      <div className="mt-0.5 text-canvas-body-lg font-medium tabular-nums text-canvas-ink">
        {value}
      </div>
    </div>
  );
}

export function TagChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-canvas-artifactIconBg px-2.5 py-0.5 text-canvas-compact font-medium text-canvas-accent">
      {label}
    </span>
  );
}

export function WidgetSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded-canvas-xs bg-canvas-artifactStage"
          style={{ width: `${70 + (i % 3) * 10}%` }}
        />
      ))}
    </div>
  );
}
