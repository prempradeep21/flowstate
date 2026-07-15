import { describe, expect, it } from "vitest";
import {
  deriveSource,
  referrerHost,
  worldRegionForCountry,
} from "@/lib/analytics/visitorSource";

describe("referrerHost", () => {
  it("strips protocol, path, and www", () => {
    expect(referrerHost("https://www.reddit.com/r/SideProject/")).toBe(
      "reddit.com",
    );
  });

  it("returns null for empty or non-host strings", () => {
    expect(referrerHost("")).toBeNull();
    expect(referrerHost(null)).toBeNull();
    expect(referrerHost("not a url")).toBeNull();
  });
});

describe("deriveSource", () => {
  it("maps known referrer hosts to friendly labels", () => {
    expect(deriveSource({ referrerHost: "reddit.com" })).toBe("Reddit");
    expect(deriveSource({ referrerHost: "old.reddit.com" })).toBe("Reddit");
    expect(deriveSource({ referrerHost: "t.co" })).toBe("X / Twitter");
    expect(deriveSource({ referrerHost: "google.co.in" })).toBe("Google");
  });

  it("prefers an explicit UTM source over the referrer", () => {
    expect(
      deriveSource({ referrerHost: "google.com", utmSource: "reddit" }),
    ).toBe("Reddit");
  });

  it("folds same-origin referrers into Direct", () => {
    expect(
      deriveSource({ referrerHost: "flowstate.app", selfHost: "flowstate.app" }),
    ).toBe("Direct");
  });

  it("falls back to Direct with no referrer", () => {
    expect(deriveSource({ referrerHost: null })).toBe("Direct");
  });

  it("surfaces the bare domain for unknown referrers", () => {
    expect(deriveSource({ referrerHost: "someblog.dev" })).toBe("someblog.dev");
  });
});

describe("worldRegionForCountry", () => {
  it("buckets ISO codes into continents", () => {
    expect(worldRegionForCountry("IN")).toBe("Asia");
    expect(worldRegionForCountry("us")).toBe("North America");
    expect(worldRegionForCountry("DE")).toBe("Europe");
    expect(worldRegionForCountry("BR")).toBe("South America");
  });

  it("returns Unknown for missing or unmapped codes", () => {
    expect(worldRegionForCountry(null)).toBe("Unknown");
    expect(worldRegionForCountry("ZZ")).toBe("Unknown");
  });
});
