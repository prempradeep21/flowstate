import { describe, expect, it } from "vitest";
import {
  createMapSavedPlace,
  normalizeMapArtifactData,
  normalizeSavedPlace,
} from "@/lib/mapArtifact";

describe("normalizeSavedPlace", () => {
  it("returns null for invalid entries", () => {
    expect(normalizeSavedPlace(null)).toBeNull();
    expect(normalizeSavedPlace({ label: "x" })).toBeNull();
  });

  it("normalizes a valid saved place", () => {
    const place = normalizeSavedPlace({
      id: "pin_1",
      label: "Eiffel Tower, Paris",
      lat: 48.8584,
      lng: 2.2945,
      type: "tourism",
    });
    expect(place).toEqual({
      id: "pin_1",
      label: "Eiffel Tower, Paris",
      lat: 48.8584,
      lng: 2.2945,
      type: "tourism",
    });
  });
});

describe("normalizeMapArtifactData", () => {
  it("ensures savedPlaces array", () => {
    const data = normalizeMapArtifactData({
      place: { name: "Paris", lat: 48.85, lng: 2.35 },
      zoom: 11,
      savedPlaces: [{ label: "Louvre", lat: 48.86, lng: 2.34 }],
    });
    expect(data.savedPlaces).toHaveLength(1);
    expect(data.savedPlaces![0]!.label).toBe("Louvre");
  });
});

describe("createMapSavedPlace", () => {
  it("assigns a unique id", () => {
    const a = createMapSavedPlace({ label: "A", lat: 1, lng: 2 });
    const b = createMapSavedPlace({ label: "B", lat: 3, lng: 4 });
    expect(a.id).not.toBe(b.id);
  });
});
