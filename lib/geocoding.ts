import type {
  MapArtifactData,
  MapPlace,
  MapSavedPlace,
} from "@/lib/artifactTypes";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "BranchAI/1.0 (flowstate travel maps)";

let lastRequestAt = 0;

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  class?: string;
}

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
  }
  lastRequestAt = Date.now();
  return fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
}

function zoomFromNominatim(type?: string, placeClass?: string): number {
  const t = (type ?? "").toLowerCase();
  const c = (placeClass ?? "").toLowerCase();

  if (t === "country") return 5;
  if (t === "state" || t === "region" || t === "county") return 7;
  if (c === "boundary" && t === "administrative") return 7;
  if (t === "city" || t === "town" || t === "municipality") return 11;
  if (
    t === "village" ||
    t === "hamlet" ||
    t === "suburb" ||
    t === "neighbourhood" ||
    t === "quarter"
  ) {
    return 13;
  }
  return 10;
}

function placeNameFromData(data: Record<string, unknown>): string | null {
  const place = data.place;
  if (!place || typeof place !== "object") return null;
  const name = (place as MapPlace).name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

export interface MapSearchResult {
  label: string;
  lat: number;
  lng: number;
  zoom: number;
}

export interface ReverseGeocodeResult {
  label: string;
  lat: number;
  lng: number;
  type?: string;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const url = new URL(NOMINATIM_REVERSE_URL);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");

  const res = await rateLimitedFetch(url.toString());
  if (!res.ok) return null;

  const hit = (await res.json()) as NominatimResult;
  if (!hit?.display_name) return null;

  const resultLat = parseFloat(hit.lat);
  const resultLng = parseFloat(hit.lon);
  if (!Number.isFinite(resultLat) || !Number.isFinite(resultLng)) return null;

  return {
    label: hit.display_name,
    lat: resultLat,
    lng: resultLng,
    type: hit.type,
  };
}

export async function searchPlaces(
  query: string,
  limit = 6,
): Promise<MapSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(Math.min(limit, 10)));
  url.searchParams.set("addressdetails", "0");

  const res = await rateLimitedFetch(url.toString());
  if (!res.ok) return [];

  const results = (await res.json()) as NominatimResult[];
  return results
    .map((hit) => {
      const lat = parseFloat(hit.lat);
      const lng = parseFloat(hit.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        label: hit.display_name,
        lat,
        lng,
        zoom: zoomFromNominatim(hit.type, hit.class),
      };
    })
    .filter((r): r is MapSearchResult => r !== null);
}

/** Cap how many saved pins we geocode per emit to bound latency/abuse. */
const MAX_SAVED_PLACES_TO_GEOCODE = 15;

function newSavedPlaceId(): string {
  return `pin_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

async function geocodeOneHit(query: string): Promise<NominatimResult | null> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const res = await rateLimitedFetch(url.toString());
  if (!res.ok) return null;

  const results = (await res.json()) as NominatimResult[];
  return results[0] ?? null;
}

/**
 * Resolve the AI-emitted `savedPlaces` into pins with real coordinates.
 *
 * The model reliably produces place *names* but not accurate lat/lng, so any
 * pin lacking valid coordinates is geocoded by name. Pins that already carry
 * finite coordinates (e.g. preserved from a prior version or a user click) are
 * trusted as-is so editing a map never re-geocodes existing markers.
 */
async function geocodeSavedPlaces(
  data: Record<string, unknown>,
  context: string,
): Promise<MapSavedPlace[]> {
  const rawList = Array.isArray(data.savedPlaces) ? data.savedPlaces : [];
  const out: MapSavedPlace[] = [];

  for (const raw of rawList.slice(0, MAX_SAVED_PLACES_TO_GEOCODE)) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;

    const id =
      typeof o.id === "string" && o.id.trim() ? o.id.trim() : newSavedPlaceId();
    const type =
      typeof o.type === "string" && o.type.trim() ? o.type.trim() : undefined;
    const group =
      typeof o.group === "string" && o.group.trim() ? o.group.trim() : undefined;
    const name = typeof o.name === "string" ? o.name.trim() : "";
    const label = typeof o.label === "string" ? o.label.trim() : "";
    const displayLabel = label || name;

    const existingLat =
      typeof o.lat === "number" ? o.lat : parseFloat(String(o.lat ?? ""));
    const existingLng =
      typeof o.lng === "number" ? o.lng : parseFloat(String(o.lng ?? ""));

    // Trust coordinates the model/user already provided.
    if (
      Number.isFinite(existingLat) &&
      Number.isFinite(existingLng) &&
      displayLabel
    ) {
      out.push({
        id,
        label: displayLabel,
        lat: existingLat,
        lng: existingLng,
        type,
        group,
      });
      continue;
    }

    // Otherwise geocode by name, disambiguated with the primary place.
    const queryBase = name || label;
    if (!queryBase) continue;
    const query =
      context && !queryBase.toLowerCase().includes(context.toLowerCase())
        ? `${queryBase}, ${context}`
        : queryBase;

    const hit = await geocodeOneHit(query);
    if (!hit) continue;
    const lat = parseFloat(hit.lat);
    const lng = parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    out.push({
      id,
      label: displayLabel || queryBase,
      lat,
      lng,
      type: type ?? hit.type,
      group,
    });
  }

  return out;
}

export async function geocodeMapArtifact(
  data: Record<string, unknown>,
): Promise<MapArtifactData | null> {
  const query = placeNameFromData(data);
  if (!query) return null;

  const hit = await geocodeOneHit(query);
  if (!hit) return null;

  const lat = parseFloat(hit.lat);
  const lng = parseFloat(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const place: MapPlace = {
    name: query,
    label: hit.display_name,
    lat,
    lng,
  };

  const savedPlaces = await geocodeSavedPlaces(data, query);
  const mapStyle =
    typeof data.mapStyle === "string" && data.mapStyle.trim()
      ? data.mapStyle.trim()
      : undefined;

  return {
    place,
    zoom: zoomFromNominatim(hit.type, hit.class),
    savedPlaces,
    mapStyle,
  };
}
