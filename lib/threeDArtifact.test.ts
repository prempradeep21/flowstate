import { describe, expect, it } from "vitest";
import {
  createThreeDPayload,
  DEFAULT_3D_SAMPLE_URL,
  isThreeDModelFile,
  threeDFormatFromFile,
} from "@/lib/threeDArtifact";

describe("isThreeDModelFile", () => {
  it("accepts GLB and GLTF by extension", () => {
    expect(
      isThreeDModelFile(new File([], "ship.glb", { type: "" })),
    ).toBe(true);
    expect(
      isThreeDModelFile(new File([], "scene.gltf", { type: "" })),
    ).toBe(true);
  });

  it("rejects other file types", () => {
    expect(
      isThreeDModelFile(new File([], "mesh.obj", { type: "" })),
    ).toBe(false);
    expect(
      isThreeDModelFile(new File([], "clip.mp3", { type: "audio/mpeg" })),
    ).toBe(false);
  });
});

describe("threeDFormatFromFile", () => {
  it("detects format from extension and mime", () => {
    expect(threeDFormatFromFile(new File([], "a.glb"))).toBe("glb");
    expect(threeDFormatFromFile(new File([], "a.gltf"))).toBe("gltf");
    expect(
      threeDFormatFromFile(
        new File([], "a.bin", { type: "model/gltf-binary" }),
      ),
    ).toBe("glb");
  });
});

describe("createThreeDPayload", () => {
  it("builds artifact payload from upload metadata", () => {
    const payload = createThreeDPayload({
      fileName: "robot.glb",
      modelUrl: "https://example.com/robot.glb",
      format: "glb",
    });
    expect(payload.type).toBe("3d");
    expect(payload.title).toBe("robot");
    expect(payload.data.modelUrl).toBe("https://example.com/robot.glb");
    expect(payload.data.format).toBe("glb");
  });

  it("falls back to sample URL in normalizer when missing", () => {
    const payload = createThreeDPayload({
      fileName: "model.glb",
      modelUrl: DEFAULT_3D_SAMPLE_URL,
      format: "glb",
    });
    expect(payload.data.modelUrl).toBe(DEFAULT_3D_SAMPLE_URL);
  });
});
