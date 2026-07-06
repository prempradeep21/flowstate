import type { CSSProperties } from "react";

import { canvasSpacing } from "@/lib/design/tokens";

/**
 * Canvas inset tiers — one meaning per size:
 * - `compact` (12px): asset chips, floating chrome — tight nodes on the canvas grid
 * - `section` (16px): Q&A blocks and panel bodies — readable content regions
 * - `artifactChrome` (16px): horizontal inset on canvas artifact header row
 */
export { canvasSpacing };

/** Collapsed question summary — doubled from the legacy ~140px text column. */
export const QA_COLLAPSED_QUESTION_TEXT_MAX_WIDTH_PX = 280;

/** Document/code asset title column — doubled from ~128px effective width. */
export const CANVAS_ASSET_TITLE_MAX_WIDTH_PX = 256;

export const CANVAS_ASSET_ICON_SIZE_PX = 40;

const qaInsets = {
  question: {
    top: canvasSpacing.section,
    bottom: canvasSpacing.section - 4,
    left: canvasSpacing.section,
    right: canvasSpacing.section,
  },
  questionCollapsed: {
    top: canvasSpacing.section,
    bottom: canvasSpacing.section,
    left: canvasSpacing.section,
    right: canvasSpacing.section,
  },
  answer: {
    top: canvasSpacing.section,
    bottom: canvasSpacing.section,
    left: canvasSpacing.section,
    right: canvasSpacing.section,
  },
  chatPanel: {
    top: canvasSpacing.section,
    bottom: canvasSpacing.section,
    left: canvasSpacing.section,
    right: canvasSpacing.section,
  },
  /** Empty question card — composer inset inside the card border. */
  emptyComposer: {
    top: canvasSpacing.compact,
    bottom: canvasSpacing.compact,
    left: canvasSpacing.section,
    right: canvasSpacing.section,
  },
} as const;

export type QaInsetVariant = keyof typeof qaInsets;

export function qaInsetStyle(variant: QaInsetVariant): CSSProperties {
  const inset = qaInsets[variant];
  return {
    paddingTop: inset.top,
    paddingBottom: inset.bottom,
    paddingLeft: inset.left,
    paddingRight: inset.right,
  };
}
