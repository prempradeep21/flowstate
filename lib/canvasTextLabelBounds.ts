import type { CanvasTextLabel } from "@/lib/store";

export const MIN_TEXT_LABEL_FONT_SIZE = 12;
export const MAX_TEXT_LABEL_FONT_SIZE = 200;
export const MIN_TEXT_LABEL_WIDTH = 40;
export const MAX_TEXT_LABEL_WIDTH = 2400;

const CHAR_WIDTH_RATIO = 0.55;
const LINE_HEIGHT_RATIO = 1.25;

export function clampTextLabelFontSize(fontSize: number): number {
  return Math.min(
    MAX_TEXT_LABEL_FONT_SIZE,
    Math.max(MIN_TEXT_LABEL_FONT_SIZE, fontSize),
  );
}

export function clampTextLabelWidth(width: number): number {
  return Math.min(
    MAX_TEXT_LABEL_WIDTH,
    Math.max(MIN_TEXT_LABEL_WIDTH, width),
  );
}

export function estimateAutoTextLabelWidth(label: CanvasTextLabel): number {
  const charWidth = label.fontSize * CHAR_WIDTH_RATIO;
  const lines = label.text.split("\n");
  const longestLine = lines.reduce(
    (max, line) => Math.max(max, line.length * charWidth),
    0,
  );
  return Math.max(label.fontSize * 2, longestLine);
}

export function getTextLabelWidth(label: CanvasTextLabel): number {
  return label.width ?? estimateAutoTextLabelWidth(label);
}

export function estimateTextLabelBounds(label: CanvasTextLabel): {
  w: number;
  h: number;
} {
  const charWidth = label.fontSize * CHAR_WIDTH_RATIO;
  const lineHeight = label.fontSize * LINE_HEIGHT_RATIO;
  const containerW = getTextLabelWidth(label);
  const explicitLines = label.text.split("\n");
  let totalLines = 0;

  for (const line of explicitLines) {
    const lineW = Math.max(charWidth, line.length * charWidth);
    totalLines += label.width
      ? Math.max(1, Math.ceil(lineW / containerW))
      : 1;
  }

  return {
    w: containerW,
    h: Math.max(lineHeight, totalLines * lineHeight),
  };
}
