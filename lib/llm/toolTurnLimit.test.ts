import { describe, expect, it } from "vitest";
import {
  DEFAULT_MAX_TOOL_TURNS,
  MCP_MAX_TOOL_TURNS,
  toolTurnLimitMessage,
} from "@/lib/llm/provider";

describe("tool-turn limit", () => {
  // Regression: at 8 turns a reflective MCP tool (sequential thinking calls
  // itself once per thought) consumed every turn before the model wrote an
  // answer, and the run returned no text at all.
  it("gives MCP runs materially more headroom than the default", () => {
    expect(MCP_MAX_TOOL_TURNS).toBeGreaterThan(DEFAULT_MAX_TOOL_TURNS);
    expect(MCP_MAX_TOOL_TURNS).toBeGreaterThanOrEqual(16);
  });

  // The message is the only thing standing between an exhausted loop and the
  // client's "connection may have timed out" fallback, which is wrong.
  it("names the limit and suggests a way forward", () => {
    const msg = toolTurnLimitMessage(MCP_MAX_TOOL_TURNS);
    expect(msg).toContain(String(MCP_MAX_TOOL_TURNS));
    expect(msg).toMatch(/narrower|fewer/i);
    expect(msg).not.toMatch(/timed out|connection/i);
  });
});
