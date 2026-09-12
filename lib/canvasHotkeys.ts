/**
 * Opt-out marker for the bare-letter canvas shortcuts (Q places a question, Z
 * opens the pie menu). Put it on any container whose fields should type letters
 * normally.
 */
export const CANVAS_HOTKEYS_OFF_ATTR = "data-canvas-hotkeys";

/**
 * Whether a bare-letter canvas shortcut should ignore this event's target.
 *
 * Those handlers listen in the CAPTURE phase on `window`, so they fire before the
 * event reaches the focused field — deliberately, so Q/Z still work while an
 * empty question composer is focused. The flip side is that nothing inside the
 * React tree can stopPropagation in time, so a field that wants the raw letter
 * has to be recognised here: mark its container with data-canvas-hotkeys="off".
 */
export function isCanvasHotkeyBlockedByTarget(
  target: EventTarget | null,
): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (typeof el.closest === "function" && el.closest(`[${CANVAS_HOTKEYS_OFF_ATTR}="off"]`)) {
    return true;
  }

  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") {
    // Empty field — the shortcut wins (an empty composer is fair game).
    return (el as HTMLInputElement | HTMLTextAreaElement).value.trim().length > 0;
  }
  return Boolean(el.isContentEditable);
}
