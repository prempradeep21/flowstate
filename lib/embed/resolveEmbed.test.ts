import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/linkPreview", () => ({
  fetchLinkPreview: vi.fn(),
}));

vi.mock("@/lib/pageScreenshot", () => ({
  fetchPageScreenshot: vi.fn(),
}));

import { fetchLinkPreview } from "@/lib/linkPreview";
import { fetchPageScreenshot } from "@/lib/pageScreenshot";
import { resolveEmbedUrl } from "@/lib/embed/resolveEmbed";

const fetchLinkPreviewMock = vi.mocked(fetchLinkPreview);
const fetchPageScreenshotMock = vi.mocked(fetchPageScreenshot);

describe("resolveEmbedUrl linkPreviewFallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses Microlink screenshot when OG image is missing", async () => {
    fetchLinkPreviewMock.mockResolvedValue({
      title: "Example",
      domainLabel: "Example",
      faviconUrl: "https://example.com/favicon.ico",
    });
    fetchPageScreenshotMock.mockResolvedValue(
      "https://cdn.microlink.io/screenshot.png",
    );

    const result = await resolveEmbedUrl(
      "https://www.reddit.com/r/test/comments/abc123/title/",
    );

    expect(fetchPageScreenshotMock).toHaveBeenCalled();
    expect(result?.fallback?.previewImageUrl).toBe(
      "https://cdn.microlink.io/screenshot.png",
    );
  });

  it("uses @handle title when X profile embed fails", async () => {
    fetchLinkPreviewMock.mockResolvedValue({
      title: "X",
      domainLabel: "X",
    });
    fetchPageScreenshotMock.mockResolvedValue(null);

    const result = await resolveEmbedUrl("https://x.com/designreview");

    expect(result?.status).toBe("failed");
    expect(result?.title).toBe("@designreview on X");
  });
});
