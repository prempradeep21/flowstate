import type { StreetViewArtifactData } from "@/lib/artifactTypes";
import type { ArtifactPayload } from "@/lib/artifactTypes";

/**
 * Default canvas height so the inscribed circle spans the inner width.
 * innerWidth = CANVAS_ARTIFACT_WIDTH - 32px padding;
 * innerHeight = height - 32px padding - 56px header → set height = width + 56.
 */
export const STREET_VIEW_ARTIFACT_HEIGHT = 576;

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
