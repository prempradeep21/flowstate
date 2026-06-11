import { describe, expect, it } from "vitest";
import {
  defaultTitleForFileKind,
  parseGoogleDriveUrl,
} from "@/lib/google/parseDriveUrl";

describe("parseGoogleDriveUrl", () => {
  it("parses Google Docs links", () => {
    const parsed = parseGoogleDriveUrl(
      "https://docs.google.com/document/d/abc123/edit",
    );
    expect(parsed?.fileId).toBe("abc123");
    expect(parsed?.fileKind).toBe("document");
  });

  it("parses Google Sheets links", () => {
    const parsed = parseGoogleDriveUrl(
      "https://docs.google.com/spreadsheets/d/sheet42/edit",
    );
    expect(parsed?.fileId).toBe("sheet42");
    expect(parsed?.fileKind).toBe("spreadsheet");
  });

  it("parses Drive file links", () => {
    const parsed = parseGoogleDriveUrl(
      "https://drive.google.com/file/d/file99/view",
    );
    expect(parsed?.fileId).toBe("file99");
    expect(parsed?.fileKind).toBe("file");
  });

  it("returns null for unrelated URLs", () => {
    expect(parseGoogleDriveUrl("https://example.com")).toBeNull();
  });
});

describe("defaultTitleForFileKind", () => {
  it("labels workspace file kinds", () => {
    expect(defaultTitleForFileKind("document")).toBe("Google Doc");
    expect(defaultTitleForFileKind("spreadsheet")).toBe("Google Sheet");
  });
});
