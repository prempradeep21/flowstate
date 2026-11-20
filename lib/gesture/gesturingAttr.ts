/**
 * `data-gesturing` on the canvas container suppresses transitions (any value)
 * and flattens shadows (value "zoom"). Node drags and viewport gestures both
 * set it, and used to each remove it outright, so a zoom during or right
 * after a drag stripped the drag's suppression and vice versa. Each owner now
 * holds its own mode; the attribute shows the strongest one held and clears
 * only when nobody holds it.
 */
export type GesturingOwner = "node-drag" | "viewport";
export type GesturingMode = "pan" | "drag" | "zoom";

const RANK: Record<GesturingMode, number> = { pan: 0, drag: 1, zoom: 2 };
const held = new Map<GesturingOwner, GesturingMode>();

/** The value the attribute should carry, or null when no gesture is live. */
export function resolveGesturingMode(
  modes: Iterable<GesturingMode>,
): GesturingMode | null {
  let best: GesturingMode | null = null;
  for (const mode of modes) {
    if (best === null || RANK[mode] > RANK[best]) best = mode;
  }
  return best;
}

export function setGesturing(
  owner: GesturingOwner,
  mode: GesturingMode | null,
): void {
  if (mode) held.set(owner, mode);
  else held.delete(owner);
  if (typeof document === "undefined") return;
  const container = document.querySelector<HTMLElement>(
    "[data-canvas-container]",
  );
  if (!container) return;
  const value = resolveGesturingMode(held.values());
  if (value) container.setAttribute("data-gesturing", value);
  else container.removeAttribute("data-gesturing");
}
