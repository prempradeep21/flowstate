"use client";

import type { CSSProperties, ReactNode } from "react";

/** Translucent radial fill: 20% white at center → 60% at edges. */
export const QA_TRANSLUCENT_FILL_STYLE: CSSProperties = {
  background:
    "radial-gradient(circle at center, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.6) 100%)",
};

/** @deprecated Use QA_TRANSLUCENT_FILL_STYLE */
export const QA_QUESTION_FILL_STYLE = QA_TRANSLUCENT_FILL_STYLE;

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
      className={`relative min-w-0 ${className}`}
      style={{ ...QA_TRANSLUCENT_FILL_STYLE, ...style }}
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
          className="pointer-events-none absolute inset-y-0 left-0 z-10 rounded-l-2xl"
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
