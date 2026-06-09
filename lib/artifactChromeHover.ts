/** Pointer is over a chrome trigger (header band, edge peel) — show artifact chrome. */
export const ARTIFACT_CHROME_ZONE_ATTR = "data-artifact-chrome-zone";

/** Pointer is over naked artifact content (map, table body, etc.) — keep chrome hidden. */
export const ARTIFACT_INTERACTIVE_SURFACE_ATTR = "data-artifact-interactive-surface";

export function shouldShowArtifactChromeHover(
  target: EventTarget | null,
): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest(`[${ARTIFACT_CHROME_ZONE_ATTR}]`)) return true;
  if (target.closest(`[${ARTIFACT_INTERACTIVE_SURFACE_ATTR}]`)) return false;
  return true;
}
