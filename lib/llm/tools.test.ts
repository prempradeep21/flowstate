import { describe, expect, it } from "vitest";
import {
  BUILTIN_TOOLS,
  EMIT_ARTIFACT_TOOL,
  toAnthropicTools,
  toOpenAITools,
} from "@/lib/llm/tools";

describe("tool schema converters", () => {
  it("converts neutral tools to Anthropic format", () => {
    const [tool] = toAnthropicTools([EMIT_ARTIFACT_TOOL]);
    expect(tool.name).toBe("emit_artifact");
    expect(tool.description).toBe(EMIT_ARTIFACT_TOOL.description);
    expect(tool.input_schema).toBe(EMIT_ARTIFACT_TOOL.inputSchema);
  });

  it("converts neutral tools to OpenAI function format", () => {
    const [tool] = toOpenAITools([EMIT_ARTIFACT_TOOL]);
    expect(tool.type).toBe("function");
    expect(tool.function.name).toBe("emit_artifact");
    expect(tool.function.description).toBe(EMIT_ARTIFACT_TOOL.description);
    expect(tool.function.parameters).toBe(EMIT_ARTIFACT_TOOL.inputSchema);
  });

  it("exposes the three built-in tools", () => {
    expect(BUILTIN_TOOLS.map((t) => t.name)).toEqual([
      "search_images",
      "fetch_chart_data",
      "emit_artifact",
    ]);
  });
});
