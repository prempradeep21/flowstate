import { describe, expect, it } from "vitest";
import { googleWorkspacePreviewUrl } from "@/lib/google/workspacePreviewUrl";

describe("googleWorkspacePreviewUrl", () => {
  it("builds preview URLs per file kind", () => {
    expect(googleWorkspacePreviewUrl("abc", "document")).toBe(
      "https://docs.google.com/document/d/abc/preview",
    );
    expect(googleWorkspacePreviewUrl("abc", "spreadsheet")).toBe(
      "https://docs.google.com/spreadsheets/d/abc/preview",
    );
    expect(googleWorkspacePreviewUrl("abc", "presentation")).toContain(
      "/presentation/d/abc/embed",
    );
    expect(googleWorkspacePreviewUrl("abc", "file")).toBe(
      "https://drive.google.com/file/d/abc/preview",
    );
  });
});
