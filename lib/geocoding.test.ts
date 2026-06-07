import { describe, expect, it } from "vitest";
import { geocodeMapArtifact } from "@/lib/geocoding";

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
