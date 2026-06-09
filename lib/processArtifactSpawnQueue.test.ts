import { describe, expect, it } from "vitest";
import { pickAutoSpawnPayload } from "@/lib/processArtifactSpawnQueue";
import type { ArtifactPayload } from "@/lib/artifactTypes";

const mapPayload: ArtifactPayload = {
  type: "map",
  title: "Trip map",
  data: { place: { name: "Paris" } },
};

const tablePayload: ArtifactPayload = {
  type: "table",
  title: "Itinerary",
  data: { columns: [], rows: [] },
};

describe("pickAutoSpawnPayload", () => {
  it("auto-spawns only the user-requested kind when intent is known", () => {
    expect(
      pickAutoSpawnPayload([tablePayload, mapPayload], "map", 0),
    ).toEqual(mapPayload);
  });

  it("returns null when an artifact is already on canvas", () => {
    expect(
      pickAutoSpawnPayload([mapPayload], "map", 1),
    ).toBeNull();
  });

  it("auto-spawns the highest-priority payload when there is no user intent", () => {
    expect(pickAutoSpawnPayload([tablePayload, mapPayload], null, 0)).toEqual(
      tablePayload,
    );
  });
});
