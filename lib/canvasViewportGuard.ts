/** Milliseconds after a pan/zoom gesture during which auto-focus is suppressed. */
const USER_VIEWPORT_LOCK_MS = 3000;

/** Active gesture window — backgrounds and heavy work pause while true. */
const VIEWPORT_GESTURE_MS = 120;

let lastUserViewportInteractionAt = 0;

export function markUserViewportInteraction(): void {
  lastUserViewportInteractionAt = Date.now();
}

export function isViewportGesturing(): boolean {
  return Date.now() - lastUserViewportInteractionAt < VIEWPORT_GESTURE_MS;
}

export function shouldAllowAutoFocus(): boolean {
  return Date.now() - lastUserViewportInteractionAt > USER_VIEWPORT_LOCK_MS;
}

/** Run a focus callback only when the user has not recently panned/zoomed. */
export function requestCanvasFocus(focus: () => void): void {
  if (shouldAllowAutoFocus()) focus();
}
