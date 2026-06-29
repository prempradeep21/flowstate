import { describe, expect, it } from "vitest";
import {
  htmlToPlainText,
  substackBodyFromHtml,
} from "@/lib/fetchPageContent";
import { extractUrlsFromText } from "@/lib/urlDetection";

describe("extractUrlsFromText", () => {
  it("finds URLs embedded in a sentence", () => {
    expect(
      extractUrlsFromText(
        "explain this https://premiumcaptures.substack.com/p/notes-on-approaching-the-abundance",
      ),
    ).toEqual([
      "https://premiumcaptures.substack.com/p/notes-on-approaching-the-abundance",
    ]);
  });

  it("dedupes and strips trailing punctuation", () => {
    expect(
      extractUrlsFromText("See https://example.com/a. Also https://example.com/a!"),
    ).toEqual(["https://example.com/a"]);
  });
});

describe("htmlToPlainText", () => {
  it("strips tags and preserves paragraph breaks", () => {
    expect(
      htmlToPlainText("<p>Hello <strong>world</strong>.</p><p>Second.</p>"),
    ).toBe("Hello world.\n\nSecond.");
  });
});

describe("substackBodyFromHtml", () => {
  it("extracts body_html from Substack preload JSON", () => {
    const preload = JSON.stringify({
      post: {
        title: "Test post",
        body_html: "<p>First paragraph about software.</p><p>Second paragraph.</p>",
      },
    });
    const escaped = JSON.stringify(preload).slice(1, -1);
    const html = `<script>window._preloads = JSON.parse("${escaped}")</script>`;
    expect(substackBodyFromHtml(html)).toBe(
      "First paragraph about software.\n\nSecond paragraph.",
    );
  });
});
