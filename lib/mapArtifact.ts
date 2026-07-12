import type {
  ArtifactPayload,
  MapArtifactData,
  MapPlace,
  MapSavedPlace,
} from "@/lib/artifactTypes";

/** Source card id for user-initiated map saves (no chat turn). */
export const MANUAL_MAP_SOURCE_CARD_ID = "__manual__";

function newSavedPlaceId(): string {
  return `pin_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function normalizeSavedPlace(raw: unknown): MapSavedPlace | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const lat = typeof o.lat === "number" ? o.lat : parseFloat(String(o.lat ?? ""));
  const lng = typeof o.lng === "number" ? o.lng : parseFloat(String(o.lng ?? ""));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const label = typeof o.label === "string" ? o.label.trim() : "";
  if (!label) return null;
  return {
    id:
      typeof o.id === "string" && o.id.trim() ? o.id.trim() : newSavedPlaceId(),
    label,
    lat,
    lng,
    type: typeof o.type === "string" && o.type.trim() ? o.type.trim() : undefined,
    group:
      typeof o.group === "string" && o.group.trim() ? o.group.trim() : undefined,
  };
}

function normalizePrimaryPlace(raw: unknown): MapPlace {
  if (!raw || typeof raw !== "object") return { name: "" };
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const label = typeof o.label === "string" ? o.label.trim() : undefined;
  const lat =
    typeof o.lat === "number"
      ? o.lat
      : o.lat != null
        ? parseFloat(String(o.lat))
        : undefined;
  const lng =
    typeof o.lng === "number"
      ? o.lng
      : o.lng != null
        ? parseFloat(String(o.lng))
        : undefined;
  return {
    name,
    label: label || undefined,
    lat: lat != null && Number.isFinite(lat) ? lat : undefined,
    lng: lng != null && Number.isFinite(lng) ? lng : undefined,
  };
}

export function normalizeMapArtifactData(data: unknown): MapArtifactData {
  const obj =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const zoom =
    typeof obj.zoom === "number" && Number.isFinite(obj.zoom) ? obj.zoom : 10;
  const savedRaw = Array.isArray(obj.savedPlaces) ? obj.savedPlaces : [];
  const savedPlaces = savedRaw
    .map(normalizeSavedPlace)
    .filter((p): p is MapSavedPlace => p !== null);
  const mapStyle =
    typeof obj.mapStyle === "string" && obj.mapStyle.trim()
      ? obj.mapStyle.trim()
      : undefined;
  return {
    place: normalizePrimaryPlace(obj.place),
    zoom,
    savedPlaces,
    mapStyle,
  };
}

export function createMapSavedPlace(hit: {
  label: string;
  lat: number;
  lng: number;
  type?: string;
  group?: string;
}): MapSavedPlace {
  return {
    id: newSavedPlaceId(),
    label: hit.label,
    lat: hit.lat,
    lng: hit.lng,
    type: hit.type,
    group: hit.group,
  };
}

export function cloneMapPayload(
  payload: Extract<ArtifactPayload, { type: "map" }>,
): Extract<ArtifactPayload, { type: "map" }> {
  return structuredClone(payload);
}
