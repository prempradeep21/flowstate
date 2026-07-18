// Shared MCP types. Client-safe (no node imports).

/** One cached tool from a server's tools/list, persisted in mcp_servers.tools_cache. */
export interface McpCachedTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  /** sha256 of name+description+inputSchema — grant invalidation key. */
  hash: string;
}

/** Registry entry mapping an exposed (namespaced) tool name back to its server. */
export interface McpToolHandle {
  serverId: string;
  serverName: string;
  exposedName: string;
  originalName: string;
  toolHash: string;
}

/** Server row shape exposed to the client (never includes secrets). */
export interface McpServerSummary {
  id: string;
  name: string;
  enabled: boolean;
  transport: "http" | "stdio";
  url: string | null;
  authType: "none" | "headers" | "oauth";
  lastStatus: string | null;
  lastError: string | null;
  toolsCachedAt: string | null;
  tools: Array<{
    name: string;
    description: string;
    grantStatus: "always" | "deny" | "stale-hash" | "none";
  }>;
  oauthConnected: boolean;
}

export type McpApprovalDecision = "allow_once" | "always" | "deny";

/** SSE event payload when a tool call needs user approval. */
export interface McpApprovalEvent {
  requestId: string;
  serverId: string;
  serverName: string;
  toolName: string;
  description: string;
  inputPreview: Record<string, unknown>;
}
