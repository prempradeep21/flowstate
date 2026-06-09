/** Google Maps Embed API key — replace in production. */
export const GOOGLE_MAPS_EMBED_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY ??
  "YOUR_GOOGLE_MAPS_API_KEY_PLACEHOLDER";

export function buildStreetViewEmbedUrl(opts: {
  lat: number;
  lng: number;
  heading?: number;
  pitch?: number;
  fov?: number;
}): string {
  const params = new URLSearchParams({
    key: GOOGLE_MAPS_EMBED_API_KEY,
    location: `${opts.lat},${opts.lng}`,
    heading: String(opts.heading ?? 0),
    pitch: String(opts.pitch ?? 0),
    fov: String(opts.fov ?? 90),
  });
  return `https://www.google.com/maps/embed/v1/streetview?${params.toString()}`;
}

export function isGoogleMapsKeyConfigured(): boolean {
  const key = GOOGLE_MAPS_EMBED_API_KEY.trim();
  return (
    key.length > 0 && key !== "YOUR_GOOGLE_MAPS_API_KEY_PLACEHOLDER"
  );
}
