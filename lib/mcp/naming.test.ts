import { describe, expect, it } from "vitest";
import {
  buildExposedName,
  isMcpToolName,
  MAX_EXPOSED_TOOL_NAME,
  slugifyServerName,
} from "@/lib/mcp/naming";

describe("slugifyServerName", () => {
  it("lowercases and sanitizes", () => {
    expect(slugifyServerName("My Notion (Work)")).toBe("my_notion_work");
  });
  it("caps length and falls back on empty", () => {
    expect(slugifyServerName("x".repeat(50)).length).toBeLessThanOrEqual(20);
    expect(slugifyServerName("!!!")).toBe("server");
  });
});

describe("buildExposedName", () => {
  it("produces mcp__slug__tool", () => {
    const taken = new Set<string>();
    expect(buildExposedName("notion", "search_pages", taken)).toBe(
      "mcp__notion__search_pages",
    );
  });

  it("stays within 64 chars for long tool names, with a disambiguating hash", () => {
    const taken = new Set<string>();
    const longTool = "extremely_long_tool_name_that_goes_on_and_on_forever_and_ever_more";
    const a = buildExposedName("myserver", longTool, taken);
    const b = buildExposedName("myserver", longTool + "_v2", taken);
    expect(a.length).toBeLessThanOrEqual(MAX_EXPOSED_TOOL_NAME);
    expect(b.length).toBeLessThanOrEqual(MAX_EXPOSED_TOOL_NAME);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[a-zA-Z0-9_-]+$/);
  });

  it("dedupes collisions across servers with the same slug", () => {
    const taken = new Set<string>();
    const a = buildExposedName("gh", "search", taken);
    const b = buildExposedName("gh", "search", taken);
    expect(a).toBe("mcp__gh__search");
    expect(b).toBe("mcp__gh__search_2");
  });

  it("sanitizes weird tool names", () => {
    const taken = new Set<string>();
    expect(buildExposedName("s", "do.thing/now!", taken)).toBe("mcp__s__do_thing_now");
  });
});

describe("isMcpToolName", () => {
  it("detects the namespace prefix", () => {
    expect(isMcpToolName("mcp__notion__search")).toBe(true);
    expect(isMcpToolName("emit_artifact")).toBe(false);
  });
});
