/** Set on a canvas node root when its body content should receive pointer/wheel input. */
export const CANVAS_NODE_INTERACTIVE_ATTR = "data-canvas-node-interactive";

/**
 * Descendants ignore pointer events; chrome hooks (repo drag handle, no-drag controls)
 * stay hit-testable for hover affordances.
 */
export const CANVAS_CONTENT_INERT_CLASS =
  "[&_*]:pointer-events-none [&_[data-repo-drag-handle]]:pointer-events-auto [&_[data-no-drag]]:pointer-events-auto";

export function isInsideInteractiveCanvasNode(el: HTMLElement): boolean {
  return el.closest(`[${CANVAS_NODE_INTERACTIVE_ATTR}]`) != null;
}
