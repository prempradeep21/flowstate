"use client";

import type { CSSProperties, ReactNode } from "react";

/** Shared translucent radial fill: 10% white at center → 30% at edges. */
export const CANVAS_TRANSLUCENT_FILL_CLASS = "canvas-translucent-fill";

interface QaTranslucentSurfaceProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** Wraps Q&A content (question + answer) in the shared translucent fill. */
export function QaTranslucentSurface({
  children,
  className = "",
  style,
}: QaTranslucentSurfaceProps) {
  return (
    <div
      className={`relative min-w-0 ${CANVAS_TRANSLUCENT_FILL_CLASS} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

interface QaQuestionSectionProps {
  children: ReactNode;
  accentColour?: string;
  accentWidth?: number;
  className?: string;
  style?: CSSProperties;
}

/** Question block with optional thread accent stroke (question height only). */
export function QaQuestionSection({
  children,
  accentColour,
  accentWidth = 3,
  className = "",
  style,
}: QaQuestionSectionProps) {
  return (
    <div
      data-card-question
      className={`relative min-w-0 shrink-0 ${className}`}
      style={style}
    >
      {accentColour && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 rounded-l-canvas"
          style={{
            background: accentColour,
            width: accentWidth,
          }}
        />
      )}
      {children}
    </div>
  );
}
