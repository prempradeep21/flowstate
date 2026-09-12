import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readImageDimensions } from "@/lib/imageDimensions";

/** Expected values cross-checked against `sips -g pixelWidth -g pixelHeight`. */
describe("readImageDimensions", () => {
  it("reads PNG dimensions from the IHDR chunk", () => {
    const cases: [string, number, number][] = [
      ["public/flowstate-logo.png", 1086, 1086],
      ["public/demo-assets/freelance-figma-preview.png", 1920, 1080],
      ["public/demo-assets/freelance-openhouse-favicon.png", 64, 64],
    ];
    for (const [path, width, height] of cases) {
      const bytes = new Uint8Array(readFileSync(path));
      expect(readImageDimensions(bytes, "image/png"), path).toEqual({
        width,
        height,
      });
    }
  });

  it("reads JPEG dimensions from the start-of-frame marker", () => {
    const bytes = new Uint8Array(
      readFileSync("public/demo-assets/freelance-nothing-os4.jpg"),
    );
    expect(readImageDimensions(bytes, "image/jpeg")).toEqual({
      width: 480,
      height: 360,
    });
  });

  it("returns null for a type it does not handle", () => {
    expect(
      readImageDimensions(new Uint8Array([1, 2, 3]), "image/svg+xml"),
    ).toBeNull();
  });

  it("returns null rather than throwing on truncated data", () => {
    expect(
      readImageDimensions(new Uint8Array([0x89, 0x50]), "image/png"),
    ).toBeNull();
    expect(
      readImageDimensions(new Uint8Array([0xff, 0xd8]), "image/jpeg"),
    ).toBeNull();
    expect(readImageDimensions(new Uint8Array([]), "image/webp")).toBeNull();
    expect(readImageDimensions(new Uint8Array([]), "image/gif")).toBeNull();
  });
});
