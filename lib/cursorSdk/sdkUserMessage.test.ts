import { describe, expect, it } from "vitest";
import { buildSdkUserMessage, askFilesToSdkImages } from "@/lib/cursorSdk/sdkUserMessage";
import type { AskAttachmentFile } from "@/lib/askAttachments";

describe("buildSdkUserMessage", () => {
  it("returns plain string when there are no attachments", () => {
    expect(buildSdkUserMessage("Build a timer", [])).toBe("Build a timer");
  });

  it("returns SDKUserMessage with images and attachment notes", () => {
    const files: AskAttachmentFile[] = [
      {
        name: "mockup.png",
        mimeType: "image/png",
        base64: "abc123",
        turnLabel: "current turn",
      },
      {
        name: "spec.pdf",
        mimeType: "application/pdf",
        base64: "pdfdata",
        turnLabel: "earlier turn 1",
      },
    ];
    const message = buildSdkUserMessage("Build UI from mockup", files);
    expect(typeof message).toBe("object");
    if (typeof message === "object") {
      expect(message.text).toContain("Build UI from mockup");
      expect(message.text).toContain("mockup.png");
      expect(message.text).toContain("spec.pdf");
      expect(message.images).toHaveLength(1);
      expect(message.images?.[0]).toEqual({
        data: "abc123",
        mimeType: "image/png",
      });
    }
  });

  it("maps only image files to SDK images", () => {
    const images = askFilesToSdkImages([
      { name: "a.png", mimeType: "image/png", base64: "x" },
      { name: "b.pdf", mimeType: "application/pdf", base64: "y" },
    ]);
    expect(images).toEqual([{ data: "x", mimeType: "image/png" }]);
  });
});
