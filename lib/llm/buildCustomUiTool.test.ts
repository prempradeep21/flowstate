import { beforeEach, describe, expect, it, vi } from "vitest";
import type { McpToolHandle } from "@/lib/mcp/types";

const callMcpTool = vi.fn();
const resolveApproval = vi.fn();

vi.mock("@/lib/mcpManager", () => ({ callMcpTool: (...a: unknown[]) => callMcpTool(...a) }));
vi.mock("@/lib/mcp/approval", () => ({
  resolveApproval: (...a: unknown[]) => resolveApproval(...a),
}));

const { BUILD_CUSTOM_UI_TOOL, createToolExecutor } = await import("@/lib/llm/tools");

function handle(originalName: string, serverName = "memory"): McpToolHandle {
  return {
    serverId: "srv-1",
    serverName,
    exposedName: `mcp__${serverName}__${originalName}`,
    originalName,
    toolHash: "hash",
  };
}

function makeExecutor() {
  const emitted: Record<string, unknown>[] = [];
  const registry = new Map<string, McpToolHandle>();
  registry.set("mcp__memory__read_graph", handle("read_graph"));
  registry.set("mcp__memory__search_nodes", handle("search_nodes"));

  const executeTool = createToolExecutor({
    emit: (data) => void emitted.push(data as Record<string, unknown>),
    mcp: { tools: [], registry },
    mcpCtx: {
      supabase: {} as never,
      userId: "user-1",
      signal: new AbortController().signal,
      origin: "http://localhost:3001",
    },
  });
  return { executeTool, emitted };
}

const frames = (emitted: Record<string, unknown>[], key: string) =>
  emitted.filter((e) => key in e);

beforeEach(() => {
  callMcpTool.mockReset();
  resolveApproval.mockReset();
  resolveApproval.mockResolvedValue({ allowed: true });
  callMcpTool.mockResolvedValue({ text: '{"entities":[]}', images: [] });
});

