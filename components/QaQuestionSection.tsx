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

/** Fixed height for collaborator + control slots in the question header row. */
export const QA_QUESTION_HEADER_ROW_HEIGHT_PX = 32;

interface QaQuestionHeaderRowProps {
  collaborators?: ReactNode;
  controls: ReactNode;
  className?: string;
}

/** Reserves fixed-height slots for collaborators (left) and card controls (right). */
export function QaQuestionHeaderRow({
  collaborators,
  controls,
  className = "",
}: QaQuestionHeaderRowProps) {
  return (
    <div
      className={`mb-2 flex shrink-0 items-center justify-between gap-2 ${className}`}
      style={{ height: QA_QUESTION_HEADER_ROW_HEIGHT_PX }}
    >
      <div
        className="flex min-w-0 flex-1 items-center"
        style={{ height: QA_QUESTION_HEADER_ROW_HEIGHT_PX }}
      >
        {collaborators}
      </div>
      <div
        className="flex shrink-0 items-center justify-end"
        style={{ height: QA_QUESTION_HEADER_ROW_HEIGHT_PX }}
      >
        {controls}
      </div>
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
