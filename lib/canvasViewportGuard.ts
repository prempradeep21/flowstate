/** Milliseconds after a pan/zoom gesture during which auto-focus is suppressed. */
const USER_VIEWPORT_LOCK_MS = 3000;

let lastUserViewportInteractionAt = 0;

export function markUserViewportInteraction(): void {
  lastUserViewportInteractionAt = Date.now();
}

export function shouldAllowAutoFocus(): boolean {
  return Date.now() - lastUserViewportInteractionAt > USER_VIEWPORT_LOCK_MS;
}

/** Run a focus callback only when the user has not recently panned/zoomed. */
export function requestCanvasFocus(focus: () => void): void {
  if (shouldAllowAutoFocus()) focus();
}
