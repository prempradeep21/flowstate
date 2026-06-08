import type { AnswerExplain } from "@/lib/store";

const HIGHLIGHT_NAME = "answer-explain";
const LEGACY_MARK_CLASS = "answer-explain-mark";

function getTextNodes(root: Node): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n = walker.nextNode();
  while (n) {
    nodes.push(n as Text);
    n = walker.nextNode();
  }
  return nodes;
}

function joinText(nodes: Text[]): string {
  return nodes.map((n) => n.textContent ?? "").join("");
}

function rangeStartOffset(nodes: Text[], range: Range): number {
  let offset = 0;
  for (const node of nodes) {
    if (node === range.startContainer) {
      return offset + range.startOffset;
    }
    offset += (node.textContent ?? "").length;
  }
  return offset;
}

function offsetsToRange(
  nodes: Text[],
  start: number,
  end: number,
): Range | null {
  const range = document.createRange();
  let pos = 0;
  let startSet = false;

  for (const node of nodes) {
    const len = (node.textContent ?? "").length;
    if (!startSet && pos + len >= start) {
      range.setStart(node, Math.max(0, start - pos));
      startSet = true;
    }
    if (startSet && pos + len >= end) {
      range.setEnd(node, Math.max(0, end - pos));
      return range;
    }
    pos += len;
  }
  return startSet ? range : null;
}

export function findOccurrenceRange(
  container: HTMLElement,
  search: string,
  occurrenceIndex: number,
): Range | null {
  const nodes = getTextNodes(container);
  const full = joinText(nodes);
  let count = 0;
  let searchFrom = 0;
  while (true) {
    const idx = full.indexOf(search, searchFrom);
    if (idx === -1) return null;
    if (count === occurrenceIndex) {
      return offsetsToRange(nodes, idx, idx + search.length);
    }
    count++;
    searchFrom = idx + 1;
  }
}

export function getExplainRange(
  container: HTMLElement,
  explain: Pick<AnswerExplain, "selectedText" | "occurrenceIndex">,
): Range | null {
  return findOccurrenceRange(
    container,
    explain.selectedText,
    explain.occurrenceIndex,
  );
}

function rangeVisualRect(range: Range): DOMRect {
  const rects = range.getClientRects();
  if (rects.length === 0) return range.getBoundingClientRect();
  let top = Infinity;
  let left = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i]!;
    top = Math.min(top, r.top);
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  }
  return new DOMRect(left, top, right - left, bottom - top);
}

export function getExplainRangeRect(
  container: HTMLElement,
  explain: Pick<AnswerExplain, "selectedText" | "occurrenceIndex">,
): DOMRect | null {
  const range = getExplainRange(container, explain);
  if (!range) return null;
  const rect = rangeVisualRect(range);
  if (rect.width === 0 && rect.height === 0) return null;
  return rect;
}

export function supportsCssHighlightApi(): boolean {
  return typeof CSS !== "undefined" && "highlights" in CSS;
}

/** Remove legacy &lt;mark&gt; injections that corrupted markdown lists. */
export function cleanupLegacyExplainMarks(container: HTMLElement): void {
  container.querySelectorAll(`mark.${LEGACY_MARK_CLASS}`).forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
  });
  container.normalize();
}

export function clearExplainHighlights(): void {
  if (!supportsCssHighlightApi()) return;
  CSS.highlights.delete(HIGHLIGHT_NAME);
}

/** Non-destructive highlights — never mutates the markdown DOM. */
export function applyExplainHighlights(
  container: HTMLElement,
  explains: AnswerExplain[],
): boolean {
  cleanupLegacyExplainMarks(container);
  clearExplainHighlights();

  if (!explains.length || !supportsCssHighlightApi()) return false;

  const highlight = new Highlight();
  for (const explain of explains) {
    const range = getExplainRange(container, explain);
    if (range) highlight.add(range);
  }

  if (highlight.size === 0) return false;
  CSS.highlights.set(HIGHLIGHT_NAME, highlight);
  return true;
}

export interface ExplainOverlayBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function getExplainOverlayBoxes(
  container: HTMLElement,
  explain: Pick<AnswerExplain, "selectedText" | "occurrenceIndex">,
): ExplainOverlayBox[] {
  const range = getExplainRange(container, explain);
  if (!range) return [];
  const containerRect = container.getBoundingClientRect();
  const boxes: ExplainOverlayBox[] = [];
  for (const r of range.getClientRects()) {
    if (r.width === 0 && r.height === 0) continue;
    boxes.push({
      left: r.left - containerRect.left + container.scrollLeft,
      top: r.top - containerRect.top + container.scrollTop,
      width: r.width,
      height: r.height,
    });
  }
  return boxes;
}

export function getSelectionInContainer(
  container: HTMLElement,
): { selectedText: string; occurrenceIndex: number; rect: DOMRect } | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) return null;

  const selectedText = range.toString();
  if (!selectedText.trim()) return null;

  const nodes = getTextNodes(container);
  const full = joinText(nodes);
  const startOffset = rangeStartOffset(nodes, range);

  if (
    full.slice(startOffset, startOffset + selectedText.length) !== selectedText
  ) {
    return null;
  }

  let occurrenceIndex = 0;
  let searchFrom = 0;
  while (searchFrom < startOffset) {
    const idx = full.indexOf(selectedText, searchFrom);
    if (idx === -1 || idx >= startOffset) break;
    occurrenceIndex++;
    searchFrom = idx + 1;
  }

  const rect = rangeVisualRect(range);
  if (rect.width === 0 && rect.height === 0) return null;

  return { selectedText, occurrenceIndex, rect };
}

export function findExplainAtPoint(
  container: HTMLElement,
  clientX: number,
  clientY: number,
  explains: AnswerExplain[],
): string | null {
  for (let i = explains.length - 1; i >= 0; i--) {
    const explain = explains[i]!;
    const range = getExplainRange(container, explain);
    if (!range) continue;
    for (const r of range.getClientRects()) {
      if (
        clientX >= r.left &&
        clientX <= r.right &&
        clientY >= r.top &&
        clientY <= r.bottom
      ) {
        return explain.id;
      }
    }
  }
  return null;
}

/** Vertical center of `targetRect` relative to the card root (for popup anchoring). */
export function anchorYRelativeToCard(
  cardEl: HTMLElement,
  targetRect: DOMRect,
): number {
  const cardRect = cardEl.getBoundingClientRect();
  return targetRect.top + targetRect.height / 2 - cardRect.top;
}
