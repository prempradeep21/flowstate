import { NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/geocoding";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = parseFloat(url.searchParams.get("lat") ?? "");
  const lng = parseFloat(url.searchParams.get("lng") ?? "");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const result = await reverseGeocode(lat, lng);
    if (!result) {
      return NextResponse.json({ error: "No place found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Reverse geocode failed" }, { status: 500 });
  }
}
