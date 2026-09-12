import type { StreetViewArtifactData, StreetViewMode } from "@/lib/artifactTypes";
import type { ArtifactPayload } from "@/lib/artifactTypes";

/** Default frame shape for new/legacy Street View artifacts. */
export const DEFAULT_STREET_VIEW_MODE: StreetViewMode = "rectangle";

/** Canvas padding + header + controls bar above the Street View body. */
export const STREET_VIEW_NODE_CHROME_PX = 104;

/** Wide-rectangle body aspect ratio (16:9). */
const STREET_VIEW_RECTANGLE_ASPECT = 16 / 9;

/**
 * Body height for a node of the given width. Rectangle mode uses a 16:9 body;
 * circle mode keeps the body square so the inscribed circle fills the frame.
 */
export function streetViewArtifactHeightForWidth(
  nodeWidth: number,
  viewMode: StreetViewMode = DEFAULT_STREET_VIEW_MODE,
): number {
  const body =
    viewMode === "circle"
      ? nodeWidth
      : Math.round(nodeWidth / STREET_VIEW_RECTANGLE_ASPECT);
  return body + STREET_VIEW_NODE_CHROME_PX;
}

export function normalizeStreetViewArtifactData(
  data: unknown,
): StreetViewArtifactData {
  const obj =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const placeRaw =
    obj.place && typeof obj.place === "object"
      ? (obj.place as Record<string, unknown>)
      : {};
  const name =
    typeof placeRaw.name === "string" ? placeRaw.name.trim() : "Unknown place";
  const label =
    typeof placeRaw.label === "string" && placeRaw.label.trim()
      ? placeRaw.label.trim()
      : undefined;
  const lat =
    typeof placeRaw.lat === "number" && Number.isFinite(placeRaw.lat)
      ? placeRaw.lat
      : undefined;
  const lng =
    typeof placeRaw.lng === "number" && Number.isFinite(placeRaw.lng)
      ? placeRaw.lng
      : undefined;

  const heading =
    typeof obj.heading === "number" && Number.isFinite(obj.heading)
      ? Math.max(0, Math.min(360, obj.heading))
      : 0;
  const pitch =
    typeof obj.pitch === "number" && Number.isFinite(obj.pitch)
      ? Math.max(-90, Math.min(90, obj.pitch))
      : 0;
  const fov =
    typeof obj.fov === "number" && Number.isFinite(obj.fov)
      ? Math.max(10, Math.min(120, obj.fov))
      : 90;

  return {
    place: { name, label, lat, lng },
    heading,
    pitch,
    fov,
    viewMode: obj.viewMode === "circle" ? "circle" : DEFAULT_STREET_VIEW_MODE,
  };
}

export function normalizeStreetViewPayload(
  payload: Extract<ArtifactPayload, { type: "streetview" }>,
): Extract<ArtifactPayload, { type: "streetview" }> {
  return {
    ...payload,
    data: normalizeStreetViewArtifactData(payload.data),
  };
}
