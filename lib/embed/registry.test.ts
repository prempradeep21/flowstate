import { describe, expect, it } from "vitest";
import { matchEmbedProvider, matchEmbedProviderId } from "@/lib/embed/registry";
import { parseInstagramShortcode } from "@/lib/embed/providers/instagram";
import { parseTweetId } from "@/lib/embed/providers/twitter";
import {
  classifyPastedUrl,
  classifyPastedText,
} from "@/lib/urlDetection";

describe("embed provider matching", () => {
  it("matches Reddit post URLs", () => {
    expect(
      matchEmbedProviderId(
        "https://www.reddit.com/r/test/comments/abc123/title/",
      ),
    ).toBe("reddit");
  });

  it("matches X/Twitter status URLs", () => {
    expect(
      matchEmbedProviderId("https://x.com/elonmusk/status/1234567890123456789"),
    ).toBe("twitter");
    expect(parseTweetId(new URL("https://twitter.com/a/status/99"))).toBe("99");
  });

  it("matches Instagram post URLs", () => {
    expect(
      matchEmbedProviderId("https://www.instagram.com/p/ABC123xyz/"),
    ).toBe("instagram");
    expect(
      parseInstagramShortcode(new URL("https://www.instagram.com/reel/XYZ_9/")),
    ).toBe("XYZ_9");
  });

  it("matches Facebook post URLs", () => {
    expect(
      matchEmbedProviderId(
        "https://www.facebook.com/somepage/posts/1234567890",
      ),
    ).toBe("facebook");
  });

  it("does not match GitHub repo URLs as embeds", () => {
    expect(matchEmbedProvider("https://github.com/facebook/react")).toBeNull();
  });
});

describe("classifyPastedUrl embed routing", () => {
  it("routes Reddit URLs to embed before website", () => {
    expect(
      classifyPastedUrl(
        "https://www.reddit.com/r/aww/comments/abc123/cute/",
      ),
    ).toBe("embed");
  });

  it("keeps GitHub repo URLs as repo", () => {
    expect(classifyPastedUrl("https://github.com/facebook/react")).toBe("repo");
  });

  it("keeps generic URLs as website", () => {
    expect(classifyPastedUrl("https://example.com")).toBe("website");
  });
});

describe("classifyPastedText embed", () => {
  it("classifies pasted Instagram URL", () => {
    const result = classifyPastedText("https://www.instagram.com/p/AbCdEf/");
    expect(result?.kind).toBe("embed");
  });
});
