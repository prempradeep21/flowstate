export interface McpServerConfig {
  id: string;
  name: string;
  enabled: boolean;
}

export interface McpConfig {
  servers: McpServerConfig[];
}

/** Load MCP server config (no servers configured by default). */
export function loadMcpConfig(): McpConfig {
  return { servers: [] };
}
