import type { McpServerConfig } from "@/lib/mcpConfig";
import type { NeutralToolDef } from "@/lib/llm/provider";

export interface McpImage {
  mimeType: string;
  data: string;
}

export interface McpToolResult {
  text: string;
  images: McpImage[];
}

export interface McpServerHandle {
  name: string;
}

export interface McpToolsResult {
  /** Provider-neutral tool definitions exposed to the LLM. */
  tools: NeutralToolDef[];
  registry: Map<string, McpServerHandle>;
}

export async function getMcpTools(
  _servers: McpServerConfig[],
): Promise<McpToolsResult> {
  return { tools: [], registry: new Map() };
}

export async function callMcpTool(
  _server: McpServerHandle,
  _toolName: string,
  _input: Record<string, unknown>,
): Promise<McpToolResult> {
  return { text: "MCP tool not available.", images: [] };
}
