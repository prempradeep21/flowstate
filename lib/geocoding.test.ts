import { describe, expect, it } from "vitest";
import {
  geocodeMapArtifact,
  reverseGeocode,
  searchPlaces,
} from "@/lib/geocoding";

describe("geocodeMapArtifact", () => {
  it("returns null when place name is missing", async () => {
    expect(await geocodeMapArtifact({})).toBeNull();
    expect(await geocodeMapArtifact({ place: {} })).toBeNull();
  });

  it("geocodes a well-known city", async () => {
    const result = await geocodeMapArtifact({
      place: { name: "Kyoto, Japan" },
    });
    expect(result).not.toBeNull();
    expect(result!.place.name).toBe("Kyoto, Japan");
    expect(result!.place.lat).toBeTypeOf("number");
    expect(result!.place.lng).toBeTypeOf("number");
    expect(result!.zoom).toBeGreaterThan(0);
  }, 15000);
});

describe("searchPlaces", () => {
  it("returns empty for short queries", async () => {
    expect(await searchPlaces("")).toEqual([]);
    expect(await searchPlaces("a")).toEqual([]);
  });

  it("returns single-line place suggestions", async () => {
    const results = await searchPlaces("Eiffel Tower, Paris");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.label).toBeTypeOf("string");
    expect(results[0]!.lat).toBeTypeOf("number");
    expect(results[0]!.lng).toBeTypeOf("number");
    expect(results[0]!.zoom).toBeGreaterThan(0);
  }, 15000);
});

describe("reverseGeocode", () => {
  it("returns null for invalid coordinates", async () => {
    expect(await reverseGeocode(Number.NaN, 0)).toBeNull();
  });

  it("reverse-geocodes a known location", async () => {
    const result = await reverseGeocode(48.8584, 2.2945);
    expect(result).not.toBeNull();
    expect(result!.label.length).toBeGreaterThan(0);
    expect(result!.lat).toBeTypeOf("number");
    expect(result!.lng).toBeTypeOf("number");
  }, 15000);
});
