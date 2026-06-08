import type { MapArtifactData, MapPlace } from "@/lib/artifactTypes";

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

export async function geocodeMapArtifact(
  data: Record<string, unknown>,
): Promise<MapArtifactData | null> {
  const query = placeNameFromData(data);
  if (!query) return null;

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const res = await rateLimitedFetch(url.toString());
  if (!res.ok) return null;

  const results = (await res.json()) as NominatimResult[];
  const hit = results[0];
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

  return {
    place,
    zoom: zoomFromNominatim(hit.type, hit.class),
  };
}
