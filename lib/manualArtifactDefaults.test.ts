import { describe, expect, it } from "vitest";
import { CATALOG_CUBBON_PARK } from "@/lib/artifactCatalogSamples";
import {
  createManualArtifactPayload,
  manualArtifactSourceCardId,
} from "@/lib/manualArtifactDefaults";

describe("createManualArtifactPayload", () => {
  it("creates sticky note with empty text and default yellow", () => {
    const payload = createManualArtifactPayload("stickynote");
    expect(payload.type).toBe("stickynote");
    if (payload.type !== "stickynote") return;
    expect(payload.title).toBe("Sticky note");
    expect(payload.data.text).toBe("");
    expect(payload.data.colorId).toBe("yellow");
  });

  it("creates todo with three placeholder tasks", () => {
    const payload = createManualArtifactPayload("todo");
    expect(payload.type).toBe("todo");
    if (payload.type !== "todo") return;
    expect(payload.title).toBe("Untitled list");
    expect(payload.data.items).toHaveLength(3);
    expect(payload.data.items.map((i) => i.label)).toEqual([
      "Task 1",
      "Task 2",
      "Task 3",
    ]);
  });

  it("creates table with starter grid", () => {
    const payload = createManualArtifactPayload("table");
    expect(payload.type).toBe("table");
    if (payload.type !== "table") return;
    expect(payload.data.columns).toHaveLength(3);
    expect(payload.data.rows).toHaveLength(3);
    expect(payload.data.columns.map((c) => c.label)).toEqual([
      "Column A",
      "Column B",
      "Column C",
    ]);
  });

  it("creates chart with bar dummy data", () => {
    const payload = createManualArtifactPayload("chart");
    expect(payload.type).toBe("chart");
    if (payload.type !== "chart") return;
    expect(payload.data.chartType).toBe("bar");
    expect(payload.data.categories).toEqual(["A", "B", "C"]);
    expect(payload.data.series?.[0]?.data).toEqual([0, 0, 0]);
  });

  it("creates map at Cubbon Park with no pins", () => {
    const payload = createManualArtifactPayload("map");
    expect(payload.type).toBe("map");
    if (payload.type !== "map") return;
    expect(payload.data.place.lat).toBe(CATALOG_CUBBON_PARK.lat);
    expect(payload.data.place.lng).toBe(CATALOG_CUBBON_PARK.lng);
    expect(payload.data.savedPlaces).toEqual([]);
  });

  it("creates street view at Cubbon Park", () => {
    const payload = createManualArtifactPayload("streetview");
    expect(payload.type).toBe("streetview");
    if (payload.type !== "streetview") return;
    expect(payload.data.place.lat).toBe(CATALOG_CUBBON_PARK.lat);
    expect(payload.data.place.lng).toBe(CATALOG_CUBBON_PARK.lng);
  });

  it("creates calendar with one sample event", () => {
    const payload = createManualArtifactPayload("calendar");
    expect(payload.type).toBe("calendar");
    if (payload.type !== "calendar") return;
    expect(payload.data.events).toHaveLength(1);
    expect(payload.data.events[0]?.title).toBe("Sample event");
  });

  it("creates timeline with one sample event", () => {
    const payload = createManualArtifactPayload("timeline");
    expect(payload.type).toBe("timeline");
    if (payload.type !== "timeline") return;
    expect(payload.data.events).toHaveLength(1);
    expect(payload.data.events[0]?.label).toBe("Sample milestone");
  });

  it("creates empty images gallery", () => {
    const payload = createManualArtifactPayload("images");
    expect(payload.type).toBe("images");
    if (payload.type !== "images") return;
    expect(payload.data.items).toEqual([]);
    expect(payload.title).toBe("Untitled gallery");
  });
});

describe("manualArtifactSourceCardId", () => {
  it("returns distinct ids for table, chart, and images", () => {
    expect(manualArtifactSourceCardId("table")).toBe("__manual_table__");
    expect(manualArtifactSourceCardId("chart")).toBe("__manual_chart__");
    expect(manualArtifactSourceCardId("images")).toBe("__manual_images__");
  });
});