describe("build_custom_ui executor branch", () => {
  it("refuses when no MCP tool has run this turn", async () => {
    const { executeTool, emitted } = makeExecutor();
    const result = await executeTool({
      id: "1",
      name: "build_custom_ui",
      input: { title: "Explorer", request: "Let them browse it." },
    });
    expect(result).toMatch(/no mcp tool result/i);
    expect(frames(emitted, "customUiHandoff")).toHaveLength(0);
  });

  it("hands over the preceding MCP result exactly once", async () => {
    const { executeTool, emitted } = makeExecutor();
    callMcpTool.mockResolvedValue({ text: '{"entities":["Flowstate"]}', images: [] });
    await executeTool({ id: "1", name: "mcp__memory__read_graph", input: {} });

    const result = await executeTool({
      id: "2",
      name: "build_custom_ui",
      input: { title: "Knowledge graph explorer", request: "Let them explore links." },
    });

    const handoffs = frames(emitted, "customUiHandoff");
    expect(handoffs).toHaveLength(1);
    const payload = handoffs[0]!.customUiHandoff as {
      title: string;
      source: { text: string; toolName: string; serverName: string; brief: string };
    };
    expect(payload.title).toBe("Knowledge graph explorer");
    expect(payload.source.text).toBe('{"entities":["Flowstate"]}');
    expect(payload.source.toolName).toBe("read_graph");
    expect(payload.source.serverName).toBe("memory");
    expect(payload.source.brief).toBe("Let them explore links.");
    expect(result).toMatch(/queued/i);
  });

  it("never emits an artifact itself — generation is deferred to the follow-up card", async () => {
    const { executeTool, emitted } = makeExecutor();
    await executeTool({ id: "1", name: "mcp__memory__read_graph", input: {} });
    await executeTool({
      id: "2",
      name: "build_custom_ui",
      input: { title: "Explorer", request: "Browse it." },
    });
    expect(frames(emitted, "artifact")).toHaveLength(0);
    expect(frames(emitted, "pendingArtifact")).toHaveLength(0);
  });

  it("rejects a second handoff in the same turn", async () => {
    const { executeTool, emitted } = makeExecutor();
    await executeTool({ id: "1", name: "mcp__memory__read_graph", input: {} });
    await executeTool({
      id: "2",
      name: "build_custom_ui",
      input: { title: "First", request: "One." },
    });
    const second = await executeTool({
      id: "3",
      name: "build_custom_ui",
      input: { title: "Second", request: "Two." },
    });
    expect(second).toMatch(/already queued/i);
    expect(frames(emitted, "customUiHandoff")).toHaveLength(1);
  });

  it("honors sourceTool over recency", async () => {
    const { executeTool, emitted } = makeExecutor();
    callMcpTool.mockResolvedValueOnce({ text: "GRAPH", images: [] });
    await executeTool({ id: "1", name: "mcp__memory__read_graph", input: {} });
    callMcpTool.mockResolvedValueOnce({ text: "SEARCH", images: [] });
    await executeTool({ id: "2", name: "mcp__memory__search_nodes", input: {} });

    await executeTool({
      id: "3",
      name: "build_custom_ui",
      input: { title: "Explorer", request: "Browse.", sourceTool: "read_graph" },
    });
    const payload = frames(emitted, "customUiHandoff")[0]!.customUiHandoff as {
      source: { text: string };
    };
    expect(payload.source.text).toBe("GRAPH");
  });

  it("defaults to the most recent result when sourceTool is omitted", async () => {
    const { executeTool, emitted } = makeExecutor();
    callMcpTool.mockResolvedValueOnce({ text: "GRAPH", images: [] });
    await executeTool({ id: "1", name: "mcp__memory__read_graph", input: {} });
    callMcpTool.mockResolvedValueOnce({ text: "SEARCH", images: [] });
    await executeTool({ id: "2", name: "mcp__memory__search_nodes", input: {} });

    await executeTool({
      id: "3",
      name: "build_custom_ui",
      input: { title: "Explorer", request: "Browse." },
    });
    const payload = frames(emitted, "customUiHandoff")[0]!.customUiHandoff as {
      source: { text: string };
    };
    expect(payload.source.text).toBe("SEARCH");
  });

  // The verbatim-HTML fast path already rendered a card; re-building it would
  // duplicate the output and discard a server's purpose-built UI.
  it("does not record a result that took the verbatim-HTML fast path", async () => {
    const { executeTool, emitted } = makeExecutor();
    callMcpTool.mockResolvedValue({
      text: "<!doctype html><html><body>done</body></html>",
      images: [],
      html: "<!doctype html><html><body>done</body></html>",
    });
    await executeTool({ id: "1", name: "mcp__memory__read_graph", input: {} });
    expect(frames(emitted, "artifact")).toHaveLength(1);

    const result = await executeTool({
      id: "2",
      name: "build_custom_ui",
      input: { title: "Explorer", request: "Browse." },
    });
    expect(result).toMatch(/no mcp tool result/i);
    expect(frames(emitted, "customUiHandoff")).toHaveLength(0);
  });

  it("requires a title", async () => {
    const { executeTool, emitted } = makeExecutor();
    await executeTool({ id: "1", name: "mcp__memory__read_graph", input: {} });
    const result = await executeTool({
      id: "2",
      name: "build_custom_ui",
      input: { title: "   ", request: "Browse." },
    });
    expect(result).toMatch(/title/i);
    expect(frames(emitted, "customUiHandoff")).toHaveLength(0);
  });
});

describe("BUILD_CUSTOM_UI_TOOL schema", () => {
  it("requires only title and request", () => {
    const schema = BUILD_CUSTOM_UI_TOOL.inputSchema as {
      required: string[];
      properties: Record<string, unknown>;
    };
    expect(schema.required).toEqual(["title", "request"]);
    expect(Object.keys(schema.properties).sort()).toEqual([
      "request",
      "sourceTool",
      "title",
    ]);
  });

  // A data field would make the model re-transcribe up to 16k chars it already
  // sent — slow, lossy, and pointless since the executor holds the bytes.
  it("has no data field", () => {
    const schema = BUILD_CUSTOM_UI_TOOL.inputSchema as {
      properties: Record<string, unknown>;
    };
    expect(schema.properties.data).toBeUndefined();
  });

  it("survives conversion to the Anthropic tool format", async () => {
    const { toAnthropicTools } = await import("@/lib/llm/tools");
    const [converted] = toAnthropicTools([BUILD_CUSTOM_UI_TOOL]);
    expect(converted!.name).toBe("build_custom_ui");
    expect(converted!.input_schema).toBe(BUILD_CUSTOM_UI_TOOL.inputSchema);
  });

  // The negative routing is what stops it firing on trivial results.
  it("points trivial cases back at emit_artifact", () => {
    expect(BUILD_CUSTOM_UI_TOOL.description).toContain("emit_artifact");
    expect(BUILD_CUSTOM_UI_TOOL.description).toMatch(/do not use it for/i);
  });
});
