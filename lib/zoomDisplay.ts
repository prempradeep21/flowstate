import type { CSSProperties } from "react";

/** Matches `MIN_SCALE` in the canvas store. */
export const MIN_VIEWPORT_SCALE = 0.25;

/** Max height (px) for question + answer when fully zoomed in. */
export const CARD_QA_MAX_HEIGHT = 500;

/** Below this scale, hide follow-up input and image grids. */
export const ZOOM_HIDE_CHROME = 0.52;

/** Below this scale, hide section labels (Question / Answer). */
export const ZOOM_HIDE_LABELS = 0.65;

/** Below this scale, hide the divider between question and answer. */
export const ZOOM_HIDE_DIVIDER = 0.6;

/** 0 = most zoomed out, 1 = fully expanded (scale ≥ 1). */
export function zoomRevealT(scale: number): number {
  if (scale >= 1) return 1;
  if (scale <= MIN_VIEWPORT_SCALE) return 0;
  return (scale - MIN_VIEWPORT_SCALE) / (1 - MIN_VIEWPORT_SCALE);
}

/**
 * Visible line count for question/answer at this zoom.
 * `null` = no clamp (full content). At min zoom → 1 line.
 */
export function zoomLineClamp(scale: number): number | null {
  if (scale >= 1) return null;
  return Math.max(
    1,
    Math.round(scale / MIN_VIEWPORT_SCALE),
  );
}

/** True when the card shows full content in a scrollable panel (scale ≥ 1). */
export function isExpandedCardContent(scale: number) {
  return zoomLineClamp(scale) === null;
}

export function shouldHideLabels(scale: number) {
  return scale < ZOOM_HIDE_LABELS;
}

export function shouldHideDivider(scale: number) {
  return scale < ZOOM_HIDE_DIVIDER;
}

export function shouldHideFollowUp(scale: number) {
  return scale < ZOOM_HIDE_CHROME;
}

export function shouldHideImages(scale: number) {
  return scale < 0.85;
}

/** Section padding in px — shrinks as you zoom out. */
export function zoomSectionInsets(scale: number) {
  const t = zoomRevealT(scale);
  return {
    question: {
      paddingTop: 4 + 12 * t,
      paddingBottom: 2 + 10 * t,
      paddingLeft: 16,
      paddingRight: 16,
    },
    answer: {
      paddingTop: 2 + 14 * t,
      paddingBottom: 4 + 12 * t,
      paddingLeft: 16,
      paddingRight: 16,
    },
  };
}

/** @deprecated Use zoomLineClamp / shouldHideLabels */
export const ZOOM_SUMMARY_ONLY = ZOOM_HIDE_CHROME;
export const ZOOM_TWO_LINE_SUMMARY = 0.72;

export function isSummaryOnlyMode(scale: number) {
  return scale < ZOOM_HIDE_CHROME;
}

export function isGodViewMode(scale: number) {
  return scale < ZOOM_HIDE_CHROME;
}

export function summaryLineClamp(scale: number): 2 | 4 {
  const lines = zoomLineClamp(scale);
  if (lines === null || lines >= 4) return 4;
  if (lines >= 2) return 2;
  return 2;
}

export function counterScaleFactor(scale: number) {
  return scale > 0 ? 1 / scale : 1;
}

export function compensatedStrokeWidth(
  screenPx: number,
  scale: number,
  baseWhenZoomedIn = screenPx,
) {
  if (scale >= 1) return baseWhenZoomedIn;
  return screenPx / scale;
}

/** World-space length so a stroke dash/gap stays ~screenPx wide on screen at any zoom. */
export function worldLengthFromScreen(screenPx: number, scale: number) {
  return scale > 0 ? screenPx / scale : screenPx;
}

export function compactThinkingWord(label: string) {
  const trimmed = label.trim();
  if (!trimmed) return "Thinking";
  return trimmed.split(/\s+/)[0];
}

/** CSS for -webkit-line-clamp when line count is limited. */
export function lineClampStyle(lines: number | null): CSSProperties | undefined {
  if (lines === null) return undefined;
  return {
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };
}
