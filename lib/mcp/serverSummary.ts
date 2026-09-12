// Serialize a server row for the client panel. Never includes secrets.

import type { Database } from "@/lib/supabase/database.types";
import { parseCachedTools } from "@/lib/mcp/toolCache";
import type { McpServerSummary } from "@/lib/mcp/types";

type ServerRow = Database["public"]["Tables"]["mcp_servers"]["Row"];

interface GrantRow {
  server_id: string;
  tool_name: string;
  decision: "always" | "deny";
  tool_hash: string;
}

interface OauthRow {
  server_id: string;
  access_token_encrypted: string | null;
}

export function serializeServerSummary(
  row: ServerRow,
  grants: GrantRow[],
  oauthRows: OauthRow[],
): McpServerSummary {
  const serverGrants = new Map(
    grants.filter((g) => g.server_id === row.id).map((g) => [g.tool_name, g]),
  );
  const tools = parseCachedTools(row).map((tool) => {
    const grant = serverGrants.get(tool.name);
    const grantStatus = !grant
      ? ("none" as const)
      : grant.tool_hash !== tool.hash
        ? ("stale-hash" as const)
        : grant.decision;
    return { name: tool.name, description: tool.description, grantStatus };
  });
  return {
    id: row.id,
    name: row.name,
    enabled: row.enabled,
    transport: row.transport,
    url: row.url,
    authType: row.auth_type,
    lastStatus: row.last_status,
    lastError: row.last_error,
    toolsCachedAt: row.tools_cached_at,
    tools,
    oauthConnected: oauthRows.some(
      (o) => o.server_id === row.id && !!o.access_token_encrypted,
    ),
  };
}
