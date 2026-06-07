import type { MapArtifactData, MapPlace } from "@/lib/artifactTypes";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
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
