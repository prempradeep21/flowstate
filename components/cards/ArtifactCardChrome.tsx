"use client";

import type { ReactNode } from "react";

const TYPE_ICONS: Record<string, ReactNode> = {
  table: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="2" y="2" width="12" height="12" rx="1" />
      <path d="M2 6h12M2 10h12M6 2v12" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="2" y="3" width="12" height="10" rx="1" />
      <circle cx="5.5" cy="6.5" r="1" />
      <path d="M14 11l-3-3-4 4-2-2-3 3" />
    </svg>
  ),
  video: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="2" y="4" width="12" height="8" rx="1" />
      <path d="M7 7l3 2-3 2V7z" fill="currentColor" stroke="none" />
    </svg>
  ),
  code: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M5 4L2 8l3 4M11 4l3 4-3 4" />
    </svg>
  ),
  custom: (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="2" y="2" width="5" height="5" rx="0.5" />
      <rect x="9" y="2" width="5" height="5" rx="0.5" />
      <rect x="2" y="9" width="5" height="5" rx="0.5" />
      <rect x="9" y="9" width="5" height="5" rx="0.5" />
    </svg>
  ),
  "3d": (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M8 2l5 3v6l-5 3-5-3V5l5-3z" />
      <path d="M8 8l5-3M8 8v6M8 8L3 5" />
    </svg>
  ),
};

interface ArtifactCardChromeProps {
  type: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function ArtifactCardChrome({
  type,
  title,
  description,
  action,
  children,
}: ArtifactCardChromeProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 shrink-0 text-canvas-muted">
            {TYPE_ICONS[type] ?? TYPE_ICONS.custom}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-canvas-body-lg font-semibold text-canvas-ink">
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-canvas-body-sm leading-snug text-canvas-muted">
                {description}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
