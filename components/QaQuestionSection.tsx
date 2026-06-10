"use client";

import type { CSSProperties, ReactNode } from "react";

import { canvasSpacing } from "@/lib/design/tokens";

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
  /** `header` = expanded card with control row; `compact` = collapsed summary row. */
  accentBandVariant?: "header" | "compact";
  className?: string;
  style?: CSSProperties;
}

/**
 * Accent band height: question paddingTop (16) + header row (32). Fixed so the
 * band only spans the icon header zone, never the question text below it.
 */
export const QA_QUESTION_ACCENT_BAND_HEIGHT_PX =
  canvasSpacing.section + QA_QUESTION_HEADER_ROW_HEIGHT_PX;

/** Collapsed summary — one text line + section inset (no separate header row). */
export const QA_QUESTION_COMPACT_ACCENT_BAND_HEIGHT_PX =
  canvasSpacing.section + 24;

/** Question block with a fixed-height diffused accent glow at the top left. */
export function QaQuestionSection({
  children,
  accentColour,
  accentWidth = 3,
  accentBandVariant = "header",
  className = "",
  style,
}: QaQuestionSectionProps) {
  // Wide band, heavily blurred and only quarter-clipped by the card's
  // overflow-hidden edge so most of the diffused colour sits on the card.
  const bandWidth = accentWidth * 5;
  const accentBandHeightPx =
    accentBandVariant === "compact"
      ? QA_QUESTION_COMPACT_ACCENT_BAND_HEIGHT_PX
      : QA_QUESTION_ACCENT_BAND_HEIGHT_PX;
  return (
    <div
      data-card-question
      className={`relative min-w-0 shrink-0 ${className}`}
      style={style}
    >
      {accentColour && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 z-10"
          style={{
            background: accentColour,
            left: -bandWidth / 4,
            width: bandWidth,
            height: accentBandHeightPx,
            filter: "blur(20px)",
            opacity: 0.425,
          }}
        />
      )}
      {children}
    </div>
  );
}
