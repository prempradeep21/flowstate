import type { CanvasTextLabel } from "@/lib/store";

export const MIN_TEXT_LABEL_FONT_SIZE = 12;
export const MAX_TEXT_LABEL_FONT_SIZE = 200;
export const MIN_TEXT_LABEL_WIDTH = 40;
export const MAX_TEXT_LABEL_WIDTH = 2400;

/** Must match the label's `font-medium` class. */
export const TEXT_LABEL_FONT_WEIGHT = 500;
/** Must match the label's `leading-tight` class. */
export const TEXT_LABEL_LINE_HEIGHT = 1.25;

const CHAR_WIDTH_RATIO = 0.55;

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

// ---------------------------------------------------------------------------
// Text measurement. The rendered label is the source of truth; these bounds
// feed hit tests, culling and the multi-selection box, so they should land on
// the same pixels. Canvas 2D measureText with the label's real font gets
// there; the character-ratio estimate is the fallback outside a browser.
// ---------------------------------------------------------------------------

let measureCtx: CanvasRenderingContext2D | null | undefined;
let fontFamilyCache: { value: string; at: number } | null = null;
const FONT_FAMILY_TTL_MS = 1000;

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (measureCtx !== undefined) return measureCtx;
  if (typeof document === "undefined") return (measureCtx = null);
  try {
    measureCtx = document.createElement("canvas").getContext("2d");
  } catch {
    measureCtx = null;
  }
  return measureCtx;
}

/** The font family labels actually render in (follows canvas font previews). */
function labelFontFamily(): string {
  const now = Date.now();
  if (fontFamilyCache && now - fontFamilyCache.at < FONT_FAMILY_TTL_MS) {
    return fontFamilyCache.value;
  }
  const el =
    document.querySelector("[data-canvas-text-label]") ??
    document.querySelector("[data-canvas-container]") ??
    document.body;
  const value = getComputedStyle(el).fontFamily || "sans-serif";
  fontFamilyCache = { value, at: now };
  return value;
}

/** Width of one unwrapped line in canvas px. */
export function measureTextLabelLine(line: string, fontSize: number): number {
  const ctx = getMeasureContext();
  if (!ctx) return line.length * fontSize * CHAR_WIDTH_RATIO;
  ctx.font = `${TEXT_LABEL_FONT_WEIGHT} ${fontSize}px ${labelFontFamily()}`;
  return ctx.measureText(line).width;
}

/** Visual line count of one hard line wrapped at `width` (greedy, by word). */
function wrappedLineCount(line: string, fontSize: number, width: number): number {
  if (line.length === 0) return 1;
  if (measureTextLabelLine(line, fontSize) <= width) return 1;
  const words = line.split(/(\s+)/);
  let lines = 1;
  let current = 0;
  for (const word of words) {
    if (word.length === 0) continue;
    const w = measureTextLabelLine(word, fontSize);
    if (current + w <= width) {
      current += w;
      continue;
    }
    if (/^\s+$/.test(word)) {
      // Trailing spaces hang past the wrap point; they don't open a line.
      continue;
    }
    if (w > width) {
      // overflow-wrap: break-word splits a long word across lines.
      const extra = Math.ceil(w / width);
      lines += current > 0 ? extra : extra - 1;
      current = w - (extra - 1) * width;
      continue;
    }
    lines += current > 0 ? 1 : 0;
    current = w;
  }
  return lines;
}

export function estimateAutoTextLabelWidth(label: CanvasTextLabel): number {
  const longestLine = label.text
    .split("\n")
    .reduce(
      (max, line) => Math.max(max, measureTextLabelLine(line, label.fontSize)),
      0,
    );
  return Math.max(label.fontSize * 0.5, Math.ceil(longestLine));
}

export function getTextLabelWidth(label: CanvasTextLabel): number {
  return label.width ?? estimateAutoTextLabelWidth(label);
}

export function estimateTextLabelBounds(label: CanvasTextLabel): {
  w: number;
  h: number;
} {
  const lineHeight = label.fontSize * TEXT_LABEL_LINE_HEIGHT;
  const containerW = getTextLabelWidth(label);
  let totalLines = 0;
  for (const line of label.text.split("\n")) {
    totalLines += label.width
      ? wrappedLineCount(line, label.fontSize, containerW)
      : 1;
  }
  return {
    w: containerW,
    h: Math.max(lineHeight, totalLines * lineHeight),
  };
}
