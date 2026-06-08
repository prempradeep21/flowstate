import { describe, expect, it } from "vitest";
import { previewImageFromHtml } from "@/lib/linkPreview";

const BASE = new URL("https://example.com/page");

describe("previewImageFromHtml", () => {
  it("extracts absolute og:image", () => {
    const html = `<meta property="og:image" content="https://cdn.example.com/hero.jpg" />`;
    expect(previewImageFromHtml(html, BASE)).toBe(
      "https://cdn.example.com/hero.jpg",
    );
  });

  it("resolves relative og:image against page URL", () => {
    const html = `<meta property="og:image" content="/assets/preview.png" />`;
    expect(previewImageFromHtml(html, BASE)).toBe(
      "https://example.com/assets/preview.png",
    );
  });

  it("falls back to twitter:image when og:image is missing", () => {
    const html = `<meta name="twitter:image" content="https://example.com/tw.jpg" />`;
    expect(previewImageFromHtml(html, BASE)).toBe(
      "https://example.com/tw.jpg",
    );
  });

  it("decodes HTML entities in image URL", () => {
    const html = `<meta property="og:image" content="https://example.com/a&amp;b.jpg" />`;
    expect(previewImageFromHtml(html, BASE)).toBe(
      "https://example.com/a&b.jpg",
    );
  });

  it("returns null when no preview meta tags exist", () => {
    const html = `<title>Example</title>`;
    expect(previewImageFromHtml(html, BASE)).toBeNull();
  });
});
