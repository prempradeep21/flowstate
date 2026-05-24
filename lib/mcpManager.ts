import type { McpServerConfig } from "@/lib/mcpConfig";
import type Anthropic from "@anthropic-ai/sdk";

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
  anthropicTools: Anthropic.Tool[];
  registry: Map<string, McpServerHandle>;
}

export async function getMcpTools(
  _servers: McpServerConfig[],
): Promise<McpToolsResult> {
  return { anthropicTools: [], registry: new Map() };
}

export async function callMcpTool(
  _server: McpServerHandle,
  _toolName: string,
  _input: Record<string, unknown>,
): Promise<McpToolResult> {
  return { text: "MCP tool not available.", images: [] };
}
