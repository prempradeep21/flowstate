import { describe, expect, it } from "vitest";
import { parseServerInput } from "@/lib/mcp/parseServerJson";

describe("parseServerInput", () => {
  it("accepts a bare URL", () => {
    const res = parseServerInput("https://mcp.deepwiki.com/mcp");
    expect(res.servers).toEqual([{ name: "deepwiki", url: "https://mcp.deepwiki.com/mcp" }]);
  });

  it("accepts a single {url} object with headers", () => {
    const res = parseServerInput(
      JSON.stringify({ name: "Linear", url: "https://mcp.linear.app/mcp", headers: { Authorization: "Bearer x" } }),
    );
    expect(res.servers).toHaveLength(1);
    expect(res.servers[0]).toMatchObject({
      name: "Linear",
      url: "https://mcp.linear.app/mcp",
      headers: { Authorization: "Bearer x" },
    });
  });

  it("accepts Claude-Desktop mcpServers shape and skips stdio entries", () => {
    const res = parseServerInput(
      JSON.stringify({
        mcpServers: {
          notion: { url: "https://mcp.notion.com/mcp" },
          github: { command: "npx", args: ["-y", "mcp-github"] },
        },
      }),
    );
    expect(res.servers).toEqual([{ name: "notion", url: "https://mcp.notion.com/mcp", headers: undefined }]);
    expect(res.skippedStdio).toBe(1);
  });

  it("accepts an array of servers", () => {
    const res = parseServerInput(
      JSON.stringify([{ name: "a", url: "https://a.example/mcp" }, { url: "https://b.example/mcp" }]),
    );
    expect(res.servers.map((s) => s.url)).toEqual([
      "https://a.example/mcp",
      "https://b.example/mcp",
    ]);
  });

  it("errors on garbage and on stdio-only configs", () => {
    expect(parseServerInput("not json at all").error).toBeTruthy();
    const stdioOnly = parseServerInput(
      JSON.stringify({ mcpServers: { gh: { command: "npx" } } }),
    );
    expect(stdioOnly.servers).toHaveLength(0);
    expect(stdioOnly.skippedStdio).toBe(1);
    expect(stdioOnly.error).toMatch(/local/i);
  });
});
