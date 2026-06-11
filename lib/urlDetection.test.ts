import { describe, expect, it } from "vitest";
import {
  classifyPastedText,
  classifyPastedUrl,
  domainDisplayLabel,
  extractUrlFromText,
  normalizeHttpUrl,
} from "@/lib/urlDetection";

describe("normalizeHttpUrl", () => {
  it("adds https when scheme is missing", () => {
    expect(normalizeHttpUrl("github.com")).toBe("https://github.com/");
  });

  it("preserves existing https URL", () => {
    expect(normalizeHttpUrl("https://example.com/path?q=1")).toBe(
      "https://example.com/path?q=1",
    );
  });

  it("rejects whitespace and invalid input", () => {
    expect(normalizeHttpUrl("not a url")).toBeNull();
    expect(normalizeHttpUrl("")).toBeNull();
  });
});

describe("extractUrlFromText", () => {
  it("extracts sole URL with trailing slash", () => {
    expect(extractUrlFromText("https://www.github.com/")).toBe(
      "https://www.github.com/",
    );
  });

  it("rejects text with extra words", () => {
    expect(extractUrlFromText("check https://github.com")).toBeNull();
  });
});

describe("domainDisplayLabel", () => {
  it("strips www and TLD", () => {
    expect(domainDisplayLabel("https://www.github.com/user")).toBe("Github");
    expect(domainDisplayLabel("https://docs.google.com/document")).toBe(
      "Google",
    );
  });
});

describe("classifyPastedUrl", () => {
  it("routes YouTube URLs to youtube", () => {
    expect(
      classifyPastedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("youtube");
    expect(classifyPastedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe("youtube");
  });

  it("routes generic URLs to website", () => {
    expect(classifyPastedUrl("https://github.com")).toBe("website");
    expect(classifyPastedUrl("https://example.com")).toBe("website");
  });

  it("routes Google Docs URLs to google-doc", () => {
    expect(
      classifyPastedUrl(
        "https://docs.google.com/document/d/abc123/edit?usp=sharing",
      ),
    ).toBe("google-doc");
    expect(
      classifyPastedUrl("https://docs.google.com/spreadsheets/d/xyz789/edit"),
    ).toBe("google-doc");
  });

  it("routes social embed URLs to embed", () => {
    expect(
      classifyPastedUrl("https://www.reddit.com/r/test/comments/abc123/x/"),
    ).toBe("embed");
  });
});

describe("classifyPastedText", () => {
  it("classifies pasted YouTube text", () => {
    const result = classifyPastedText("https://youtu.be/abc123");
    expect(result?.kind).toBe("youtube");
    expect(result?.url).toBe("https://youtu.be/abc123");
  });

  it("classifies pasted website text", () => {
    const result = classifyPastedText("github.com");
    expect(result?.kind).toBe("website");
    expect(result?.url).toBe("https://github.com/");
  });
});
